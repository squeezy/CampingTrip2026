# Milestone 2 Technical Specification: Map Phases, Bounds & Dark Mode Tiles

## 1. Executive Summary

Milestone 2 elevates the map experience from a static overview to an interactive, leg-by-leg navigation companion for EV convoy drivers. This specification addresses three primary capabilities:
1. **Dynamic Map Tile Theme Switching (`updateMapTiles(theme)`)**: Dynamically swaps CartoDB Dark Matter (`dark_all`) and CartoDB Voyager (`voyager`) tile layers matching the active color theme, preventing night driving glare.
2. **3-Phase Journey Segmented Control (`#phaseFilterGroup`)**: A driver-first segmented control offering 4 view states: `[ทั้งหมด]`, `[🟢 ขาไป]`, `[🏕️ รอบแคมป์ & บ้านไร่]`, and `[🟡 ขากลับ]`.
3. **Synchronized Phase Filtering & Dynamic Auto-Zoom (`fitBounds`)**: Filters markers, list cards, and route polylines to eliminate visual clutter, and automatically animates map bounds to frame the active leg with `mapInstance.fitBounds(bounds, { padding: [40, 40] })`.

---

## 2. Dynamic Map Tile Theme Engine (`updateMapTiles(theme)`)

### 2.1 Current Problem
In `app.js` (lines 312-323):
```javascript
function updateMapTiles(theme) {
  if (mapTileLayer) {
    mapInstance.removeLayer(mapTileLayer);
  }

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  mapTileLayer = L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  }).addTo(mapInstance);
}
```
- The `theme` parameter is accepted but never evaluated.
- In dark mode (`data-theme="dark"`), the map remains bright white, creating extreme visual dissonance with dark UI cards (`--bg-card: #131b2e`, `--bg-main: #0b1120`).

### 2.2 Technical Solution & Tile Specifications
CartoDB provides high-performance, retina-ready raster tiles for both themes:
- **Light Theme (Voyager)**:
  `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- **Dark Theme (Dark Matter)**:
  `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png`
- **Common Options**:
  - `subdomains`: `'abcd'`
  - `maxZoom`: `19`
  - `attribution`: `'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'`

### 2.3 Proposed Implementation (`app.js`)
```javascript
function updateMapTiles(theme) {
  if (!mapInstance) return;

  if (mapTileLayer) {
    mapInstance.removeLayer(mapTileLayer);
  }

  const currentTheme = theme || document.documentElement.getAttribute('data-theme') || 'light';
  const isDark = (currentTheme === 'dark');

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  mapTileLayer = L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance);

  if (mapTileLayer.bringToBack) {
    mapTileLayer.bringToBack();
  }
}
```

### 2.4 Lifecycle & Synchronization
- **On Map Initialization (`initMap`)**:
  Reads the current document theme via `document.documentElement.getAttribute('data-theme') || 'light'` and calls `updateMapTiles(theme)`.
- **On Theme Toggle (`initTheme`)**:
  Triggered when the user taps `#themeToggleBtn`. Immediately calls `updateMapTiles(newTheme)` if `window.mapInstance` exists.

---

## 3. 3-Phase Journey Segmented Control (`#phaseFilterGroup`)

### 3.1 Phase Breakdown & Purpose
| Phase ID | UI Label | Journey Scope | Primary Driver Purpose |
|----------|----------|---------------|------------------------|
| `all` | 🗺️ ทั้งหมด | Entire 545 km Loop | Full trip overview; see entire route and all 20 stops. |
| `outbound` | 🟢 ขาไป | Nonthaburi ➔ Suphan Buri ➔ PTT Dan Chang ➔ Owl Yard | Focus on Outbound leg; ensure 90-95% SoC top-up at Dan Chang before entering camp. |
| `campsite` | 🏕️ รอบแคมป์ & บ้านไร่ | Owl Yard & Ban Rai Local Area (3-10 km radius) | Focus on campsite activities: evening dining, morning coffee, local sights, backup PEA charger. |
| `inbound` | 🟡 ขากลับ | Owl Yard ➔ Hup Pa Tat ➔ Wat Tha Sung ➔ NEXMOEV ➔ Asian Highway | Focus on Inbound leg; visit Jurassic valley, temples, 12-gun VIP charging at NEXMOEV, then highway run. |

### 3.2 Place-to-Phase Mapping Matrix
All 20 places in `TRIP_DATA.places` map cleanly into phases:

| Place ID | Place Name | Category | Primary Phase | Leg Context |
|----------|------------|----------|---------------|-------------|
| `home` | บ้าน (จุดเริ่มต้น / ปลายทาง) | `poi` | `outbound` / `inbound` | Start & End of loop |
| `poi_samchuk` | ตลาดสามชุก 100 ปี | `poi` | `outbound` | Midpoint lunch / provisions |
| `charger_danchang` | PTT Station ด่านช้าง | `charger` | `outbound` | Key Outbound charging hub (120 kW) |
| `owlyard` | Owl Yard Campsite at Ban Rai | `camp` | `campsite` (also end of outbound) | Camp destination & sleep |
| `charger_banrai_pea` | PEA VOLTA การไฟฟ้าบ้านไร่ | `charger` | `campsite` | Local backup charger (50 kW, 5 km from camp) |
| `rest_koomrimkhao` | สวนอาหาร คุ้มริมเขา | `food` | `campsite` | Evening dinner (3 km from camp) |
| `rest_baansuan` | ร้านอาหารบ้านสวน บ้านไร่ | `food` | `campsite` | Local dining option |
| `rest_chaika` | ครัวชายคาตามสั่งก๋วยเตี๋ยว | `food` | `campsite` | Quick meal near camp (1.5 km) |
| `rest_heiauan` | ราดหน้าเฮียอ้วน @ Banrai | `food` | `campsite` | Legendary noodle shop |
| `rest_padthai` | ร้านผัดไทยมรดกโลก (ป้าสมนึก) | `food` | `campsite` | Day 2 lunch highlight |
| `cafe_leleela` | Le Leela Cafe | `cafe` | `campsite` | Morning specialty coffee & mountain view |
| `poi_giant_tree` | ต้นไม้ยักษ์บ้านสะนำ | `poi` | `campsite` | 400-year-old tree landmark |
| `poi_wat_tham_khao_wong` | วัดถ้ำเขาวง บ้านไร่ | `poi` | `campsite` | Teak temple by limestone cliff |
| `poi_huppatat` | หุบป่าตาด (Jurassic Valley) | `poi` | `inbound` | Ancient cave & Jurassic palm forest |
| `charger_ptt_uthai_bypass` | PTT เลี่ยงเมืองอุทัยธานี (ทล.333) | `charger` | `inbound` | Post-Hup Pa Tat rest & top-up |
| `poi_watthasung` | วัดจันทาราม (วัดท่าซุง) | `poi` | `inbound` | 100m Crystal Hall & Golden Castle |
| `charger_nexmoev` | ⭐ NEXMOEV Mega Station | `charger` | `inbound` | 12x 120kW guns + VIP massage lounge |
| `charger_elex_egat_manorom` | EleX by EGAT (มโนรมย์) | `charger` | `inbound` | High-reliability EGAT DC charger |
| `charger_ptt_manorom_ah2` | PTT Station มโนรมย์ (สายเอเชีย) | `charger` | `inbound` | Asian Highway major rest hub |
| `poi_chainat_bird` | สวนนกชัยนาท | `poi` | `inbound` | Landmark park before Bangkok run |

### 3.3 DOM Structure (`index.html`)
The phase control should be positioned prominently above the category filters inside `.map-sidebar`:

```html
<!-- Journey Phase Segmented Control -->
<div class="sidebar-phase-section">
  <div class="sidebar-phase-title">
    ช่วงการเดินทาง (Journey Phase)
  </div>
  <div id="phaseFilterGroup" class="phase-filter-group" role="tablist" aria-label="Journey Phase Filter">
    <button class="phase-btn active" data-phase="all" role="tab" aria-selected="true">
      <i data-lucide="compass" style="width: 16px; height: 16px;"></i>
      <span>ทั้งหมด</span>
    </button>
    <button class="phase-btn phase-btn-outbound" data-phase="outbound" role="tab" aria-selected="false">
      <span class="phase-dot dot-outbound"></span>
      <span>ขาไป</span>
    </button>
    <button class="phase-btn phase-btn-camp" data-phase="campsite" role="tab" aria-selected="false">
      <span class="phase-dot dot-camp"></span>
      <span>รอบแคมป์ & บ้านไร่</span>
    </button>
    <button class="phase-btn phase-btn-inbound" data-phase="inbound" role="tab" aria-selected="false">
      <span class="phase-dot dot-inbound"></span>
      <span>ขากลับ</span>
    </button>
  </div>
</div>
```

### 3.4 CSS Design Tokens & Styling (`style.css`)
```css
/* Phase Segmented Control */
.sidebar-phase-section {
  margin-bottom: 1rem;
}

.sidebar-phase-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.phase-filter-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  background: var(--bg-card-subtle);
  padding: 0.4rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

@media (min-width: 480px) {
  .phase-filter-group {
    grid-template-columns: repeat(4, 1fr);
  }
}

.phase-btn {
  min-height: 44px;
  min-width: 44px;
  padding: 0.5rem 0.65rem;
  border-radius: var(--radius-sm);
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.phase-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.phase-btn:active {
  transform: scale(0.96);
}

.phase-btn.active {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

/* Phase specific active styles */
.phase-btn-outbound.active {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.phase-btn-camp.active {
  border-color: var(--accent-amber);
  color: var(--accent-amber);
  background: var(--accent-amber-light);
}

.phase-btn-inbound.active {
  border-color: #d97706;
  color: #b45309;
  background: #fef3c7;
}

[data-theme="dark"] .phase-btn-outbound.active {
  background: rgba(52, 211, 153, 0.18);
  color: #34d399;
}

[data-theme="dark"] .phase-btn-camp.active {
  background: rgba(251, 191, 36, 0.18);
  color: #fbbf24;
}

[data-theme="dark"] .phase-btn-inbound.active {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
}

.phase-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.phase-dot.dot-outbound { background: var(--primary); }
.phase-dot.dot-camp { background: var(--accent-amber); }
.phase-dot.dot-inbound { background: #f59e0b; }
```

---

## 4. Synchronized Filtering, Polyline Management & Dynamic Auto-Zoom (`fitBounds`)

### 4.1 State Model & Filter Combination
Two state variables in `app.js`:
```javascript
let currentActivePhase = 'all';     // 'all' | 'outbound' | 'campsite' | 'inbound'
let currentActiveCategory = 'all';  // 'all' | 'charger' | 'camp' | 'food' | 'cafe' | 'poi'
```

### 4.2 Filtering Function (`getFilteredPlaces`)
```javascript
function getFilteredPlaces() {
  if (typeof TRIP_DATA === 'undefined' || !TRIP_DATA.places) return [];

  return TRIP_DATA.places.filter(place => {
    // 1. Phase Matching:
    let matchesPhase = false;
    if (currentActivePhase === 'all') {
      matchesPhase = true;
    } else if (place.phase) {
      if (Array.isArray(place.phase)) {
        matchesPhase = place.phase.includes(currentActivePhase);
      } else {
        matchesPhase = (place.phase === currentActivePhase);
      }
    } else {
      // Fallback phase deduction if phase property not yet populated
      if (currentActivePhase === 'outbound') {
        matchesPhase = ['home', 'poi_samchuk', 'charger_danchang', 'owlyard'].includes(place.id);
      } else if (currentActivePhase === 'campsite') {
        matchesPhase = ['owlyard', 'charger_banrai_pea', 'rest_koomrimkhao', 'rest_baansuan', 'rest_chaika', 'rest_heiauan', 'rest_padthai', 'cafe_leleela', 'poi_giant_tree', 'poi_wat_tham_khao_wong'].includes(place.id);
      } else if (currentActivePhase === 'inbound') {
        matchesPhase = ['owlyard', 'poi_huppatat', 'charger_ptt_uthai_bypass', 'poi_watthasung', 'charger_nexmoev', 'charger_elex_egat_manorom', 'charger_ptt_manorom_ah2', 'poi_chainat_bird', 'home'].includes(place.id);
      }
    }

    // 2. Category Matching:
    const matchesCategory = (currentActiveCategory === 'all') || (place.category === currentActiveCategory);

    return matchesPhase && matchesCategory;
  });
}
```

### 4.3 Polyline Switching Logic (`updateRoutePolylines`)
When the phase switches:
- **`all`**: Show both `outboundPolyline` and `inboundPolyline` with default stroke.
- **`outbound`**: Add `outboundPolyline` to map (highlighted stroke), remove `inboundPolyline`.
- **`campsite`**: Remove both highway polylines (or set opacity 0) to avoid obstructing the local Ban Rai cluster.
- **`inbound`**: Remove `outboundPolyline`, add `inboundPolyline` (highlighted stroke).

```javascript
function updateRoutePolylines(phase) {
  if (!mapInstance) return;

  if (phase === 'all') {
    if (outboundPolyline && !mapInstance.hasLayer(outboundPolyline)) outboundPolyline.addTo(mapInstance);
    if (inboundPolyline && !mapInstance.hasLayer(inboundPolyline)) inboundPolyline.addTo(mapInstance);
    if (outboundPolyline) outboundPolyline.setStyle({ opacity: 0.95, weight: 5 });
    if (inboundPolyline) inboundPolyline.setStyle({ opacity: 0.95, weight: 5 });
  } else if (phase === 'outbound') {
    if (outboundPolyline && !mapInstance.hasLayer(outboundPolyline)) outboundPolyline.addTo(mapInstance);
    if (inboundPolyline && mapInstance.hasLayer(inboundPolyline)) mapInstance.removeLayer(inboundPolyline);
    if (outboundPolyline) outboundPolyline.setStyle({ opacity: 1.0, weight: 6 });
  } else if (phase === 'campsite') {
    if (outboundPolyline && mapInstance.hasLayer(outboundPolyline)) mapInstance.removeLayer(outboundPolyline);
    if (inboundPolyline && mapInstance.hasLayer(inboundPolyline)) mapInstance.removeLayer(inboundPolyline);
  } else if (phase === 'inbound') {
    if (outboundPolyline && mapInstance.hasLayer(outboundPolyline)) mapInstance.removeLayer(outboundPolyline);
    if (inboundPolyline && !mapInstance.hasLayer(inboundPolyline)) inboundPolyline.addTo(mapInstance);
    if (inboundPolyline) inboundPolyline.setStyle({ opacity: 1.0, weight: 6 });
  }
}
```

### 4.4 Dynamic Bounding Boxes & Auto-Zoom Engine (`zoomToPhaseBounds`)
```javascript
const PHASE_BOUNDS_PRESETS = {
  all: [
    [13.80, 99.40],
    [15.55, 100.45]
  ],
  outbound: [
    [13.80, 99.45],
    [15.12, 100.45]
  ],
  campsite: [
    [15.02, 99.44],
    [15.11, 99.55]
  ],
  inbound: [
    [13.80, 99.58],
    [15.52, 100.20]
  ]
};

function zoomToPhaseBounds(phase) {
  if (!mapInstance) return;

  const activePlaces = getFilteredPlaces();
  if (activePlaces.length > 0) {
    const coords = activePlaces.map(p => [p.lat, p.lng]);
    // Include route anchor points if necessary
    const bounds = L.latLngBounds(coords);
    
    // Fit bounds with comfortable padding
    const maxZoom = (phase === 'campsite') ? 14 : 12;
    mapInstance.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: maxZoom,
      animate: true,
      duration: 0.6
    });
  } else if (PHASE_BOUNDS_PRESETS[phase]) {
    mapInstance.fitBounds(PHASE_BOUNDS_PRESETS[phase], {
      padding: [40, 40],
      maxZoom: (phase === 'campsite') ? 14 : 12,
      animate: true
    });
  }
}
```

---

## 5. Implementation Roadmap for Worker

1. **`index.html`**:
   - Add `#phaseFilterGroup` segmented control above `#mapFilterGroup`.
   - Add ARIA attributes (`role="tablist"`, `role="tab"`, `aria-selected`).
2. **`style.css`**:
   - Add `.sidebar-phase-section`, `.phase-filter-group`, `.phase-btn`, `.phase-dot` rules.
   - Add high-contrast daylight and dark mode active tokens.
3. **`app.js`**:
   - Refactor `updateMapTiles(theme)` to switch CartoDB Dark Matter / Voyager.
   - Implement `initPhaseFilters()`, `setJourneyPhase(phase)`.
   - Update `renderMapMarkers()` to consume `getFilteredPlaces()`.
   - Implement `updateRoutePolylines(phase)` and `zoomToPhaseBounds(phase)`.

---

## 6. Verification Methods

1. **Syntax Check**: `node --check app.js` and `node --check data.js`.
2. **Automated Test Run**: `node test/run-tests.js`.
3. **Behavioral Assertions**:
   - Toggling theme flips tile URL from `voyager` to `dark_all` and back.
   - Clicking `[🟢 ขาไป]` reduces displayed cards to 4 and zooms map to outbound corridor.
   - Clicking `[🏕️ รอบแคมป์ & บ้านไร่]` displays 10 local places and zooms tightly into Ban Rai valley.
   - Clicking `[🟡 ขากลับ]` displays 9 inbound places and highlights inbound polyline.
