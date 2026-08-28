# Handoff Report — Milestone 1: Navigation & View Architecture

> **From:** M1 Explorer 1 (Navigation & View Architecture)  
> **To:** Teamwork Orchestrator & M1 Workers / Reviewers  
> **Date:** 2026-08-28T23:38:30+07:00  
> **Handoff Type:** Hard (Complete Milestone 1 Specification)  
> **Target Files:** `index.html`, `app.js`, `style.css`  

---

## 1. Observation

### 1.1 Triple Navigation Redundancy in `index.html`
- **Desktop Header Navigation** (`index.html:39-52`):
  ```html
  <nav class="nav-desktop">
    <button class="nav-btn active" data-tab="tab-map">...</button>
    <button class="nav-btn" data-tab="tab-charge-chill">...</button>
    <button class="nav-btn" data-tab="tab-simulator">...</button>
  </nav>
  ```
- **Hero Quick Action Buttons** (`index.html:84-97`):
  ```html
  <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem;">
    <button class="btn-nav-full" data-goto-tab="tab-map">...</button>
    <button class="btn-nav-full" data-goto-tab="tab-charge-chill">...</button>
    <button class="btn-nav-full" data-goto-tab="tab-simulator">...</button>
  </div>
  ```
- **Mobile Bottom Navigation Bar** (`index.html:313-326`):
  ```html
  <nav class="mobile-nav-bar" style="justify-content: space-around;">
    <button class="mobile-nav-item active" data-tab="tab-map">...</button>
    <button class="mobile-nav-item" data-tab="tab-charge-chill">...</button>
    <button class="mobile-nav-item" data-tab="tab-simulator">...</button>
  </nav>
  ```
- **Observation:** A mobile user loads the web page and is greeted by 6 redundant tab buttons before any content can be viewed.

### 1.2 Viewport Accessibility Violation
- `index.html:5`:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  ```
- **Observation:** Prevents pinch-to-zoom on mobile devices, violating WCAG 1.4.4.

### 1.3 View Switching Mechanism in `app.js`
- `app.js:53-109`:
  - Switches `.tab-content` classes directly based on `data-tab` / `data-goto-tab`.
  - Does not maintain URL hash synchronization or support browser Back/Forward navigation (`popstate`).
  - Lacks ARIA attributes (`role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`).

### 1.4 Unrendered Dormant Dataset in `data.js`
- `data.js:521-589` contains `TRIP_DATA.evCampingGuide`:
  - 6 EV brand camp mode guides: Tesla, BYD, MG, GWM, Changan Deepal, Aion.
  - 4 Car camping Pro-Tips: Custom Sunshades, Air Mattress, V2L (Vehicle-to-Load), AC 24-25°C.
  - 6 Emergency Hotline contacts: NEXMOEV (`086-311-4422`), PluZ (`1365`), PEA (`1129`), EleX (`02-436-1111`), Highway Police (`1193`), Rescue (`1669`).
- **Observation:** This entire dataset is currently unrendered in HTML and inaccessible to drivers.

---

## 2. Logic Chain

1. **Premise 1 (Redundancy Elimination - R1):** Consolidating the 3 separate navigation bars into a single primary 2-view paradigm (`view-trip` and `view-simulator`) eliminates all duplicate button clutter in both header and hero sections.
2. **Premise 2 (Integrated Stop Flow):** Tab 1 (Map) and Tab 2 (Charge & Chill) represent two views of the same journey stops. Merging them into `view-trip` allows the driver to view the map and the enriched stop cards synchronously without context switching.
3. **Premise 3 (High-Value Quick Action - R1, R2):** The dormant `evCampingGuide` dataset provides critical nighttime camp instructions and emergency phone numbers. Placing it in a lightweight, accessible drawer (`#drawerCampSos`) accessible from the header and mobile bottom bar makes it instantly available with 1 tap without cluttering the main screen.
4. **Premise 4 (Deep Linking & Resilience):** Synchronizing `view-trip` and `view-simulator` with URL hashes (`#trip` and `#simulator`) via `history.pushState` and `window.addEventListener('popstate')` allows direct link sharing and seamless browser navigation.
5. **Premise 5 (Zero Map Glitch):** Calling `window.mapInstance.invalidateSize()` on switching to `view-trip` ensures Leaflet tiles recalculate dimensions immediately upon becoming visible.

---

## 3. Caveats

- **Milestone 2 Dependency:** The internal stop cards rendered inside `view-trip` (`#mapPlacesList`) will be upgraded in Milestone 2 with 3-phase journey filtering and rich food/charging badges. The container DOM IDs (`#mapPlacesList`, `#mapFilterGroup`, `#map`) are strictly preserved in M1 to ensure zero breaking changes for M2.
- **Milestone 3 Dependency:** The simulator input sliders inside `view-simulator` (`#simCar1Cap`, `#simCar2Cap`, `#simSleepHours`, `#simAcPower`) are preserved in M1, with M3 adding the vehicle preset chips and animated battery meters.
- **Browser Compatibility:** URL hash routing and CSS transitions are supported across all modern mobile and desktop browsers (iOS Safari, Android Chrome, Edge, Firefox).

---

## 4. Conclusion

The specification formulated in `analysis.md` provides the exact, production-ready blueprint for Milestone 1:
1. **`index.html`**:
   - Replaces 3 redundant tab menus with a unified 2-view layout (`#view-trip`, `#view-simulator`).
   - Removes hero duplicate buttons.
   - Adds accessible `#drawerCampSos` drawer container for camp mode and emergency contacts.
   - Fixes mobile viewport meta tag (`user-scalable=no` removed).
2. **`app.js`**:
   - Implements `initNavigation()` with two-way URL hash routing (`#trip`, `#simulator`), ARIA accessibility sync, and Leaflet `invalidateSize()` handling.
   - Implements `initCampGuideDrawer()` with backdrop dismissal, ESC key dismissal, body scroll locking, and dynamic rendering of `TRIP_DATA.evCampingGuide`.
3. **`style.css`**:
   - Provides smooth view fade-in transitions (`.view-content.active`), drawer overlay animations (`.drawer-overlay.is-open`), and tactile tap targets (>=44x44px).

---

## 5. Verification Method

To verify the implementation once applied by the Worker:

1. **Syntax Integrity Check**:
   ```bash
   node --check app.js
   node --check data.js
   ```
2. **DOM & Redundancy Verification**:
   - Check that `index.html` contains exactly 2 primary desktop view buttons and 3 mobile bottom items.
   - Verify that all `[data-goto-tab]` buttons are removed from the hero section.
   - Verify `#drawerCampSos` exists and has `role="dialog"` and `aria-modal="true"`.
3. **Functional & Interaction Checks**:
   - Open `index.html` in browser.
   - Click "⚡ จำลองแบต 2 คัน": Confirm view switches to simulator and URL hash changes to `#simulator`.
   - Click "🗺️ แผนที่ & จุดแวะ": Confirm view switches to map, map renders cleanly without gray tiles, and URL hash changes to `#trip`.
   - Click "⛺ คู่มือ & SOS": Confirm drawer slides in from the right with brand guides and 1-tap phone dialers.
   - Press `Escape` key: Confirm drawer closes.
4. **Automated Test Suite**:
   ```bash
   node test/run-tests.js
   ```
