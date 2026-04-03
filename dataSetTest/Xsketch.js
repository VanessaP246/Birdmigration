let csvRohtext;
let backgroundImage;
let migratorischeRouten = [];  // Array um alle Routen zu speichern
let csvZeilen;
let csvHeader;

// Globale Variable für Checkbox-Status
let checkboxZwischenstopps;
let zeigeZwischenstopps = true;  // Standard: Zwischenstopps anzeigen

// Globale Variablen für Jahresfilter
let sliderMinJahr;
let sliderMaxJahr;
let minJahrBereich = 1970;  // Minimum Jahresbereich
let maxJahrBereich = 2024;  // Maximum Jahresbereich
let minJahrSelected = 1970;
let maxJahrSelected = 2024;

function preload(){
    // CSV-Datei als Text laden um manuell zu parsen
    csvRohtext = loadStrings('../data/Bird migration dataset.csv');
    backgroundImage = loadImage('../data/mapaMundi1800x600.png');
}


function setup() {
    createCanvas(1600, 800);

    // Erstelle Checkbox für Zwischenstopps
    checkboxZwischenstopps = createCheckbox('Transit Points anzeigen', true);
    checkboxZwischenstopps.position(20, 20);
    checkboxZwischenstopps.style('font-size', '14px');
    checkboxZwischenstopps.changed(aktualisiereZwischenstoppsAnzeige);

    // Überprüfe ob CSV-Daten geladen wurden
    if (!csvRohtext || csvRohtext.length === 0) {
        console.error("CSV-Datei konnte nicht geladen werden");
        return;
    }
    
    // Parse CSV manuell (Semikolon als Trennzeichen)
    csvHeader = csvRohtext[0].split(';');
    console.log("CSV Header geladen: " + csvHeader.length + " Spalten");
    
    // Finde die Spaltenindizes
    let indexRoutenCode = csvHeader.indexOf('Migratory route codes');
    let indexMigrationsTyp = csvHeader.indexOf('Migration nodes');
    let indexVogelart = csvHeader.indexOf('English Name');
    let indexGpsX = csvHeader.indexOf('GPS_xx');
    let indexGpsY = csvHeader.indexOf('GPS_yy');
    let indexStartJahr = csvHeader.indexOf('Migration start year');
    
    console.log("Spalten gefunden - Route:" + indexRoutenCode + " Typ:" + indexMigrationsTyp + " Vogel:" + indexVogelart + " GPS_X:" + indexGpsX + " GPS_Y:" + indexGpsY + " StartYear:" + indexStartJahr);
    
    // Sammle alle vorhandenen Jahre aus der CSV
    let allJahre = new Set();
    for (let r = 1; r < csvRohtext.length; r++) {
        try {
            let zeile = csvRohtext[r].split(';');
            let startJahr = int(zeile[indexStartJahr]);
            if (!isNaN(startJahr)) {
                allJahre.add(startJahr);
            }
        } catch(error) {}
    }
    
    // Ermittle Min und Max Jahr
    if (allJahre.size > 0) {
        let jahreSortiert = Array.from(allJahre).sort((a, b) => a - b);
        minJahrBereich = jahreSortiert[0];
        maxJahrBereich = jahreSortiert[jahreSortiert.length - 1];
        minJahrSelected = minJahrBereich;
        maxJahrSelected = maxJahrBereich;
    }
    
    console.log("Jahresbereich in Daten: " + minJahrBereich + " - " + maxJahrBereich);
    
    // Erstelle Slider für Jahresbereich
    createP("Jahresbereich Filter:").position(20, 50).style('font-weight', 'bold');
    
    createP("Min. Jahr: " + minJahrSelected).position(20, 70).id("minYearDisplay");
    sliderMinJahr = createSlider(minJahrBereich, maxJahrBereich, minJahrSelected, 1);
    sliderMinJahr.position(20, 90);
    sliderMinJahr.style('width', '300px');
    sliderMinJahr.changed(aktualisiereJahresfilter);
    
    createP("Max. Jahr: " + maxJahrSelected).position(20, 130).id("maxYearDisplay");
    sliderMaxJahr = createSlider(minJahrBereich, maxJahrBereich, maxJahrSelected, 1);
    sliderMaxJahr.position(20, 150);
    sliderMaxJahr.style('width', '300px');
    sliderMaxJahr.changed(aktualisiereJahresfilter);
    
    // Objekt um Daten nach Flugrouten-Code zu organisieren
    let routenNachCode = {};
    
    // Iteriere durch alle Datenzeilen (ab Zeile 1, da Zeile 0 ist Header)
    for (let r = 1; r < csvRohtext.length; r++) {
        try {
            // Spalte nach Semikolon teilen
            let zeile = csvRohtext[r].split(';');
            
            // Extrahiere Werte
            let routenCode = zeile[indexRoutenCode];
            let migrationsKnotenTyp = zeile[indexMigrationsTyp];
            let vogelSpecies = zeile[indexVogelart];
            let gpsXString = zeile[indexGpsX];
            let gpsYString = zeile[indexGpsY];
            let startJahr = int(zeile[indexStartJahr]);
            
            // Skip if empty
            if (!routenCode || !gpsXString || !gpsYString) {
                continue;
            }
            
            // Komma durch Punkt ersetzen (deutsches CSV-Format)
            let vogelLongitude = float(gpsXString.replace(',', '.'));
            let vogelLatitude = float(gpsYString.replace(',', '.'));
            
            // Skip invalid entries
            if (isNaN(vogelLongitude) || isNaN(vogelLatitude)) {
                continue;
            }
            
            // Koordinaten auf Canvas abbilden (Mercator-Projektion)
            let canvasX = map(vogelLongitude, -180, 180, 0, width);
            let canvasY = map(vogelLatitude, 90, -90, 0, height);
            
            // Gruppiere Punkte nach Flugrouten-Code
            if (!routenNachCode[routenCode]) {
                routenNachCode[routenCode] = {
                    vogelArt: vogelSpecies,
                    startJahr: startJahr,
                    punkte: []
                };
            }
            
            // Füge Wegpunkt mit allen Informationen hinzu
            routenNachCode[routenCode].punkte.push({
                type: migrationsKnotenTyp,
                x: canvasX,
                y: canvasY,
                longitude: vogelLongitude,
                latitude: vogelLatitude
            });
            
        } catch(error) {
            // Stille Fehlerbehandlung für fehlerhafte Zeilen
        }
    }
    
    // Konvertiere Objekt zu Array von MigrationRoute-Objekten
    for (let code in routenNachCode) {
        let neueRoute = new MigrationRoute(
            routenNachCode[code].vogelArt,
            routenNachCode[code].punkte,
            code,
            routenNachCode[code].startJahr
        );
        migratorischeRouten.push(neueRoute);
    }
    
    console.log("Anzahl Flugrouten geladen: " + migratorischeRouten.length);
}

function draw() {
    image(backgroundImage, 0, 0);
    
    // Aktualisiere den Status der Zwischenstopps von der Checkbox
    zeigeZwischenstopps = checkboxZwischenstopps.checked();
    
    // Lese aktuelle Jahresfilter von den Slidern
    minJahrSelected = int(sliderMinJahr.value());
    maxJahrSelected = int(sliderMaxJahr.value());
    
    // Stelle sicher dass Min <= Max ist
    if (minJahrSelected > maxJahrSelected) {
        let temp = minJahrSelected;
        minJahrSelected = maxJahrSelected;
        maxJahrSelected = temp;
        sliderMinJahr.value(minJahrSelected);
        sliderMaxJahr.value(maxJahrSelected);
    }
    
    // Zeichne alle Vogelflugrouten
    for (let i = 0; i < migratorischeRouten.length; i++) {
        let route = migratorischeRouten[i];
        
        // Prüfe ob Route im Jahresbereich liegt
        if (route.startJahr >= minJahrSelected && route.startJahr <= maxJahrSelected) {
            route.anzeigeRoute(zeigeZwischenstopps);
        }
    }
    
    // Aktualisiere Display der gewählten Jahre
    document.getElementById("minYearDisplay").textContent = "Min. Jahr: " + minJahrSelected;
    document.getElementById("maxYearDisplay").textContent = "Max. Jahr: " + maxJahrSelected;
}

/**
 * Callback-Funktion die aufgerufen wird wenn die Checkbox geändert wird
 */
function aktualisiereZwischenstoppsAnzeige() {
    zeigeZwischenstopps = checkboxZwischenstopps.checked();
    console.log("Zwischenstopps: " + (zeigeZwischenstopps ? "AKTIVIERT" : "DEAKTIVIERT"));
}

/**
 * Callback-Funktion die aufgerufen wird wenn ein Jahres-Slider geändert wird
 */
function aktualisiereJahresfilter() {
    minJahrSelected = int(sliderMinJahr.value());
    maxJahrSelected = int(sliderMaxJahr.value());
    
    // Stelle sicher dass Min <= Max ist
    if (minJahrSelected > maxJahrSelected) {
        let temp = minJahrSelected;
        minJahrSelected = maxJahrSelected;
        maxJahrSelected = temp;
        sliderMinJahr.value(minJahrSelected);
        sliderMaxJahr.value(maxJahrSelected);
    }
    
    console.log("Jahresfilter aktualisiert: " + minJahrSelected + " - " + maxJahrSelected);
}