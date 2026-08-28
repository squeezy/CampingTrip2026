## 2026-08-28T16:49:25Z
You are the M2 Implementation Worker (Interactive Map & Synchronized Journey Stops).
Your working directory: d:\Project\CampingTrip\.agents\teamwork_preview_worker_m2_1
Your parent is: teamwork_preview_orchestrator (conv ID: 7fd6582b-6aa3-4ea0-9151-ef21112d7682)

Read ORIGINAL_REQUEST.md at: d:\Project\CampingTrip\.agents\ORIGINAL_REQUEST.md
Read PROJECT.md at: d:\Project\CampingTrip\PROJECT.md
Read M2 Explorer 1 Report at: d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m2_1\handoff.md
Read M2 Explorer 2 Report at: d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m2_2\handoff.md
Read M2 Explorer 3 Report at: d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m2_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- `d:\Project\CampingTrip\data.js`
- `d:\Project\CampingTrip\app.js`
- `d:\Project\CampingTrip\style.css`
- `d:\Project\CampingTrip\index.html` (if adding phase segmented control container)
- Your `.agents` directory

Implementation Scope:
1. **Data Model Enrichment in `data.js`**:
   - Enrich all 20 places in `TRIP_DATA.places` with:
     - `phase`: `'outbound'` (3 places), `'campsite'` (10 places in Ban Rai), `'inbound'` (7 places).
     - `powerKw`: numeric charging power where applicable (e.g. 120, 160, 360, 50).
     - `plugType`: e.g. 'CCS2 2 หัว', 'PEA VOLTA 50kW'.
     - `networkApp`: e.g. 'PEA VOLTA', 'EleXA', 'Evolt', 'GINKGO'.
     - `foodHighlights`: array of food tags/specialties.
     - `navUrl`: direct Google Maps direction link `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`.
2. **Dark Mode Tiles & Gesture Guard in `app.js`**:
   - Fix `updateMapTiles(theme)`: load CartoDB Dark Matter (`https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png`) in dark theme and Voyager in light theme.
   - Prevent mobile touch-scrolling trap on Leaflet map container (implement cooperative gestures or touch guard overlay).
3. **3-Phase Journey Segmented Control**:
   - Implement segmented filter: [ทั้งหมด (All)], [🟢 ขาไป (Outbound)], [🏕️ รอบแคมป์ (Campsite & Ban Rai)], [🟡 ขากลับ (Inbound)].
   - When phase changes, filter both map markers/polylines and stop cards list, and auto-zoom to the active leg bounds using `mapInstance.fitBounds(bounds, { padding: [40, 40] })`.
4. **Driver Stop Cards & 1-Tap Navigation**:
   - Render stop cards with prominent name, distance badge, charging speed badge (⚡ 160 kW), food chips, and a direct 1-tap "🚗 นำทาง (Navigate)" CTA button (>=48px tap target) opening `navUrl` in a new tab.
5. **Bidirectional Marker <-> Card Synchronization**:
   - Clicking a card flies map, opens popup, and sets card active.
   - Clicking a map marker opens popup, highlights the card, and smoothly calls `card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`.
6. **Verification**:
   - Run `node test/run-tests.js` (all tests must pass).
   - Run `node --check app.js data.js`.
   - Write your handoff report to `d:\Project\CampingTrip\.agents\teamwork_preview_worker_m2_1\handoff.md`.
   - Send completion message via send_message to parent.
