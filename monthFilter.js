// Non-Ribbon Chord Diagram for Bird Migration Months

// Farben sortiert
// const MONTH_COLORS = [
//   '#3A5D53', '#A1C181', '#858C4A', '#E9C46A', '#F4A261', '#E76F51',
//   '#CE6A85', '#A95B4C', '#A67458', '#9E99D3', '#398CBF', '#4C54A9'
// ];

// Farben wie bei birdFilter
const MONTH_COLORS = [
  '#3A5D53', '#E9C46A', '#A95B4C', '#4C54A9', '#7AB8BF', '#A1C181',
  '#F4A261', '#E76F51', '#398CBF', '#8A4CA9', '#A67458', '#CE6A85'
];

// Deutsche Monatsnamen (0-basiert: index 0 = Januar)
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

let currentMonthFilter = { startMonth: null, endMonth: null };
let selectedConn = null;
let selectedNode = null;

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
    } catch (e) {}
  }
  return connections;
}

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

function drawmonthFilter(container, connections) {
  d3.select(container).selectAll('*').remove();

  const width   = container.clientWidth;
  const height  = container.clientHeight;
  const padding = 12;

  // Radien
  const size      = Math.max(0, Math.min(width, height));
  const arcOuterR = size / 2;
  const ringW     = arcOuterR * 0.18;   // radius * (1 - 0.28) / 4 = radius * 0.18
  const arcInnerR = arcOuterR - ringW; // Dicke des Kreisbogens

  // Abstand zwischen den Kreisbögen
  const gapAngle      = 2 / arcInnerR;

  // Segment-Winkelspanne (1/12 Kreis, abzüglich beider halben Lücken)
  const segmentSpan   = (Math.PI * 2) / 12 - gapAngle;

  const centerX = width  / 2;
  const centerY = height / 2;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'month-filter-svg')
    .style('background', 'transparent');

  const g = svg.append('g')
    .attr('transform', `translate(${centerX},${centerY})`);

  // Verbindungslinie-Endpunkte auf dem Innenradius der Bögen
  const nodePositions = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: arcInnerR * Math.cos(angle), y: arcInnerR * Math.sin(angle) };
  });

  const maxValue = Math.max(...connections.map(c => c.value), 1);

  function baseOpacity(v)     { return 0.2 + (v / maxValue) * 0.5; }
  function baseStrokeWidth(v) { return 1.2 + (v / maxValue) * 3;   }

  function resetPaths() {
    connectionGroup.selectAll('path').each(function() {
      const s = +d3.select(this).attr('data-source');
      const t = +d3.select(this).attr('data-target');
      const v = +d3.select(this).attr('data-value');
      if (selectedConn && s === selectedConn.source && t === selectedConn.target) {
        d3.select(this).attr('opacity', 1).attr('stroke-width', baseStrokeWidth(v) + 3);
      } else if (selectedNode !== null && (s === selectedNode || t === selectedNode)) {
        d3.select(this).attr('opacity', 1).attr('stroke-width', baseStrokeWidth(v) + 3);
      } else if (selectedConn || selectedNode !== null) {
        d3.select(this).attr('opacity', baseOpacity(v) * 0.3).attr('stroke-width', 0.6 + (v / maxValue) * 1.5);
      } else {
        d3.select(this).attr('opacity', baseOpacity(v)).attr('stroke-width', baseStrokeWidth(v));
      }
    });
  }

  function applySelectionHighlight(selSource, selTarget) {
    connectionGroup.selectAll('path').each(function() {
      const s = +d3.select(this).attr('data-source');
      const t = +d3.select(this).attr('data-target');
      const v = +d3.select(this).attr('data-value');
      if (s === selSource && t === selTarget) {
        d3.select(this).attr('opacity', 0.7).attr('stroke-width', baseStrokeWidth(v) + 3);
      } else {
        d3.select(this).attr('opacity', baseOpacity(v) * 0.3).attr('stroke-width', 0.6 + (v / maxValue) * 1.5);
      }
    });
  }

   // ── Verbindungslinien ────────────────────────────────────────────────────
  const connectionGroup = g.append('g').attr('class', 'connections');
 
  for (const conn of connections) {
    let pathData;
    if (conn.source === conn.target) {
      // Gleicher Monat: quadratische Kurve vom Anfang bis Ende des Kreisbogens
      const i           = conn.source;
      const d3MidAngle  = (i / 12) * Math.PI * 2;
      const startAngle  = d3MidAngle - segmentSpan / 2;
      const endAngle    = d3MidAngle + segmentSpan / 2;
 
      // D3-Winkel → Math-Winkel (−π/2 verschiebt 12-Uhr auf 0)
      const p1x = arcInnerR * Math.cos(startAngle - Math.PI / 2);
      const p1y = arcInnerR * Math.sin(startAngle - Math.PI / 2);
      const p2x = arcInnerR * Math.cos(endAngle   - Math.PI / 2);
      const p2y = arcInnerR * Math.sin(endAngle   - Math.PI / 2);
 
      // Kontrollpunkt nach innen zur Kreismitte auf der Mittellinie des Segments
      const mathMid = d3MidAngle - Math.PI / 2;
      const cpR  = arcInnerR * 0.3;
      const cpX  = cpR * Math.cos(mathMid);
      const cpY  = cpR * Math.sin(mathMid);
 
      pathData = `M${p1x},${p1y} Q${cpX},${cpY} ${p2x},${p2y}`;
    } else {
      // Normaler Monat-zu-Monat-Pfad
      const source = nodePositions[conn.source];
      const target = nodePositions[conn.target];
      const midX   = (source.x + target.x) / 2;
      const midY   = (source.y + target.y) / 2;
      const pull   = 0.3;
      pathData = `M${source.x},${source.y} Q${midX * (1 - pull)},${midY * (1 - pull)} ${target.x},${target.y}`;
    }
 
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
        // Show month names instead of numeric month values
        const sName = MONTH_NAMES[s] || (s + 1);
        const tName = MONTH_NAMES[t] || (t + 1);
        showTooltip(svg, event,
          `${sName} → ${tName}: ${v} data points`);
      })
      .on('mouseleave', function() {
        hideTooltip();
        resetPaths();
      })
      .on('click', function() {
        const s = +d3.select(this).attr('data-source');
        const t = +d3.select(this).attr('data-target');
        if (selectedConn && selectedConn.source === s && selectedConn.target === t) {
          selectedConn = null;
          currentMonthFilter = { startMonth: null, endMonth: null };
          if (typeof filterRoutesByMonths === 'function') filterRoutesByMonths(null, null);
          // Notify bird filter to refresh availability after month-based filtering
          if (typeof refreshBirdAvailability === 'function') refreshBirdAvailability();
          resetPaths();
          g.select('.month-filter-back-arrow').text('');
        } else {
          selectedConn = { source: s, target: t };
          currentMonthFilter = { startMonth: s + 1, endMonth: t + 1 };
          if (typeof filterRoutesByMonths === 'function') filterRoutesByMonths(s + 1, t + 1);
          // Notify bird filter to refresh availability after month-based filtering
          if (typeof refreshBirdAvailability === 'function') refreshBirdAvailability();
          applySelectionHighlight(s, t);
          g.select('.month-filter-back-arrow').text('↩');
        }
      });
  }

  if (selectedConn) {
    applySelectionHighlight(selectedConn.source, selectedConn.target);
  } else if (selectedNode !== null) {
    resetPaths();
  }

  // Arc-Generator
  const arcGen = d3.arc()
    .innerRadius(arcInnerR)
    .outerRadius(arcOuterR);

  // Hover-Bogen: leicht nach außen vergrößert
  const arcHoverGen = d3.arc()
    .innerRadius(arcInnerR - 3)
    .outerRadius(arcOuterR + 4);

  // Nodes als Kreisbogenausschnitte
const nodeGroup = g.append('g').attr('class', 'nodes');

nodeGroup.selectAll('g')
  .data(Array.from({ length: 12 }, (_, i) => i))
  .enter()
  .append('g')
  .attr('class', 'node')
  .each(function(d) {
    // D3-Arc erwartet: 0 = 12 Uhr, im Uhrzeigersinn
    const d3MidAngle = (d / 12) * Math.PI * 2;
    // Math.cos/sin: 0 = 3 Uhr → -π/2 verschiebt auf 12 Uhr
    const mathAngle  = d3MidAngle - Math.PI / 2;

    const startAngle = d3MidAngle - segmentSpan / 2;
    const endAngle   = d3MidAngle + segmentSpan / 2;

    d3.select(this).append('path')
      .attr('class', 'node-arc')
      .attr('d', arcGen({ startAngle, endAngle }))
      .attr('fill', MONTH_COLORS[d])
      .style('cursor', 'pointer');

    d3.select(this).append('path')
      .attr('class', 'node-ring')
      .attr('d', arcHoverGen({ startAngle, endAngle }))
      .attr('fill', MONTH_COLORS[d])
      .attr('opacity', 0)
      .style('pointer-events', 'none');

    const labelR = arcInnerR + ringW / 2; // platziert Label vertikal zentriert im Kreisbogen
    d3.select(this).append('text')
      .attr('x', labelR * Math.cos(mathAngle))
      .attr('y', labelR * Math.sin(mathAngle))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d + 1);
  });

  // Node-Interaktion
  nodeGroup.selectAll('g.node')
    .on('mouseenter', function(event, idx) {
      d3.select(this).select('.node-ring')
        .transition().duration(200)
        .attr('opacity', 0.35);

      connectionGroup.selectAll('path')
        .transition().duration(200)
        .each(function() {
          const s = +d3.select(this).attr('data-source');
          const t = +d3.select(this).attr('data-target');
          const v = +d3.select(this).attr('data-value');
          const connected    = s === idx || t === idx;
          const isSelectedPath = selectedConn && s === selectedConn.source && t === selectedConn.target;
          const isSelectedNode = selectedNode !== null && (s === selectedNode || t === selectedNode);
          d3.select(this)
            .attr('opacity',      isSelectedPath ? 1 : isSelectedNode ? 1 : connected ? Math.min(0.6 + (v / maxValue) * 0.4, 1) : 0.05)
            .attr('stroke-width', isSelectedPath
              ? baseStrokeWidth(v) + 3
              : isSelectedNode ? baseStrokeWidth(v) + 3
              : connected      ? baseStrokeWidth(v) + 1
              : 0.6 + (v / maxValue) * 1.5);
        });
    })
    .on('mouseleave', function(event, idx) {
      d3.select(this).select('.node-ring')
        .transition().duration(200)
        .attr('opacity', 0);

      connectionGroup.selectAll('path')
        .transition().duration(200)
        .each(function() {
          const s = +d3.select(this).attr('data-source');
          const t = +d3.select(this).attr('data-target');
          const v = +d3.select(this).attr('data-value');
          const isSelectedPath = selectedConn && s === selectedConn.source && t === selectedConn.target;
          const isSelectedNode = selectedNode !== null && (s === selectedNode || t === selectedNode);
          if (isSelectedPath)       { d3.select(this).attr('opacity', 1).attr('stroke-width', baseStrokeWidth(v) + 3); }
          else if (isSelectedNode)  { d3.select(this).attr('opacity', 1).attr('stroke-width', baseStrokeWidth(v) + 3); }
          else if (selectedConn || selectedNode !== null) { d3.select(this).attr('opacity', baseOpacity(v) * 0.3).attr('stroke-width', 0.6 + (v / maxValue) * 1.5); }
          else                      { d3.select(this).attr('opacity', baseOpacity(v)).attr('stroke-width', baseStrokeWidth(v)); }
        });
    })
    .on('click', function(event, idx) {
      if (selectedNode === idx) {
        selectedNode = null;
        if (typeof filterRoutesByStartMonth === 'function') filterRoutesByStartMonth(null);
        // Notify bird filter to refresh availability after month-based filtering
        if (typeof refreshBirdAvailability === 'function') refreshBirdAvailability();
        resetPaths();
        g.select('.month-filter-back-arrow').text('');
      } else {
        selectedNode = idx;
        selectedConn = null;
        if (typeof filterRoutesByStartMonth === 'function') filterRoutesByStartMonth(idx + 1);
        // Notify bird filter to refresh availability after month-based filtering
        if (typeof refreshBirdAvailability === 'function') refreshBirdAvailability();
        resetPaths();
        g.select('.month-filter-back-arrow').text('↩');
      }
    });

  //  Zurück-Pfeil
  const centerArrow = g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '1.5rem')
    .attr('fill', '#ffffffaa')
    .attr('pointer-events', 'auto')
    .attr('cursor', 'pointer')
    .attr('class', 'month-filter-back-arrow')
    .text((selectedConn || selectedNode !== null) ? '↩' : '');

  centerArrow.on('click', function() {
    selectedConn = null;
    selectedNode = null;
    currentMonthFilter = { startMonth: null, endMonth: null };
    if (typeof filterRoutesByMonths === 'function') filterRoutesByMonths(null, null);
    if (typeof filterRoutesByStartMonth === 'function') filterRoutesByStartMonth(null);
    // Ensure bird filter updates when month filters are cleared via back arrow
    if (typeof refreshBirdAvailability === 'function') refreshBirdAvailability();
    resetPaths();
    centerArrow.text('');
  });
}

// Tooltip-Hilfsfunktionen 
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
  // Set text first and temporarily hide (opacity 0) so we can measure size
  tooltipDiv
    .text(text)
    .style('opacity', '0')
    .style('left', '0px')
    .style('top', '0px');

  const tooltipEl = tooltipDiv.node();
  const ttRect = tooltipEl.getBoundingClientRect();
  const ttWidth = ttRect.width || tooltipEl.offsetWidth || 0;
  const ttHeight = ttRect.height || tooltipEl.offsetHeight || 0;

  // Use page coordinates (account for scroll) where available
  const pageX = (typeof event.pageX === 'number') ? event.pageX : (event.clientX + window.scrollX);
  const pageY = (typeof event.pageY === 'number') ? event.pageY : (event.clientY + window.scrollY);

  const padding = 10;
  let left = pageX + padding;
  let top  = pageY - 10;

  // If tooltip would overflow the right viewport edge, flip to the left of the cursor
  const viewportRight = window.scrollX + window.innerWidth;
  if (left + ttWidth > viewportRight - 8) {
    left = pageX - padding - ttWidth;
  }
  // Clamp horizontally to viewport
  if (left < window.scrollX + 8) left = window.scrollX + 8;

  // If tooltip would overflow bottom, clamp up
  const viewportBottom = window.scrollY + window.innerHeight;
  if (top + ttHeight > viewportBottom - 8) {
    top = viewportBottom - ttHeight - 8;
  }
  // Clamp top
  if (top < window.scrollY + 8) top = window.scrollY + 8;

  tooltipDiv
    .style('left', left + 'px')
    .style('top',  top  + 'px')
    .style('opacity', '1');
}

function hideTooltip() {
  if (tooltipDiv) tooltipDiv.style('opacity', '0');
}

// Globale Verbindungsdaten & Einstiegspunkte
let currentConnections = [];

function updateMonthFilterConnections(connections) {
  currentConnections = connections;
  const container = document.getElementById('monthFilter');
  if (container && connections.length >= 0) drawmonthFilter(container, connections);
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