// mapRoutes.js
// Zeichnet die Vogelmigrations-Routen auf die MapLibre-Karte.
// Wird von sketch.js aufgerufen sobald die CSV geladen ist.
//
// Später – Filter anbinden:
//   filterRoutes(filterObj) aufrufen um die sichtbaren Routen einzuschränken.
//   filterObj kann sein: { type: 'order'|'family'|'genus'|'species', name: '...' }
//   oder null für "alle zeigen".


// ── Farben je Red-List-Status ──────────────────────────────
// Linienfarbe (heller)
const RL_LINE_COLOR = {
  'Critically Endangered': '#E76F51',
  'Endangered':            '#F4A261',
  'Vulnerable':            '#E9C46A',
  'Near Threatened':       '#A1C181',
  'Least Concern':         '#619B8A',
  '':                      '#888888', // Fallback wenn kein Status vorhanden
};

// Punktfarbe (dunkler) für Origin/Transit/Destination
const RL_POINT_COLOR = {
  'Critically Endangered': '#B95941',
  'Endangered':            '#C3824E',
  'Vulnerable':            '#BA9D55',
  'Near Threatened':       '#819A67',
  'Least Concern':         '#2E4A42',
  '':                      '#555555',
};

// Normaler und hover Linienbreite
const LINE_WIDTH_NORMAL = 1.2;  // hier anpassen für dünnere/dickere Routen
const LINE_WIDTH_HOVER  = 3.0;  // Breite beim Hovern
const POINT_RADIUS      = 4;    // Radius der Kreise (Zwischenstopps) in px – hier anpassen
const SYMBOL_SIZE       = 7;    // Größe der Dreiecke und Kreuze in px – hier anpassen

// ── Globale Variablen ──────────────────────────────────────
let allRoutes     = [];   // alle geparsten Routen
let activeFilter  = null; // aktuell aktiver Filter (von birdFilter.js gesetzt)
let selectedRoute = null; // angeklickte Route (Routencode als String)
let mapReady      = false;// wird true sobald MapLibre fertig geladen hat

// Canvas für die Routen (wird über die Karte gelegt)
let routeCanvas, routeCtx;
// Referenz auf das DOM-Element in das das Overlay gehängt wurde
let overlayContainer = null;
// Debug: sichtbare Markierung des Overlay-Canvas (setzt Rahmen + Testkreuz)
const DEBUG_CANVAS_OVERLAY = false;

// ── Einstiegspunkt: CSV-Daten übergeben ───────────────────
// Wird von sketch.js in setup() aufgerufen
function initMapRoutes(csvTable) {
  allRoutes = parseRoutes(csvTable);
  waitForMap();
}

// ── Warten bis MapLibre-Karte geladen ist ─────────────────
function waitForMap() {
  // map ist die globale Variable die in index.html erstellt wird
  if (typeof map === 'undefined') {
    setTimeout(waitForMap, 200);
    return;
  }
  if (map.loaded()) {
    onMapReady();
  } else {
    map.on('load', onMapReady);
  }
}

function onMapReady() {
  mapReady = true;

  map.once('idle', () => {
    // Routen als GeoJSON direkt in MapLibre einfügen – kein eigener Canvas nötig
    buildGeoJSON();
    setupInteraction(document.getElementById('map'));
  });

  // Wenn der Benutzer den Kartenstil wechselt (z.B. auf Satellite), entfernt MapLibre
  // die Quellen/Layers – also neu aufbauen sobald der Stil geladen ist.
  map.on('style.load', () => {
    // rebuild sources & layers for the new style
    buildGeoJSON();
  });
}

function buildGeoJSON() {
  const visible = getVisibleRoutes();
console.log('buildGeoJSON: sichtbare Routen:', visible.length, '| activeFilter:', activeFilter);

  // GeoJSON für Linien
  const lineFeatures = visible.map(route => ({
    type: 'Feature',
    properties: {
      code:    route.code,
      species: route.species,
      rl:      route.rl,
      country: route.country,
      year:    route.year,
      color:   RL_LINE_COLOR[route.rl] || RL_LINE_COLOR[''],
    },
    geometry: {
      type: 'LineString',
      coordinates: route.points.map(p => [p.lon, p.lat])
    }
  }));

  // GeoJSON für Punkte
  const pointFeatures = [];
  for (const route of visible) {
    for (const pt of route.points) {
      pointFeatures.push({
        type: 'Feature',
        properties: {
          code:    route.code,
          species: route.species,
          rl:      route.rl,
          node:    pt.node,
          color:   RL_POINT_COLOR[route.rl] || RL_POINT_COLOR[''],
        },
        geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] }
      });
    }
  }

  // Source und Layer hinzufügen oder aktualisieren
  if (map.getSource('routes')) {
    map.getSource('routes').setData({ type: 'FeatureCollection', features: lineFeatures });
    map.getSource('points').setData({ type: 'FeatureCollection', features: pointFeatures });
  } else {
    // Linien
    map.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: lineFeatures } });
    map.addLayer({
      id:     'route-lines',
      type:   'line',
      source: 'routes',
      paint: {
        'line-color':   ['get', 'color'],
        'line-width':   LINE_WIDTH_NORMAL,
        'line-opacity': 0.7,
      }
    });

    // Unsichtbarer dicker Layer nur für einfacheres Hovern/Klicken
map.addLayer({
  id:     'route-lines-hitbox',
  type:   'line',
  source: 'routes',
  paint: {
    'line-color':   'transparent',
    'line-width':   20, // breite unsichtbare Klickfläche – hier anpassen
    'line-opacity': 0,
  }
});

    // Punkte (Kreise für alle – Dreiecke/Kreuze später per Symbol-Layer)
    map.addSource('points', { type: 'geojson', data: { type: 'FeatureCollection', features: pointFeatures } });
    map.addLayer({
      id:     'route-points',
      type:   'circle',
      source: 'points',
      paint: {
        'circle-radius': POINT_RADIUS,
        'circle-color':  ['get', 'color'],
      }
    });

    // // Hover
    // map.on('mousemove', 'route-lines', onLineHover);
    // map.on('mouseleave','route-lines', onLineLeave);
    // map.on('click',     'route-lines', onLineClick);
    map.on('mousemove', 'route-lines-hitbox', function(e) {
  map.getCanvas().style.cursor = 'pointer';
  const props = e.features[0].properties;

  // Hover: ausgewählte Route bleibt dick, gehoverte Route auch dick
  map.setPaintProperty('route-lines', 'line-width', [
    'case',
    ['==', ['get', 'code'], selectedRoute || ''], LINE_WIDTH_HOVER,
    ['==', ['get', 'code'], props.code],          LINE_WIDTH_HOVER,
    LINE_WIDTH_NORMAL
  ]);

  routeTooltip.style.left    = (e.originalEvent.clientX + 14) + 'px';
  routeTooltip.style.top     = (e.originalEvent.clientY - 10) + 'px';
  routeTooltip.style.opacity = '1';
  routeTooltip.innerHTML = `
    <strong style="font-size:0.85rem">${props.species}</strong><br>
    <span style="color:${props.color}">${props.rl || 'Unbekannt'}</span><br>
    Route ${props.code}<br>
    ${props.country ? props.country + '<br>' : ''}
    ${props.year ? 'Jahr: ' + props.year : ''}
  `;
});
// Zweites Tooltip für die fixierte (angeklickte) Route
const fixedTooltip = document.createElement('div');
Object.assign(fixedTooltip.style, {
  position:      'fixed',
  background:    'rgba(50,50,60,0.92)',
  color:         '#fff',
  borderRadius:  '6px',
  padding:       '8px 12px',
  fontSize:      '0.75rem',
  pointerEvents: 'none',
  opacity:       '0',
  maxWidth:      '200px',
  lineHeight:    '1.5',
  zIndex:        '1000',
  transition:    'opacity 0.15s',
  border:        '1px solid rgba(255,255,255,0.3)', // leichter Rahmen damit man die zwei unterscheiden kann
});
document.body.appendChild(fixedTooltip);

map.on('mouseleave', 'route-lines-hitbox', function() {
  map.getCanvas().style.cursor = '';
  routeTooltip.style.opacity = '0';

  map.setPaintProperty('route-lines', 'line-width', [
    'case',
    ['==', ['get', 'code'], selectedRoute || ''], LINE_WIDTH_HOVER,
    LINE_WIDTH_NORMAL
  ]);
});

map.on('click', 'route-lines-hitbox', function(e) {
  const props = e.features[0].properties;
  const code  = props.code;
  selectedRoute = (code !== selectedRoute) ? code : null;

  map.setPaintProperty('route-lines', 'line-width', [
    'case',
    ['==', ['get', 'code'], selectedRoute || ''], LINE_WIDTH_HOVER,
    LINE_WIDTH_NORMAL
  ]);

  if (selectedRoute) {
    // Fixiertes Tooltip an der Klick-Position einfrieren
    fixedTooltip.innerHTML = `
      <strong style="font-size:0.85rem">${props.species}</strong><br>
      <span style="color:${props.color}">${props.rl || 'Unbekannt'}</span><br>
      Route ${props.code}<br>
      ${props.country ? props.country + '<br>' : ''}
      ${props.year ? 'Jahr: ' + props.year : ''}
    `;
    fixedTooltip.style.left    = (e.originalEvent.clientX + 14) + 'px';
    fixedTooltip.style.top     = (e.originalEvent.clientY - 10) + 'px';
    fixedTooltip.style.opacity = '1';
  } else {
    fixedTooltip.style.opacity = '0';
  }
});

map.on('click', function(e) {
  const features = map.queryRenderedFeatures(e.point, { layers: ['route-lines'] });
  if (features.length === 0 && selectedRoute) {
    selectedRoute = null;
    map.setPaintProperty('route-lines', 'line-width', LINE_WIDTH_NORMAL);
    fixedTooltip.style.opacity = '0';
  }
});

  }
}

function onLineHover(e) {
  map.getCanvas().style.cursor = 'pointer';
  const props = e.features[0].properties;

  // Hover-Linie dicker machen
  map.setPaintProperty('route-lines-hitbox', 'line-width', [
    'case', ['==', ['get', 'code'], props.code], LINE_WIDTH_HOVER, LINE_WIDTH_NORMAL
  ]);

  routeTooltip.style.left    = (e.originalEvent.clientX + 14) + 'px';
  routeTooltip.style.top     = (e.originalEvent.clientY - 10) + 'px';
  routeTooltip.style.opacity = '1';
  routeTooltip.innerHTML = `
    <strong style="font-size:0.85rem">${props.species}</strong><br>
    <span style="color:${props.color}">${props.rl || 'Unbekannt'}</span><br>
    Route ${props.code}<br>
    ${props.country ? props.country + '<br>' : ''}
    ${props.year ? 'Jahr: ' + props.year : ''}
  `;
}

function onLineLeave() {
  map.getCanvas().style.cursor = '';
  map.setPaintProperty('route-lines', 'line-width', LINE_WIDTH_NORMAL);
  routeTooltip.style.opacity = '0';
}

function onLineClick(e) {
  const code = e.features[0].properties.code;
  selectedRoute = (code !== selectedRoute) ? code : null;

  map.setPaintProperty('route-lines', 'line-width', [
    'case',
    ['==', ['get', 'code'], selectedRoute || ''], LINE_WIDTH_HOVER,
    LINE_WIDTH_NORMAL
  ]);
}

// drawRoutes jetzt einfach GeoJSON neu laden
function drawRoutes() {
  if (!mapReady) return;
  if (map.getSource('routes')) buildGeoJSON();
}

function resizeCanvas() {
  const mc = map.getCanvas();

  // Exakt die gleiche CSS-Größe wie MapLibre's Canvas
  routeCanvas.style.width  = mc.style.width  || mc.clientWidth  + 'px';
  routeCanvas.style.height = mc.style.height || mc.clientHeight + 'px';

  // Backbuffer in CSS-Pixeln (nicht Backbuffer-Pixeln)
  routeCanvas.width  = mc.clientWidth;
  routeCanvas.height = mc.clientHeight;

  routeCtx.setTransform(1, 0, 0, 1, 0, 0);
  drawRoutes();
}

// ── CSV parsen: Routen als Array von Objekten ──────────────
function parseRoutes(table) {
  const routeMap = {}; // routeCode → { meta, points[] }

  for (let i = 0; i < table.getRowCount(); i++) {
    const code    = table.getString(i, 'Migratory route codes').trim();
    const node    = table.getString(i, 'Migration nodes').trim();
    const species = table.getString(i, 'English Name').trim();
    const order   = table.getString(i, 'Bird orders').trim();
    const family  = table.getString(i, 'Bird families').trim();
    const genus   = table.getString(i, 'Bird genera').trim();
    const rl      = table.getString(i, 'The IUCN Red List (2023)').trim();
    const month   = table.getString(i, 'Migration start month').trim();
    const year    = table.getString(i, 'Migration start year').trim();
    const country = table.getString(i, 'Countries').trim();

    // GPS: Komma als Dezimaltrennzeichen → Punkt
    const lon = parseFloat(table.getString(i, 'GPS_xx').replace(',', '.'));
    const lat = parseFloat(table.getString(i, 'GPS_yy').replace(',', '.'));

    if (!code || isNaN(lon) || isNaN(lat)) continue;

    if (!routeMap[code]) {
      routeMap[code] = {
        code, species, order, family, genus, rl, month, year, country,
        points: []
      };
    }

    routeMap[code].points.push({ lon, lat, node });
  }

  return Object.values(routeMap);
}

// ── Koordinaten: Geo → Canvas-Pixel ───────────────────────
function project(lon, lat) {
  // Return raw map.project coordinates. resizeCanvas() ensures the overlay canvas
  // backbuffer uses the same pixel units as MapLibre's internal canvas when available.
  return map.project([lon, lat]);
}

// ── Routen zeichnen ────────────────────────────────────────
function drawRoutes() {
  if (!routeCtx || !mapReady) return;

  const w = routeCanvas.width;
  const h = routeCanvas.height;
  routeCtx.clearRect(0, 0, w, h);

  const visible = getVisibleRoutes();

  // Erst alle nicht-ausgewählten Routen zeichnen, dann die ausgewählte obendrauf
  for (const route of visible) {
    if (route.code !== selectedRoute) drawRoute(route, false);
  }
  for (const route of visible) {
    if (route.code === selectedRoute) drawRoute(route, true);
  }

  // Debug: zeichne ein diagonales Kreuz über die Canvas, so sieht man sofort
  // ob die Backbuffer-Fläche korrekt die gesamte Map abdeckt.
  if (DEBUG_CANVAS_OVERLAY) {
    try {
      // Speichere aktuellen Kontextzustand
      routeCtx.save();
      routeCtx.strokeStyle = 'rgba(255,0,0,0.9)';
      routeCtx.lineWidth = 2;
      const w = routeCanvas.width / (window.devicePixelRatio || 1);
      const h = routeCanvas.height / (window.devicePixelRatio || 1);
      routeCtx.beginPath();
      routeCtx.moveTo(0, 0); routeCtx.lineTo(w, h);
      routeCtx.moveTo(w, 0); routeCtx.lineTo(0, h);
      routeCtx.stroke();
      routeCtx.restore();
    } catch (e) {
      // ignore debug errors
    }
  }
}

// ── Gibt Routen zurück die den aktuellen Filter erfüllen ───
function getVisibleRoutes() {
  if (!activeFilter) return allRoutes; // kein Filter = alle zeigen

  return allRoutes.filter(r => {
    switch (activeFilter.type) {
      case 'order':   return r.order   === activeFilter.name;
      case 'family':  return r.family  === activeFilter.name;
      case 'genus':   return r.genus   === activeFilter.name;
      case 'species': return r.species === activeFilter.name;
      default:        return true;
    }
  });
    console.log('getVisibleRoutes: gefiltert auf', filtered.length, 'Routen, erste Route family:', filtered[0]?.family);
  return filtered;
}

// ── Eine einzelne Route zeichnen ───────────────────────────
function drawRoute(route, isSelected) {
  const pts = route.points;
  if (pts.length < 1) return;

  const lineColor  = RL_LINE_COLOR[route.rl]  || RL_LINE_COLOR[''];
  const pointColor = RL_POINT_COLOR[route.rl] || RL_POINT_COLOR[''];
  const lineWidth  = isSelected ? LINE_WIDTH_HOVER : LINE_WIDTH_NORMAL;

  // Pixel-Koordinaten berechnen
  const px = pts.map(p => project(p.lon, p.lat));

  // Linie zeichnen
  routeCtx.beginPath();
  routeCtx.strokeStyle = isSelected
    ? saturate(lineColor, 1.4)  // angeklickte Route: gesättigtere Farbe
    : lineColor;
  routeCtx.lineWidth = lineWidth;
  routeCtx.lineJoin  = 'round';
  routeCtx.globalAlpha = isSelected ? 1.0 : 0.7; // nicht ausgewählte Routen leicht transparent
  routeCtx.moveTo(px[0].x, px[0].y);
  for (let i = 1; i < px.length; i++) {
    routeCtx.lineTo(px[i].x, px[i].y);
  }
  routeCtx.stroke();
  routeCtx.globalAlpha = 1.0;

  // Punkte zeichnen
  for (let i = 0; i < pts.length; i++) {
    const { x, y } = px[i];
    const node = pts[i].node;
    routeCtx.fillStyle = isSelected ? saturate(pointColor, 1.4) : pointColor;

    if (node === 'Origin') {
      drawTriangle(x, y, SYMBOL_SIZE); // Dreieck für Startpunkt
    } else if (node === 'Destination') {
      drawCross(x, y, SYMBOL_SIZE);    // Kreuz für Endpunkt
    } else {
      drawCircle(x, y, POINT_RADIUS);  // Kreis für Zwischenstopp
    }
  }
}

// ── Geometrie-Hilfsfunktionen ──────────────────────────────
function drawCircle(x, y, r) {
  routeCtx.beginPath();
  routeCtx.arc(x, y, r, 0, Math.PI * 2);
  routeCtx.fill();
}

// Dreieck mit Spitze nach unten (zeigt auf die Linie)
function drawTriangle(x, y, size) {
  routeCtx.beginPath();
  routeCtx.moveTo(x, y + size);           // Spitze unten
  routeCtx.lineTo(x - size * 0.7, y - size * 0.5);
  routeCtx.lineTo(x + size * 0.7, y - size * 0.5);
  routeCtx.closePath();
  routeCtx.fill();
}

// Kreuz (×) für Endpunkt
function drawCross(x, y, size) {
  const s = size * 0.65;
  routeCtx.lineWidth   = 2;
  routeCtx.strokeStyle = routeCtx.fillStyle; // gleiche Farbe wie fill
  routeCtx.beginPath();
  routeCtx.moveTo(x - s, y - s); routeCtx.lineTo(x + s, y + s);
  routeCtx.moveTo(x + s, y - s); routeCtx.lineTo(x - s, y + s);
  routeCtx.stroke();
}

// ── Farbe sättigen (für Hover/Auswahl) ────────────────────
// Multipliziert S in HSL mit dem Faktor
function saturate(hex, factor) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max===min) { h=s=0; } else {
    const d = max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h/=6;
  }
  s = Math.min(1, s * factor);
  // HSL → RGB
  function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
  let nr,ng,nb;
  if(s===0){nr=ng=nb=l;}else{
    const q2=l<0.5?l*(1+s):l+s-l*s, p2=2*l-q2;
    nr=hue2rgb(p2,q2,h+1/3); ng=hue2rgb(p2,q2,h); nb=hue2rgb(p2,q2,h-1/3);
  }
  const toHex=v=>Math.round(v*255).toString(16).padStart(2,'0');
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

// ── Interaktion: Hover & Klick ─────────────────────────────
let hoveredRoute = null;

// Tooltip-Element erstellen
const routeTooltip = document.createElement('div');
Object.assign(routeTooltip.style, {
  position:      'fixed',
  background:    'rgba(50,50,60,0.92)', // Hintergrundfarbe Tooltip – hier änderbar
  color:         '#fff',
  borderRadius:  '6px',
  padding:       '8px 12px',
  fontSize:      '0.75rem',  // Schriftgröße Tooltip – hier änderbar
  pointerEvents: 'none',
  opacity:       '0',
  maxWidth:      '200px',
  lineHeight:    '1.5',
  zIndex:        '1000',
  transition:    'opacity 0.15s',
});
document.body.appendChild(routeTooltip);

// Fixed tooltip (für die angeklickte/fixierte Route) – ein Element, wiederverwendbar
let fixedTooltip = document.getElementById('fixedRouteTooltip');
if (!fixedTooltip) {
  fixedTooltip = document.createElement('div');
  fixedTooltip.id = 'fixedRouteTooltip';
  Object.assign(fixedTooltip.style, {
    position:      'fixed',
    background:    'rgba(50,50,60,0.92)',
    color:         '#fff',
    borderRadius:  '6px',
    padding:       '8px 12px',
    fontSize:      '0.75rem',
    pointerEvents: 'none',
    opacity:       '0',
    maxWidth:      '200px',
    lineHeight:    '1.5',
    zIndex:        '1000',
    transition:    'opacity 0.15s',
    border:        '1px solid rgba(255,255,255,0.3)',
  });
  document.body.appendChild(fixedTooltip);
}


function setupInteraction(mapEl) {
  // Nichts mehr nötig – Hover/Klick läuft über map.on() oben
}

function onMouseMove(e) {
  const rect = routeCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const hit = findRouteAtPixel(mx, my);

  if (hit !== hoveredRoute) {
    hoveredRoute = hit;
    drawRoutes();
    if (hit) highlightRoute(hit, mx, my);
  }

  if (hit) {
    // Tooltip-Position aktualisieren
    routeTooltip.style.left    = (e.clientX + 14) + 'px';
    routeTooltip.style.top     = (e.clientY - 10) + 'px';
    routeTooltip.style.opacity = '1';
    routeTooltip.innerHTML = buildTooltip(hit);
  } else {
    routeTooltip.style.opacity = '0';
  }
}

function onMouseClick(e) {
  const rect = routeCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const hit = findRouteAtPixel(mx, my);

  // Klick auf eine Route: auswählen; nochmal klicken: abwählen
  selectedRoute = (hit && hit.code !== selectedRoute) ? hit.code : null;
  drawRoutes();
}

// ── Route unter dem Mauszeiger finden ─────────────────────
// Sucht die erste Route deren Linie oder Punkte nah genug am Cursor sind
function findRouteAtPixel(mx, my) {
  const hitRadius = 8; // px Toleranz – hier anpassen
  const visible = getVisibleRoutes();

  // Rückwärts iterieren damit obere (zuletzt gezeichnete) Routen Vorrang haben
  for (let i = visible.length - 1; i >= 0; i--) {
    const route = visible[i];
    const px = route.points.map(p => project(p.lon, p.lat));

    // Punkte prüfen
    for (const p of px) {
      if (Math.hypot(p.x - mx, p.y - my) < hitRadius) return route;
    }

    // Liniensegmente prüfen
    for (let j = 0; j < px.length - 1; j++) {
      if (distToSegment(mx, my, px[j].x, px[j].y, px[j+1].x, px[j+1].y) < hitRadius) {
        return route;
      }
    }
  }
  return null;
}

// Abstand Punkt zu Liniensegment
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx-ax, dy = by-ay;
  const lenSq = dx*dx + dy*dy;
  if (lenSq === 0) return Math.hypot(px-ax, py-ay);
  let t = ((px-ax)*dx + (py-ay)*dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t*dx), py - (ay + t*dy));
}

// Route beim Hovern hervorheben (dicker + gesättigt)
function highlightRoute(route, mx, my) {
  const pts = route.points;
  const px  = pts.map(p => project(p.lon, p.lat));
  const lineColor = RL_LINE_COLOR[route.rl] || RL_LINE_COLOR[''];

  routeCtx.beginPath();
  routeCtx.strokeStyle = saturate(lineColor, 1.4);
  routeCtx.lineWidth   = LINE_WIDTH_HOVER;
  routeCtx.lineJoin    = 'round';
  routeCtx.moveTo(px[0].x, px[0].y);
  for (let i = 1; i < px.length; i++) routeCtx.lineTo(px[i].x, px[i].y);
  routeCtx.stroke();
}

// ── Tooltip-Inhalt aufbauen ────────────────────────────────
function buildTooltip(route) {
  const rlColor = RL_LINE_COLOR[route.rl] || '#fff';
  return `
    <strong style="font-size:0.85rem">${route.species}</strong><br>
    <span style="color:${rlColor}">${route.rl || 'Unbekannt'}</span><br>
    Route ${route.code} &nbsp;·&nbsp; ${route.points.length} Punkte<br>
    ${route.country ? route.country + '<br>' : ''}
    ${route.year ? 'Jahr: ' + route.year : ''}
  `;
}

// ── Legende in die Kachel einfügen ────────────────────────
// Wird aufgerufen wenn das DOM bereit ist
function buildLegend() {
  const legend = document.querySelector('.legend');
  if (!legend) return;

  // Bestehenden Inhalt behalten (Radio-Buttons) und Legende anhängen
  const div = document.createElement('div');
  div.style.marginTop = '12px';
  div.style.color     = '#fff';
  div.style.fontSize  = '0.72rem';
  div.style.lineHeight = '1.8';

  // Red-List-Farben
  div.innerHTML = `
    <div style="font-weight:bold;margin-bottom:4px">Gefährdungsstatus</div>
    ${Object.entries(RL_LINE_COLOR).filter(([k])=>k).map(([label, color]) =>
      `<div><span style="display:inline-block;width:10px;height:10px;background:${color};border-radius:2px;margin-right:5px"></span>${label}</div>`
    ).join('')}
    <div style="font-weight:bold;margin-top:8px;margin-bottom:4px">Punkte</div>
    <div>▲ Startpunkt</div>
    <div>● Zwischenstopp</div>
    <div>✕ Endpunkt</div>
  `;
  legend.appendChild(div);
}

function filterRoutes(name, depth) {
  console.log('filterRoutes aufgerufen:', name, depth);
  if (!name) {
    activeFilter = null;
  } else {
    const typeMap = { 1: 'order', 2: 'family', 3: 'genus', 4: 'species' };
    activeFilter = { type: typeMap[depth], name };
  }
  selectedRoute = null;
  console.log('activeFilter gesetzt:', activeFilter);
  console.log('map.getSource routes existiert:', !!map.getSource('routes'));
//   drawRoutes();
// Direkt buildGeoJSON aufrufen statt drawRoutes
  buildGeoJSON();
}
function drawRoutes() {
  if (!mapReady || !map.getSource('routes')) return;
  buildGeoJSON();
}

// ── Start ──────────────────────────────────────────────────
window.addEventListener('load', buildLegend);