# Technical Analysis & Specification: Bidirectional Sync & Mobile Touch Ergonomics (Milestone 2)

**Author**: M2 Explorer 3 (Bidirectional Sync & Mobile Touch Ergonomics)  
**Date**: 2026-08-28  
**Scope**: Milestone 2 — Bidirectional Marker <-> Card Synchronization, Mobile Leaflet Gesture Handling (Scroll-Trap Prevention), and Driver Touch Ergonomics.

---

## 1. Executive Summary

In road-trip and convoy scenarios (e.g. driving 2 EVs from Bangkok/Nonthaburi to Owl Yard Campsite, Ban Rai, Uthai Thani), drivers interact with mobile devices using single-thumb taps under moving or bumpy road conditions. 

Two critical UX requirements define Milestone 2 for the interactive trip view:
1. **Seamless Bidirectional Synchronization**: Tapping a stop card in the itinerary must instantly fly the Leaflet map to that location, open the enriched popup, and mark the card as active. Conversely, tapping any marker pin on the map must open its popup, highlight the corresponding `.place-card`, and smoothly scroll it into view in the card list (`card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`).
2. **Mobile Gesture Guard & Touch Ergonomics**: Mobile users scrolling through the trip guide must never be trapped in the Leaflet map container by single-touch dragging. We implement **Cooperative Gesture Handling** (2-finger map pan + instructional overlay), expanded touch hit targets (>=44x44px with a 60x60px invisible touch hit cylinder via CSS pseudo-elements), and `touch-action: manipulation` across all interactive elements.

---

## 2. Current Implementation Analysis & Identified Gaps

### 2.1 Card -> Marker Synchronization (Current vs Target)
- **Current state (`app.js:366-375`)**:
  ```javascript
  sidebarList.querySelectorAll('.map-place-card').forEach(card => {
    card.addEventListener('click', () => {
      const placeId = card.getAttribute('data-place-id');
      const place = TRIP_DATA.places.find(p => p.id === placeId);
      if (place) {
        mapInstance.flyTo([place.lat, place.lng], 14, { duration: 1 });
        openPlacePopup(place);
      }
    });
  });
  ```
- **Gaps Identified**:
  1. No active styling or class toggle (e.g. `.active`, `.selected`) applied to the clicked card.
  2. `openPlacePopup(place)` performs an O(N) linear scan over `markersLayerGroup.eachLayer()` comparing `lat`/`lng` coordinates with `Math.abs < 0.0001`. This is brittle and inefficient.
  3. No `aria-selected` or accessibility feedback.

### 2.2 Marker -> Card Synchronization (Current vs Target)
- **Current state (`app.js:388-406`)**:
  ```javascript
  const marker = L.marker([place.lat, place.lng], { icon: customIcon }).addTo(markersLayerGroup);
  marker.bindPopup(popupContent);
  ```
- **Gaps Identified**:
  1. Marker click only opens the Leaflet popup; it does **not** trigger any event on the sidebar stop cards.
  2. The sidebar card list remains static—the user has to manually scroll through the list to find the matching place.
  3. No active highlight class or visual cue on the corresponding DOM card.
  4. Missing `card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`.

### 2.3 Mobile Scroll-Trapping in Leaflet (`#map`)
- **Current state (`app.js:290-295`)**:
  `mapInstance = L.map('map', { center: [14.75, 99.95], zoom: 9, zoomControl: true });`
- **Gaps Identified**:
  1. Default Leaflet behavior intercepts all single-finger touchmove events on `#map`.
  2. On mobile screens (where `#map` spans 100% viewport width and 480px height), users attempting to scroll down the page to read stop cards get stuck panning the map.
  3. No visual hint or two-finger gesture handler exists.

### 2.4 Touch Target Ergonomics & Tap Latency
- **Current state**:
  - Visual pins are 44px, but have no expanded hit radius beyond their visual border.
  - Missing explicit `touch-action: manipulation;` on map container and markers to eliminate 300ms mobile browser tap delay.
  - Popup close button is 44px in CSS, but needs clear touch-target padding to avoid accidental dismissals or mis-taps.

---

## 3. Detailed Technical Specification

### 3.1 Architecture: Centralized Marker Registry & Unified Controller

To guarantee zero race conditions, no infinite event loops, and instant O(1) lookups, we introduce a centralized `markersMap` dictionary and a unified controller `selectPlace(placeId, options)`:

```
┌────────────────────────────────────────────────────────┐
│               App State & Marker Registry              │
│  - markersMap: { [placeId: string]: L.Marker }         │
│  - activePlaceId: string | null                        │
└──────────────────┬──────────────────┬──────────────────┘
                   │                  │
         User Taps │                  │ User Taps
         Stop Card │                  │ Map Pin
                   ▼                  ▼
      ┌────────────────────────────────────┐
      │  selectPlace(placeId, options)     │
      │  options:                          │
      │    - fromMarker: boolean           │
      │    - flyMap: boolean               │
      │    - openPopup: boolean            │
      │    - scrollList: boolean           │
      └─────────────────┬──────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
 ┌──────────────────────┐     ┌──────────────────────┐
 │ DOM Card Update:     │     │ Leaflet Map Update:  │
 │ - Remove .active     │     │ - flyTo([lat, lng])  │
 │ - Add .active to id  │     │ - marker.openPopup() │
 │ - scrollIntoView()   │     │ - Pulse marker scale │
 │ - aria-selected=true │     └──────────────────────┘
 └──────────────────────┘
```

---

### 3.2 Specification 1: Bidirectional Synchronization Engine

#### A. Central Marker Registry
```javascript
// Module-level dictionary
let markersMap = {};

function clearMarkersRegistry() {
  markersMap = {};
}
```

#### B. Unified Selection Controller: `selectPlace(placeId, options = {})`
```javascript
/**
 * Unified place selection controller for bidirectional synchronization
 * @param {string} placeId - ID of the place (e.g. 'charger_danchang', 'owlyard')
 * @param {Object} options - Customization flags
 * @param {boolean} [options.fromMarker=false] - If true, triggered from marker click
 * @param {boolean} [options.flyMap=true] - Whether to fly map to coordinates
 * @param {boolean} [options.openPopup=true] - Whether to open the Leaflet popup
 * @param {boolean} [options.scrollList=true] - Whether to scroll the card into view
 * @param {number} [options.zoom=14] - Zoom level for flyTo
 */
function selectPlace(placeId, options = {}) {
  const {
    fromMarker = false,
    flyMap = true,
    openPopup = true,
    scrollList = true,
    zoom = 14
  } = options;

  if (!placeId || typeof TRIP_DATA === 'undefined' || !TRIP_DATA.places) return;
  const place = TRIP_DATA.places.find(p => p.id === placeId);
  if (!place) return;

  // 1. Synchronize DOM Card Elements
  const allCards = document.querySelectorAll('.map-place-card, .place-card');
  let targetCard = null;

  allCards.forEach(card => {
    const cardId = card.getAttribute('data-place-id') || card.getAttribute('data-id');
    const isTarget = (cardId === placeId);
    
    card.classList.toggle('active', isTarget);
    card.classList.toggle('selected', isTarget);
    card.setAttribute('aria-selected', isTarget.toString());
    
    if (isTarget) {
      targetCard = card;
      // Trigger subtle pulse highlight animation
      card.classList.add('card-highlight-pulse');
      setTimeout(() => card.classList.remove('card-highlight-pulse'), 1200);
    }
  });

  // 2. Smoothly Scroll Card into View (when triggered from marker or programmatically)
  if (targetCard && scrollList) {
    targetCard.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }

  // 3. Synchronize Leaflet Map & Marker
  const marker = markersMap[placeId];

  if (mapInstance && flyMap) {
    mapInstance.flyTo([place.lat, place.lng], zoom, {
      duration: 0.8,
      easeLinearity: 0.25
    });
  }

  if (marker && openPopup && !fromMarker) {
    // Open popup after brief pan delay or immediately
    setTimeout(() => {
      if (marker && mapInstance) {
        marker.openPopup();
      }
    }, 150);
  }
}

// Global exposure for debugging & automated testing
window.selectPlace = selectPlace;
```

#### C. Card Click Event Binding
```javascript
sidebarList.querySelectorAll('.map-place-card, .place-card').forEach(card => {
  card.addEventListener('click', (e) => {
    // Prevent overriding if user clicked direct 1-tap navigation button
    if (e.target.closest('a, button, .btn-nav-full, .popup-nav-btn')) return;
    
    const placeId = card.getAttribute('data-place-id') || card.getAttribute('data-id');
    if (placeId) {
      selectPlace(placeId, {
        fromMarker: false,
        flyMap: true,
        openPopup: true,
        scrollList: false // Already at clicked card
      });
    }
  });
});
```

#### D. Marker Click Event Binding
```javascript
const marker = L.marker([place.lat, place.lng], { icon: customIcon }).addTo(markersLayerGroup);
markersMap[place.id] = marker;

marker.bindPopup(popupContent, {
  offset: [0, -10],
  maxWidth: 320,
  minWidth: 260,
  autoPan: true,
  autoPanPadding: [30, 30]
});

// Marker click syncs to card
marker.on('click', () => {
  selectPlace(place.id, {
    fromMarker: true,
    flyMap: false,    // Leaflet popup autoPan handles viewport positioning
    openPopup: true,
    scrollList: true  // Automatically scrolls sidebar to matching card
  });
});
```

---

### 3.3 Specification 2: Mobile Leaflet Gesture Guard (Scroll-Trap Prevention)

#### A. The Cooperative Gesture Handling Pattern
To solve the mobile scroll-trap problem without external libraries, we install a touch listener on the map wrapper that implements Google Maps-style **Cooperative Gesture Handling**:
- **1 Finger on Mobile**: Map does not drag. Page scrolls vertically with standard browser smoothness.
- **2 Fingers on Mobile**: Map dragging and pinch-zoom are immediately enabled.
- **Single-finger drag attempt**: Displays a sleek floating glassmorphism banner: `"📱 ใช้ 2 นิ้วเพื่อเลื่อนแผนที่ / Use 2 fingers to pan map"`.

#### B. Implementation Code: `initMapGestureGuard()`
```javascript
function initMapGestureGuard(map, mapContainer) {
  if (!map || !mapContainer) return;

  // 1. Inject or Locate Gesture Overlay
  let overlay = mapContainer.querySelector('.map-gesture-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'map-gesture-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="map-gesture-pill">
        <i data-lucide="hand" style="width: 18px; height: 18px;"></i>
        <span>ใช้ 2 นิ้วเพื่อเลื่อนแผนที่ (Use 2 fingers to pan)</span>
      </div>
    `;
    mapContainer.appendChild(overlay);
    if (window.lucide) lucide.createIcons();
  }

  // Check if device supports touch
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouchDevice) return;

  // Initially disable single finger dragging on touch devices
  map.dragging.disable();

  let gestureHintTimeout = null;

  function showGestureHint() {
    overlay.classList.add('is-visible');
    clearTimeout(gestureHintTimeout);
    gestureHintTimeout = setTimeout(() => {
      overlay.classList.remove('is-visible');
    }, 1500);
  }

  // 2. Touch Event Listeners
  mapContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length >= 2) {
      map.dragging.enable();
      overlay.classList.remove('is-visible');
    } else {
      map.dragging.disable();
    }
  }, { passive: true });

  mapContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && !map.dragging.enabled()) {
      showGestureHint();
    }
  }, { passive: true });

  mapContainer.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      map.dragging.disable();
    }
  }, { passive: true });

  // Re-enable dragging if user uses mouse pointer on hybrid touch laptops
  mapContainer.addEventListener('mousedown', () => {
    map.dragging.enable();
  });
}
```

#### C. CSS Architecture for Gesture Overlay & Scroll Guard
```css
/* Map Container Wrapper */
.map-container-wrapper {
  position: relative;
  touch-action: pan-y; /* Allows vertical page scroll on touch */
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Floating Gesture Toast Overlay */
.map-gesture-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.25s ease, visibility 0.25s ease;
  border-radius: var(--radius-lg);
}

.map-gesture-overlay.is-visible {
  opacity: 1;
  visibility: visible;
}

.map-gesture-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-xl);
  font-size: 0.9rem;
  font-weight: 700;
  animation: pulseScale 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes pulseScale {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

### 3.4 Specification 3: Driver Touch Ergonomics & Expanded Hit Targets

#### A. 60x60px Invisible Hit Cylinder for Map Marker Pins
Even though the visual pin is 44x44px (and 48x48px for super highlights), tapping while driving or on rough roads can easily miss a tight bounding box. We expand the hit area using a CSS `::before` pseudo-element with `inset: -8px;` yielding a **60x60px** effective hit zone:

```css
/* Custom Marker Pin Base */
.custom-map-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-full);
  color: #ffffff;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
  border: 2.5px solid #ffffff;
  cursor: pointer;
  touch-action: manipulation; /* Removes 300ms tap delay */
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}

/* Expanded Touch Hit Target Cylinder (60x60px) */
.custom-map-pin::before {
  content: '';
  position: absolute;
  inset: -8px; /* 44px + 16px = 60px diameter touch zone */
  border-radius: var(--radius-full);
  pointer-events: auto;
}

/* Active / Hover Pin Animation */
.custom-map-pin:hover,
.custom-map-pin:active {
  transform: scale(1.18);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
}
```

#### B. Highlight & Selection Styling for Stop Cards
When a card is activated via marker click or direct tap:
```css
.map-place-card.active,
.map-place-card.selected,
.place-card.active {
  border-color: var(--primary) !important;
  background: var(--bg-card) !important;
  box-shadow: 0 0 0 2px var(--primary), var(--shadow-md) !important;
  transform: translateX(4px);
}

/* Pulse animation triggered upon selection */
.card-highlight-pulse {
  animation: cardPulse 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardPulse {
  0% { box-shadow: 0 0 0 0 var(--primary-glow); }
  40% { box-shadow: 0 0 0 8px var(--primary-glow); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
```

#### C. Zoom Controls and Popup Close Ergonomics
```css
/* Leaflet Zoom Control (+ / -) Sizing >=44px */
.leaflet-control-zoom-in,
.leaflet-control-zoom-out {
  width: 44px !important;
  height: 44px !important;
  line-height: 44px !important;
  font-size: 1.35rem !important;
  font-weight: 700 !important;
  touch-action: manipulation !important;
}

/* Leaflet Popup Close Button >=44px */
.leaflet-popup-close-button {
  width: 44px !important;
  height: 44px !important;
  line-height: 44px !important;
  font-size: 1.3rem !important;
  top: 0 !important;
  right: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  touch-action: manipulation !important;
}

/* 1-Tap Google Maps Navigation Button >=48px */
.popup-nav-btn,
.btn-nav-full {
  min-height: 48px !important;
  touch-action: manipulation !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}
```

---

## 4. Verification & Testing Matrix

To ensure robust test coverage, the following test scenarios will be integrated into the test harness:

| Test ID | Category | Scenario | Expected Behavior |
|---|---|---|---|
| **M2-SYNC-1** | Bidirectional Sync | User clicks stop card (`[data-place-id="charger_danchang"]`) | 1. Card receives `.active` class.<br>2. Sibling cards lose `.active`.<br>3. `mapInstance.flyTo()` called with Dan Chang coordinates.<br>4. Dan Chang popup opens. |
| **M2-SYNC-2** | Bidirectional Sync | User clicks marker on Leaflet map | 1. Marker popup opens.<br>2. DOM queries `.map-place-card[data-place-id="..."]`.<br>3. Target card receives `.active` class and `.card-highlight-pulse`.<br>4. `card.scrollIntoView()` called with `{ behavior: 'smooth', block: 'nearest' }`. |
| **M2-SYNC-3** | Edge Case | Rapid alternating clicks between cards and markers (50 cycles) | Zero DOM desynchronization, exactly one card marked `.active` at any moment, no JavaScript errors or infinite loops. |
| **M2-GEST-1** | Mobile Gesture | Single-finger touch on mobile `#map` wrapper | Map dragging remains disabled, page scrolls vertically without getting trapped, gesture hint appears. |
| **M2-GEST-2** | Mobile Gesture | Two-finger touch on mobile `#map` wrapper | Map dragging is immediately enabled, allowing pan and pinch zoom. |
| **M2-TOUCH-1** | Driver Ergonomics | Validate marker pin touch hit target in CSS | `custom-map-pin` defines minimum 44x44px width/height and `::before` pseudo-element with `inset: -8px` (60px hit zone). |
| **M2-TOUCH-2** | Driver Ergonomics | Validate `touch-action: manipulation` | Present on `.custom-map-pin`, `.popup-nav-btn`, `.btn-nav-full`, `.leaflet-popup-close-button`, `.filter-chip`. |

---

## 5. Summary of Recommended Actions for Worker

1. **`app.js`**:
   - Add `markersMap = {}` registry.
   - Implement `selectPlace(placeId, options)`.
   - Update `renderMapMarkers()` to populate `markersMap`, bind marker `click` to `selectPlace()`, and bind card `click` to `selectPlace()`.
   - Implement `initMapGestureGuard(mapInstance, mapElement)`.
2. **`style.css`**:
   - Add `.map-gesture-overlay`, `.map-gesture-pill`, and animation keyframes.
   - Add `::before` pseudo-element on `.custom-map-pin` for 60x60px touch cylinder.
   - Add `.map-place-card.active`, `.card-highlight-pulse`, and keyframes.
   - Verify `touch-action: manipulation;` on all interactive touch classes.
3. **`test/`**:
   - Add Tier 1-4 tests for bidirectional marker-card sync and gesture handling.
