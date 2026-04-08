// Ganz oben – NICHT innerhalb von buildLayers() oder onMapReady()
function getAvailableNames() {
  const filtered = allRoutes.filter(r => {
    if (yearFilterFrom !== null && yearFilterTo !== null) {
      const y = parseInt(r.year);
      if (isNaN(y) || y < yearFilterFrom || y > yearFilterTo) return false;
    }
    return true;
  });

  return {
    orders:   new Set(filtered.map(r => r.order)),
    families: new Set(filtered.map(r => r.family)),
    genera:   new Set(filtered.map(r => r.genus)),
    species:  new Set(filtered.map(r => r.species)),
  };
}

// Farben je Red-List-Status
const RL_LINE_COLOR = {
  'Critically Endangered': '#E76F51',
  'Endangered':            '#F4A261',
  'Vulnerable':            '#E9C46A',
  'Near Threatened':       '#A1C181',
  'Least Concern':         '#619B8A',
  '':                      '#888888',
};
const RL_POINT_COLOR = {
  'Critically Endangered': '#B95941',
  'Endangered':            '#C3824E',
  'Vulnerable':            '#BA9D55',
  'Near Threatened':       '#819A67',
  'Least Concern':         '#2E4A42',
  '':                      '#555555',
};

const LINE_WIDTH_NORMAL = 1.2; // normale Linienbreite 
const LINE_WIDTH_HOVER  = 3.5; // Breite bei Hover/Auswahl 
const POINT_RADIUS      = 4;   // Kreis-Radius

// Globaler Zustand
let allRoutes    = [];
let activeFilters = []; // Array von aktiven Filtern statt nur eines
let yearFilterFrom = null; // null = kein Jahresfilter aktiv
let yearFilterTo   = null;
let selectedRoute = null; // code der aktuell angeklickten Route
let selectedRouteData = null; // vollständiges Route-Objekt der angeklickten Route
let mapReady     = false;
// Option: Zwischenstopps ausblenden (nur Origin/Destination zeigen)
let hideStops = false;

// Tooltips/Infobox
// Hover-Tooltip (folgt der Maus)
const hoverTooltip = document.createElement('div');
Object.assign(hoverTooltip.style, {
  position: 'absolute', background: 'rgba(50,50,60,0.92)', color: '#fff',
  borderRadius: '6px', padding: '8px 12px', fontSize: '0.75rem',
  pointerEvents: 'none', opacity: '0',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip',
  lineHeight: '1.5', zIndex: '1001', transition: 'opacity 0.15s',
});

// Fixiertes Tooltip (bleibt nach Klick, bewegt sich mit Karte/Zoom)
const fixedTooltip = document.createElement('div');
Object.assign(fixedTooltip.style, {
  position: 'absolute', background: 'rgba(50,50,60,0.92)', color: '#fff',
  borderRadius: '6px', padding: '8px 12px', fontSize: '0.75rem',
  pointerEvents: 'none', opacity: '0',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip',
  lineHeight: '1.5', zIndex: '1000', transition: 'opacity 0.15s',
  border: '1px solid rgba(255,255,255,0.3)',
});

// Einstiegspunkt
function initMapRoutes(csvTable) {
  allRoutes = parseRoutes(csvTable);
  waitForMap();
}

function waitForMap() {
  if (typeof map === 'undefined') { setTimeout(waitForMap, 200); return; }
  if (map.loaded()) { onMapReady(); } else { map.on('load', onMapReady); }
}

function onMapReady() {
  mapReady = true;

  // Beim ersten Laden
  map.once('idle', () => {
    buildLayers();
    registerInteraction();
  });

  // Bei Kartenstil-Wechsel (z.B. auf Satellite) Layer neu aufbauen
  map.on('style.load', () => {
    buildLayers();
    // Listener nicht nochmal registrieren – map.on('click') etc. bleiben erhalten
  });

  // Fixiertes Tooltip mitbewegen wenn Karte bewegt oder gezoomt wird
  map.on('move', updateFixedTooltipPosition);
  map.on('zoom', updateFixedTooltipPosition);

  try {
    const mc = map.getContainer();
    if (mc) {
      const cs = window.getComputedStyle(mc);
      if (cs.position === 'static') mc.style.position = 'relative';
      if (hoverTooltip && !mc.contains(hoverTooltip)) mc.appendChild(hoverTooltip);
      if (fixedTooltip && !mc.contains(fixedTooltip)) mc.appendChild(fixedTooltip);
    }
  } catch (e) {
  }
}

// GeoJSON-Layer aufbauen
function buildLayers() {
  const visible = getVisibleRoutes();

  const lineFeatures = visible.map(r => ({
    type: 'Feature',
    properties: {
      code: r.code, species: r.species, rl: r.rl,
      country: r.country, year: r.year,
      color: RL_LINE_COLOR[r.rl] || RL_LINE_COLOR[''],
    },
    geometry: { type: 'LineString', coordinates: r.points.map(p => [p.lon, p.lat]) }
  }));

  const pointFeatures = [];
  for (const r of visible) {
    for (const pt of r.points) {
      // Wenn hideStops aktiviert ist, nur Start- und Endpunkte anzeigen
      if (hideStops && pt.node !== 'Origin' && pt.node !== 'Destination') continue;
      pointFeatures.push({
        type: 'Feature',
        properties: {
          code: r.code, species: r.species, rl: r.rl, node: pt.node,
          color: RL_POINT_COLOR[r.rl] || RL_POINT_COLOR[''],
        },
        geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] }
      });
    }
  }

  if (map.getSource('routes')) {
    // Daten aktualisieren
    map.getSource('routes').setData({ type: 'FeatureCollection', features: lineFeatures });
    map.getSource('points').setData({ type: 'FeatureCollection', features: pointFeatures });
  } else {
    // Sources und Layer erstmalig anlegen
    map.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: lineFeatures } });
    map.addSource('points', { type: 'geojson', data: { type: 'FeatureCollection', features: pointFeatures } });

    // Sichtbare Linie
    map.addLayer({
      id: 'route-lines', type: 'line', source: 'routes',
      paint: {
        'line-color':   ['get', 'color'],
        'line-width':   LINE_WIDTH_NORMAL,
        'line-opacity': 0.7,
      }
    });

    // Unsichtbare breite Hitbox – macht Linien leichter anklickbar
    map.addLayer({
      id: 'route-lines-hitbox', type: 'line', source: 'routes',
      paint: { 'line-color': 'transparent', 'line-width': 20, 'line-opacity': 0 }
    });

    // Punkte
    map.addLayer({
      id: 'route-points', type: 'circle', source: 'points',
      paint: { 'circle-radius': POINT_RADIUS, 'circle-color': ['get', 'color'] }
    });
  }

  // Auswahl-Stil wiederherstellen wenn Layer neu gebaut wurden
  applySelectionStyle();
}

// Interaktion registrieren (nur einmal!)
function registerInteraction() {

  // HOVER – Linie dicker + Hover-Tooltip zeigen
  map.on('mousemove', 'route-lines-hitbox', function(e) {
    map.getCanvas().style.cursor = 'pointer';
    const props = e.features[0].properties;
    map.setPaintProperty('route-lines', 'line-width', [
      'case',
      ['==', ['get', 'code'], selectedRoute || ''], LINE_WIDTH_HOVER,
      ['==', ['get', 'code'], props.code],          LINE_WIDTH_HOVER,
      LINE_WIDTH_NORMAL
    ]);

    // Hover-Tooltip zeigen – aber nicht wenn es dieselbe Route wie die fixierte ist
    if (props.code !== selectedRoute) {
      hoverTooltip.innerHTML = buildTooltipHTML(props);
      // Position relativ zum Map-Container
      const mapRect = map.getContainer().getBoundingClientRect();
      const relX = e.originalEvent.clientX - mapRect.left;
      const relY = e.originalEvent.clientY - mapRect.top;
      hoverTooltip.style.left = (relX + 14) + 'px';
      hoverTooltip.style.top  = (relY - 10) + 'px';
      hoverTooltip.style.opacity = '1';
    }
  });

  // HOVER LEAVE – Hover-Tooltip ausblenden, Auswahl-Stil beibehalten
  map.on('mouseleave', 'route-lines-hitbox', function() {
    map.getCanvas().style.cursor = '';
    hoverTooltip.style.opacity = '0';
    applySelectionStyle(); // stellt sicher dass ausgewählte Route dick bleibt
  });

  // KLICK AUF ROUTE – Route auswählen oder abwählen
  map.on('click', 'route-lines-hitbox', function(e) {
    e.preventDefault();
    const props = e.features[0].properties;
    const code  = props.code;

    if (code === selectedRoute) {
      // Nochmal klicken = abwählen
      selectedRoute     = null;
      selectedRouteData = null;
      fixedTooltip.style.opacity = '0';
    } else {
      // Neue Route auswählen
      selectedRoute     = code;
      selectedRouteData = allRoutes.find(r => r.code === code) || null;

      // Fixiertes Tooltip an Klick-Position setzen
  fixedTooltip.innerHTML = buildTooltipHTML(props);
  // Position relativ zum Map-Container
  const mapRect = map.getContainer().getBoundingClientRect();
  const relX = e.originalEvent.clientX - mapRect.left;
  const relY = e.originalEvent.clientY - mapRect.top;
  fixedTooltip.style.left = (relX + 14) + 'px';
  fixedTooltip.style.top  = (relY - 10) + 'px';
  fixedTooltip.style.opacity = '1';

      // Geografische Position merken damit Tooltip beim Zoomen/Bewegen folgt
      if (selectedRouteData) {
        // Mittelpunkt der Route als Ankerpunkt nehmen
        const pts = selectedRouteData.points;
        const mid = pts[Math.floor(pts.length / 2)];
        selectedRoute_lngLat = [mid.lon, mid.lat];
      }
    }

    applySelectionStyle();
  });

  // KLICK INS LEERE – Auswahl aufheben
  map.on('click', function(e) {
    const features = map.queryRenderedFeatures(e.point, { layers: ['route-lines-hitbox'] });
    if (features.length === 0 && selectedRoute) {
      selectedRoute     = null;
      selectedRouteData = null;
      selectedRoute_lngLat = null;
      fixedTooltip.style.opacity = '0';
      applySelectionStyle();
    }
  });
}

// Geografischer Ankerpunkt für das fixierte Tooltip
let selectedRoute_lngLat = null;

// Fixiertes Tooltip neu positionieren wenn Karte bewegt/gezoomt wird
function updateFixedTooltipPosition() {
  if (!selectedRoute || !selectedRoute_lngLat) return;

  // Geo-Koordinaten → Pixel
  const px = map.project(selectedRoute_lngLat);

  fixedTooltip.style.left = (px.x + 14) + 'px';
  fixedTooltip.style.top  = (px.y - 10) + 'px';
}

// Linienbreite je nach Auswahl setzen
function applySelectionStyle() {
  if (!map.getLayer('route-lines')) return;

  map.setPaintProperty('route-lines', 'line-width', [
    'case',
    ['==', ['get', 'code'], selectedRoute || ''], LINE_WIDTH_HOVER,
    LINE_WIDTH_NORMAL
  ]);

  map.setPaintProperty('route-lines', 'line-opacity', [
    'case',
    ['==', ['get', 'code'], selectedRoute || ''], 1.0,
    selectedRoute ? 0.35 : 0.7  // andere Routen abdunkeln wenn eine ausgewählt ist
  ]);

  // Chord-Diagramm mit gefilterten Verbindungen aktualisieren
  if (typeof updateMonthFilterConnections === 'function') {
    const connections = getVisibleMonthConnections();
    updateMonthFilterConnections(connections);
  }
}
// Tooltip HTML
function buildTooltipHTML(props) {
  const rlColor = RL_LINE_COLOR[props.rl] || '#fff';
  return `
    <strong style="font-size:0.85rem">${props.species}</strong><br>
    <span style="color:${rlColor}">${props.rl || 'Unbekannt'}</span><br>
    Route ${props.code}<br>
    ${props.country ? props.country + '<br>' : ''}
    ${props.year    ? 'Jahr: ' + props.year  : ''}
  `;
}

function getVisibleRoutes() {
  return allRoutes.filter(r => {
    // Alle aktiven Filter als Schnittmenge prüfen
    for (const f of activeFilters) {
      switch (f.type) {
        case 'order':   if (r.order   !== f.name) return false; break;
        case 'family':  if (r.family  !== f.name) return false; break;
        case 'genus':   if (r.genus   !== f.name) return false; break;
        case 'species': if (r.species !== f.name) return false; break;
        case 'months': {
          const sm = parseInt(r.month);
          const em = parseInt(r.endMonth);
          if (isNaN(sm) || isNaN(em)) return false;
          if (sm !== f.startMonth || em !== f.endMonth) return false;
          break;
        }
        case 'startMonth': {
          const sm = parseInt(r.month);
          if (isNaN(sm)) return false;
          if (sm !== f.month) return false;
          break;
        }
      }
    }
    // Jahresfilter (eigener Zustand, kein activeFilters-Eintrag)
    if (yearFilterFrom !== null && yearFilterTo !== null) {
      const y = parseInt(r.year);
      if (isNaN(y) || y < yearFilterFrom || y > yearFilterTo) return false;
    }
    return true;
  });
}

// CSV parsen
function parseRoutes(table) {
  const routeMap = {};
  for (let i = 0; i < table.getRowCount(); i++) {
    const code    = table.getString(i, 'Migratory route codes').trim();
    const node    = table.getString(i, 'Migration nodes').trim();
    const species = table.getString(i, 'English Name').trim();
    const order   = table.getString(i, 'Bird orders').trim();
    const family  = table.getString(i, 'Bird families').trim();
    const genus   = table.getString(i, 'Bird genera').trim();
    const rl      = table.getString(i, 'The IUCN Red List (2023)').trim();
    const month   = table.getString(i, 'Migration start month').trim();
    const endMonth = table.getString(i, 'Migration end month').trim();
    const year    = table.getString(i, 'Migration start year').trim();
    const country = table.getString(i, 'Countries').trim();
    const lon = parseFloat(table.getString(i, 'GPS_xx').replace(',', '.'));
    const lat = parseFloat(table.getString(i, 'GPS_yy').replace(',', '.'));
    if (!code || isNaN(lon) || isNaN(lat)) continue;
    if (!routeMap[code]) {
      routeMap[code] = { code, species, order, family, genus, rl, month, endMonth, year, country, points: [] };
    }
    routeMap[code].points.push({ lon, lat, node });
  }
  return Object.values(routeMap);
}

// Gibt nur die Monatsverbindungen zurück, für die in den sichtbaren Routen Daten existieren
function getVisibleMonthConnections() {
  const visible = getVisibleRoutes();
  const connections = {};
  
  for (const route of visible) {
    const startMonth = parseInt(route.month);
    const endMonth = parseInt(route.endMonth);
    if (!isNaN(startMonth) && !isNaN(endMonth)) {
      const key = `${startMonth}-${endMonth}`;
      connections[key] = (connections[key] || 0) + 1;
    }
  }
  
  const result = [];
  for (const [key, count] of Object.entries(connections)) {
    const [source, target] = key.split('-').map(Number);
    result.push({ source: source - 1, target: target - 1, value: count });
  }
  
  return result;
}function filterRoutes(name, depth) {
  // Nur Vogel-Filtertypen entfernen, andere (z.B. 'months') behalten
  const birdTypes = ['order', 'family', 'genus', 'species'];
  activeFilters = activeFilters.filter(f => !birdTypes.includes(f.type));
  if (name) {
    const typeMap = { 1: 'order', 2: 'family', 3: 'genus', 4: 'species' };
    activeFilters.push({ type: typeMap[depth], name });
  }
  selectedRoute        = null;
  selectedRouteData    = null;
  selectedRoute_lngLat = null;
  fixedTooltip.style.opacity = '0';
  buildLayers();
}

// Filter nach Migrations-Monaten (von monthFilter.js aufgerufen)
function filterRoutesByMonths(startMonth, endMonth) {
  if (startMonth === null || endMonth === null) {
    // Monats-Filter löschen, aber andere Filter behalten
    activeFilters = activeFilters.filter(f => f.type !== 'months');
  } else {
    // Existierenden Monats-Filter entfernen
    activeFilters = activeFilters.filter(f => f.type !== 'months');
    
    // Neuen Filter hinzufügen
    activeFilters.push({ type: 'months', startMonth, endMonth });
  }
  // Auswahl und Tooltip zurücksetzen wenn Filter wechselt
  selectedRoute        = null;
  selectedRouteData    = null;
  selectedRoute_lngLat = null;
  fixedTooltip.style.opacity = '0';

  buildLayers();
}

// Filter nach Startmonat (von monthFilter.js aufgerufen wenn auf Node geklickt wird)
function filterRoutesByStartMonth(month) {
  if (month === null) {
    // Filter löschen
    activeFilters = activeFilters.filter(f => f.type !== 'startMonth');
  } else {
    // Existierenden Startmonat-Filter entfernen
    activeFilters = activeFilters.filter(f => f.type !== 'startMonth');
    
    // Neuen Filter hinzufügen
    activeFilters.push({ type: 'startMonth', month });
  }
  // Auswahl und Tooltip zurücksetzen wenn Filter wechselt
  selectedRoute        = null;
  selectedRouteData    = null;
  selectedRoute_lngLat = null;
  fixedTooltip.style.opacity = '0';

  buildLayers();
}

// Aktuellen Status aller Filter abrufen
function getActiveFilters() {
  return activeFilters;
}

// Prüfen ob ein bestimmter Filter-Typ aktiv ist
function getFilterByType(type) {
  return activeFilters.find(f => f.type === type) || null;
}

// Alle Filter löschen
function clearAllFilters() {
  activeFilters = [];
  selectedRoute = null;
  selectedRouteData = null;
  selectedRoute_lngLat = null;
  fixedTooltip.style.opacity = '0';
  buildLayers();
}

// Legende aufbauen
function buildLegend() {
  const legend = document.querySelector('.legend');
  if (!legend) return;
  const div = document.createElement('div');
  div.style.cssText = 'margin-top:12px;color:#fff;font-size:0.72rem;line-height:1.8';
  div.innerHTML = `
    <div style="font-weight:bold;margin-bottom:4px">Gefährdungsstatus</div>
    ${Object.entries(RL_LINE_COLOR).filter(([k]) => k).map(([label, color]) =>
      `<div><span style="display:inline-block;width:10px;height:10px;background:${color};border-radius:2px;margin-right:5px"></span>${label}</div>`
    ).join('')}
    <div style="font-weight:bold;margin-top:8px;margin-bottom:4px">Punkte</div>
    <div style="margin-bottom:6px"><label><input type="checkbox" id="hide-stops-checkbox" ${hideStops ? 'checked' : ''}/> Zwischenstopps ausblenden</label></div>
    <div>▲ Startpunkt</div>
    <div>● Zwischenstopp</div>
    <div>✕ Endpunkt</div>
  `;
  legend.appendChild(div);

  // Checkbox-Listener anhängen
  const cb = document.getElementById('hide-stops-checkbox');
  if (cb) {
    cb.addEventListener('change', function() {
      hideStops = !!this.checked;
      // Neu aufbauen / aktualisieren
      try { buildLayers(); } catch (e) {}
      applySelectionStyle();
    });
  }
}

// Wird von yearFilter.js aufgerufen
function filterRoutesByYear(from, to) {
  yearFilterFrom = from;
  yearFilterTo   = to;
  selectedRoute        = null;
  selectedRouteData    = null;
  selectedRoute_lngLat = null;
  fixedTooltip.style.opacity = '0';
  buildLayers();
}

window.addEventListener('load', buildLegend);