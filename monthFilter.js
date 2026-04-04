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

// const MONTH_NAMES = [
//   'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
//   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
// ];

// Filter für den aktuell aktiven Monat speichern
let currentMonthFilter = { startMonth: null, endMonth: null };

// monthFilter initialisiern
function initmonthFilter(csvTable) {
  const container = document.getElementById('chord-diagram-container');
  if (!container) return;

  // Daten nalysieren & Startmonat- und Endmonatspaare extrahieren
  const connections = parseMigrationConnections(csvTable);
  
  if (connections.length === 0) {
    console.warn('Keine gültigen Migrations-Verbindungen in den CSV-Daten gefunden');
    return;
  }
  
  // Zählen, wie viele Routen von Monat X zu Monat Y existieren
  const aggregatedConnections = aggregateConnections(connections);
  
  // Diagramm zeichnen
  drawmonthFilter(container, aggregatedConnections);
}

// Start- und Endmonat der Migration aus CSV-Daten extrahieren -> gibt Array {startMonth, endMonth} zurück
function parseMigrationConnections(csvTable) {
  const connections = [];
  
  // Handle both formats: parsed CSV object or raw lines array
  let rowCount = 0;
  let getValueFunc;
  
  if (csvTable.getRowCount) {
    // Already parsed format
    rowCount = csvTable.getRowCount();
    getValueFunc = (i, col) => csvTable.getString(i, col);
  } else if (typeof csvTable === 'object') {
    // Try to extract row count and value function
    rowCount = csvTable.length || 0;
    getValueFunc = (i, col) => csvTable[i] ? csvTable[i][col] : '';
  }
  
  for (let i = 0; i < rowCount; i++) {
    try {
      const startMonthStr = getValueFunc(i, 'Migration start month');
      const endMonthStr = getValueFunc(i, 'Migration end month');
      
      const startMonth = parseInt(startMonthStr);
      const endMonth = parseInt(endMonthStr);
      
      // Nur hinzufügen, wenn beide Monate gültig sind (1-12)
      if (startMonth >= 1 && startMonth <= 12 && endMonth >= 1 && endMonth <= 12) {
        connections.push({ startMonth, endMonth });
      }
    } catch (e) {
      // Zeilen überspringen, die nicht analysiert werden können
    }
  }
  
  return connections;
}

/**
 * Aggregate connections by counting occurrences
 * Returns array of {source, target, value} for each month pair
 */
// Verbindungen durch Zählen der Vorkommen aggregieren -> gibt Array {Quelle, Ziel, Wert} für jedes Monatspaar zurück
function aggregateConnections(connections) {
  const aggregated = {};
  
  for (const conn of connections) {
    const key = `${conn.startMonth}-${conn.endMonth}`;
    aggregated[key] = (aggregated[key] || 0) + 1;
  }
  
  // in Array-Format konvertieren
  const result = [];
  for (const [key, count] of Object.entries(aggregated)) {
    const [source, target] = key.split('-').map(Number);
    result.push({ source: source - 1, target: target - 1, value: count }); // Convert to 0-indexed
  }
  
  return result;
}

// Cord Diagramm zeichnen
function drawmonthFilter(container, connections) {
  // existierenden Inhalt löschen
  d3.select(container).selectAll('*').remove();
  
  // Container-Größe verwenden (CSS stellt sicher, dass sie richtig ist)
  const width = container.clientWidth;
  const height = container.clientHeight;
  const nodeRadius = 12; // Radius der Node-Kreise
  const padding = 12; // Gewünschter Abstand zum Rand
  const radius = Math.min(width, height) / 2 - nodeRadius - padding; // Platz für Nodes lassen
  const centerX = width / 2;
  const centerY = height / 2;
  
  // SVG erstellen (Größe wird über CSS gesteuert)
  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'month-filter-svg')
    .style('background', 'transparent');
  
  // Hauptgruppe für das Diagramm
  const g = svg.append('g')
    .attr('transform', `translate(${centerX},${centerY})`);
  
  // Postionen für 12 kreisförmig angeordnete nodes berechnen
  const nodePositions = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2; // oben anfangen
    nodePositions.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      angle: angle
    });
  }
  
  // max. Verbindungsmenge für die Deckkraftskalierung ermitteln
  const maxValue = Math.max(...connections.map(c => c.value), 1);
  
  // Verbindungslinien zuerst zeichnen, damit sie hinter den nodes liegen
  const connectionGroup = g.append('g').attr('class', 'connections');
  
  for (const conn of connections) {
    const source = nodePositions[conn.source];
    const target = nodePositions[conn.target];
    
    // Pfadeigenschaften
    const opacity = 0.2 + (conn.value / maxValue) * 0.5; // Pfaddeckkraft, Spanne von 0.2 to 0.7
    const strokeWidth = 1.2 + (conn.value / maxValue) * 3; // Pfadbreite, Spanne von 1.2 to 4.2
    
    // Bezier-Kurve zw. den nodes berechnen (mit Quadratfunktion)
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    
    // Kontrollpunkt für Bézierkurve -> Kurve zur Mitte ziehen
    const pullStrength = 0.3;
    const controlX = midX * (1 - pullStrength);
    const controlY = midY * (1 - pullStrength);
    
    // Pfaddaten für quadratische Bézier-Kurve erstellen
    const pathData = `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
    
    const path = connectionGroup.append('path')
      .attr('d', pathData)
      .attr('stroke', MONTH_COLORS[conn.source])
      .attr('stroke-width', strokeWidth)
      .attr('fill', 'none')
      .attr('opacity', opacity)
      .attr('stroke-linecap', 'round')
      .attr('data-source', conn.source)
      .attr('data-target', conn.target)
      .attr('data-value', conn.value)
      .style('cursor', 'pointer');
    
    // Hover-Effekt mit Infobox hinzufügen
    path.on('mouseenter', function() {
      d3.select(this)
        .attr('stroke-width', strokeWidth + 1.5)
        .attr('opacity', Math.min(opacity + 0.4, 1));
      
      // Infobox anzeigen
      showTooltip(svg, event, `${conn.source + 1} → ${conn.target + 1}: ${conn.value} routes (Click to filter)`);
    })
    .on('mouseleave', function() {
      d3.select(this)
        .attr('stroke-width', strokeWidth)
        .attr('opacity', opacity);
      hideTooltip();
    })
    .on('click', function() {
      // Rufe die Filterfunktion aus mapRoutes.js auf.
      if (typeof filterRoutesByMonths === 'function') {
        currentMonthFilter.startMonth = conn.source + 1;
        currentMonthFilter.endMonth = conn.target + 1;
        filterRoutesByMonths(conn.source + 1, conn.target + 1); // Convert back to 1-indexed
        
        // Zurück-Pfeil anzeigen
        d3.select(this.parentNode.parentNode).select('.month-filter-back-arrow').text('↩');
        
        // ausgewählten Pfad hervorheben
        connectionGroup.selectAll('path')
          .attr('opacity', (d) => {
            if (d.source === conn.source && d.target === conn.target) {
              return 1; // Highlight selected
            } else {
              return opacity * 0.3; // Dim others
            }
          })
          .attr('stroke-width', (d) => {
            if (d.source === conn.source && d.target === conn.target) {
              return strokeWidth + 3; // Dicker für ausgewählte Pfade
            } else {
              return 0.6 + (d.value / maxValue) * 1.5;
            }
          });
      }
    });
  }
  
  // Nodes zeichnen
  const nodeGroup = g.append('g').attr('class', 'nodes');
  
  nodeGroup.selectAll('g')
    .data(Array.from({length: 12}, (_, i) => i))
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d, i) => `translate(${nodePositions[i].x},${nodePositions[i].y})`)
    .each(function(d, i) {
      // Hauptkreis
      d3.select(this).append('circle')
        .attr('r', 14)
        .attr('fill', MONTH_COLORS[i])
        // .attr('stroke', '#fff')
        // .attr('stroke-width', 2)
        // .attr('opacity', 0.9);
      
      // Nummern im Kreis
      d3.select(this).append('text')
        .attr('x', 0)
        .attr('y', 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .text(i + 1); // Nummern 1-12
      
      // Äußerer Ring beim Hovern
      d3.select(this).append('circle')
        .attr('r', 12)
        .attr('fill', 'none')
        .attr('stroke', MONTH_COLORS[i])
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .attr('class', 'node-ring');
    });
  
  // Interaktivität zu den Nodes hinzufügen
  nodeGroup.selectAll('g.node')
    .on('mouseenter', function(d) {
      const idx = d;
      d3.select(this).select('circle:last-of-type')
        .transition()
        .duration(200)
        .attr('r', 12)
        .attr('opacity', 0.6);
      
      // vebundene Pfade markieren
      connectionGroup.selectAll('path')
        .transition()
        .duration(200)
        .attr('opacity', (conn) => {
          if (conn.source === idx || conn.target === idx) {
            return Math.min(0.6 + (conn.value / maxValue) * 0.4, 1);
          } else {
            return 0.05; // nicht verbundene Verbindungen verblassen
          }
        })
        .attr('stroke-width', (conn) => {
          if (conn.source === idx || conn.target === idx) {
            return strokeWidth + 1;
          } else {
            return 0.6 + (conn.value / maxValue) * 1.5;
          }
        });
    })
    .on('mouseleave', function() {
      d3.select(this).select('circle:last-of-type')
        .transition()
        .duration(200)
        .attr('r', 12)
        .attr('opacity', 0);
      
      // Pfade zurücksetzen
      connectionGroup.selectAll('path')
        .transition()
        .duration(200)
        .attr('opacity', (conn) => 0.2 + (conn.value / maxValue) * 0.5)
        .attr('stroke-width', (conn) => 0.6 + (conn.value / maxValue) * 1.5);
    });
  
  // Titel hinzufügen
//   svg.append('text')
//     .attr('x', centerX)
//     .attr('y', 20)
//     .attr('text-anchor', 'middle')
//     .attr('font-size', '16px')
//     .attr('font-weight', 'bold')
//     .attr('fill', '#fff')
//     .text('Bird Migration Routes: Month Connections');
  
  // Zurück-Pfeil in der Mitte hinzufügen (wie im birdFilter)
  addBackArrow(g, connectionGroup, connections, maxValue);
}

// Zurück-Pfeil zum Diagramm hinzufügen (statt Clear-Button)
function addBackArrow(g, connectionGroup, connections, maxValue) {
  // Zurück-Pfeil Text-Element erstellen
  const centerArrow = g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '1.5rem')
    .attr('fill', '#ffffffaa')
    .attr('pointer-events', 'auto')
    .attr('cursor', 'pointer')
    .attr('class', 'month-filter-back-arrow')
    .text(currentMonthFilter.startMonth ? '↩' : ''); // Nur sichtbar wenn Filter aktiv
  
  // Click-Handler für Zurück-Pfeil
  centerArrow.on('click', function() {
    currentMonthFilter = { startMonth: null, endMonth: null };
    if (typeof filterRoutesByMonths === 'function') {
      filterRoutesByMonths(null, null); // Löscht nur den Monats-Filter, behält andere Filter
    }
    
    // setzt visuelle Hervorhebung zurück
    connectionGroup.selectAll('path')
      .attr('opacity', (d) => 0.2 + (d.value / maxValue) * 0.5)
      .attr('stroke-width', (d) => 0.6 + (d.value / maxValue) * 1.5);
    
    // Pfeil ausblenden
    centerArrow.text('');
  });
}

// Hilfsfunktion für Infobox
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
    .style('top', (event.pageY - 10) + 'px')
    .text(text)
    .style('opacity', '1');
}

function hideTooltip() {
  if (tooltipDiv) {
    tooltipDiv.style('opacity', '0');
  }
}

// Globale Variable zum Speichern der aktuellen Verbindungsdaten
let currentConnections = [];

// Funktion wird von sketch.js aufgerufen, nachdem die CSV-Datei analysiert wurde.
window.onCSVParsed = function(parsedCSV) {
  const connections = parseMigrationConnections(parsedCSV);
  if (connections.length > 0) {
    currentConnections = aggregateConnections(connections);
    drawmonthFilter(document.getElementById('chord-diagram-container'), currentConnections);
  }
};

// Neuzeichnen, wenn Fenstergröße geändert wurde
window.addEventListener('resize', function() {
  if (currentConnections.length > 0) {
    const container = document.getElementById('chord-diagram-container');
    if (container) {
      drawmonthFilter(container, currentConnections);
    }
  }
});
