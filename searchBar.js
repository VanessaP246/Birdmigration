// Search Bar mit Vogelnamen und Orts-Suche
// Sucht nach Vogelnamen oder geographischen Orten/Ländern

let searchBarData = {
  birds: [], // Array von { species, count }
  locations: [] // Array von { country, coordinates: [lon, lat], count }
};

let allRoutesForSearch = []; // Speichert alle Routen für die Suche
let searchMarker = null; // Globaler Marker für den gesuchten Ort
const SEARCH_MARKER_COLOR = '#8A4CA9'; // Farbe für Such-Marker

// Wird aufgerufen wenn CSV geladen ist (von sketch.js über onCSVParsed)
function onSearchBarDataReady(csvTable) {
  // Vogeldaten sammeln
  const birdMap = {};
  const locationMap = {};

  for (let i = 0; i < csvTable.getRowCount(); i++) {
    const species = csvTable.getString(i, 'English Name').trim();
    const country = csvTable.getString(i, 'Countries').trim();
    const lon = parseFloat(csvTable.getString(i, 'GPS_xx').replace(',', '.'));
    const lat = parseFloat(csvTable.getString(i, 'GPS_yy').replace(',', '.'));

    // Vögel sammeln
    if (species) {
      birdMap[species] = (birdMap[species] || 0) + 1;
    }

    // Länder/Orte sammeln
    if (country && !isNaN(lon) && !isNaN(lat)) {
      if (!locationMap[country]) {
        locationMap[country] = { country, lon, lat, count: 0 };
      }
      locationMap[country].count++;
    }
  }

  // In Arrays umwandeln
  searchBarData.birds = Object.entries(birdMap)
    .map(([species, count]) => ({ species, count }))
    .sort((a, b) => a.species.localeCompare(b.species));

  searchBarData.locations = Object.values(locationMap)
    .sort((a, b) => a.country.localeCompare(b.country));

  initSearchBar();
}

function initSearchBar() {
  const container = document.getElementById('searchBar');
  if (!container) return;

  container.innerHTML = `
    <div class="searchBar-container">
      <div class="searchBar-inputWrapper">
        <input 
          type="text" 
          id="searchBar-input" 
          class="searchBar-input" 
          placeholder="Search birds or locations..."
          autocomplete="off"
        />
        <button id="searchBar-clearBtn" class="searchBar-clearBtn" title="Clear">✕</button>
      </div>
      <div id="searchBar-suggestions" class="searchBar-suggestions"></div>
    </div>
  `;

  const input = document.getElementById('searchBar-input');
  const suggestionsDiv = document.getElementById('searchBar-suggestions');
  const clearBtn = document.getElementById('searchBar-clearBtn');

  // Event: Input mit Debounce
  let searchTimeout;
  input.addEventListener('input', async (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim().toLowerCase();

    if (query.length === 0) {
      suggestionsDiv.innerHTML = '';
      clearBtn.style.display = 'none';
      return;
    }

    clearBtn.style.display = 'block';

    searchTimeout = setTimeout(async () => {
      const results = await performSearch(query);
      displaySuggestions(results, suggestionsDiv, input);
    }, 150);
  });

  // Clear-Button
  clearBtn.addEventListener('click', () => {
    input.value = '';
    suggestionsDiv.innerHTML = '';
    clearBtn.style.display = 'none';
    activeFilters = [];
    selectedRoute = null;
    removeSearchMarker();
    if (typeof buildLayers === 'function') buildLayers();
    if (typeof applySelectionStyle === 'function') applySelectionStyle();
  });

  // Bei Click außerhalb: Suggestions schließen
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      suggestionsDiv.innerHTML = '';
    }
  });

  // Enter-Taste: Erste Suggestion auswählen
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstSuggestion = suggestionsDiv.querySelector('.suggestion-item');
      if (firstSuggestion) {
        firstSuggestion.click();
      }
    }
  });
}

async function performSearch(query) {
  const results = {
    birds: [],
    locations: []
  };

  // Vögel durchsuchen
  results.birds = searchBarData.birds
    .filter(b => b.species.toLowerCase().includes(query))
    .slice(0, 8); // Max 8 Ergebnisse

  // Orte durchsuchen - zuerst lokale Daten aus CSV
  results.locations = searchBarData.locations
    .filter(l => l.country.toLowerCase().includes(query))
    .slice(0, 4);

  // Zusätzlich: OpenStreetMap Nominatim API für weitere geografische Orte
  try {
    const geoResults = await searchOpenStreetMap(query);
    results.geolocations = geoResults;
  } catch (e) {
    console.error('Geocoding error:', e);
    results.geolocations = [];
  }

  return results;
}

// OpenStreetMap Nominatim API durchsuchen
async function searchOpenStreetMap(query) {
  if (query.length < 2) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8`,
      {
        headers: {
          'User-Agent': 'BirdMigrationApp'
        }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    
    // OSM-Ergebnisse filtern und formatieren
    return data.map(item => ({
      name: item.name || item.display_name,
      type: getOSMType(item),
      category: item.class || 'place',
      lon: parseFloat(item.lon),
      lat: parseFloat(item.lat),
      boundingbox: item.boundingbox, // [minlat, maxlat, minlon, maxlon]
      displayName: item.display_name
    })).filter(item => !isNaN(item.lon) && !isNaN(item.lat));
  } catch (e) {
    console.error('OSM API error:', e);
    return [];
  }
}

function getOSMType(osmItem) {
  const typeMap = {
    'place': {
      'country': 'Country',
      'state': 'State',
      'city': 'City',
      'town': 'Town',
      'village': 'Village',
      'suburb': 'Suburb',
      'neighbourhood': 'Neighbourhood',
      'hamlet': 'Hamlet'
    },
    'natural': {
      'water': 'Water',
      'glacier': 'Glacier',
      'wood': 'Forest',
      'mountain': 'Mountain',
      'cave': 'Cave'
    },
    'waterway': 'Waterway',
    'highway': 'Road/Street',
    'railway': 'Railway',
    'aeroway': 'Airport',
    'tourism': 'POI',
    'amenity': 'Amenity',
    'building': 'Building'
  };

  const category = osmItem.class || '';
  const type = osmItem.type || '';

  if (typeMap[category]) {
    if (typeof typeMap[category] === 'object') {
      return typeMap[category][type] || type || category;
    }
    return typeMap[category];
  }

  return category;
}

// Icon für Orts-Kategorie
function getLocationIcon(category, type) {
  const iconMap = {
    'country': '🌍',
    'state': '🗺️',
    'city': '🏙️',
    'town': '🏘️',
    'village': '🏞️',
    'suburb': '🏘️',
    'neighbourhood': '🏘️',
    'hamlet': '🏘️',
    'water': '💧',
    'glacier': '❄️',
    'wood': '🌲',
    'mountain': '⛰️',
    'cave': '🔦',
    'waterway': '🌊',
    'road': '🛣️',
    'street': '🛣️',
    'railway': '🚂',
    'airport': '✈️',
    'poi': '📌',
    'amenity': '🏢',
    'building': '🏠'
  };

  // Zuerst nach spezifischem Typ suchen (für place-Kategorien)
  if (iconMap[type]) return iconMap[type];
  
  // Dann nach Kategorie suchen
  if (iconMap[category]) return iconMap[category];

  // Fallback
  return '📍';
}

function displaySuggestions(results, container, input) {
  let html = '';

  // Vogel-Ergebnisse
  if (results.birds.length > 0) {
    html += '<div class="searchBar-group"><div class="searchBar-groupLabel">Birds</div>';
    results.birds.forEach(bird => {
      html += `
        <div class="searchBar-suggestionItem searchBar-bird" data-type="bird" data-value="${escapeHtml(bird.species)}">
          <div class="searchBar-suggestionIcon">🐦</div>
          <div class="searchBar-suggestionText">
            <div class="searchBar-suggestionTitle">${escapeHtml(bird.species)}</div>
            <div class="searchBar-suggestionMeta">${bird.count} data points</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  // CSV-Länder-Ergebnisse
  if (results.locations.length > 0) {
    html += '<div class="searchBar-group"><div class="searchBar-groupLabel">Countries</div>';
    results.locations.forEach(loc => {
      html += `
        <div class="searchBar-suggestionItem searchBar-location" data-type="location" data-value="${escapeHtml(loc.country)}" data-lon="${loc.lon}" data-lat="${loc.lat}">
          <div class="searchBar-suggestionIcon">🗺️</div>
          <div class="searchBar-suggestionText">
            <div class="searchBar-suggestionTitle">${escapeHtml(loc.country)}</div>
            <div class="searchBar-suggestionMeta">${loc.count} data points</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  // OpenStreetMap Geocoding-Ergebnisse
  if (results.geolocations && results.geolocations.length > 0) {
    html += '<div class="searchBar-group"><div class="searchBar-groupLabel">Places</div>';
    results.geolocations.forEach(geo => {
      const icon = getLocationIcon(geo.category, geo.type);
      const displayText = geo.name || geo.displayName;
      const boundingboxJSON = geo.boundingbox ? JSON.stringify(geo.boundingbox) : '';
      html += `
        <div class="searchBar-suggestionItem searchBar-geolocation" data-type="geolocation" data-value="${escapeHtml(displayText)}" data-lon="${geo.lon}" data-lat="${geo.lat}" data-name="${escapeHtml(geo.name)}" data-type-osm="${escapeHtml(geo.type)}" data-boundingbox='${boundingboxJSON}'>
          <div class="searchBar-suggestionIcon">${icon}</div>
          <div class="searchBar-suggestionText">
            <div class="searchBar-suggestionTitle">${escapeHtml(geo.name)}</div>
            <div class="searchBar-suggestionMeta">${escapeHtml(geo.type)}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  if (html === '') {
    container.innerHTML = '<div class="searchBar-noResults">No results found</div>';
  } else {
    container.innerHTML = html;

    // Event-Listener auf alle Suggestions
    document.querySelectorAll('.searchBar-suggestionItem').forEach(item => {
      item.addEventListener('click', (e) => {
        onSuggestionSelected(item, input, container);
      });
      item.addEventListener('mouseover', () => {
        document.querySelectorAll('.searchBar-suggestionItem').forEach(s => s.classList.remove('active'));
        item.classList.add('active');
      });
    });

    // Mit Pfeiltasten navigieren
    input.addEventListener('keydown', (e) => {
      const items = Array.from(container.querySelectorAll('.searchBar-suggestionItem'));
      const activeItem = container.querySelector('.searchBar-suggestionItem.active');
      let currentIndex = activeItem ? items.indexOf(activeItem) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        if (items[currentIndex]) {
          document.querySelectorAll('.searchBar-suggestionItem').forEach(s => s.classList.remove('active'));
          items[currentIndex].classList.add('active');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        if (items[currentIndex]) {
          document.querySelectorAll('.searchBar-suggestionItem').forEach(s => s.classList.remove('active'));
          items[currentIndex].classList.add('active');
        }
      }
    });
  }
}

function onSuggestionSelected(item, input, container) {
  const type = item.dataset.type;
  const value = item.dataset.value;

  input.value = value;
  container.innerHTML = '';

  if (type === 'bird') {
    // Vogel-Filter setzen
    activeFilters = [{ type: 'species', name: value }];
    selectedRoute = null;
    // Marker entfernen wenn Vogel ausgewählt wird
    removeSearchMarker();
  } else if (type === 'location' || type === 'geolocation') {
    // Auf den Ort zoomen
    const lon = parseFloat(item.dataset.lon);
    const lat = parseFloat(item.dataset.lat);
    const osmType = item.dataset.typeOsm || '';
    const name = item.dataset.name || value;

    if (typeof map !== 'undefined' && map) {
      // Marker setzen
      addSearchMarker(lon, lat, name);

      // Bounds basierend auf OSM-Bounding-Box (wenn vorhanden) oder Standardzoom
      const boundingbox = item.dataset.boundingbox;
      
      if (boundingbox && boundingbox.length >= 4) {
        // Bounding Box verwenden: [minlat, maxlat, minlon, maxlon]
        const bounds = JSON.parse(boundingbox);
        map.fitBounds(
          [
            [parseFloat(bounds[2]), parseFloat(bounds[0])], // Southwest
            [parseFloat(bounds[3]), parseFloat(bounds[1])]   // Northeast
          ],
          {
            padding: 50,
            duration: 1500,
            maxZoom: 15
          }
        );
      } else {
        // Fallback: flyTo mit angepasstem Zoom-Level
        let zoom = 6;
        if (osmType.includes('Country')) zoom = 4;
        else if (osmType.includes('City') || osmType.includes('Town')) zoom = 10;
        else if (osmType.includes('Street') || osmType.includes('Road')) zoom = 14;
        else if (osmType.includes('Mountain') || osmType.includes('Water') || osmType.includes('Waterway')) zoom = 9;
        else if (osmType.includes('Village') || osmType.includes('Hamlet')) zoom = 12;

        map.flyTo({
          center: [lon, lat],
          zoom: zoom,
          duration: 1500
        });
      }
    }

    // Keine Filter setzen, nur zoomen
    activeFilters = [];
  }

  // Karte aktualisieren
  if (typeof buildLayers === 'function') buildLayers();
  if (typeof applySelectionStyle === 'function') applySelectionStyle();
}

// Marker für gesuchten Ort hinzufügen
function addSearchMarker(lon, lat, name) {
  // Alten Marker entfernen wenn vorhanden
  removeSearchMarker();

  // Neuen Marker erstellen mit HTML-Element
  const el = document.createElement('div');
  el.className = 'search-marker';
  el.style.width = '30px';
  el.style.height = '30px';
  el.style.backgroundColor = SEARCH_MARKER_COLOR;
  el.style.borderRadius = '50%';
  el.style.border = '3px solid #fff';
  el.style.boxShadow = `0 0 12px ${SEARCH_MARKER_COLOR}80, 0 0 6px ${SEARCH_MARKER_COLOR}`;
  el.style.cursor = 'pointer';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.fontSize = '16px';
  el.title = name;

  if (typeof map !== 'undefined' && map) {
    searchMarker = new maplibregl.Marker({ element: el })
      .setLngLat([lon, lat])
      .addTo(map);

    // Popup beim Klick
    el.addEventListener('click', () => {
      new maplibregl.Popup({ offset: 25 })
        .setHTML(`<strong>${escapeHtml(name)}</strong>`)
        .setLngLat([lon, lat])
        .addTo(map);
    });
  }
}

// Marker entfernen
function removeSearchMarker() {
  if (searchMarker) {
    searchMarker.remove();
    searchMarker = null;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
