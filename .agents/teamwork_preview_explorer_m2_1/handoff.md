# Milestone 2 Handoff Report: Map Phases, Bounds & Dark Mode Tiles

## 1. Observation

1. **`app.js` (lines 312-323)**: `updateMapTiles(theme)` ignores the `theme` argument and hardcodes CartoDB Voyager:
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
   When switching to dark mode (`data-theme="dark"`), the map remains bright white, failing dark mode ergonomics.

2. **`index.html` (lines 128-135)**: Only `#mapFilterGroup` (category filter) exists in the sidebar. There is no phase filter segmented control (`#phaseFilterGroup`) for the 3 journey legs (🟢 ขาไป / 🏕️ รอบแคมป์ & บ้านไร่ / 🟡 ขากลับ).

3. **`app.js` (lines 418-464)**: `drawDirectionalRoutes()` creates `outboundPolyline` and `inboundPolyline` but keeps them both persistently rendered without phase-based visibility toggling or bounding box auto-zoom.

4. **`data.js` (lines 175-519)**: 20 places exist in `TRIP_DATA.places`, clustering heavily in the Ban Rai valley (`campsite`), while outbound and inbound corridors span 120-345 km.

---

## 2. Logic Chain

1. **Dark Tile Switching**:
   - Observation 1 shows `updateMapTiles` is hardcoded to `voyager`.
   - By evaluating `const isDark = (theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark')`, `updateMapTiles` can conditionally select `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png` for dark mode and `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` for light mode.
   - Calling `updateMapTiles(newTheme)` inside `initTheme()` immediately propagates theme switches to Leaflet without page reload.

2. **3-Phase Segmented Control & DOM/CSS Design**:
   - Observation 2 shows the absence of a phase selector.
   - Adding `#phaseFilterGroup` with 4 accessible segmented buttons (`all`, `outbound`, `campsite`, `inbound`) gives drivers immediate leg-by-leg context.
   - Sizing buttons to `>=44px` height with high-contrast color indicators satisfies mobile driver ergonomics.

3. **Synchronized Phase Filtering & Dynamic Bounds**:
   - Observation 3 & 4 show 20 places spanning from Nonthaburi to Uthai Thani causing visual clutter.
   - When a phase button is selected, filtering `TRIP_DATA.places` by `phase` narrows the visible markers and sidebar list:
     - `outbound`: 4 stops (Home, Sam Chuk, PTT Dan Chang, Owl Yard) + Outbound polyline.
     - `campsite`: 10 stops (Owl Yard, 5 restaurants, 1 cafe, 2 sights, 1 backup charger) with local tight focus.
     - `inbound`: 9 stops (Owl Yard, Hup Pa Tat, PTT Bypass, Wat Tha Sung, ⭐ NEXMOEV, Manorom, Chainat, Home) + Inbound polyline.
   - Calling `mapInstance.fitBounds(bounds, { padding: [40, 40] })` on phase change auto-zooms smoothly to frame the selected leg.

---

## 3. Caveats

1. Explorer 2 (`teamwork_preview_explorer_m2_2`) is detailing the exact property naming for `place.phase` in `data.js`. The filtering logic in `app.js` is designed to support both explicit `place.phase` properties and fallback ID-based lookup to ensure zero breakage during intermediate implementation steps.
2. Explorer 3 (`teamwork_preview_explorer_m2_3`) is detailing gesture handling and bidirectional marker-to-card clicks. The map instance and layers created here conform directly to Explorer 3's DOM/event contracts.

---

## 4. Conclusion

The technical specification for Milestone 2 Phase Filtering, Dynamic Bounds, and Dark Mode Tiles is completely formulated and documented in `analysis.md`:
- **Dark Mode Tiles**: Conditional tile layer switching between CartoDB Dark Matter and Voyager.
- **Segmented Control**: 4-state `#phaseFilterGroup` (`all`, `outbound`, `campsite`, `inbound`) with driver-ergonomic tap targets.
- **Filtering & Auto-Zoom**: Coordinated marker, card, and polyline visibility updates with `mapInstance.fitBounds()` dynamic framing.

---

## 5. Verification Method

1. **Syntax Check**:
   ```powershell
   node --check app.js
   node --check data.js
   ```
2. **Automated E2E Test Suite**:
   ```powershell
   node test/run-tests.js
   ```
3. **Manual / DOM Inspection**:
   - Inspect `index.html` for `#phaseFilterGroup` containing 4 buttons with `data-phase="all|outbound|campsite|inbound"`.
   - Inspect `app.js` for `updateMapTiles(theme)` loading `rastertiles/dark_all` in dark mode and `rastertiles/voyager` in light mode.
   - Verify `fitBounds` is called with `{ padding: [40, 40] }` on phase switch.
