// ─────────────────────────────────────────────────────────────────────────────
// routeAnimation.js  –  Bird Migration Route Animation
//
// USAGE (Browser-Konsole oder Skript):
//   ANIMATION_ROUTE = '42';          // Migratory route code (String oder Zahl)
//   playRouteAnimation();            // Animation starten
//   stopRouteAnimation();            // Animation abbrechen
//
// OPTIONEN (vor dem Start setzen):
//   ANIMATION_SPEED    = 1.0;        // 0.5 = langsamer, 2.0 = schneller
//   ANIMATION_SEGMENT_MS = 2000;     // Feste Dauer pro Segment in Millisekunden
// ─────────────────────────────────────────────────────────────────────────────

// ── Globale Steuervariablen ───────────────────────────────────────────────────
window.ANIMATION_ROUTE      = null;   // Route code (wird mit || verglichen → allRoutes)
window.ANIMATION_SPEED      = 1.0;   // Geschwindigkeitsfaktor
window.ANIMATION_SEGMENT_MS = 2000;  // Gleichmäßige Flugdauer pro Segment (ms)

// ── Interner Zustand ──────────────────────────────────────────────────────────
let _animRunning   = false;
let _animAbort     = false;
let _origLegend    = '';        // gespeicherter display-Wert der Legende
let _origHeading   = '';

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

/** Wartet ms Millisekunden (abbrechbar). Gibt false zurück wenn abgebrochen. */
function _wait(ms) {
  return new Promise(resolve => {
    const t = setTimeout(() => resolve(true), ms / window.ANIMATION_SPEED);
    // Beim Abort sofort auflösen
    const check = setInterval(() => {
      if (_animAbort) { clearTimeout(t); clearInterval(check); resolve(false); }
    }, 50);
    // Normales Auflösen cleant auch den Interval
    setTimeout(() => clearInterval(check), ms / window.ANIMATION_SPEED + 100);
  });
}

/** Wartet bis map.isMoving() false ist. */
function _waitForIdle() {
  return new Promise(resolve => {
    if (!map.isMoving()) { resolve(true); return; }
    map.once('idle', () => resolve(true));
  });
}

/** flyTo als Promise – löst auf wenn die Bewegung endet. Nur für Intro/Outro verwenden. */
function _flyTo(options) {
  return new Promise(resolve => {
    if (_animAbort) { resolve(false); return; }
    map.flyTo(options);
    map.once('moveend', () => resolve(true));
  });
}

/** easeTo als Promise – verschiebt die Kamera linear ohne Zoom-Bogenkurve. */
function _easeTo(options) {
  return new Promise(resolve => {
    if (_animAbort) { resolve(false); return; }
    map.easeTo(options);
    map.once('moveend', () => resolve(true));
  });
}

// ── Blendet Legende + Heading aus / wieder ein ────────────────────────────────
function _hideUI() {
  const legend  = document.querySelector('.legend');
  const heading = document.querySelector('.heading');
  if (legend)  { _origLegend  = legend.style.opacity;  legend.style.transition  = 'opacity 0.6s'; legend.style.opacity  = '0'; legend.style.pointerEvents  = 'none'; }
  if (heading) { _origHeading = heading.style.opacity; heading.style.transition = 'opacity 0.6s'; heading.style.opacity = '0'; heading.style.pointerEvents = 'none'; }
}

function _showUI() {
  const legend  = document.querySelector('.legend');
  const heading = document.querySelector('.heading');
  if (legend)  { legend.style.opacity  = _origLegend  || '1'; legend.style.pointerEvents  = ''; }
  if (heading) { heading.style.opacity = _origHeading || '1'; heading.style.pointerEvents = ''; }
}

// ── Opacity der anderen Routen ────────────────────────────────────────────────
function _dimOtherRoutes(animCode) {
  if (!map.getLayer('route-lines')) return;
  // Linien: animierte Route ausblenden (anim-route-line übernimmt), andere stark abdunkeln
  map.setPaintProperty('route-lines', 'line-opacity', [
    'case', ['==', ['get', 'code'], animCode], 0, 0.008
  ]);
  // Punkte: Kreise der animierten Route voll sichtbar lassen, andere stark abdunkeln
  if (map.getLayer('route-points')) {
    map.setPaintProperty('route-points', 'circle-opacity', [
      'case', ['==', ['get', 'code'], animCode], 1, 0.006
    ]);
  }
}

function _restoreOpacity() {
  if (!map.getLayer('route-lines')) return;
  map.setPaintProperty('route-lines', 'line-opacity', 0.7);
  if (map.getLayer('route-points'))
    map.setPaintProperty('route-points', 'circle-opacity', 1);
}

// ── Dreieck (▲) und Kreuz (✕) für die animierte Route dauerhaft anzeigen ─────

/** Befüllt den highlight-symbols-Layer mit Origin (▲) und Destination (✕) der Route. */
function _showRouteSymbols(route) {
  if (!map.getSource('highlight-symbols')) return;

  const features = [];
  for (let i = 0; i < route.points.length; i++) {
    const pt = route.points[i];
    let symbol = null, rotation = 0;

    if (pt.node === 'Origin') {
      symbol = '▲';
      if (i + 1 < route.points.length)
        rotation = _bearing(pt, route.points[i + 1]);
    } else if (pt.node === 'Destination') {
      symbol = '\u2715';
      if (i > 0)
        rotation = _bearing(route.points[i - 1], pt);
    }

    if (symbol) {
      features.push({
        type: 'Feature',
        properties: {
          symbol,
          rotation,
          color: (typeof RL_SPECIAL_POINT_COLOR !== 'undefined'
            ? RL_SPECIAL_POINT_COLOR[route.rl]
            : null) || '#ffffff',
        },
        geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
      });
    }
  }

  map.getSource('highlight-symbols').setData({ type: 'FeatureCollection', features });
}

/** Leert den highlight-symbols-Layer (gibt Hover-Zustand zurück). */
function _hideRouteSymbols() {
  if (!map.getSource('highlight-symbols')) return;
  map.getSource('highlight-symbols').setData({ type: 'FeatureCollection', features: [] });
}

/** Bearing zwischen zwei Punkten {lat, lon} in Grad (0–360). */
function _bearing(from, to) {
  const toRad = d => d * Math.PI / 180;
  const y = Math.sin(toRad(to.lon - from.lon)) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat))
          - Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(toRad(to.lon - from.lon));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// ── Highlighted Route-Linie (nur die animierte Route, voll sichtbar) ──────────
function _showAnimRoute(route) {
  const geojson = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { color: (typeof RL_LINE_COLOR !== 'undefined' ? RL_LINE_COLOR[route.rl] : null) || '#ffffff' },
      geometry: { type: 'LineString', coordinates: route.points.map(p => [p.lon, p.lat]) }
    }]
  };
  if (map.getSource('anim-route')) {
    map.getSource('anim-route').setData(geojson);
  } else {
    map.addSource('anim-route', { type: 'geojson', data: geojson });
    map.addLayer({
      id: 'anim-route-line',
      type: 'line',
      source: 'anim-route',
      paint: {
        'line-color':   ['get', 'color'],
        'line-width':   2.5,
        'line-opacity': 0.9,
      }
    }, map.getLayer('route-points') ? 'route-points' : undefined); // unterhalb der Punkte & Symbole einfügen
  }
}

function _removeAnimRoute() {
  try { if (map.getLayer('anim-route-line')) map.removeLayer('anim-route-line'); } catch (_) {}
  try { if (map.getSource('anim-route'))     map.removeSource('anim-route');     } catch (_) {}
}

// ── Catmull-Rom Spline – fließende Kamerabewegung ────────────────────────────

/**
 * Interpoliert einen Punkt auf dem Catmull-Rom-Segment [p1 → p2]
 * mit den Führungspunkten p0 (vor p1) und p3 (nach p2).
 */
function _catmullRomPt(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return {
    lon: 0.5 * (2*p1.lon + (-p0.lon + p2.lon)*t + (2*p0.lon - 5*p1.lon + 4*p2.lon - p3.lon)*t2 + (-p0.lon + 3*p1.lon - 3*p2.lon + p3.lon)*t3),
    lat: 0.5 * (2*p1.lat + (-p0.lat + p2.lat)*t + (2*p0.lat - 5*p1.lat + 4*p2.lat - p3.lat)*t2 + (-p0.lat + 3*p1.lat - 3*p2.lat + p3.lat)*t3),
  };
}

/**
 * Baut ein nach Bogenlänge gleichmäßig abgetastetes Sample-Array
 * aus einer Catmull-Rom-Spline durch alle Wegpunkte.
 */
function _buildSplineSamples(pts, sampleCount = 1200) {
  const n = pts.length;
  if (n < 2) return pts.map(p => ({ lon: p.lon, lat: p.lat }));

  // Spline dicht abtasten (30 Schritte pro Segment)
  const STEPS = 30;
  const raw = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    for (let s = 0; s < STEPS; s++) {
      raw.push(_catmullRomPt(p0, p1, p2, p3, s / STEPS));
    }
  }
  raw.push({ lon: pts[n - 1].lon, lat: pts[n - 1].lat });

  // Kumulative Bogenlänge (in °-Einheiten, ausreichend für gleichmäßiges Resampling)
  const cumLen = [0];
  for (let i = 1; i < raw.length; i++) {
    const dx = raw[i].lon - raw[i - 1].lon;
    const dy = raw[i].lat - raw[i - 1].lat;
    cumLen.push(cumLen[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalLen = cumLen[cumLen.length - 1];

  // Gleichmäßig nach Bogenlänge resampling
  const samples = [];
  for (let s = 0; s < sampleCount; s++) {
    const target = (s / (sampleCount - 1)) * totalLen;
    let lo = 0, hi = cumLen.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cumLen[mid] <= target) lo = mid; else hi = mid;
    }
    const f = (cumLen[hi] - cumLen[lo]) > 0
      ? (target - cumLen[lo]) / (cumLen[hi] - cumLen[lo])
      : 0;
    samples.push({
      lon: raw[lo].lon + (raw[hi].lon - raw[lo].lon) * f,
      lat: raw[lo].lat + (raw[hi].lat - raw[lo].lat) * f,
    });
  }
  return samples;
}

/**
 * Fährt die Kamera kontinuierlich entlang der Spline-Samples.
 * Kein Stop an Zwischenpunkten – fließende Kurvenfahrt.
 */
function _animateSpline(pts, totalDuration) {
  const samples = _buildSplineSamples(pts);
  const last    = samples[samples.length - 1];

  return new Promise(resolve => {
    const startTime = performance.now();

    function frame(now) {
      if (_animAbort) { resolve(false); return; }

      const t   = Math.min((now - startTime) / totalDuration, 1);
      const idx = t * (samples.length - 1);
      const i0  = Math.floor(idx);
      const i1  = Math.min(i0 + 1, samples.length - 1);
      const f   = idx - i0;

      map.setCenter([
        samples[i0].lon + (samples[i1].lon - samples[i0].lon) * f,
        samples[i0].lat + (samples[i1].lat - samples[i0].lat) * f,
      ]);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        map.setCenter([last.lon, last.lat]); // exakt am Zielpunkt landen
        resolve(true);
      }
    }

    requestAnimationFrame(frame);
  });
}


let _labelEl = null;

function _showLabel(text) {
  if (!_labelEl) {
    _labelEl = document.createElement('div');
    Object.assign(_labelEl.style, {
      position:       'absolute',
      bottom:         '38px',
      right:          '18px',
      color:          '#fff',
      fontFamily:     'sans-serif',
      fontSize:       '0.8rem',
      letterSpacing:  '0.08em',
      textTransform:  'uppercase',
      opacity:        '0',
      transition:     'opacity 0.8s',
      pointerEvents:  'none',
      zIndex:         '1005',
      textShadow:     '0 1px 6px rgba(0,0,0,0.8)',
    });
    map.getContainer().appendChild(_labelEl);
  }
  _labelEl.textContent = text;
  requestAnimationFrame(() => { _labelEl.style.opacity = '1'; });
}

function _hideLabel() {
  if (_labelEl) { _labelEl.style.opacity = '0'; }
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────
async function playRouteAnimation(routeCode) {
  // Code-Auflösung: Parameter > globale Variable
  const code = String(routeCode !== undefined ? routeCode : window.ANIMATION_ROUTE);

  if (!code || code === 'null') {
    console.warn('[routeAnimation] Bitte ANIMATION_ROUTE setzen, z.B.: ANIMATION_ROUTE = "42"');
    return;
  }

  if (_animRunning) {
    console.log('[routeAnimation] Läuft bereits – erst stopRouteAnimation() aufrufen.');
    return;
  }

  // Route suchen: zuerst exakten Treffer auf displayCode, dann auf code
  if (typeof allRoutes === 'undefined') {
    console.error('[routeAnimation] allRoutes nicht gefunden – mapRoutes.js geladen?');
    return;
  }

  const route = allRoutes.find(r => String(r.displayCode) === code) ||
                allRoutes.find(r => String(r.code).startsWith(code + '||'));

  if (!route) {
    console.error(`[routeAnimation] Route "${code}" nicht gefunden. Verfügbare displayCodes (erste 20):`,
      [...new Set(allRoutes.slice(0, 200).map(r => r.displayCode))].slice(0, 20));
    return;
  }

  _animRunning = true;
  _animAbort   = false;

  const pts    = route.points;
  const origin = pts[0];

  console.log(`[routeAnimation] Starte Animation: ${route.species} (Route ${route.displayCode}), ${pts.length} Punkte`);

  // ── Setup ──────────────────────────────────────────────────────────────────
  _hideUI();
  _dimOtherRoutes(route.code);   // Andere Routen abdunkeln, Symbole bleiben erhalten
  _showAnimRoute(route);
  _showRouteSymbols(route);      // ▲ und ✕ dauerhaft einblenden

  // ── 1. Zurück auf Zoom 0 ──────────────────────────────────────────────────
  map.flyTo({ zoom: 0, duration: 1200 / window.ANIMATION_SPEED, essential: true });
  await _waitForIdle();
  if (_animAbort) { _cleanup(); return; }

  await _wait(600);
  if (_animAbort) { _cleanup(); return; }

  // Einheitliche Segmentdauer für die gesamte Strecke (inkl. Anflug auf den Startpunkt)
  const segDuration = window.ANIMATION_SEGMENT_MS / window.ANIMATION_SPEED;

  // ── 2. Zum Origin fahren – easeTo hält den Zoom konstant (kein Bogenkurven-Dip) ──
  await _easeTo({
    center:    [origin.lon, origin.lat],
    zoom:      6,
    duration:  segDuration,
    essential: true,
    easing:    t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  });
  if (_animAbort) { _cleanup(); return; }

  // Artname einblenden
  _showLabel(route.species);
  await _wait(1000);
  if (_animAbort) { _cleanup(); return; }

  // ── 3. Kontinuierliche Spline-Fahrt entlang der Route ────────────────────
  // Catmull-Rom-Kurve durch alle Wegpunkte – kein Stop, kein Zoom-Sprung.
  const totalRouteDuration = (pts.length - 1) * segDuration;
  const ok = await _animateSpline(pts, totalRouteDuration);
  if (!ok || _animAbort) { _cleanup(); return; }

  // ── 4. Abschluss: Zoom out auf Gesamtroute ────────────────────────────────
  await _wait(600);
  if (_animAbort) { _cleanup(); return; }

  // Bounding Box der Route berechnen
  const lons = pts.map(p => p.lon);
  const lats = pts.map(p => p.lat);
  const bounds = [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]];

  map.fitBounds(bounds, {
    padding:   80,
    duration:  2800 / window.ANIMATION_SPEED,
    essential: true,
  });
  await _waitForIdle();
  if (_animAbort) { _cleanup(); return; }

  await _wait(2000);

  // ── 5. Aufräumen & alles zurücksetzen ────────────────────────────────────
  _cleanup();
  console.log('[routeAnimation] Animation abgeschlossen.');
}

/** Bricht die laufende Animation ab und räumt auf. */
function stopRouteAnimation() {
  if (!_animRunning) return;
  _animAbort = true;
  console.log('[routeAnimation] Animation wird abgebrochen...');
}

/** Interner Aufräumschritt. */
function _cleanup() {
  _animRunning = false;
  _animAbort   = false;
  _hideLabel();
  setTimeout(() => {
    _removeAnimRoute();
    _hideRouteSymbols();
    _restoreOpacity();
    _showUI();
  }, 500);
}