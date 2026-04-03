/**
 * Klasse MigrationRoute
 * Repräsentiert eine komplette Vogelflugroute mit allen Wegpunkten
 * Zeichnet Origin & Destination als farbige Punkte
 * Verbindet alle Routen-Punkte mit einer Linie
 */
class MigrationRoute {
    
    /**
     * Constructor für eine Flugroute
     * @param {string} vogelArt - Name der Vogelart (z.B. "Osprey")
     * @param {array} routePunkte - Array mit allen Wegpunkten der Route
     * @param {string} routenCode - Eindeutige ID der Flugroute
     * @param {number} startJahr - Jahreszahl wann die Migration gestartet wurde
     */
    constructor(vogelArt, routePunkte, routenCode, startJahr = 0) {
        this.vogelArt = vogelArt;
        this.routePunkte = routePunkte;  // Array mit allen Waypoints [Origin, Transit..., Destination]
        this.routenCode = routenCode;
        this.startJahr = startJahr;  // Jahr des Migrations-Starts
        
        // Farben für verschiedene Knotentypen
        this.farbenKnotentyp = {
            'Origin': color(0, 200, 0, 200),          // Grün für Startpunkt
            'Transit locations': color(255, 150, 0, 150), // Orange für Zwischenpunkte
            'Destination': color(200, 0, 0, 200)     // Rot für Endpunkt
        };
        
        this.linienFarbe = color(100, 150, 255, 80);  // Blau für Routenlinien
        this.punktGroesse = 6;
        this.isHoveredRoute = false;
    }

    /**
     * Hauptmethode zum Zeichnen der kompletten Flugroute
     * Besteht aus: Verbindungslinie + Punkte + optionaler Tooltip
     * @param {boolean} zeigeZwischenstopps - Wenn true: zeige Zwischenstopps, wenn false: nur Origin/Destination
     */
    anzeigeRoute(zeigeZwischenstopps = true) {
        // Prüfe ob Maus über Route hovert
        this.aktualisierHoverStatus(zeigeZwischenstopps);
        
        // Zeichne die Verbindungslinie zwischen allen Punkten
        this.zeichneVerbindungslinie();
        
        // Zeichne alle Waypoints (Origin, Transit, Destination)
        this.zeichneAllePunkte(zeigeZwischenstopps);
        
        // Zeige Info-Tooltip bei Hover über Route
        if (this.isHoveredRoute) {
            this.zeigeRoutenbeschreibung();
        }
    }

    /**
     * Aktualisiert den Hover-Status
     * Prüft ob die Maus über einen der Route-Punkte ist
     * @param {boolean} zeigeZwischenstopps - Wenn false, ignoriere Zwischenstopps bei Hover
     */
    aktualisierHoverStatus(zeigeZwischenstopps = true) {
        this.isHoveredRoute = false;
        
        for (let punkt of this.routePunkte) {
            let distanzZurMaus = dist(mouseX, mouseY, punkt.x, punkt.y);
            
            // Wenn Zwischenstopps deaktiviert, ignoriere "Transit locations"
            if (!zeigeZwischenstopps && punkt.type === 'Transit locations') {
                continue;
            }
            
            if (distanzZurMaus < this.punktGroesse + 5) {  // +5 für größerer Hover-Bereich
                this.isHoveredRoute = true;
                break;
            }
        }
    }

    /**
     * Zeichnet eine Linie die alle Wegpunkte der Route verbindet
     * Die Linie zeigt den gesamten Flugrouten-Verlauf
     */
    zeichneVerbindungslinie() {
        stroke(this.linienFarbe);
        strokeWeight(1);
        noFill();
        
        // Verbinde alle Punkte in Reihenfolge
        for (let i = 0; i < this.routePunkte.length - 1; i++) {
            let punkt1 = this.routePunkte[i];
            let punkt2 = this.routePunkte[i + 1];
            
            line(punkt1.x, punkt1.y, punkt2.x, punkt2.y);
        }
    }

    /**
     * Zeichnet alle Punkte der Route mit unterschiedlichen Farben
     * Grün = Origin (Startpunkt)
     * Orange = Transit locations (Zwischenpunkte)
     * Rot = Destination (Endpunkt)
     * @param {boolean} zeigeZwischenstopps - Wenn false, zeige nur Origin und Destination
     */
    zeichneAllePunkte(zeigeZwischenstopps = true) {
        noStroke();
        
        for (let punkt of this.routePunkte) {
            // Wenn Zwischenstopps deaktiviert, überspringe Transit locations
            if (!zeigeZwischenstopps && punkt.type === 'Transit locations') {
                continue;
            }
            
            // Wähle Farbe basierend auf Knotentyp
            let farbeFürPunkt = this.farbenKnotentyp[punkt.type] || color(100, 100, 100);
            fill(farbeFürPunkt);
            
            // Zeichne Punkt als Kreis
            ellipse(punkt.x, punkt.y, this.punktGroesse, this.punktGroesse);
        }
    }

    /**
     * Zeigt Informationen über die Route wenn Maus über einem Punkt ist
     * Tooltip mit: Vogelart, Routencode, Knotentyp, Koordinaten, Jahr
     */
    zeigeRoutenbeschreibung() {
        // Finde den Punkt über dem die Maus ist
        for (let i = 0; i < this.routePunkte.length; i++) {
            let punkt = this.routePunkte[i];
            let distanzZurMaus = dist(mouseX, mouseY, punkt.x, punkt.y);
            
            if (distanzZurMaus < this.punktGroesse + 5) {
                // Zeichne Hintergrund für Tooltip
                fill(30, 30, 30, 220);
                stroke(150, 150, 150);
                strokeWeight(1);
                
                let textX = mouseX + 15;
                let textY = mouseY - 75;
                
                // Tooltip-Box Dimensionen
                let tooltipBreite = 200;
                let tooltipHoehe = 115;
                
                rect(textX, textY, tooltipBreite, tooltipHoehe, 5);
                
                // Schreibe Text
                fill(200, 200, 200);
                textSize(11);
                textAlign(LEFT);
                
                let zeilenAbstand = 15;
                let textStartX = textX + 8;
                let textStartY = textY + 15;
                
                text("🐦 " + this.vogelArt, textStartX, textStartY);
                text("Route: #" + this.routenCode, textStartX, textStartY + zeilenAbstand);
                text("Jahr: " + this.startJahr, textStartX, textStartY + zeilenAbstand * 2);
                text("Typ: " + punkt.type, textStartX, textStartY + zeilenAbstand * 3);
                text("Lon: " + punkt.longitude.toFixed(2) + "°", textStartX, textStartY + zeilenAbstand * 4);
                text("Lat: " + punkt.latitude.toFixed(2) + "°", textStartX, textStartY + zeilenAbstand * 5);
                
                break;
            }
        }
    }

}  // end of class MigrationRoute
