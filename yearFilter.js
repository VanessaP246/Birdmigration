// Jahres-Filter als interaktiver Zeitstrahl im year-filter Block.

// Datensatz-Grenzen
const YEAR_MIN = 1979; // ältestes Jahr im Datensatz
const YEAR_MAX = 2023; // neuestes Jahr im Datensatz

// Zustand
let yearFrom   = YEAR_MIN; // linker Zeiger
let yearTo     = YEAR_MAX; // rechter Zeiger (nur im Zeitspannen-Modus aktiv)
let rangeMode  = false;    // false = Einzeljahr, true = Zeitspanne

// Farben
const TRACK_BG    = '#2E4A42'; // Hintergrund der Schiene
const TRACK_FILL  = '#A0C3B9'; // Füllung zwischen den Zeigern
const THUMB_COLOR = '#fff';    // Farbe der Zeiger-Kreise
const TEXT_COLOR  = '#fff';    // Schriftfarbe

// Hauptfunktion
function initYearFilter() {
  const container = document.querySelector('.year-filter');
  if (!container) return;

  container.innerHTML = ''; // zurücksetzen bei Resize
  container.style.position = 'relative';
  container.style.display  = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'center';
  container.style.padding  = '0 20px';
  container.style.boxSizing = 'border-box';

  // Checkbox-Zeile oben
  const checkRow = document.createElement('div');
  checkRow.style.cssText = `
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 10px; font-size: 0.72rem; color: ${TEXT_COLOR};
  `;

  const checkbox = document.createElement('input');
  checkbox.type    = 'checkbox';
  checkbox.id      = 'year-range-toggle';
  checkbox.checked = rangeMode;
  checkbox.style.cssText = 'accent-color: #3A5D53; cursor: pointer; width:14px; height:14px;';

  const label = document.createElement('label');
  label.htmlFor   = 'year-range-toggle';
  label.textContent = 'Zeitspanne wählen';
  label.style.cursor = 'pointer';

  checkRow.appendChild(checkbox);
  checkRow.appendChild(label);
  container.appendChild(checkRow);

  // Slider-Bereich
  const sliderWrap = document.createElement('div');
  sliderWrap.style.cssText = 'position: relative; width: 100%; height: 36px;';
  container.appendChild(sliderWrap);

  // Schiene (Hintergrund)
  const track = document.createElement('div');
  track.style.cssText = `
    position: absolute; top: 50%; left: 0; right: 0;
    height: 6px; transform: translateY(-50%);
    background: ${TRACK_BG}; border-radius: 3px;
  `;
  sliderWrap.appendChild(track);

  // Füllung zwischen den Zeigern
  const fill = document.createElement('div');
  fill.style.cssText = `
    position: absolute; top: 50%; height: 6px;
    transform: translateY(-50%);
    background: ${TRACK_FILL}; border-radius: 3px;
    pointer-events: none;
  `;
  sliderWrap.appendChild(fill);

  // Zeiger-Kreise
  const thumbFrom = createThumb();
  const thumbTo   = createThumb();
  sliderWrap.appendChild(thumbFrom);
  sliderWrap.appendChild(thumbTo);

  // Beschriftungen
  const labelRow = document.createElement('div');
  labelRow.style.cssText = `
    position: relative; width: 100%;
    margin-top: 6px; height: 18px; font-size: 0.7rem; color: ${TEXT_COLOR};
  `;
  container.appendChild(labelRow);

  // Linkes Extrem-Jahr
  const labelMin = document.createElement('span');
  labelMin.textContent = YEAR_MIN;
  labelMin.style.cssText = 'position: absolute; left: 0;';
  labelRow.appendChild(labelMin);

  // Rechtes Extrem-Jahr
  const labelMax = document.createElement('span');
  labelMax.textContent = YEAR_MAX;
  labelMax.style.cssText = 'position: absolute; right: 0;';
  labelRow.appendChild(labelMax);

  // Schwebendes Jahr unter dem linken Zeiger
  const bubbleFrom = createBubble();
  labelRow.appendChild(bubbleFrom);

  // Schwebendes Jahr unter dem rechten Zeiger (nur im Zeitspannen-Modus)
  const bubbleTo = createBubble();
  labelRow.appendChild(bubbleTo);

  // Zeichnen & Events
function render() {
  const w = sliderWrap.offsetWidth;
  const fromPct = (yearFrom - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
  const toPct   = (yearTo   - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);

  setThumb(thumbFrom, fromPct);
  setThumb(thumbTo,   toPct);

  if (rangeMode) {
    fill.style.left  = (fromPct * 100) + '%';
    fill.style.width = ((toPct - fromPct) * 100) + '%';
  } else {
    fill.style.left  = '0%';
    fill.style.width = (fromPct * 100) + '%';
  }

  thumbTo.style.opacity       = rangeMode ? '1' : '0';
  thumbTo.style.pointerEvents = rangeMode ? 'auto' : 'none';

  // Bubble "from": ausblenden wenn auf Min oder Max
  const fromIsExtreme = (yearFrom === YEAR_MIN || yearFrom === YEAR_MAX);
  bubbleFrom.style.opacity = fromIsExtreme ? '0' : '1';
  if (!fromIsExtreme) {
    const bFromLeft = clamp(fromPct * 100, 3, 90);
    bubbleFrom.style.left      = bFromLeft + '%';
    bubbleFrom.style.transform = 'translateX(-50%)';
    bubbleFrom.textContent     = yearFrom;
  }

  // Bubble "to": ausblenden wenn auf Min oder Max
  if (rangeMode) {
    const toIsExtreme = (yearTo === YEAR_MIN || yearTo === YEAR_MAX);
    bubbleTo.style.opacity = toIsExtreme ? '0' : '1';
    if (!toIsExtreme) {
      const bToLeft = clamp(toPct * 100, 10, 97);
      bubbleTo.style.left      = bToLeft + '%';
      bubbleTo.style.transform = 'translateX(-50%)';
      bubbleTo.textContent     = yearTo;
    }
  } else {
    bubbleTo.style.opacity = '0';
  }

  // Extrem-Labels fett wenn Zeiger drauf steht
  labelMin.style.fontWeight = (yearFrom === YEAR_MIN || (rangeMode && yearTo === YEAR_MIN)) ? 'bold' : 'normal';
  labelMax.style.fontWeight = (yearFrom === YEAR_MAX || (rangeMode && yearTo === YEAR_MAX)) ? 'bold' : 'normal';
}
  // Drag-Logik für einen Zeiger
  function makeDraggable(thumb, isTo) {
    let dragging = false;

    thumb.addEventListener('mousedown', e => {
      dragging = true;
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const rect = sliderWrap.getBoundingClientRect();
      const pct  = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const year = Math.round(pct * (YEAR_MAX - YEAR_MIN) + YEAR_MIN);

      if (isTo) {
        yearTo = Math.max(yearFrom, year); // rechter Zeiger nie links vom linken
      } else {
        yearFrom = rangeMode ? Math.min(year, yearTo) : year; // linker nie rechts vom rechten
      }

      render();
      onYearFilterChange(yearFrom, rangeMode ? yearTo : yearFrom);
    });

    document.addEventListener('mouseup', () => { dragging = false; });

    // Touch-Support
    thumb.addEventListener('touchstart', e => { dragging = true; e.preventDefault(); });
    document.addEventListener('touchmove', e => {
      if (!dragging) return;
      const touch = e.touches[0];
      const rect  = sliderWrap.getBoundingClientRect();
      const pct   = clamp((touch.clientX - rect.left) / rect.width, 0, 1);
      const year  = Math.round(pct * (YEAR_MAX - YEAR_MIN) + YEAR_MIN);
      if (isTo) { yearTo = Math.max(yearFrom, year); }
      else { yearFrom = rangeMode ? Math.min(year, yearTo) : year; }
      render();
      onYearFilterChange(yearFrom, rangeMode ? yearTo : yearFrom);
    });
    document.addEventListener('touchend', () => { dragging = false; });
  }

  // Klick auf die Schiene – Zeiger an Klick-Position setzen
sliderWrap.addEventListener('click', e => {
  // Klicks auf die Zeiger selbst ignorieren
  if (e.target === thumbFrom || e.target === thumbTo) return;

  const rect = sliderWrap.getBoundingClientRect();
  const pct  = clamp((e.clientX - rect.left) / rect.width, 0, 1);
  const year = Math.round(pct * (YEAR_MAX - YEAR_MIN) + YEAR_MIN);

  if (rangeMode) {
    // Mittelpunkt der Zeitspanne an Klick-Position verschieben
    const span    = yearTo - yearFrom;         // aktuelle Spannweite beibehalten
    const halfSpan = Math.round(span / 2);
    let newFrom = year - halfSpan;
    let newTo   = year + (span - halfSpan);    // Rest der Spanne nach rechts

    // Ränder nicht überschreiten
    if (newFrom < YEAR_MIN) { newFrom = YEAR_MIN; newTo = YEAR_MIN + span; }
    if (newTo   > YEAR_MAX) { newTo = YEAR_MAX;   newFrom = YEAR_MAX - span; }

    yearFrom = newFrom;
    yearTo   = newTo;
  } else {
    // Einzelmodus: Zeiger direkt setzen
    yearFrom = year;
  }

  render();
  onYearFilterChange(yearFrom, rangeMode ? yearTo : yearFrom);
});

// Zeitspanne als Ganzes verschieben – Drag auf die Füllung
let spanDragging = false;
let spanDragStartX = null;
let spanDragStartFrom = null;
let spanDragStartTo = null;

fill.style.pointerEvents = 'auto'; // Klicks/Drags auf Fill erlauben
fill.style.cursor = 'grab';

fill.addEventListener('mousedown', e => {
  if (!rangeMode) return;
  spanDragging     = true;
  spanDragStartX    = e.clientX;
  spanDragStartFrom = yearFrom;
  spanDragStartTo   = yearTo;
  fill.style.cursor = 'grabbing';
  e.stopPropagation(); // verhindert dass sliderWrap-Klick feuert
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!spanDragging) return;
  const rect   = sliderWrap.getBoundingClientRect();
  const span   = spanDragStartTo - spanDragStartFrom;
  const deltaPct = (e.clientX - spanDragStartX) / rect.width;
  const deltaYear = Math.round(deltaPct * (YEAR_MAX - YEAR_MIN));

  let newFrom = spanDragStartFrom + deltaYear;
  let newTo   = spanDragStartTo   + deltaYear;

  // Ränder nicht überschreiten
  if (newFrom < YEAR_MIN) { newFrom = YEAR_MIN; newTo = YEAR_MIN + span; }
  if (newTo   > YEAR_MAX) { newTo = YEAR_MAX;   newFrom = YEAR_MAX - span; }

  yearFrom = newFrom;
  yearTo   = newTo;
  render();
  onYearFilterChange(yearFrom, yearTo);
});

document.addEventListener('mouseup', () => {
  if (spanDragging) {
    spanDragging      = false;
    fill.style.cursor = 'grab';
  }
});

// Touch-Support für die Zeitspanne
fill.addEventListener('touchstart', e => {
  if (!rangeMode) return;
  spanDragging      = true;
  spanDragStartX    = e.touches[0].clientX;
  spanDragStartFrom = yearFrom;
  spanDragStartTo   = yearTo;
  e.stopPropagation();
  e.preventDefault();
});

document.addEventListener('touchmove', e => {
  if (!spanDragging) return;
  const rect     = sliderWrap.getBoundingClientRect();
  const span     = spanDragStartTo - spanDragStartFrom;
  const deltaPct = (e.touches[0].clientX - spanDragStartX) / rect.width;
  const deltaYear = Math.round(deltaPct * (YEAR_MAX - YEAR_MIN));

  let newFrom = spanDragStartFrom + deltaYear;
  let newTo   = spanDragStartTo   + deltaYear;

  if (newFrom < YEAR_MIN) { newFrom = YEAR_MIN; newTo = YEAR_MIN + span; }
  if (newTo   > YEAR_MAX) { newTo = YEAR_MAX;   newFrom = YEAR_MAX - span; }

  yearFrom = newFrom;
  yearTo   = newTo;
  render();
  onYearFilterChange(yearFrom, yearTo);
});

document.addEventListener('touchend', () => { spanDragging = false; });

  makeDraggable(thumbFrom, false);
  makeDraggable(thumbTo,   true);

  // Checkbox umschalten
  checkbox.addEventListener('change', () => {
    rangeMode = checkbox.checked;
    if (!rangeMode) yearTo = YEAR_MAX; // Zeitspanne zurücksetzen
    render();
    onYearFilterChange(yearFrom, rangeMode ? yearTo : yearFrom);
  });

  // Beim Resize neu rendern
  window.addEventListener('resize', render);

  // Ersten Render nach kurzem Warten (Container hat dann seine Größe)
  setTimeout(render, 50);
}

// Hilfsfunktionen
// Zeiger-Kreis erstellen
function createThumb() {
  const t = document.createElement('div');
  t.style.cssText = `
    position: absolute; top: 50%; width: 18px; height: 18px;
    background: ${THUMB_COLOR}; border-radius: 50%;
    transform: translate(-50%, -50%);
    cursor: grab; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    transition: box-shadow 0.15s;
    z-index: 2;
  `;
  t.addEventListener('mousedown', () => { t.style.cursor = 'grabbing'; });
  document.addEventListener('mouseup', () => { t.style.cursor = 'grab'; });
  return t;
}

// Zeiger auf Prozentposition setzen
function setThumb(thumb, pct) {
  thumb.style.left = (pct * 100) + '%';
}

// Schwebendes Jahres-Label erstellen
function createBubble() {
  const b = document.createElement('span');
  b.style.cssText = `
    position: absolute; bottom: 0;
    background: transparent;
    color: ${TEXT_COLOR}; font-size: 0.72rem;
    font-weight: bold;
    white-space: nowrap; pointer-events: none;
  `;
  return b;
}

// Wert zwischen min und max begrenzen
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}


function onYearFilterChange(from, to) {
  filterRoutesByYear(from, to);
}

// Start
window.addEventListener('load', () => setTimeout(initYearFilter, 150));