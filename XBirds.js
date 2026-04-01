class MigrationRoute {
    // Klasse zur Darstellung einer kompletten Vogelflugroute
    constructor(vogelArt, routePunkte, routenCode) {
        this.vogelArt = vogelArt;
        this.routePunkte = routePunkte;  // Array mit allen Waypoints
        this.routenCode = routenCode;
        
        // Farben für verschiedene Knotentypen
        this.farbenKnotentyp = {
            'Origin': color(0, 200, 0, 200),          // Grün für Startpunkt
            'Transit locations': color(255, 150, 0, 150), // Orange für Zwischenpunkte
            'Destination': color(200, 0, 0, 200)     // Rot für Endpunkt
        };
        
        this.linienFarbe = color(100, 150, 255, 100);  // Blau für Routenlinien
        this.punktGroesse = 8;
        this.isHoveredRoute = false;
    }

    /**
     * Zeichnet die komplette Flugroute bestehend aus:
     * - Linie die alle Punkte verbindet
     * - Punkte für Origin, Intermediate waypoints und Destination
     * - Tooltip bei Hover
     */
    anzeigeRoute() {
        // Prüfe ob Maus über Route hover
        this.aktualisierHoverStatus();
        
        // Zeichne die Verbindungslinie zwischen allen Punkten
        this.zeichneVerbindungslinie();
        
        // Zeichne alle Waypoints (Origin, Transit, Destination)
        this.zeichneAllePunkte();
        
        // Zeige Info bei Hover über Route
        if (this.isHoveredRoute) {
            this.zeigeRoutenbeschreibung();
        }
    }

    /**
     * Prüft ob die Maus über einen der Route-Punkte hovert
     */
    aktualisierHoverStatus() {
        this.isHoveredRoute = false;
        
        for (let punkt of this.routePunkte) {
            let distanzZurMaus = dist(mouseX, mouseY, punkt.x, punkt.y);
            if (distanzZurMaus < this.punktGroesse) {
                this.isHoveredRoute = true;
                break;
            }
        }
    }

    /**
     * Zeichnet eine Linie die alle Wegpunkte der Route verbindet
     */
    zeichneVerbindungslinie() {
        stroke(this.linienFarbe);
        strokeWeight(1);
        
        // Verbinde alle Punkte in Reihenfolge
        for (let i = 0; i < this.routePunkte.length - 1; i++) {
            let punkt1 = this.routePunkte[i];
            let punkt2 = this.routePunkte[i + 1];
            
            line(punkt1.x, punkt1.y, punkt2.x, punkt2.y);
        }
    }

    /**
     * Zeichnet alle Punkte der Route mit unterschiedlichen Farben
     * je nach Knotentyp (Origin, Transit, Destination)
     */
    zeichneAllePunkte() {
        noStroke();
        
        for (let punkt of this.routePunkte) {
            // Wähle Farbe basierend auf Knotentyp
            let farbeFürPunkt = this.farbenKnotentyp[punkt.type] || color(100, 100, 100);
            fill(farbeFürPunkt);
            
            ellipse(punkt.x, punkt.y, this.punktGroesse, this.punktGroesse);
        }
    }

    /**
     * Zeigt Informationen über die Route wenn Maus über einem Punkt ist
     */
    zeigeRoutenbeschreibung() {
        fill(200);
        textSize(12);
        textAlign(LEFT);
        
        // Finde den Punkt über dem die Maus ist
        for (let i = 0; i < this.routePunkte.length; i++) {
            let punkt = this.routePunkte[i];
            let distanzZurMaus = dist(mouseX, mouseY, punkt.x, punkt.y);
            
            if (distanzZurMaus < this.punktGroesse) {
                // Zeige Punkt-Informationen
                let zeilenAbstand = 15;
                let textX = mouseX + 15;
                let textY = mouseY;
                
                text("Vogelart: " + this.vogelArt, textX, textY);
                text("Routencode: " + this.routenCode, textX, textY + zeilenAbstand);
                text("Punkt: " + punkt.type, textX, textY + zeilenAbstand * 2);
                text("Lon: " + punkt.longitude.toFixed(2), textX, textY + zeilenAbstand * 3);
                text("Lat: " + punkt.latitude.toFixed(2), textX, textY + zeilenAbstand * 4);
                
                break;
            }
        }
    }

}  // end of class MigrationRoute