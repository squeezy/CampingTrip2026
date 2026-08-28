# Milestone 2 Handoff Report: Stop Cards Data Enrichment & 1-Tap Navigation Specification

**Agent**: M2 Explorer 2 (`teamwork_preview_explorer_m2_2`)  
**Parent**: `teamwork_preview_orchestrator` (`7fd6582b-6aa3-4ea0-9151-ef21112d7682`)  
**Date**: 2026-08-28  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

1. **Existing `data.js` Place Structure (`TRIP_DATA.places`, lines 175–519)**:
   - There are currently 20 places defined in `TRIP_DATA.places`.
   - Existing fields include `id`, `name`, `category`, `subCategory`, `lat`, `lng`, `mapsUrl`, `distanceFromOrigin`, `image`, `description`, `tips`, `highlight`, `isSuperHighlight`, `openingHours`, `phone`, `recommendedMenu`, `facilities`, and `chargerInfo`.
   - **Missing critical fields**:
     - `phase` ('outbound' | 'campsite' | 'inbound') is missing on all 20 places, preventing phase filtering in the journey feed.
     - `powerKw`, `plugType`, `networkApp` are buried inside nested `chargerInfo` or absent on flat properties.
     - `foodHighlights` is inconsistently named (`recommendedMenu` vs `whatToEatAndChill` vs `facilities`).
     - `navUrl` with direct Google Maps turn-by-turn navigation intent (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`) is not standardized (some entries used `https://maps.app.goo.gl/...` shortlinks, which prompt web redirects instead of direct navigation app triggers).

2. **Existing Stop Cards in `app.js` (`renderMapMarkers`, lines 356–365)**:
   - The current list renders minimal cards:
     ```javascript
     <div class="map-place-card ${place.isSuperHighlight ? 'super-highlight' : ''}" data-place-id="${place.id}">
       <div class="map-place-card-header">
         <span class="map-place-name">${place.name}</span>
         <span class="badge ${getBadgeClass(place.category)}">${getCategoryName(place.category)}</span>
       </div>
       <div class="map-place-sub">${place.subCategory} • ห่างจุดเริ่มต้น ~${place.distanceFromOrigin} กม.</div>
     </div>
     ```
   - No direct 1-tap navigation CTA button exists in the sidebar cards. Users must click the card, wait for the map popup to open, and then click the popup button.
   - Charging power (kW) and food highlights are omitted from the list view.

3. **Touch Ergonomics & Style Rules in `style.css`**:
   - Touch min target token is set to `--touch-min-target: 44px;`.
   - `.btn-nav-full` is styled with `min-height: 48px;` and WCAG AA contrast colors (`--primary: #047857` in light mode, `--primary: #34d399` in dark mode).

---

## 2. Logic Chain

1. **Step 1 (Data Normalization)**:
   - Based on Observation 1, by enriching all 20 places with normalized top-level properties (`phase`, `powerKw`, `plugType`, `networkApp`, `foodHighlights`, and standard `navUrl`), both the map marker system and the sidebar card renderer can access identical attributes synchronously without null checks or nested object parsing errors.
2. **Step 2 (3-Phase Journey Partitioning)**:
   - Outbound leg (`phase: "outbound"`): `home`, `poi_samchuk`, `charger_danchang` (3 places leading up to the campsite).
   - Campsite zone (`phase: "campsite"`): `owlyard`, `charger_banrai_pea`, `rest_koomrimkhao`, `rest_baansuan`, `rest_chaika`, `rest_heiauan`, `rest_padthai`, `cafe_leleela`, `poi_giant_tree`, `poi_wat_tham_khao_wong` (10 places within 5 km of campsite).
   - Inbound leg (`phase: "inbound"`): `poi_huppatat`, `charger_ptt_uthai_bypass`, `poi_watthasung`, `charger_nexmoev`, `charger_elex_egat_manorom`, `charger_ptt_manorom_ah2`, `poi_chainat_bird` (7 places along the return route).
   - Total: 3 + 10 + 7 = 20 places.
3. **Step 3 (Driver-First 1-Tap CTA Design)**:
   - Based on Observations 2 and 3, road trip drivers need immediate navigation access without intermediate popup clicks.
   - Adding a full-width `.btn-driver-nav` button directly onto each stop card with `min-height: 48px`, prominent Lucide `navigation` icon, and `navUrl` href (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`) enables 1-tap instant navigation from both mobile and desktop.
4. **Step 4 (Progressive Disclosure & Visual Scannability)**:
   - Stop cards display prominent place names, distance pills (`175 กม. จากบ้าน`), charging speed pills (`⚡ 120 kW (EV Station PluZ)`), and up to 3 food chips (`🍽️ แนะนำ: [Cafe Amazon, 7-Eleven, อาหารตามสั่ง]`), delivering complete situational awareness in under 3 seconds.

---

## 3. Caveats

1. **Coordination with M2 Explorer 1 & 3**:
   - Explorer 1 specifies the `#phaseFilterGroup` segmented buttons and map bounds (`fitBounds`).
   - Explorer 3 specifies the bidirectional marker <-> card scroll/highlight synchronization and gesture protection.
   - Explorer 2 provides the data dictionary and the card DOM/CSS rendering blueprint used by both.
2. **Read-Only Investigation**:
   - No source files (`data.js`, `app.js`, `style.css`) were modified in project directories during this exploratory phase; all specifications and ready-to-use snippets are detailed in `analysis.md`.

---

## 4. Conclusion

1. **Complete 20-Place Dataset Ready**: All 20 places have been fully mapped, validated, and enriched with `phase`, `powerKw`, `plugType`, `networkApp`, `foodHighlights`, and standard Google Maps direct intent `navUrl`.
2. **Driver Stop Card Template Standardized**: Complete semantic HTML structure, CSS rules, and helper functions are documented in `analysis.md` with >=48px 1-tap navigation CTA buttons and WCAG AA contrast compliance.

---

## 5. Verification Method

To independently verify the specification:
1. **Data Completeness Verification**:
   - Inspect `d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m2_2\analysis.md` Section 2.2 and 2.3.
   - Confirm all 20 places have valid `phase` in `['outbound', 'campsite', 'inbound']` and valid `navUrl` matching `https://www.google.com/maps/dir/?api=1&destination=\d+\.\d+,\d+\.\d+`.
2. **Syntax Validation Test Command**:
   - Upon implementation by the worker, run:
     ```powershell
     node --check d:\Project\CampingTrip\data.js
     node --check d:\Project\CampingTrip\app.js
     ```
3. **Ergonomic Button Inspection**:
   - Verify `.btn-driver-nav` has `min-height: 48px`, `touch-action: manipulation`, and active state `transform: scale(0.97)`.
