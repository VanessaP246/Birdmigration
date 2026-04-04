// function preload(){
//     csvRohtext = loadTable('data/Bird migration dataset.csv', 'csv', 'header');
//     // backgroundImage = loadImage('data/mapaMundi1800x600.png');
// }

// function setup() {
//     let canvas = createCanvas(100, 100);
//     canvas.parent('map-area');

//     // DEBUG: Spaltennamen ausgeben
//     console.log('Spalten:', csvRohtext.columns);
//     console.log('Erste Zeile:', csvRohtext.getRow(0).arr);

//     initMapRoutes(csvRohtext);
// }

let csvRohtext = null;

function preload() {
    // loadStrings lädt die Datei als reinen Text – wir parsen dann selbst
    csvRohtext = loadStrings('data/Bird migration dataset.csv');
}

function setup() {
    let canvas = createCanvas(100, 100);
    canvas.parent('map-area');

    // CSV manuell mit Semikolon parsen
    const parsed = parseSemicolonCSV(csvRohtext);
    console.log('Spalten:', parsed.columns);
    initMapRoutes(parsed);
    
    // Initialize chord diagram with parsed CSV
    if (typeof onCSVParsed === 'function') {
      onCSVParsed(parsed);
    }

    // DEBUG - nach 1 Sekunde ausgeben
setTimeout(() => {
    const mapEl = document.getElementById('map');
    const mapCanvas = map.getCanvas();
    console.log('map div clientWidth:', mapEl.clientWidth, 'clientHeight:', mapEl.clientHeight);
    console.log('mapCanvas width:', mapCanvas.width, 'height:', mapCanvas.height);
    console.log('mapCanvas clientWidth:', mapCanvas.clientWidth, 'clientHeight:', mapCanvas.clientHeight);
    
    // Test: wo landet ein bekannter Punkt?
    const berlin = map.project([13.38, 52.52]);
    console.log('Berlin projected:', berlin);
    
    // Wo ist der map div im Fenster?
    const rect = mapEl.getBoundingClientRect();
    console.log('map div rect:', rect);
    
    // Wo ist der MapLibre Canvas im Fenster?
    const canvasRect = mapCanvas.getBoundingClientRect();
    console.log('mapCanvas rect:', canvasRect);
}, 1000);
}

// Parst eine Semikolon-CSV in ein einfaches Objekt mit columns und getRow/getString
function parseSemicolonCSV(lines) {
    // BOM entfernen falls vorhanden
    if (lines[0].charCodeAt(0) === 0xFEFF) {
        lines[0] = lines[0].slice(1);
    }
    const columns = lines[0].split(';');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        const vals = lines[i].split(';');
        const row = {};
        columns.forEach((col, j) => { row[col.trim()] = (vals[j] || '').trim(); });
        rows.push(row);
    }
    return {
        columns,
        getRowCount: () => rows.length,
        getString: (i, col) => rows[i][col] || ''
    };
}