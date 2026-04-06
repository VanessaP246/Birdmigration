// Non-Ribbon Chord Diagram for Bird Migration Months

// Color palette for 12 months - distinct colors for each node
const MONTH_COLORS = [
  '#3A5D53', // January
  '#A1C181', // February
  '#858C4A', // March
  '#E9C46A', // April
  '#F4A261', // May
  '#E76F51', // June
  '#CE6A85', // July
  '#A95B4C', // August
  '#A67458', // September
  '#9E99D3', // October
  '#398CBF', // November
  '#4C54A9'  // December
];

// Filter für den aktuell aktiven Monat speichern
let currentMonthFilter = { startMonth: null, endMonth: null };

// Aktuell angeklickte Verbindung (0-indiziert) – null wenn keine ausgewählt
let selectedConn = null;

// Aktuell angeklickter Node (0-indiziert) – null wenn keine ausgewählt
let selectedNode = null;

// monthFilter initialisieren
function initmonthFilter(csvTable) {
  const container = document.getElementById('monthFilter');
  if (!container) return;

  const connections = parseMigrationConnections(csvTable);

  if (connections.length === 0) {
    console.warn('Keine gültigen Migrations-Verbindungen in den CSV-Daten gefunden');
    return;
  }

  const aggregatedConnections = aggregateConnections(connections);
  drawmonthFilter(container, aggregatedConnections);
}

// Start- und Endmonat der Migration aus CSV-Daten extrahieren
function parseMigrationConnections(csvTable) {
  const connections = [];

  let rowCount = 0;
  let getValueFunc;

  if (csvTable.getRowCount) {
    rowCount = csvTable.getRowCount();
    getValueFunc = (i, col) => csvTable.getString(i, col);
  } else if (typeof csvTable === 'object') {
    rowCount = csvTable.length || 0;
    getValueFunc = (i, col) => csvTable[i] ? csvTable[i][col] : '';
  }

  for (let i = 0; i < rowCount; i++) {
    try {
      const startMonth = parseInt(getValueFunc(i, 'Migration start month'));
      const endMonth   = parseInt(getValueFunc(i, 'Migration end month'));
      if (startMonth >= 1 && startMonth <= 12 && endMonth >= 1 && endMonth <= 12) {
        connections.push({ startMonth, endMonth });
      }
    } catch (e) { /* Zeile überspringen */ }
  }

  return connections;
}

// Verbindungen aggregieren -> [{source, target, value}] (0-indiziert)
function aggregateConnections(connections) {
  const aggregated = {};

  for (const conn of connections) {
    const key = `${conn.startMonth}-${conn.endMonth}`;
    aggregated[key] = (aggregated[key] || 0) + 1;
  }

  const result = [];
  for (const [key, count] of Object.entries(aggregated)) {
    const [source, target] = key.split('-').map(Number);
    result.push({ source: source - 1, target: target - 1, value: count });
  }

  return result;
}

// Chord-Diagramm zeichnen
function drawmonthFilter(container, connections) {
  d3.select(container).selectAll('*').remove();

  const width   = container.clientWidth;
  const height  = container.clientHeight;
  const padding = 12;
  const radius  = Math.min(width, height) / 2 - 12 - padding;
  const centerX = width  / 2;
  const centerY = height / 2;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'month-filter-svg')
    .style('background', 'transparent');

  const g = svg.append('g')
    .attr('transform', `translate(${centerX},${centerY})`);

  // Kreisförmige Node-Positionen
  const nodePositions = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });

  const maxValue = Math.max(...connections.map(c => c.value), 1);

  // ── Hilfsfunktionen für Basis-Stil eines Pfades ──────────────────────────
  function baseOpacity(v)     { return 0.2 + (v / maxValue) * 0.5; }
  function baseStrokeWidth(v) { return 1.2 + (v / maxValue) * 3;   }

  // Alle Pfade in ihren Ruhezustand zurücksetzen –
  // respektiert dabei selectedConn oder selectedNode, falls etwas geklickt wurde
  function resetPaths() {
    connectionGroup.selectAll('path').each(function() {
      const s = +d3.select(this).attr('data-source');
      const t = +d3.select(this).attr('data-target');
      const v = +d3.select(this).attr('data-value');

      if (selectedConn && (s === selectedConn.source && t === selectedConn.target)) {
        // Ausgewählter Pfad bleibt hervorgehoben
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', baseStrokeWidth(v) + 3);
      } else if (selectedNode !== null && (s === selectedNode || t === selectedNode)) {
        // Pfade vom ausgewählten Node bleiben hervorgehoben
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', baseStrokeWidth(v) + 3);
      } else if (selectedConn || selectedNode !== null) {
        // Andere Pfade abdunkeln
        d3.select(this)
          .attr('opacity', baseOpacity(v) * 0.3)
          .attr('stroke-width', 0.6 + (v / maxValue) * 1.5);
      } else {
        // Kein Filter aktiv → Standardstil
        d3.select(this)
          .attr('opacity', baseOpacity(v))
          .attr('stroke-width', baseStrokeWidth(v));
      }
    });
  }

  // Einen bestimmten Pfad als ausgewählt hervorheben, alle anderen abdunkeln
  function applySelectionHighlight(selSource, selTarget) {
    connectionGroup.selectAll('path').each(function() {
      const s = +d3.select(this).attr('data-source');
      const t = +d3.select(this).attr('data-target');
      const v = +d3.select(this).attr('data-value');

      if (s === selSource && t === selTarget) {
        d3.select(this)
          .attr('opacity', 0.7)
          .attr('stroke-width', baseStrokeWidth(v) + 3);
      } else {
        d3.select(this)
          .attr('opacity', baseOpacity(v) * 0.3)
          .attr('stroke-width', 0.6 + (v / maxValue) * 1.5);
      }
    });
  }

  // ── Verbindungslinien ────────────────────────────────────────────────────
  const connectionGroup = g.append('g').attr('class', 'connections');

  for (const conn of connections) {
    const source = nodePositions[conn.source];
    const target = nodePositions[conn.target];

    const midX     = (source.x + target.x) / 2;
    const midY     = (source.y + target.y) / 2;
    const pull     = 0.3;
    const pathData = `M${source.x},${source.y} Q${midX * (1 - pull)},${midY * (1 - pull)} ${target.x},${target.y}`;

    const path = connectionGroup.append('path')
      .attr('d', pathData)
      .attr('stroke', MONTH_COLORS[conn.source])
      .attr('stroke-width', baseStrokeWidth(conn.value))
      .attr('fill', 'none')
      .attr('opacity', baseOpacity(conn.value))
      .attr('stroke-linecap', 'round')
      .attr('data-source', conn.source)
      .attr('data-target', conn.target)
      .attr('data-value', conn.value)
      .style('cursor', 'pointer');

    // HOVER: eigenen Pfad kurz aufhellen – nur wenn dieser nicht bereits selected ist
    path.on('mouseenter', function() {
        const s = +d3.select(this).attr('data-source');
        const t = +d3.select(this).attr('data-target');
        const v = +d3.select(this).attr('data-value');
        const isSelected = selectedConn && selectedConn.source === s && selectedConn.target === t;

        if (!isSelected) {
          d3.select(this)
            .attr('stroke-width', baseStrokeWidth(v) + 1.5)
            .attr('opacity', Math.min(baseOpacity(v) + 0.4, 1));
        }

        showTooltip(svg, event,
          `${s + 1} → ${t + 1}: ${v} routes${selectedConn ? '' : ' (Click to filter)'}`);
      })
      .on('mouseleave', function() {
        hideTooltip();
        resetPaths(); // stellt ausgewählten Zustand korrekt wieder her
      })
      .on('click', function() {
        const s = +d3.select(this).attr('data-source');
        const t = +d3.select(this).attr('data-target');

        if (selectedConn && selectedConn.source === s && selectedConn.target === t) {
          // Nochmal klicken → Auswahl aufheben
          selectedConn = null;
          currentMonthFilter = { startMonth: null, endMonth: null };
          if (typeof filterRoutesByMonths === 'function') filterRoutesByMonths(null, null);
          resetPaths();
          g.select('.month-filter-back-arrow').text('');
        } else {
          // Neue Verbindung auswählen
          selectedConn = { source: s, target: t };
          currentMonthFilter = { startMonth: s + 1, endMonth: t + 1 };
          if (typeof filterRoutesByMonths === 'function') filterRoutesByMonths(s + 1, t + 1);
          applySelectionHighlight(s, t);
          g.select('.month-filter-back-arrow').text('↩');
        }
      });
  }

  // Selektionsstil wiederherstellen falls beim Neuzeichnen (Resize) bereits etwas ausgewählt war
  if (selectedConn) {
    applySelectionHighlight(selectedConn.source, selectedConn.target);
  } else if (selectedNode !== null) {
    resetPaths();
  }

  // ── Nodes ────────────────────────────────────────────────────────────────
  const nodeGroup = g.append('g').attr('class', 'nodes');

  nodeGroup.selectAll('g')
    .data(Array.from({ length: 12 }, (_, i) => i))
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `translate(${nodePositions[d].x},${nodePositions[d].y})`)
    .each(function(d) {
      d3.select(this).append('circle')
        .attr('r', 14)
        .attr('fill', MONTH_COLORS[d]);

      d3.select(this).append('text')
        .attr('x', 0).attr('y', 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .text(d + 1);

      // Äußerer Ring (Hover-Indikator)
      d3.select(this).append('circle')
        .attr('r', 12)
        .attr('fill', 'none')
        .attr('stroke', MONTH_COLORS[d])
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .attr('class', 'node-ring');
    });

  // Node-Interaktion
  nodeGroup.selectAll('g.node')
    .on('mouseenter', function(event, idx) {
      d3.select(this).select('circle:last-of-type')
        .transition().duration(200)
        .attr('r', 18).attr('opacity', 0.5);

      // Verbundene Pfade hervorheben – via DOM-Attribute (kein gebundenes D3-Datum auf paths)
      connectionGroup.selectAll('path')
        .transition().duration(200)
        .each(function() {
          const s = +d3.select(this).attr('data-source');
          const t = +d3.select(this).attr('data-target');
          const v = +d3.select(this).attr('data-value');
          const connected = s === idx || t === idx;

          // Wenn ein Pfad bereits geklickt-ausgewählt ist, dessen Stil nicht überschreiben
          const isSelectedPath = selectedConn && s === selectedConn.source && t === selectedConn.target;
          const isSelectedNode = selectedNode !== null && (s === selectedNode || t === selectedNode);

          d3.select(this)
            .attr('opacity', isSelectedPath ? 1 : isSelectedNode ? 1 : connected ? Math.min(0.6 + (v / maxValue) * 0.4, 1) : 0.05)
            .attr('stroke-width', isSelectedPath
              ? baseStrokeWidth(v) + 3
              : isSelectedNode
                ? baseStrokeWidth(v) + 3
                : connected
                  ? baseStrokeWidth(v) + 1
                  : 0.6 + (v / maxValue) * 1.5);
        });
    })
    .on('mouseleave', function(event, idx) {
      d3.select(this).select('circle:last-of-type')
        .transition().duration(200)
        .attr('r', 12).attr('opacity', 0);

      // Zustand wiederherstellen (ggf. mit aktiver Selektion)
      connectionGroup.selectAll('path')
        .transition().duration(200)
        .each(function() {
          const s = +d3.select(this).attr('data-source');
          const t = +d3.select(this).attr('data-target');
          const v = +d3.select(this).attr('data-value');
          const isSelectedPath = selectedConn && s === selectedConn.source && t === selectedConn.target;
          const isSelectedNode = selectedNode !== null && (s === selectedNode || t === selectedNode);

          if (isSelectedPath) {
            d3.select(this).attr('opacity', 1).attr('stroke-width', baseStrokeWidth(v) + 3);
          } else if (isSelectedNode) {
            d3.select(this).attr('opacity', 1).attr('stroke-width', baseStrokeWidth(v) + 3);
          } else if (selectedConn || selectedNode !== null) {
            d3.select(this).attr('opacity', baseOpacity(v) * 0.3).attr('stroke-width', 0.6 + (v / maxValue) * 1.5);
          } else {
            d3.select(this).attr('opacity', baseOpacity(v)).attr('stroke-width', baseStrokeWidth(v));
          }
        });
    })
    .on('click', function(event, idx) {
      // Node-Klick: Alle Routen anzeigen, die in diesem Monat starten
      if (selectedNode === idx) {
        // Nochmal klicken → Auswahl aufheben
        selectedNode = null;
        if (typeof filterRoutesByStartMonth === 'function') filterRoutesByStartMonth(null);
        resetPaths();
        g.select('.month-filter-back-arrow').text('');
      } else {
        // Neuen Node auswählen
        selectedNode = idx;
        selectedConn = null; // Pfad-Auswahl aufheben
        if (typeof filterRoutesByStartMonth === 'function') {
          filterRoutesByStartMonth(idx + 1); // idx ist 0-indiziert, Monate sind 1-12
        }
        resetPaths();
        g.select('.month-filter-back-arrow').text('↩');
      }
    });

  // ── Zurück-Pfeil ─────────────────────────────────────────────────────────
  const centerArrow = g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '1.5rem')
    .attr('fill', '#ffffffaa')
    .attr('pointer-events', 'auto')
    .attr('cursor', 'pointer')
    .attr('class', 'month-filter-back-arrow')
    .text((selectedConn || selectedNode !== null) ? '↩' : ''); // Sichtbar wenn Filter aktiv

  centerArrow.on('click', function() {
    selectedConn = null;
    selectedNode = null;
    currentMonthFilter = { startMonth: null, endMonth: null };
    if (typeof filterRoutesByMonths === 'function') filterRoutesByMonths(null, null);
    if (typeof filterRoutesByStartMonth === 'function') filterRoutesByStartMonth(null);
    resetPaths();
    centerArrow.text('');
  });
}

// ── Tooltip-Hilfsfunktionen ───────────────────────────────────────────────
let tooltipDiv = null;

function showTooltip(svg, event, text) {
  if (!tooltipDiv) {
    tooltipDiv = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(50,50,60,0.95)')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('white-space', 'nowrap')
      .style('border', '1px solid rgba(255,255,255,0.3)');
  }
  tooltipDiv
    .style('left', (event.pageX + 10) + 'px')
    .style('top',  (event.pageY - 10) + 'px')
    .text(text)
    .style('opacity', '1');
}

function hideTooltip() {
  if (tooltipDiv) tooltipDiv.style('opacity', '0');
}

// ── Globale Verbindungsdaten & Einstiegspunkte ───────────────────────────
let currentConnections = [];

// Aktualisiert die Verbindungen im Chord-Diagramm (z.B. wenn andere Filter angewendet werden)
function updateMonthFilterConnections(connections) {
  currentConnections = connections;
  const container = document.getElementById('monthFilter');
  if (container && connections.length >= 0) {
    drawmonthFilter(container, connections);
  }
}

window.onCSVParsed = function(parsedCSV) {
  const connections = parseMigrationConnections(parsedCSV);
  if (connections.length > 0) {
    currentConnections = aggregateConnections(connections);
    drawmonthFilter(document.getElementById('monthFilter'), currentConnections);
  }
};

window.addEventListener('resize', function() {
  if (currentConnections.length > 0) {
    const container = document.getElementById('monthFilter');
    if (container) drawmonthFilter(container, currentConnections);
  }
});