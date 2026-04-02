//  Sunburst-Diagramm für den Vogel-Filter

//  Später – Anbindung an die Karte:
//   Am Ende dieser Datei ist die Funktion onBirdFilterChange().
//   Dort kommt der Code rein, der die Karte nach der Auswahl filtert.
// ============================================================


// Hierarchie-Daten (Ordnung → Familie → Gattung → Spezies)
const BIRD_DATA = {"name": "root", "children": [{"name": "Accipitriformes", "children": [{"name": "Pandionidae", "children": [{"name": "Pandion", "children": [{"name": "Osprey", "value": 2240}]}]}, {"name": "Accipitridae", "children": [{"name": "Buteo", "children": [{"name": "Ferruginous Hawk", "value": 176}, {"name": "Eurasian Buzzard", "value": 157}, {"name": "Japanese Buzzard", "value": 72}, {"name": "Swainson's Hawk", "value": 517}, {"name": "Long-legged Buzzard", "value": 49}]}, {"name": "Clanga", "children": [{"name": "Lesser Spotted Eagle", "value": 387}, {"name": "Greater Spotted Eagle", "value": 73}]}, {"name": "Pernis", "children": [{"name": "European Honey-buzzard", "value": 1593}]}, {"name": "Haliaeetus", "children": [{"name": "Steller's Sea-eagle", "value": 9}, {"name": "White-tailed Sea-eagle", "value": 6}, {"name": "Bald Eagle", "value": 22}]}, {"name": "Aquila", "children": [{"name": "Steppe Eagle", "value": 323}]}, {"name": "Circus", "children": [{"name": "Western Marsh-harrier", "value": 519}, {"name": "Montagu's Harrier", "value": 1783}]}, {"name": "Milvus", "children": [{"name": "Black Kite", "value": 392}, {"name": "Red Kite", "value": 144}]}, {"name": "Aegypius", "children": [{"name": "Cinereous Vulture", "value": 243}]}, {"name": "Accipiter", "children": [{"name": "Levant Sparrowhawk", "value": 57}]}, {"name": "Hieraaetus", "children": [{"name": "Booted Eagle", "value": 175}]}]}]}, {"name": "Falconiformes", "children": [{"name": "Falconidae", "children": [{"name": "Falco", "children": [{"name": "Sooty Falcon", "value": 518}, {"name": "Lesser Kestrel", "value": 824}, {"name": "Eleonora's Falcon", "value": 1197}, {"name": "Amur Falcon", "value": 48}, {"name": "Peregrine Falcon", "value": 585}]}]}]}, {"name": "Gruiformes", "children": [{"name": "Gruidae", "children": [{"name": "Grus", "children": [{"name": "White-naped Crane", "value": 72}, {"name": "Red-crowned Crane", "value": 11}]}, {"name": "Leucogeranus", "children": [{"name": "Siberian Crane", "value": 88}]}, {"name": "Anthropoides", "children": [{"name": "Demoiselle Crane", "value": 662}]}]}]}, {"name": "Passeriformes", "children": [{"name": "Vireonidae", "children": [{"name": "Vireo", "children": [{"name": "Vireo olivaceus", "value": 677}]}]}, {"name": "Fringillidae", "children": [{"name": "Chloris", "children": [{"name": "European Greenfinch", "value": 159}]}, {"name": "Carpodacus", "children": [{"name": "Common Rosefinch", "value": 254}]}]}, {"name": "Parulidae", "children": [{"name": "Setophaga", "children": [{"name": "Blackpoll Warbler", "value": 860}]}, {"name": "Icteria", "children": [{"name": "Yellow-breasted Chat", "value": 41}]}, {"name": "Cardellina", "children": [{"name": "Canada Warbler", "value": 1649}]}, {"name": "Vermivora", "children": [{"name": "Vermivora chrysoptera", "value": 904}]}]}, {"name": "Hirundinidae", "children": [{"name": "Hirundo", "children": [{"name": "Barn Swallow", "value": 1721}]}, {"name": "Riparia", "children": [{"name": "Collared Sand Martin", "value": 33}]}]}, {"name": "Emberizidae", "children": [{"name": "Emberiza", "children": [{"name": "Ortolan Bunting", "value": 710}]}]}, {"name": "Laniidae", "children": [{"name": "Lanius", "children": [{"name": "Red-backed Shrike", "value": 1248}]}]}, {"name": "Mimidae", "children": [{"name": "Dumetella", "children": [{"name": "Grey Catbird", "value": 58}]}]}, {"name": "Phylloscopidae", "children": [{"name": "Phylloscopus", "children": [{"name": "Phylloscopus trochilus", "value": 1375}]}]}, {"name": "Sylviidae", "children": [{"name": "Curruca", "children": [{"name": "Common Whitethroat", "value": 579}]}]}, {"name": "Tyrannidae", "children": [{"name": "Tyrannus", "children": [{"name": "Eastern Kingbird", "value": 119}]}]}, {"name": "Troglodytidae", "children": [{"name": "Troglodytes", "children": [{"name": "House Wren", "value": 137}]}]}]}, {"name": "Ciconiiformes", "children": [{"name": "Ciconiidae", "children": [{"name": "Ciconia", "children": [{"name": "Oriental Stork", "value": 161}, {"name": "Black Stork", "value": 344}, {"name": "White Stork", "value": 132}]}]}]}, {"name": "Charadriiformes", "children": [{"name": "Scolopacidae", "children": [{"name": "Calidris", "children": [{"name": "Temminck's Stint", "value": 385}, {"name": "Purple Sandpiper", "value": 80}, {"name": "Red Knot", "value": 264}, {"name": "Buff-breasted Sandpiper", "value": 289}, {"name": "Dunlin", "value": 226}]}, {"name": "Limosa", "children": [{"name": "Bar-tailed Godwit", "value": 115}]}, {"name": "Numenius", "children": [{"name": "Far Eastern Curlew", "value": 182}, {"name": "Eurasian Curlew", "value": 90}, {"name": "Whimbrel", "value": 417}]}, {"name": "Bartramia", "children": [{"name": "Upland Sandpiper", "value": 453}]}, {"name": "Scolopax", "children": [{"name": "Eurasian Woodcock", "value": 119}, {"name": "American Woodcock", "value": 245}]}, {"name": "Tringa", "children": [{"name": "Common Redshank", "value": 602}]}, {"name": "Phalaropus", "children": [{"name": "Red-necked Phalarope", "value": 1704}]}, {"name": "Gallinago", "children": [{"name": "Great Snipe", "value": 1371}]}]}, {"name": "Laridae", "children": [{"name": "Larus", "children": [{"name": "Lesser Black-backed Gull", "value": 652}, {"name": "Pallas's Gull", "value": 224}, {"name": "Iceland Gull", "value": 21}]}, {"name": "Sterna", "children": [{"name": "Common Tern", "value": 1013}]}]}, {"name": "Haematopodidae", "children": [{"name": "Haematopus", "children": [{"name": "Eurasian Oystercatcher", "value": 2}]}]}, {"name": "Charadriidae", "children": [{"name": "Charadrius", "children": [{"name": "Mountain Plover", "value": 42}, {"name": "Common Rosefinch", "value": 640}]}, {"name": "Pluvialis", "children": [{"name": "Pacific Golden Plover", "value": 199}]}]}, {"name": "Stercorariidae", "children": [{"name": "Stercorarius", "children": [{"name": "Pomarine Jaeger", "value": 529}]}]}]}, {"name": "Anseriformes", "children": [{"name": "Anatidae", "children": [{"name": "Anas", "children": [{"name": "Common Teal", "value": 65}, {"name": "American Black Duck", "value": 115}, {"name": "Indian Spot-billed Duck", "value": 65}, {"name": "Mallard", "value": 176}, {"name": "Northern Pintail", "value": 201}]}, {"name": "Anser", "children": [{"name": "Lesser White-fronted Goose", "value": 160}, {"name": "Greylag Goose", "value": 49}, {"name": "Bar-headed Goose", "value": 128}, {"name": "Greater White-fronted Goose", "value": 446}, {"name": "Bean Goose", "value": 115}, {"name": "Pink-footed Goose", "value": 35}, {"name": "Swan Goose", "value": 25}]}, {"name": "Mareca", "children": [{"name": "Falcated Duck", "value": 65}, {"name": "Eurasian Wigeon", "value": 194}]}, {"name": "Sibirionetta", "children": [{"name": "Baikal Teal", "value": 65}]}, {"name": "Spatula", "children": [{"name": "Cinnamon Teal", "value": 54}, {"name": "Garganey", "value": 65}]}, {"name": "Branta", "children": [{"name": "Brent Goose", "value": 47}, {"name": "Barnacle Goose", "value": 62}]}, {"name": "Cygnus", "children": [{"name": "Tundra Swan", "value": 51}, {"name": "Trumpeter Swan", "value": 11}]}, {"name": "Chloephaga", "children": [{"name": "Upland Goose", "value": 6}]}, {"name": "Aythya", "children": [{"name": "Ring-necked Duck", "value": 149}]}, {"name": "Tadorna", "children": [{"name": "Ruddy Shelduck", "value": 169}]}]}]}, {"name": "Pelecaniformes", "children": [{"name": "Pelecanidae", "children": [{"name": "Pelecanus", "children": [{"name": "Great White Pelican", "value": 163}]}]}, {"name": "Ardeidae", "children": [{"name": "Botaurus", "children": [{"name": "American Bittern", "value": 209}]}, {"name": "Nycticorax", "children": [{"name": "Black-crowned Night-heron", "value": 83}]}, {"name": "Egretta", "children": [{"name": "Chinese Egret", "value": 305}]}]}, {"name": "Threskiornithidae", "children": [{"name": "Platalea", "children": [{"name": "Eurasian Spoonbill", "value": 527}]}]}]}, {"name": "Suliformes", "children": [{"name": "Phalacrocoracidae", "children": [{"name": "Nannopterum", "children": [{"name": "Double-crested Cormorant", "value": 122}]}]}]}, {"name": "Strigiformes", "children": [{"name": "Strigidae", "children": [{"name": "Athene", "children": [{"name": "Burrowing Owl", "value": 61}]}, {"name": "Psiloscops", "children": [{"name": "Flammulated Owl", "value": 100}]}, {"name": "Asio", "children": [{"name": "Short-eared Owl", "value": 63}]}]}]}, {"name": "Apodiformes", "children": [{"name": "Apodidae", "children": [{"name": "Apus", "children": [{"name": "Common Swift", "value": 697}, {"name": "Pacific Swift", "value": 280}]}]}]}, {"name": "Otidiformes", "children": [{"name": "Otididae", "children": [{"name": "Otis", "children": [{"name": "Great Bustard", "value": 30}]}]}]}, {"name": "Columbiformes", "children": [{"name": "Columbidae", "children": [{"name": "Streptopelia", "children": [{"name": "European Turtle-dove", "value": 55}]}]}]}, {"name": "Gaviiformes", "children": [{"name": "Gaviidae", "children": [{"name": "Gavia", "children": [{"name": "Common Loon", "value": 75}]}]}]}, {"name": "Cuculiformes", "children": [{"name": "Cuculidae", "children": [{"name": "Cuculus", "children": [{"name": "Common Cuckoo", "value": 2702}]}]}]}, {"name": "Caprimulgiformes", "children": [{"name": "Caprimulgidae", "children": [{"name": "Caprimulgus", "children": [{"name": "European Nightjar", "value": 887}]}]}]}]};

// Farbpaletten: je 4 Stufen von hell nach dunkel
// Reihenfolge so gewählt dass ähnliche Farben nicht nebeneinander liegen
// [innerste/hellste Farbe zuerst, äußerste/dunkelste Farbe zuletzt]
const COLOR_GROUPS = [
  ["#DFEBE8", "#A0C3B9", "#3A5D53", "#2E4A42"],   //  1 Grün-Grau
  ["#FBF3E1", "#F2DCA6", "#E9C46A", "#BA9D55"],   //  3 Gold
  ["#EEDEDB", "#CB9D94", "#A95B4C", "#87493D"],   //  6 Dunkelrot
  ["#DBDDEE", "#9498CB", "#4C54A9", "#3D4387"],   //  9 Blau-Lila
  ["#E4F1F2", "#AFD4D9", "#7AB8BF", "#629399"],   // 11 Türkis
  ["#ECF3E6", "#C7DAB3", "#A1C181", "#819A67"],   //  2 Hellgrün
  ["#FDECDF", "#F8C7A0", "#F4A261", "#C3824E"],   //  4 Orange
  ["#FAE2DC", "#F1A997", "#E76F51", "#B95941"],   //  5 Koralle
  ["#D7E8F2", "#88BAD9", "#398CBF", "#2E7099"],   // 10 Hellblau
  ["#E8DBEE", "#B994CB", "#8A4CA9", "#6E3D87"],   // 12 Lila
  ["#EDE3DE", "#CAAC9B", "#A67458", "#855D46"],   //  7 Braun
  ["#F5E1E7", "#E2A6B6", "#CE6A85", "#A5556A"],   //  8 Rosa
  ["#EEDBDF", "#CB949E", "#A94C5E", "#873D4B"],   // 13 Dunkelpink
  ["#E7E8DB", "#B6BA92", "#858C4A", "#6A703B"],   // 15 Olivgrün
  ["#F7F1EC", "#E8D6C6", "#D9BBA0", "#AE9680"],   // 14 Beige
  ["#ECEBF6", "#C5C2E5", "#9E99D3", "#7E7AA9"],   // 16 Flieder
];

// Hauptfunktion: Sunburst aufbauen
function initBirdFilter() {
  const container = document.getElementById("bird-filter-block");
  if (!container) return;

 // Alles vorher gezeichnete löschen bevor neu gezeichnet wird (z.B. bei Resize)
  d3.select(container).selectAll("*").remove();

 // Größe des Diagramms an den Container anpassen
  const margin = 12; // Abstand zum Rand der Kachel – hier anpassen wenn nötig
  const size   = Math.max(0, Math.min(container.clientWidth, container.clientHeight) - margin * 2);
  const radius = size / 2;

  // SVG erstellen und in der Mitte der Kachel platzieren
  const svg = d3.select(container)
    .append("svg")
    .attr("width",  size)
    .attr("height", size)
    .style("display", "block")
    .style("margin", "auto");

  // Gruppe mit Ursprung in der Mitte des SVG, damit alles um den Mittelpunkt gezeichnet wird
  const g = svg.append("g")
    .attr("transform", `translate(${radius},${radius})`);

  // d3-Hierarchie aus den Baumdaten bauen und nach Datenpunkten sortieren
  const root = d3.hierarchy(BIRD_DATA)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value); // größte Segmente zuerst 

  // d3.partition teilt den Kreis (2π) proportional zur Datenmenge auf
  const partition = d3.partition().size([2 * Math.PI, radius]);
  partition(root);

   // Innenkreis-Radius – bestimmt wie groß der mittlere Kreis ist
  const innerR = radius * 0.28; // 0.28 = 28% des Radius – hier anpassen für größeren/kleineren Innenkreis
  const ringW  = (radius - innerR) / 4; // Breite eines Rings – ergibt sich automatisch aus 4 Ringen

  // Hilfsfunktionen: Innen- und Außenradius eines Segments je nach Tiefe
  const xScale  = d => innerR + (d.depth - 1) * ringW;
  const x1Scale = d => innerR + d.depth * ringW;

   // Bogenform für jedes Segment
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => xScale(d))
    .outerRadius(d => x1Scale(d))
    .padAngle(0.012)  // Lücke zwischen Segmenten – größer = mehr Abstand
    .padRadius(radius / 2);

  // Jeder Order eine Farbgruppe zuweisen
  const orders = root.children.map(d => d.data.name);
  const colorMap = {}; // orderName → Farbgruppe (Array von 4 Farben)
  orders.forEach((name, i) => {
    colorMap[name] = COLOR_GROUPS[i % COLOR_GROUPS.length];
  });

   // Gibt die Farbe eines Knotens zurück: heller innen, dunkler außen
  function getColor(d) {
    // Order-Vorfahren finden
    let node = d;
    while (node.depth > 1) node = node.parent; //Ordnung des Knotens finden
    const group = colorMap[node.data.name] || COLOR_GROUPS[0];
    // depth 1 → index 0 (hellste), depth 4 → index 3 (dunkelste)
    return group[d.depth - 1] || group[group.length - 1]; //Tiefe bestimmt Farbton
  }

  // Merkt sich welches Segment gerade gezoomt ist
  let currentRoot = root;

  // Infobox beim Hovern
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

  // Bezeichnungen für die 4 Ebenen - erscheinen in der Infobox
  const DEPTH_LABEL = ["", "Ordnung", "Familie", "Gattung", "Art"];

  // Alle Segmente als SVG-Pfade zeichnen
  const paths = g.selectAll("path")
    .data(root.descendants().filter(d => d.depth > 0)) // Tiefe 0 = root, wird nicht gezeichnet
    .join("path")
    .attr("d", arc)
    .attr("fill", d => getColor(d))
    .attr("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("opacity", 0.75); // Segment beim Hovern leicht abdunkeln
      tooltip
        .html(`<strong style="font-size:0.85rem">${d.data.name}</strong><br>
               ${DEPTH_LABEL[d.depth]}<br>
               ${d.value.toLocaleString()} Datenpunkte`)
        .style("opacity", 1);
    })
    .on("mousemove", function(event) {
      // Infobox neben dem Mauszeiger positionieren
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left + 12;
      const y = event.clientY - rect.top  - 10;
      tooltip.style("left", x + "px").style("top", y + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("opacity", 1);
      tooltip.style("opacity", 0);
    })
    .on("click", function(event, d) {
      event.stopPropagation();
      zoomTo(d);
    });

  // Text-Labels auf den Segmenten
  // Text wird nur gezeigt wenn er in das Segment passt
  const labels = g.selectAll("text")
    .data(root.descendants().filter(d => d.depth > 0))
    .join("text")
    .attr("text-anchor", "middle")
    .attr("font-size",   "0.6rem")
    .attr("fill",        "#fff")
    .attr("pointer-events", "none")
   .each(function(d) {
  const node    = d3.select(this);
  const angle   = d.x1 - d.x0;
  const midR    = (xScale(d) + x1Scale(d)) / 2; //mittlere Radius des Rings
  const arcLen  = angle * midR; //verfügbare Länge für den Text entlang des Bogens

  if (arcLen < 20) { node.text(""); return; } //zu wenig Platz - kein Text

  // Text der Felder in der Mitte der Ringbreite positionieren
  const midAngle = (d.x0 + d.x1) / 2 - Math.PI / 2;
  const tx = Math.cos(midAngle) * midR;
  const ty = Math.sin(midAngle) * midR;

 // Text immer lesbar drehen (nie auf dem Kopf)
  let rotateDeg = (midAngle + Math.PI / 2) * 180 / Math.PI;
  if (rotateDeg > 90 && rotateDeg < 270) rotateDeg += 180; // untere Hälfte: 180° drehen

  node
    .attr("transform", `translate(${tx},${ty}) rotate(${rotateDeg})`)
    .text(d.data.name);

    //Text kürzen wenn er nicht reinpasst
  const maxChars = Math.floor(arcLen / 6); // 6 = grobe Zeichenbreite in px
  if (d.data.name.length > maxChars && maxChars > 3) {
    node.text(d.data.name.slice(0, maxChars - 1) + "…");
  } else if (maxChars <= 3) {
    node.text(""); // zu wenig Platz auch für abgekürzten Text
  }
});

  // Mittelkreis
  // Hintergrundkreis
  const centerCircle = g.append("circle")
    .attr("r",    innerR - 4) // etwas kleiner als innerR damit kein Überlappen
    .attr("fill", "#1b2a41")
    .attr("cursor", "pointer")
    .on("click", () => zoomTo(root)); // Klick auf Mitte = zurück zur Übersicht

 // Name des ausgewählten Segments in der Mitte
  const centerText = g.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "#fff")
    .attr("pointer-events", "none");

  // Pfeil-Symbol in der Mitte
  const centerArrow = g.append("text")
    .attr("text-anchor", "middle")
    .attr("y", innerR * 0.35) // Position des Pfeils unterhalb des Textes
    .attr("font-size", "1rem")
    .attr("fill", "#ffffffaa")
    .attr("pointer-events", "none")
    .text("↩");

  updateCenter(root); // Startzustand der Mitte setzen


  // Zoom: auf ein Segment klicken zeigt nur dessen Kinder und Kindeskinder
  function zoomTo(target) {
    if (target === currentRoot) {
      target = root; // nochmal klicken = zurück zur Übersicht
    }
    currentRoot = target;

     // Winkelbereich des gewählten Segments auf den vollen Kreis (2π) strecken
    const x0 = target.x0;
    const dx = target.x1 - target.x0;
    const xScale2 = d3.scaleLinear().domain([x0, x0 + dx]).range([0, 2 * Math.PI]);

    const minDepth = target.depth;
    // Kinder rücken eine Ebene nach innen damit der innerste Ring wieder bei innerR beginnt.
    const mappingBaseDepth = Math.max(minDepth + 1, 1);

    paths
      .transition().duration(600) // Animationsdauer in ms
      .attrTween("d", function(d) {
  // Nur Nachfahren des angeklickten Segments zeigen, das Segment selbst bleibt ausgeblendet
  // Dadurch bleibt das Zentrum die einzige Anzeige des gewählten Felds.
  const visible = (d !== target) && ( (d.ancestors && d.ancestors().includes(target)) || isDescendant(target, d) );
        const newArc = d3.arc()
          .startAngle(dd => xScale2(Math.max(x0, Math.min(x0 + dx, dd.x0))))
          .endAngle(dd  => xScale2(Math.max(x0, Math.min(x0 + dx, dd.x1))))
          // Wenn target == root (minDepth == 0) das ursprüngliche
          // Mapping (depth 1 → innerR) wiederherstellen. Daher
          // baseDepth = Math.max(minDepth, 1) benutzen.
          .innerRadius(dd => {
            const relDepth = Math.max(0, dd.depth - mappingBaseDepth);
            return innerR + relDepth * ringW;
          })
          .outerRadius(dd => {
            const relDepth = Math.max(0, dd.depth - mappingBaseDepth);
            return innerR + (relDepth + 1) * ringW;
          })
          .padAngle(0.012)
          .padRadius(radius / 2);

        return function(t) {
          // Segmente die nicht zum Feld gehören ausblenden
          if (!visible && target !== root) {
            d3.select(this).attr("opacity", 0).attr("pointer-events", "none");
          } else {
            d3.select(this).attr("opacity", 1).attr("pointer-events", "all");
          }
          return newArc(d);
        };
      });

  updateCenter(target);
  updateLabels(target, xScale2, minDepth, mappingBaseDepth);

    // Karte filtern – diese Funktion später unten mit Code befüllen
    onBirdFilterChange(target === root ? null : target.data.name, target.depth);
  }

    // Prüft ob 'node' ein Nachfahre von 'ancestor' ist
  function isDescendant(ancestor, node) {
    let n = node;
    while (n) {
      if (n === ancestor) return true;
      n = n.parent;
    }
    return false;
  }

  
  // Mittelkreis aktualisieren wenn ein Segment ausgewählt wird
  function updateCenter(target) {
    const isRoot = (target === root);

    // Farbe des Mittelkreises
    centerCircle
      .transition().duration(400)
      .attr("fill", isRoot ? "#1a1d22" : getColor(target));

    // Text
    centerText
      .text(isRoot ? "Alle Vögel" : target.data.name)
      .attr("font-size", isRoot ? "0.75rem" : "0.7rem")
      .attr("y", isRoot ? 0 : -(innerR * 0.2));

    // Pfeil nur zeigen wenn nicht im Startzustand
    centerArrow.text(isRoot ? "" : "↩");
  }

  // Labels nach Zoom neu berechnen
  function updateLabels(target, xScale2, minDepth, mappingBaseDepth) {
    const x0 = target.x0;
    const dx = target.x1 - target.x0;

    labels.each(function(d) {
      const node     = d3.select(this);
      // Sichtbarkeit wie bei den Pfaden: Target selbst ist ausgeblendet,
      // nur seine Nachfahren werden angezeigt.
      const visible  = (d !== target) && ((d.ancestors && d.ancestors().includes(target)) || isDescendant(target, d));
      if (!visible && target !== root) { node.text(""); return; }

  const relDepth  = d.depth - mappingBaseDepth;
  const startA    = xScale2(Math.max(x0, Math.min(x0 + dx, d.x0)));
  const endA      = xScale2(Math.max(x0, Math.min(x0 + dx, d.x1)));
  const midAngle  = (startA + endA) / 2 - Math.PI / 2;
  const midR      = innerR + relDepth * ringW + ringW / 2; // mitte des Rings
  const arcLen    = (endA - startA) * midR;
  const tx        = Math.cos(midAngle) * midR;
  const ty        = Math.sin(midAngle) * midR;

      if (arcLen < 20) { node.text(""); return; }

      let rotateDeg = (midAngle + Math.PI / 2) * 180 / Math.PI;
if (rotateDeg > 90 && rotateDeg < 270) rotateDeg += 180;

node
  .attr("transform", `translate(${tx},${ty}) rotate(${rotateDeg})`)
  .text(d.data.name);

      const maxChars = Math.floor(arcLen / 6);
      if (d.data.name.length > maxChars && maxChars > 3) {
        node.text(d.data.name.slice(0, maxChars - 1) + "…");
      } else if (maxChars <= 3) {
        node.text("");
      }
    });
  }

  // Klick auf SVG-Hintergrund = zurück zu root
  svg.on("click", () => zoomTo(root));
}



// ── Filter-Callback ────────────────────────────────────────
// Wird aufgerufen wenn der Nutzer ein Segment anklickt.
//   name  = Name des ausgewählten Knotens (z.B. "Falco"), null = alles zeigen
//   depth = Tiefe: 1=Order, 2=Family, 3=Genus, 4=Species
//
// TODO: Hier später den Code einfügen der die Karte filtert, z.B.:
//   filterMapByBird(name, depth);
function onBirdFilterChange(name, depth) {
  console.log("Vogel-Filter geändert:", name, "| Tiefe:", depth);
  // Beispiel für spätere Anbindung:
  // if (name === null) {
  //   showAllRoutes();
  // } else {
  //   filterRoutesByBird(name, depth);
  // }
}

// Diagramm starten sobald DOM bereit ist
// kurz warten damit der Container seine endgültige Größe hat
window.addEventListener("load", () => {
  setTimeout(initBirdFilter, 100);
  // Beim Resize neu zeichnen
  window.addEventListener("resize", () => {
    setTimeout(initBirdFilter, 100);
  });
});