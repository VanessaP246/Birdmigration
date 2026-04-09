// birdFilter.js
// Sunburst-Diagramm für den Vogel-Filter.
// Anbindung an die Karte: onBirdFilterChange() ganz unten


// Hierarchie-Daten
const BIRD_DATA = {"name": "root", "children": [{"name": "Accipitriformes", "children": [{"name": "Pandionidae", "children": [{"name": "Pandion", "children": [{"name": "Osprey", "value": 2240}]}]}, {"name": "Accipitridae", "children": [{"name": "Buteo", "children": [{"name": "Ferruginous Hawk", "value": 176}, {"name": "Eurasian Buzzard", "value": 157}, {"name": "Japanese Buzzard", "value": 72}, {"name": "Swainson's Hawk", "value": 517}, {"name": "Long-legged Buzzard", "value": 49}]}, {"name": "Clanga", "children": [{"name": "Lesser Spotted Eagle", "value": 387}, {"name": "Greater Spotted Eagle", "value": 73}]}, {"name": "Pernis", "children": [{"name": "European Honey-buzzard", "value": 1593}]}, {"name": "Haliaeetus", "children": [{"name": "Steller's Sea-eagle", "value": 9}, {"name": "White-tailed Sea-eagle", "value": 6}, {"name": "Bald Eagle", "value": 22}]}, {"name": "Aquila", "children": [{"name": "Steppe Eagle", "value": 323}]}, {"name": "Circus", "children": [{"name": "Western Marsh-harrier", "value": 519}, {"name": "Montagu's Harrier", "value": 1783}]}, {"name": "Milvus", "children": [{"name": "Black Kite", "value": 392}, {"name": "Red Kite", "value": 144}]}, {"name": "Aegypius", "children": [{"name": "Cinereous Vulture", "value": 243}]}, {"name": "Accipiter", "children": [{"name": "Levant Sparrowhawk", "value": 57}]}, {"name": "Hieraaetus", "children": [{"name": "Booted Eagle", "value": 175}]}]}]}, {"name": "Falconiformes", "children": [{"name": "Falconidae", "children": [{"name": "Falco", "children": [{"name": "Sooty Falcon", "value": 518}, {"name": "Lesser Kestrel", "value": 824}, {"name": "Eleonora's Falcon", "value": 1197}, {"name": "Amur Falcon", "value": 48}, {"name": "Peregrine Falcon", "value": 585}]}]}]}, {"name": "Gruiformes", "children": [{"name": "Gruidae", "children": [{"name": "Grus", "children": [{"name": "White-naped Crane", "value": 72}, {"name": "Red-crowned Crane", "value": 11}]}, {"name": "Leucogeranus", "children": [{"name": "Siberian Crane", "value": 88}]}, {"name": "Anthropoides", "children": [{"name": "Demoiselle Crane", "value": 662}]}]}]}, {"name": "Passeriformes", "children": [{"name": "Vireonidae", "children": [{"name": "Vireo", "children": [{"name": "Vireo olivaceus", "value": 677}]}]}, {"name": "Fringillidae", "children": [{"name": "Chloris", "children": [{"name": "European Greenfinch", "value": 159}]}, {"name": "Carpodacus", "children": [{"name": "Common Rosefinch", "value": 254}]}]}, {"name": "Parulidae", "children": [{"name": "Setophaga", "children": [{"name": "Blackpoll Warbler", "value": 860}]}, {"name": "Icteria", "children": [{"name": "Yellow-breasted Chat", "value": 41}]}, {"name": "Cardellina", "children": [{"name": "Canada Warbler", "value": 1649}]}, {"name": "Vermivora", "children": [{"name": "Vermivora chrysoptera", "value": 904}]}]}, {"name": "Hirundinidae", "children": [{"name": "Hirundo", "children": [{"name": "Barn Swallow", "value": 1721}]}, {"name": "Riparia", "children": [{"name": "Collared Sand Martin", "value": 33}]}]}, {"name": "Emberizidae", "children": [{"name": "Emberiza", "children": [{"name": "Ortolan Bunting", "value": 710}]}]}, {"name": "Laniidae", "children": [{"name": "Lanius", "children": [{"name": "Red-backed Shrike", "value": 1248}]}]}, {"name": "Mimidae", "children": [{"name": "Dumetella", "children": [{"name": "Grey Catbird", "value": 58}]}]}, {"name": "Phylloscopidae", "children": [{"name": "Phylloscopus", "children": [{"name": "Phylloscopus trochilus", "value": 1375}]}]}, {"name": "Sylviidae", "children": [{"name": "Curruca", "children": [{"name": "Common Whitethroat", "value": 579}]}]}, {"name": "Tyrannidae", "children": [{"name": "Tyrannus", "children": [{"name": "Eastern Kingbird", "value": 119}]}]}, {"name": "Troglodytidae", "children": [{"name": "Troglodytes", "children": [{"name": "House Wren", "value": 137}]}]}]}, {"name": "Ciconiiformes", "children": [{"name": "Ciconiidae", "children": [{"name": "Ciconia", "children": [{"name": "Oriental Stork", "value": 161}, {"name": "Black Stork", "value": 344}, {"name": "White Stork", "value": 132}]}]}]}, {"name": "Charadriiformes", "children": [{"name": "Scolopacidae", "children": [{"name": "Calidris", "children": [{"name": "Temminck's Stint", "value": 385}, {"name": "Purple Sandpiper", "value": 80}, {"name": "Red Knot", "value": 264}, {"name": "Buff-breasted Sandpiper", "value": 289}, {"name": "Dunlin", "value": 226}]}, {"name": "Limosa", "children": [{"name": "Bar-tailed Godwit", "value": 115}]}, {"name": "Numenius", "children": [{"name": "Far Eastern Curlew", "value": 182}, {"name": "Eurasian Curlew", "value": 90}, {"name": "Whimbrel", "value": 417}]}, {"name": "Bartramia", "children": [{"name": "Upland Sandpiper", "value": 453}]}, {"name": "Scolopax", "children": [{"name": "Eurasian Woodcock", "value": 119}, {"name": "American Woodcock", "value": 245}]}, {"name": "Tringa", "children": [{"name": "Common Redshank", "value": 602}]}, {"name": "Phalaropus", "children": [{"name": "Red-necked Phalarope", "value": 1704}]}, {"name": "Gallinago", "children": [{"name": "Great Snipe", "value": 1371}]}]}, {"name": "Laridae", "children": [{"name": "Larus", "children": [{"name": "Lesser Black-backed Gull", "value": 652}, {"name": "Pallas's Gull", "value": 224}, {"name": "Iceland Gull", "value": 21}]}, {"name": "Sterna", "children": [{"name": "Common Tern", "value": 1013}]}]}, {"name": "Haematopodidae", "children": [{"name": "Haematopus", "children": [{"name": "Eurasian Oystercatcher", "value": 2}]}]}, {"name": "Charadriidae", "children": [{"name": "Charadrius", "children": [{"name": "Mountain Plover", "value": 42}, {"name": "Common Rosefinch", "value": 640}]}, {"name": "Pluvialis", "children": [{"name": "Pacific Golden Plover", "value": 199}]}]}, {"name": "Stercorariidae", "children": [{"name": "Stercorarius", "children": [{"name": "Pomarine Jaeger", "value": 529}]}]}]}, {"name": "Anseriformes", "children": [{"name": "Anatidae", "children": [{"name": "Anas", "children": [{"name": "Common Teal", "value": 65}, {"name": "American Black Duck", "value": 115}, {"name": "Indian Spot-billed Duck", "value": 65}, {"name": "Mallard", "value": 176}, {"name": "Northern Pintail", "value": 201}]}, {"name": "Anser", "children": [{"name": "Lesser White-fronted Goose", "value": 160}, {"name": "Greylag Goose", "value": 49}, {"name": "Bar-headed Goose", "value": 128}, {"name": "Greater White-fronted Goose", "value": 446}, {"name": "Bean Goose", "value": 115}, {"name": "Pink-footed Goose", "value": 35}, {"name": "Swan Goose", "value": 25}]}, {"name": "Mareca", "children": [{"name": "Falcated Duck", "value": 65}, {"name": "Eurasian Wigeon", "value": 194}]}, {"name": "Sibirionetta", "children": [{"name": "Baikal Teal", "value": 65}]}, {"name": "Spatula", "children": [{"name": "Cinnamon Teal", "value": 54}, {"name": "Garganey", "value": 65}]}, {"name": "Branta", "children": [{"name": "Brent Goose", "value": 47}, {"name": "Barnacle Goose", "value": 62}]}, {"name": "Cygnus", "children": [{"name": "Tundra Swan", "value": 51}, {"name": "Trumpeter Swan", "value": 11}]}, {"name": "Chloephaga", "children": [{"name": "Upland Goose", "value": 6}]}, {"name": "Aythya", "children": [{"name": "Ring-necked Duck", "value": 149}]}, {"name": "Tadorna", "children": [{"name": "Ruddy Shelduck", "value": 169}]}]}]}, {"name": "Pelecaniformes", "children": [{"name": "Pelecanidae", "children": [{"name": "Pelecanus", "children": [{"name": "Great White Pelican", "value": 163}]}]}, {"name": "Ardeidae", "children": [{"name": "Botaurus", "children": [{"name": "American Bittern", "value": 209}]}, {"name": "Nycticorax", "children": [{"name": "Black-crowned Night-heron", "value": 83}]}, {"name": "Egretta", "children": [{"name": "Chinese Egret", "value": 305}]}]}, {"name": "Threskiornithidae", "children": [{"name": "Platalea", "children": [{"name": "Eurasian Spoonbill", "value": 527}]}]}]}, {"name": "Suliformes", "children": [{"name": "Phalacrocoracidae", "children": [{"name": "Nannopterum", "children": [{"name": "Double-crested Cormorant", "value": 122}]}]}]}, {"name": "Strigiformes", "children": [{"name": "Strigidae", "children": [{"name": "Athene", "children": [{"name": "Burrowing Owl", "value": 61}]}, {"name": "Psiloscops", "children": [{"name": "Flammulated Owl", "value": 100}]}, {"name": "Asio", "children": [{"name": "Short-eared Owl", "value": 63}]}]}]}, {"name": "Apodiformes", "children": [{"name": "Apodidae", "children": [{"name": "Apus", "children": [{"name": "Common Swift", "value": 697}, {"name": "Pacific Swift", "value": 280}]}]}]}, {"name": "Otidiformes", "children": [{"name": "Otididae", "children": [{"name": "Otis", "children": [{"name": "Great Bustard", "value": 30}]}]}]}, {"name": "Columbiformes", "children": [{"name": "Columbidae", "children": [{"name": "Streptopelia", "children": [{"name": "European Turtle-dove", "value": 55}]}]}]}, {"name": "Gaviiformes", "children": [{"name": "Gaviidae", "children": [{"name": "Gavia", "children": [{"name": "Common Loon", "value": 75}]}]}]}, {"name": "Cuculiformes", "children": [{"name": "Cuculidae", "children": [{"name": "Cuculus", "children": [{"name": "Common Cuckoo", "value": 2702}]}]}]}, {"name": "Caprimulgiformes", "children": [{"name": "Caprimulgidae", "children": [{"name": "Caprimulgus", "children": [{"name": "European Nightjar", "value": 887}]}]}]}]};

// Farbpaletten 
const COLOR_GROUPS = [
  ["#A0C3B9", "#81AFA1", "#3A5D53", "#2E4A42"],
  ["#f2dca6", "#edd088", "#E9C46A", "#BA9D55"],
  ["#cb9d94", "#BA7C70", "#A95B4C", "#87493D"],
  ["#9498cb", "#7076ba", "#4C54A9", "#3D4387"],
  ["#afd4d9", "#95c6cc", "#7AB8BF", "#629399"],
  ["#c7dab3", "#b4cd9a", "#A1C181", "#819A67"],
  ["#f8c7a0", "#f6b581", "#F4A261", "#C3824E"],
  ["#f1a997", "#ec8c74", "#E76F51", "#B95941"],
  ["#88bad9", "#61a3cc", "#398CBF", "#2E7099"],
  ["#b994cb", "#a170ba", "#8A4CA9", "#6E3D87"],
  ["#caac9b", "#b89079", "#A67458", "#855D46"],
  ["#e2a6b6", "#d8889d", "#CE6A85", "#A5556A"],
  ["#cb949e", "#ba707e", "#A94C5E", "#873D4B"],
  ["#b6ba92", "#9da36e", "#858C4A", "#6A703B"],
  ["#e8d6c6", "#e1c9b3", "#D9BBA0", "#AE9680"],
  ["#c5c2e5", "#b1addc", "#9E99D3", "#7E7AA9"],
];

// Globale Referenz auf updateAvailability
// Wird von yearFilter.js aufgerufen wenn der Jahresfilter sich ändert
let _updateBirdAvailability = null;

function refreshBirdAvailability() {
  if (typeof _updateBirdAvailability === 'function') _updateBirdAvailability();
}

// Hierarchie dynamisch aus allRoutes aufbauen 
// Ersetzt die hardcodierte BIRD_DATA, damit der Sunburst immer
// mit dem aktuellen Stand der CSV übereinstimmt.
function buildBirdDataFromRoutes() {
  if (typeof allRoutes === 'undefined' || allRoutes.length === 0) return null;

  const root = { name: 'root', children: [] };
  const orderMap = {};

  for (const r of allRoutes) {
    const order   = r.order   || '';
    const family  = r.family  || '';
    const genus   = r.genus   || '';
    const species = r.species || '';
    if (!order || !family || !genus || !species) continue;

    if (!orderMap[order]) {
      orderMap[order] = { name: order, children: [], _familyMap: {} };
      root.children.push(orderMap[order]);
    }
    const orderNode = orderMap[order];

    if (!orderNode._familyMap[family]) {
      orderNode._familyMap[family] = { name: family, children: [], _genusMap: {} };
      orderNode.children.push(orderNode._familyMap[family]);
    }
    const familyNode = orderNode._familyMap[family];

    if (!familyNode._genusMap[genus]) {
      familyNode._genusMap[genus] = { name: genus, children: [], _speciesMap: {} };
      familyNode.children.push(familyNode._genusMap[genus]);
    }
    const genusNode = familyNode._genusMap[genus];

    if (!genusNode._speciesMap[species]) {
      genusNode._speciesMap[species] = { name: species, value: 0 };
      genusNode.children.push(genusNode._speciesMap[species]);
    }
    // Anzahl Wegpunkte als Gewicht (entspricht der ursprünglichen BIRD_DATA-Logik)
    genusNode._speciesMap[species].value += r.points.length;
  }

  // Interne Hilfs-Maps entfernen damit d3.hierarchy keine fremden Keys sieht
  function clean(node) {
    delete node._familyMap;
    delete node._genusMap;
    delete node._speciesMap;
    if (node.children) node.children.forEach(clean);
  }
  clean(root);

  return root;
}

// Hauptfunktion
function initBirdFilter() {
  const container = document.getElementById("bird-filter-block");
  if (!container) return;

  d3.select(container).selectAll("*").remove();

  const margin = 12;
  const size   = Math.max(0, Math.min(container.clientWidth, container.clientHeight) - margin * 2);
  const radius = size / 2;

  const svg = d3.select(container)
    .append("svg")
    .attr("width",  size)
    .attr("height", size)
    .style("display", "block")
    .style("margin", "auto");

  const g = svg.append("g")
    .attr("transform", `translate(${radius},${radius})`);

  const birdData = buildBirdDataFromRoutes() || BIRD_DATA;
  const root = d3.hierarchy(birdData)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  d3.partition().size([2 * Math.PI, radius])(root);

  const innerR = radius * 0.28;
  const ringW  = (radius - innerR) / 4;

  const xScale  = d => innerR + (d.depth - 1) * ringW;
  const x1Scale = d => innerR + d.depth * ringW;

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => xScale(d))
    .outerRadius(d => x1Scale(d))
    .padAngle(0.012)
    .padRadius(radius / 2);

  const colorMap = {};
  root.children.forEach((d, i) => {
    colorMap[d.data.name] = COLOR_GROUPS[i % COLOR_GROUPS.length];
  });

  // Expose a lightweight global helper so other modules (mapRoutes.js)
  // can query the lightest sunburst color for a given order.
  // We store the mapping on window to avoid leaking variables across modules.
  try {
    window._birdColorMap = colorMap;
    window.getBirdLightColor = function(orderName) {
      if (!orderName) return null;
      if (window._birdColorMap && window._birdColorMap[orderName]) {
        return window._birdColorMap[orderName][0]; // lightest color
      }
      // Fallback deterministic hash to pick a COLOR_GROUP index
      try {
        let h = 0;
        for (let i = 0; i < orderName.length; i++) {
          h = ((h << 5) - h) + orderName.charCodeAt(i);
          h |= 0;
        }
        const idx = Math.abs(h) % COLOR_GROUPS.length;
        return COLOR_GROUPS[idx][0];
      } catch (e) {
        return COLOR_GROUPS[0][0];
      }
    };
  } catch (e) {
    // ignore if window is not writable in this environment
  }

  function getColor(d) {
    let node = d;
    while (node.depth > 1) node = node.parent;
    const group = colorMap[node.data.name] || COLOR_GROUPS[0];
    return group[d.depth - 1] || group[group.length - 1];
  }

  let currentRoot = root;

  // Hover-Infobox 
  const tooltip = d3.select(container)
    .append("div")
    .style("position",       "absolute")
    .style("background",     "rgba(50,50,60,0.92)")
    .style("color",          "#fff")
    .style("border-radius",  "6px")
    .style("padding",        "8px 12px")
    .style("font-size",      "0.75rem")
    .style("pointer-events", "none")
    .style("opacity",        0)
    .style("max-width",      "160px")
    .style("line-height",    "1.4");

  const DEPTH_LABEL = ["", "Order", "Family", "Genus", "Species"];

  // Helper: fit text into maxWidth (SVG text). Uses getComputedTextLength and
  // binary search to find the longest substring that fits, appending an ellipsis.
  function fitLabel(node, text, maxWidth) {
    if (!node || !text || maxWidth <= 0) { if (node) node.text(""); return; }
    const el = node.node();
    if (!el) return;
    el.textContent = text;
    // If it already fits, we're done
    if (el.getComputedTextLength() <= maxWidth) return;

    // Binary search for the maximum number of characters that fit with an ellipsis
    let left = 0, right = text.length, fit = 0;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      el.textContent = text.slice(0, mid) + '…';
      if (el.getComputedTextLength() <= maxWidth) {
        fit = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    el.textContent = fit > 0 ? text.slice(0, fit) + '…' : '';
  }
  // Segmente
  const paths = g.selectAll("path")
    .data(root.descendants().filter(d => d.depth > 0))
    .join("path")
    .attr("d", arc)
    .attr("fill", d => getColor(d))
    .attr("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("opacity", 0.75);
      tooltip
        .html(`<strong style="font-size:0.85rem">${d.data.name}</strong><br>
               ${DEPTH_LABEL[d.depth]}<br>
               ${d.value.toLocaleString()} data points`)
        .style("opacity", 1);
    })
    .on("mousemove", function(event) {
      // Position the tooltip next to the cursor, but if it would overflow
      // the right side of the container, flip it to the left of the cursor.
      const rect = container.getBoundingClientRect();
      const tooltipEl = tooltip.node();
      const padding = 12; // space from cursor
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      let left = cursorX + padding;
      let top = cursorY - 10;

      if (tooltipEl) {
        // Measure tooltip size
        const ttRect = tooltipEl.getBoundingClientRect();
        const ttWidth = ttRect.width || tooltipEl.offsetWidth || 0;
        const ttHeight = ttRect.height || tooltipEl.offsetHeight || 0;

        // If tooltip would overflow right edge of container, place it to the left
        if (left + ttWidth > rect.width - 8) {
          left = cursorX - ttWidth - padding;
          // If flipping still goes off the left edge, clamp it inside container
          if (left < 8) left = Math.max(8, rect.width - ttWidth - 8);
        }

        // If tooltip would overflow bottom, move it up (clamp)
        if (top + ttHeight > rect.height - 8) {
          top = Math.max(8, rect.height - ttHeight - 8);
        }
        // If tooltip would overflow top, clamp it
        if (top < 8) top = 8;
      }

      tooltip
        .style("left", left + "px")
        .style("top",  top + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("opacity", 1);
      tooltip.style("opacity", 0);
    })
    .on("click", function(event, d) {
      event.stopPropagation();
      zoomTo(d);
    });

  // Text-Labels
  const labels = g.selectAll("text")
    .data(root.descendants().filter(d => d.depth > 0))
    .join("text")
    .attr("text-anchor",    "middle")
    .attr("font-size",      "12px") // use px to make getComputedTextLength reliable
    .attr("fill",           "#fff")
    .attr("pointer-events", "none")
    .each(function(d) {
      const node   = d3.select(this);
      const midR   = (xScale(d) + x1Scale(d)) / 2;
      const arcLen = (d.x1 - d.x0) * midR;
      if (arcLen < 20) { node.text(""); return; }
      const midAngle = (d.x0 + d.x1) / 2 - Math.PI / 2;
      let rotateDeg = (midAngle + Math.PI / 2) * 180 / Math.PI;
      if (rotateDeg > 90 && rotateDeg < 270) rotateDeg += 180;
      node.attr("transform", `translate(${Math.cos(midAngle) * midR},${Math.sin(midAngle) * midR}) rotate(${rotateDeg})`);
      // Fit the label text to the available arc length using measured text width
      fitLabel(node, d.data.name, Math.max(0, arcLen - 6));
    });

  // Mittelkreis
  const centerCircle = g.append("circle")
    .attr("r",      innerR - 4)
    .attr("fill",   "#1b2a41")
    .attr("cursor", "pointer")
    .on("click", () => zoomTo(root));

  const centerText = g.append("text")
    .attr("text-anchor",       "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill",              "#fff")
    .attr("pointer-events",    "none");

  const centerArrow = g.append("text")
    .attr("text-anchor",    "middle")
    .attr("y",              innerR * 0.35)
    .attr("font-size",      "1rem")
    .attr("fill",           "#ffffffaa")
    .attr("pointer-events", "none")
    .text("↩");

  function recomputeAvailabilityValues() {
    if (typeof getAvailableNames !== 'function') return null;
    const available = getAvailableNames();

    // Sum only available leaves (species). Internal nodes will be summed.
    root.sum(function(node) {
      if (!node) return 0;
      if (!node.children || node.children.length === 0) {
        const name = node.name || node.data?.name;
        const isAvail = (available && available.species) ? available.species.has(name) : true;
        return isAvail ? (node.value || node.data?.value || 0) : 0;
      }
      return 0;
    });

    // Re-run partition so x0/x1 reflect the new proportions
    d3.partition().size([2 * Math.PI, radius])(root);

    return available;
  }

  function applyAvailabilityVisuals(mappingBaseDepth = 1, xScale2 = null, duration = 200) {
    const available = getAvailableNames ? getAvailableNames() : null;

    // Default xScale2 maps identity (no zoom)
    if (!xScale2) xScale2 = d3.scaleLinear().domain([0, 2 * Math.PI]).range([0, 2 * Math.PI]);

    // Arc generator that respects mappingBaseDepth and the provided xScale2
    const visualArc = d3.arc()
      .startAngle(dd => xScale2(Math.max(xScale2.domain()[0], Math.min(xScale2.domain()[1], dd.x0))))
      .endAngle(dd   => xScale2(Math.max(xScale2.domain()[0], Math.min(xScale2.domain()[1], dd.x1))))
      .innerRadius(dd => {
        const rel = Math.max(0, dd.depth - mappingBaseDepth);
        return innerR + rel * ringW;
      })
      .outerRadius(dd => {
        const rel = Math.max(0, dd.depth - mappingBaseDepth);
        return innerR + (rel + 1) * ringW;
      })
      .padAngle(0.012)
      .padRadius(radius / 2);

    // Update shapes (animate only if duration > 0, otherwise set immediately)
    if (duration && duration > 0) {
      paths.transition().duration(duration).attr("d", d => visualArc(d));
    } else {
      paths.attr("d", d => visualArc(d));
    }

    // Update visibility/interaction per node
    paths.each(function(d) {
      const name = d.data.name;
      let avail = true;
      if (available) {
        switch (d.depth) {
          case 1: avail = available.orders.has(name);   break;
          case 2: avail = available.families.has(name); break;
          case 3: avail = available.genera.has(name);   break;
          case 4: avail = available.species.has(name);  break;
          default: avail = true;
        }
      }

      const visibleBecauseOfZoom = (currentRoot === root) ? true : (isDescendant(currentRoot, d) && d !== currentRoot);
      const show = avail && visibleBecauseOfZoom && (d.value && d.value > 0);

      d3.select(this)
        .attr("opacity",        show ? 1     : 0)
        .attr("pointer-events", show ? "all" : "none");
    });

    // Update labels to match the visualArc geometry and visibility
    labels.each(function(d) {
      const node = d3.select(this);
      const name = d.data.name;
      let avail = true;
      if (available) {
        switch (d.depth) {
          case 1: avail = available.orders.has(name);   break;
          case 2: avail = available.families.has(name); break;
          case 3: avail = available.genera.has(name);   break;
          case 4: avail = available.species.has(name);  break;
          default: avail = true;
        }
      }
      const visibleBecauseOfZoom = (currentRoot === root) ? true : (isDescendant(currentRoot, d) && d !== currentRoot);
      const show = avail && visibleBecauseOfZoom && (d.value && d.value > 0);

      if (!show) { node.text(""); return; }

      // compute mid radius and arc length using current partition angles
      const startA = xScale2(Math.max(xScale2.domain()[0], Math.min(xScale2.domain()[1], d.x0)));
      const endA   = xScale2(Math.max(xScale2.domain()[0], Math.min(xScale2.domain()[1], d.x1)));
      const relDepth = d.depth - mappingBaseDepth;
      const midR = innerR + Math.max(0, relDepth) * ringW + ringW / 2;
      const arcLen = (endA - startA) * midR;
      if (arcLen < 20) { node.text(""); return; }

      const midAngle = (startA + endA) / 2 - Math.PI / 2;
      let rotateDeg = (midAngle + Math.PI / 2) * 180 / Math.PI;
      if (rotateDeg > 90 && rotateDeg < 270) rotateDeg += 180;

      node.attr("transform", `translate(${Math.cos(midAngle) * midR},${Math.sin(midAngle) * midR}) rotate(${rotateDeg})`);
      fitLabel(node, d.data.name, Math.max(0, arcLen - 6));
    });
  }

  // Globale Referenz setzen damit yearFilter.js es aufrufen kann
  _updateBirdAvailability = function() {
    // Recompute then apply visuals using the current mapping (zoom state)
    const available = recomputeAvailabilityValues();
    // Determine xScale2/mappingBaseDepth for currentRoot
    const x0 = currentRoot.x0;
    const dx = currentRoot.x1 - currentRoot.x0;
    const xScale2 = d3.scaleLinear().domain([x0, x0 + dx]).range([0, 2 * Math.PI]);
    const mappingBaseDepth = Math.max(currentRoot.depth + 1, 1);
    // For year-filter updates we want no animation: show new fields instantly
    applyAvailabilityVisuals(mappingBaseDepth, xScale2, 0);
  };

  updateCenter(root);
  // initial compute/apply once mapRoutes is ready
  setTimeout(() => { const available = recomputeAvailabilityValues(); applyAvailabilityVisuals(1, d3.scaleLinear().domain([0,2*Math.PI]).range([0,2*Math.PI]), 200); }, 200);

  // Zoom
  function zoomTo(target) {
    if (target === currentRoot) target = root;
    currentRoot = target;

    const x0 = target.x0;
    const dx = target.x1 - target.x0;
    const xScale2 = d3.scaleLinear().domain([x0, x0 + dx]).range([0, 2 * Math.PI]);
    const minDepth         = target.depth;
    const mappingBaseDepth = Math.max(minDepth + 1, 1);

    paths
      .transition().duration(600)
      .attrTween("d", function(d) {
        const visible = (d !== target) && isDescendant(target, d);
        const newArc = d3.arc()
          .startAngle(dd => xScale2(Math.max(x0, Math.min(x0 + dx, dd.x0))))
          .endAngle(dd   => xScale2(Math.max(x0, Math.min(x0 + dx, dd.x1))))
          .innerRadius(dd => {
            const rel = Math.max(0, dd.depth - mappingBaseDepth);
            return innerR + rel * ringW;
          })
          .outerRadius(dd => {
            const rel = Math.max(0, dd.depth - mappingBaseDepth);
            return innerR + (rel + 1) * ringW;
          })
          .padAngle(0.012)
          .padRadius(radius / 2);

        return function() {
          if (!visible && target !== root) {
            d3.select(this).attr("opacity", 0).attr("pointer-events", "none");
          } else {
            d3.select(this).attr("opacity", 1).attr("pointer-events", "all");
          }
          return newArc(d);
        };
      });

  updateCenter(target);
  updateLabels(target, xScale2, mappingBaseDepth);

  recomputeAvailabilityValues();

  setTimeout(() => applyAvailabilityVisuals(mappingBaseDepth, xScale2, 200), 650);

  onBirdFilterChange(target === root ? null : target.data.name, target.depth);
  }

  function isDescendant(ancestor, node) {
    let n = node;
    while (n) {
      if (n === ancestor) return true;
      n = n.parent;
    }
    return false;
  }

  function updateCenter(target) {
    const isRoot = target === root;
    centerCircle.transition().duration(400)
      .attr("fill", isRoot ? "#1a1d22" : getColor(target));
    centerText
      .text(isRoot ? "All birds" : target.data.name)
      .attr("font-size", isRoot ? "0.75rem" : "0.7rem")
      .attr("y", isRoot ? 0 : -(innerR * 0.2));
    centerArrow.text(isRoot ? "" : "↩");
  }

  function updateLabels(target, xScale2, mappingBaseDepth) {
    const x0 = target.x0;
    const dx = target.x1 - target.x0;

    labels.each(function(d) {
      const node    = d3.select(this);
      const visible = (d !== target) && isDescendant(target, d);
      if (!visible && target !== root) { node.text(""); return; }

      const relDepth = d.depth - mappingBaseDepth;
      const startA   = xScale2(Math.max(x0, Math.min(x0 + dx, d.x0)));
      const endA     = xScale2(Math.max(x0, Math.min(x0 + dx, d.x1)));
      const midAngle = (startA + endA) / 2 - Math.PI / 2;
      const midR     = innerR + relDepth * ringW + ringW / 2;
      const arcLen   = (endA - startA) * midR;

      if (arcLen < 20) { node.text(""); return; }

      let rotateDeg = (midAngle + Math.PI / 2) * 180 / Math.PI;
      if (rotateDeg > 90 && rotateDeg < 270) rotateDeg += 180;

      node.attr("transform", `translate(${Math.cos(midAngle) * midR},${Math.sin(midAngle) * midR}) rotate(${rotateDeg})`);
      // Fit label to arc length using measured text width
      fitLabel(node, d.data.name, Math.max(0, arcLen - 6));
    });
  }

  svg.on("click", () => zoomTo(root));
}

// Karten-Filter-Callback
function onBirdFilterChange(name, depth) {
  if (typeof filterRoutes === 'function') filterRoutes(name, depth);
}

// Start
window.addEventListener("load", () => {
  setTimeout(initBirdFilter, 100);
  window.addEventListener("resize", () => setTimeout(initBirdFilter, 100));
});