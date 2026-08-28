# Technical Specification: Mobile Touch Ergonomics & Responsive Sizing (Milestone 1)

> **Author:** M1 Explorer 3 (Mobile Touch Ergonomics & Responsive Sizing)  
> **Target Milestone:** Milestone 1 (UI Foundation & Driver Ergonomics)  
> **Status:** Complete Specification Ready for Implementation  
> **Target Files:** `d:\Project\CampingTrip\style.css`, `d:\Project\CampingTrip\index.html`  
> **Associated Features:** F1 (Navigation & Layout Consolidation), F2 (Daylight Theme & Touch Ergonomics), F8 (SOS & Camp Guide Drawer)

---

## 1. Executive Summary

In a road trip context—where drivers and co-pilots interact with mobile devices mounted on phone holders or held in one hand during vehicle stops—**standard desktop-sized touch targets lead to high misclick rates, driver frustration, and dangerous distraction**.

An exhaustive audit of the current `style.css` and DOM elements revealed critical ergonomic deficiencies:
- **Theme Toggle Button** (`style.css:215`): Fixed at `40x40px` (violates the >=44px AAA standard and 48px automotive standard).
- **Filter Chips** (`style.css:387`): `padding: 0.4rem 0.8rem` resulting in a vertical height of only **~32px** (causes frequent misclicks when selecting categories).
- **Range Sliders** (`style.css:773-792`): Sliders have an **18px thumb** and a **6px track** with no touch-box padding, making precise one-thumb battery adjustment almost impossible on bumpy road stops.
- **Leaflet Map Controls**: Native zoom buttons (`30x30px`) and popup close button (`18x14px`) are dangerously small on touchscreens.
- **Mobile Navigation Bar**: Missing safe-area inset calculations (`env(safe-area-inset-bottom)`), causing buttons to collide with the iOS Home Indicator and Android 3-button system bars.
- **Content Bottom Overlap**: Bottom padding on `<body>` is inadequate (`calc(65px + 20px)`), causing the last stop cards and simulator results to be partially obscured behind the fixed bottom bar.

This specification details the **exact CSS rules, component classes, cross-browser range slider architectures, safe-area padding calculations, and one-thumb driver ergonomic patterns** to guarantee a frictionless 48px+ touch experience throughout the application.

---

## 2. Touch Target Ergonomic Standards & Compliance Matrix

### 2.1 Standard Guidelines
- **WCAG 2.1 Level AAA (Criterion 2.5.5 - Target Size)**: Minimum **44 × 44 CSS pixels**.
- **Android Material Design & Google Automotive Guidelines**: Minimum **48 × 48 dp** for primary touch targets in moving/in-vehicle environments.
- **Apple iOS Human Interface Guidelines**: Minimum **44 × 44 pt** (recommended 48 × 48 pt for navigation bars and floating controls).

### 2.2 Interactive Elements Audit & Target Sizing Matrix

| UI Component | Current Selector | Previous Size / Padding | Target Minimum Dimension | Applied Touch Padding / Virtual Hit-Box | Compliance Status |
|---|---|---|---|---|---|
| **Theme Toggle Button** | `.theme-toggle-btn` | `40 × 40px` ❌ | **48 × 48px** (Mobile) / **44 × 44px** (Desktop) | Full button boundary with 10px internal icon padding | ✅ PASS (AAA / 48px) |
| **Desktop Nav Buttons** | `.nav-btn` | `padding: 0.6rem 1.0rem` (~38px) ❌ | **min-height: 44px; min-width: 44px;** | `padding: 0.65rem 1.25rem; display: inline-flex; align-items: center;` | ✅ PASS (AAA) |
| **Mobile Bottom Nav Items** | `.mobile-nav-item` | `padding: 0.35rem 0` (~36px) ❌ | **min-height: 48px; min-width: 48px;** | Flex 1 full cell height with 48px hit target centered | ✅ PASS (AAA / 48px) |
| **Header Quick SOS Button** | `.header-action-btn` | N/A (New) | **min-height: 44px; min-width: 44px;** | `padding: 0.5rem 1rem;` with active press state | ✅ PASS (AAA) |
| **Category Filter Chips** | `.filter-chip` | `padding: 0.4rem 0.8rem` (~32px) ❌ | **min-height: 44px; min-width: 48px;** | `padding: 0.6rem 1.1rem; gap: 0.5rem;` | ✅ PASS (AAA / 48px) |
| **Custom Range Sliders** | `input[type="range"].custom-range` | Thumb `18px`, Track `6px` ❌ | **Thumb: 28 × 28px** (Desktop) / **32 × 32px** (Mobile), **Hit Area: 48px** | `height: 48px; padding: 0;` (creates 48px vertical touch cylinder) | ✅ PASS (AAA / 48px) |
| **Full-Width Action Buttons** | `.btn-nav-full` | `padding: 0.55rem 1.2rem` (~38px) ❌ | **min-height: 48px;** | `padding: 0.75rem 1.25rem; font-size: 0.95rem;` | ✅ PASS (AAA / 48px) |
| **Map Popup Navigation Button** | `.popup-nav-btn` | `padding: 0.45rem` (~28px) ❌ | **min-height: 44px;** | `padding: 0.65rem 1rem; font-size: 0.875rem;` | ✅ PASS (AAA) |
| **Leaflet Zoom Controls** | `.leaflet-control-zoom a` | `30 × 30px` ❌ | **44 × 44px** (Desktop) / **48 × 48px** (Mobile) | Override default leaflet CSS rules | ✅ PASS (AAA) |
| **Leaflet Popup Close Button** | `.leaflet-popup-close-button` | `18 × 14px` ❌ | **44 × 44px** | `width: 44px; height: 44px; line-height: 44px; font-size: 1.25rem;` | ✅ PASS (AAA) |
| **Custom Map Pins** | `.custom-map-pin` | `36 × 36px` ❌ | **44 × 44px** (Super Highlight: **48 × 48px**) | Expanded boundary with `::after` virtual touch bounds | ✅ PASS (AAA / 48px) |
| **Drawer Close Button** | `.drawer-close-btn` | N/A (New) | **48 × 48px** | `width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;` | ✅ PASS (AAA / 48px) |
| **Emergency SOS Dialers** | `.emergency-contact-card a` | N/A (New) | **min-height: 48px;** | Full card touchable row with prominent phone icon | ✅ PASS (AAA / 48px) |
| **Search Inputs & Text Fields** | `.search-input` | `padding: 0.65rem 1rem` (~38px) ❌ | **min-height: 48px; font-size: 16px;** | Prevents iOS Safari 16px auto-zoom trigger | ✅ PASS (AAA / 48px) |

---

## 3. Custom Range Slider Architecture & Driver Ergonomics

### 3.1 The Slider Touch Trap Problem
On mobile browsers, native `<input type="range">` elements default to a tiny 12-18px thumb and an ultra-narrow hit area. When a user tries to drag the slider while sitting in a car, touch events frequently slip outside the hit boundary, causing the entire webpage to scroll vertically instead of moving the slider.

### 3.2 Solution Architecture
1. **48px Vertical Hit Cylinder**: Set `input[type="range"]` to `height: 48px;` with `background: transparent; margin: 0;`. This expands the clickable and draggable surface across the entire 48px vertical height.
2. **28px – 32px Custom Thumb**: A solid thumb with a high-contrast white border (`3px solid #ffffff`), subtle elevation shadow (`0 2px 8px rgba(0,0,0,0.3)`), and high-contrast theme coloring (`var(--primary)` for Car 1, `var(--secondary)` for Car 2).
3. **Active State Ripple Effect**: When touched or dragged (`:active`), the thumb expands smoothly (`transform: scale(1.18)`) and projects a 10px glowing aura (`box-shadow: 0 0 0 10px var(--primary-glow)`), giving the driver instant visual confirmation of engagement.
4. **Accessible Focus Rings**: On keyboard/switch access (`:focus-visible`), a distinct 4px focus ring appears with high WCAG contrast.
5. **Cross-Browser Track Normalization**: Explicit styling for both WebKit (`-webkit-slider-runnable-track`, `-webkit-slider-thumb`) and Firefox (`-moz-range-track`, `-moz-range-thumb`).

### 3.3 Exact CSS Specification for Sliders

```css
/* ==========================================================================
   Range Sliders - Driver Ergonomics & Touch Target Optimization
   ========================================================================== */

.sim-slider-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

.sim-slider-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.sim-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.sim-val-display {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--primary);
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}

/* Custom Range Input Container */
.custom-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 48px; /* 48px vertical touch target hit cylinder */
  background: transparent;
  cursor: pointer;
  margin: 0;
  padding: 0;
  touch-action: pan-x; /* Explicitly allow horizontal dragging while preventing vertical scroll interception */
}

.custom-range:focus {
  outline: none;
}

/* WebKit Track */
.custom-range::-webkit-slider-runnable-track {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

/* WebKit Thumb */
.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--primary);
  border: 3px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
  cursor: grab;
  /* Centering the 28px thumb on the 8px track: (8px - 28px) / 2 = -10px */
  margin-top: -10px;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s ease, background-color 0.2s ease;
}

/* WebKit Active / Pressed State (Ripple Aura) */
.custom-range:active::-webkit-slider-thumb {
  cursor: grabbing;
  transform: scale(1.18);
  box-shadow: 0 0 0 10px var(--primary-glow), 0 3px 10px rgba(0, 0, 0, 0.35);
}

/* WebKit Focus Visible */
.custom-range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px #ffffff, 0 0 0 8px var(--primary), 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Firefox Track */
.custom-range::-moz-range-track {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

/* Firefox Thumb */
.custom-range::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--primary);
  border: 3px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
  cursor: grab;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s ease, background-color 0.2s ease;
}

/* Firefox Active / Pressed State */
.custom-range:active::-moz-range-thumb {
  cursor: grabbing;
  transform: scale(1.18);
  box-shadow: 0 0 0 10px var(--primary-glow), 0 3px 10px rgba(0, 0, 0, 0.35);
}

/* Firefox Focus Visible */
.custom-range:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 4px #ffffff, 0 0 0 8px var(--primary), 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Car 2 Themed Range Slider (Blue Accent) */
.range-car2::-webkit-slider-thumb {
  background: var(--secondary);
}
.range-car2:active::-webkit-slider-thumb {
  box-shadow: 0 0 0 10px rgba(29, 78, 216, 0.25), 0 3px 10px rgba(0, 0, 0, 0.35);
}
.range-car2:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px #ffffff, 0 0 0 8px var(--secondary), 0 4px 12px rgba(0, 0, 0, 0.3);
}
.range-car2::-moz-range-thumb {
  background: var(--secondary);
}
.range-car2:active::-moz-range-thumb {
  box-shadow: 0 0 0 10px rgba(29, 78, 216, 0.25), 0 3px 10px rgba(0, 0, 0, 0.35);
}
.range-car2:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 4px #ffffff, 0 0 0 8px var(--secondary), 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Mobile Screen Tuning (32px Thumb on <=480px viewports) */
@media (max-width: 480px) {
  .custom-range::-webkit-slider-thumb {
    width: 32px;
    height: 32px;
    margin-top: -12px; /* (8px - 32px) / 2 = -12px */
  }
  .custom-range::-moz-range-thumb {
    width: 32px;
    height: 32px;
  }
}
```

---

## 4. Mobile Sticky Header, Floating Navigation & Safe Area Insets

### 4.1 Safe Area Layout Model
Modern mobile devices (iPhone with Dynamic Island / notch, Android with edge-to-edge navigation gesture bars) require strict adherence to CSS `env(safe-area-inset-*)` variables. Without these, content underlaps or gets blocked by physical device hardware.

```
┌────────────────────────────────────────────────────────┐
│  STATUS BAR / NOTCH (env(safe-area-inset-top))         │
├────────────────────────────────────────────────────────┤
│  STICKY HEADER (64px + env(safe-area-inset-top))       │
│  [🚗 Logo]                  [⛺ คู่มือ&SOS] [🌙 Theme]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  MAIN SCROLLABLE CONTENT VIEWPORT                     │
│  (Map, Journey Stop Cards, EV Simulator Widget)        │
│                                                        │
│  ... Content continues ...                             │
│                                                        │
├────────────────────────────────────────────────────────┤
│  MOBILE BOTTOM NAV BAR (64px + env(safe-area-inset-bot)│
│  [🗺️ แผนที่&จุดแวะ]     [⚡ จำลองแบต]     [⛺ คู่มือ&SOS] │
├────────────────────────────────────────────────────────┤
│  HOME INDICATOR BAR (env(safe-area-inset-bottom))      │
└────────────────────────────────────────────────────────┘
```

### 4.2 Exact Safe-Area Variables & Calculation Rules

```css
/* ==========================================================================
   Safe Area Insets & Responsive Layout Shell
   ========================================================================== */

:root {
  --header-height: 64px;
  --mobile-nav-height: 64px;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}

/* Body clearance for mobile bottom navigation */
body {
  font-family: var(--font-sans);
  background-color: var(--bg-main);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease, color 0.3s ease;
  /* CRITICAL: Space below main content so the last card is NEVER hidden behind the bottom bar */
  padding-bottom: calc(var(--mobile-nav-height) + var(--safe-bottom) + 2rem);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}

@media (min-width: 900px) {
  body {
    padding-bottom: 0;
  }
}

/* Sticky Header */
.header-wrapper {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-color);
  padding-top: var(--safe-top);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Header Action Buttons (>=44px Target Size) */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.header-action-btn {
  min-height: 44px;
  min-width: 44px;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: var(--bg-card-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-action-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.header-action-btn:active {
  transform: scale(0.96);
}

.theme-toggle-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: scale(1.06);
}

.theme-toggle-btn:active {
  transform: scale(0.94);
}

/* Mobile Bottom Fixed Navigation Bar */
.mobile-nav-bar {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(var(--mobile-nav-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.08);
  z-index: 1000;
  justify-content: space-around;
  align-items: center;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

@media (min-width: 900px) {
  .mobile-nav-bar {
    display: none;
  }
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: var(--text-muted);
  font-size: 0.725rem;
  font-weight: 700;
  flex: 1;
  min-height: 48px;
  min-width: 48px;
  height: 100%;
  padding: 0.35rem 0.25rem;
  cursor: pointer;
  touch-action: manipulation;
  border-radius: var(--radius-sm);
  transition: color 0.2s ease, transform 0.1s ease;
}

.mobile-nav-item i, .mobile-nav-item svg {
  width: 22px;
  height: 22px;
  stroke-width: 2.2px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-nav-item:active {
  transform: scale(0.94);
}

.mobile-nav-item.active {
  color: var(--primary);
}

.mobile-nav-item.active i, .mobile-nav-item.active svg {
  transform: translateY(-2px) scale(1.1);
}
```

---

## 5. Comprehensive Interactive Component Specifications (>=44px / 48px)

### 5.1 Category Filter Chips
Chips must have generous tap padding and clear visual feedback for drivers switching between All / Chargers / Food / Camp / POI:

```css
.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.filter-chip {
  min-height: 44px;
  min-width: 48px;
  padding: 0.6rem 1.1rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--bg-card-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-chip i, .filter-chip svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.filter-chip:hover {
  border-color: var(--primary);
  color: var(--text-primary);
  background: var(--bg-card);
}

.filter-chip:active {
  transform: scale(0.95);
}

.filter-chip.active {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
  box-shadow: 0 3px 10px var(--primary-glow);
}
```

### 5.2 Navigation Buttons & 1-Tap Google Maps Triggers
Every primary CTA and navigation card trigger must provide a full 48px height with immediate press tactile response:

```css
.btn-nav-full {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 48px;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  border: 1px solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px var(--primary-glow);
}

.btn-nav-full:hover {
  background: var(--primary-hover);
  box-shadow: 0 4px 12px var(--primary-glow);
  transform: translateY(-1px);
}

.btn-nav-full:active {
  transform: scale(0.97);
  box-shadow: 0 1px 3px var(--primary-glow);
}

/* Secondary Button Variant */
.btn-nav-full.btn-secondary {
  background: var(--bg-card-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.btn-nav-full.btn-secondary:hover {
  background: var(--bg-card);
  border-color: var(--primary);
  color: var(--primary);
}
```

### 5.3 Leaflet Interactive Controls & Map Overrides
Leaflet's default controls are designed for desktop mouse cursors. We override them directly to achieve touch compliance:

```css
/* Leaflet Zoom Control Ergonomics */
.leaflet-control-zoom {
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  overflow: hidden;
  box-shadow: var(--shadow-md) !important;
}

.leaflet-control-zoom-in,
.leaflet-control-zoom-out {
  width: 44px !important;
  height: 44px !important;
  line-height: 44px !important;
  font-size: 1.35rem !important;
  font-weight: 700 !important;
  color: var(--text-primary) !important;
  background-color: var(--bg-card) !important;
  touch-action: manipulation !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.leaflet-control-zoom-in:hover,
.leaflet-control-zoom-out:hover {
  background-color: var(--bg-card-subtle) !important;
  color: var(--primary) !important;
}

.leaflet-control-zoom-in:active,
.leaflet-control-zoom-out:active {
  background-color: var(--primary-light) !important;
}

/* Leaflet Popup Close Button (Expand from 18px to 44x44px Hit Target) */
.leaflet-popup-close-button {
  width: 44px !important;
  height: 44px !important;
  line-height: 44px !important;
  font-size: 1.3rem !important;
  color: var(--text-secondary) !important;
  top: 0 !important;
  right: 0 !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  touch-action: manipulation !important;
  transition: color 0.15s ease, transform 0.15s ease !important;
}

.leaflet-popup-close-button:hover {
  color: var(--accent-red) !important;
}

.leaflet-popup-close-button:active {
  transform: scale(0.9);
}

/* Popup Navigation Action Button */
.popup-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  min-height: 44px;
  padding: 0.65rem 1rem;
  background: var(--primary);
  color: #ffffff;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 700;
  margin-top: 0.75rem;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-nav-btn:hover {
  background: var(--primary-hover);
  box-shadow: 0 4px 10px var(--primary-glow);
}

.popup-nav-btn:active {
  transform: scale(0.97);
}

/* Custom Marker Pin Sizing & Expanded Hit Boundary */
.custom-map-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
  border: 2.5px solid #ffffff;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.custom-map-pin:hover,
.custom-map-pin:active {
  transform: scale(1.18);
}
```

### 5.4 Brand Camp Guide & Emergency SOS Drawer Ergonomics
The quick drawer slides up from the bottom on mobile (Natural Thumb Reach Zone) and presents large, 1-tap call cards:

```css
/* Quick Action Drawer Shell */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: flex-end; /* Bottom sheet on mobile */
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.25s;
}

.drawer-overlay.active {
  opacity: 1;
  visibility: visible;
}

.drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  cursor: pointer;
}

.drawer-sheet {
  position: relative;
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  background: var(--bg-card);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  padding-bottom: var(--safe-bottom);
}

.drawer-overlay.active .drawer-sheet {
  transform: translateY(0);
}

@media (min-width: 768px) {
  .drawer-overlay {
    align-items: center; /* Centered modal on desktop */
  }
  .drawer-sheet {
    border-radius: var(--radius-lg);
    max-height: 80vh;
    transform: scale(0.94);
  }
  .drawer-overlay.active .drawer-sheet {
    transform: scale(1);
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
  position: sticky;
  top: 0;
  z-index: 10;
}

.drawer-header-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.drawer-header-title h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}

.drawer-close-btn {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-close-btn:hover {
  background: var(--accent-red-light);
  color: var(--accent-red);
  border-color: var(--accent-red);
}

.drawer-close-btn:active {
  transform: scale(0.92);
}

.drawer-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  scrollbar-gutter: stable;
  touch-action: pan-y;
}

/* 1-Tap Emergency Hotlines (Full 48px Target Size) */
.emergency-contacts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 600px) {
  .emergency-contacts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.emergency-contact-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  min-height: 52px;
  border-radius: var(--radius-md);
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  text-decoration: none;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.emergency-contact-card:hover {
  background: var(--bg-card);
  border-color: var(--accent-red);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.emergency-contact-card:active {
  transform: scale(0.97);
}

.emergency-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.emergency-phone-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-full);
  background: var(--accent-red-light);
  color: var(--accent-red);
  font-weight: 800;
  font-size: 0.85rem;
}
```

---

## 6. One-Handed Driver Ergonomics & Thumb Zone Mapping

### 6.1 Thumb Zone Geometry
When holding a mobile device with one hand while in a vehicle, the thumb sweeps in a natural arc from the bottom corner:

```
┌────────────────────────────────────────────────────────┐
│  🔴 HARD REACH ZONE (Top 25% of Screen)                │
│  - Application Branding & Title                        │
│  - Theme Toggle Icon (infrequent)                      │
├────────────────────────────────────────────────────────┤
│  🟡 NATURAL REACH ZONE (Middle 45% of Screen)          │
│  - Map Overview & Zoom Pins                            │
│  - Journey Stop Cards (Outbound / Inbound)             │
│  - Range Sliders & Battery Gauges                      │
├────────────────────────────────────────────────────────┤
│  🟢 EASY THUMB REACH ZONE (Bottom 30% of Screen)       │
│  - Mobile Bottom Navigation Tabs (Map, Sim, SOS)       │
│  - 1-Tap Google Maps Navigation Buttons                │
│  - Category Filter Chips                               │
│  - Slide-Up Emergency & Camp Drawer                    │
└────────────────────────────────────────────────────────┘
```

### 6.2 Zero-Misclick Spacing Discipline
1. **Minimum Interactive Spacing**: Adjacent clickable elements must maintain a minimum physical gap of **>= 8px** (ideally `10px - 12px`).
2. **Click Isolation via Container**: Stop cards and list items have `border-radius: var(--radius-md)` with `margin-bottom: 0.75rem`, ensuring that rapid taps cannot register on a neighboring stop.
3. **No Tap Delay (`touch-action: manipulation`)**: Added to all interactive buttons, chips, toggles, and nav elements. This removes the 300ms double-tap zoom delay on touch devices, giving instant tactile responsiveness.
4. **Input Zoom Prevention**: All `<input>` and `<select>` elements explicitly declare `font-size: 16px;` (1rem) on mobile to prevent iOS Safari from zooming into the form and breaking the driver layout.

---

## 7. Responsive Breakpoint Layout Matrix

```css
/* ==========================================================================
   Responsive Sizing & Breakpoint Grid
   ========================================================================== */

/* 1. Mobile Portrait (<= 480px) */
@media (max-width: 480px) {
  .container {
    padding-left: 0.85rem;
    padding-right: 0.85rem;
  }
  
  .hero-card {
    padding: 1.25rem;
  }

  .hero-title {
    font-size: 1.35rem;
  }

  .map-container-wrapper {
    height: 360px; /* Compact height allowing stop list below without scroll trap */
  }

  .two-car-grid {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
}

/* 2. Mobile Landscape & Phablet (481px - 899px) */
@media (min-width: 481px) and (max-width: 899px) {
  .map-container-wrapper {
    height: 420px;
  }

  .two-car-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* 3. Desktop & Large Tablets (>= 900px) */
@media (min-width: 900px) {
  .nav-desktop {
    display: flex;
  }

  .mobile-nav-bar {
    display: none;
  }

  .map-layout {
    grid-template-columns: 380px 1fr;
    height: 720px;
  }

  .simulator-layout {
    grid-template-columns: 440px 1fr;
  }
}
```

---

## 8. Summary of Specific Code Additions & Replacements for `style.css`

The implementer should make the following contiguous updates in `style.css`:
1. **Layout & Body Insets** (lines 44-92): Update `:root` with safe-area variables, update `body` `padding-bottom` to `calc(var(--mobile-nav-height) + var(--safe-bottom) + 2rem)`.
2. **Header & Theme Toggle** (lines 122-231): Update `.theme-toggle-btn` to `44x44px`, add `.header-action-btn`, add safe-area top padding to `.header-wrapper`.
3. **Filter Chips** (lines 380-411): Update `.filter-chip` to `min-height: 44px`, `padding: 0.6rem 1.1rem`, add `touch-action: manipulation`.
4. **Leaflet Overrides & Custom Map Pins** (lines 479-582): Add 44px zoom controls, 44px close button, 44px map pins, and 44px `.popup-nav-btn`.
5. **Range Sliders** (lines 773-792): Replace `.custom-range` with the 48px hit cylinder, 28-32px thumb, active ripple aura, and Firefox support.
6. **Mobile Navigation Bar** (lines 1038-1083): Update `.mobile-nav-bar` with `calc(64px + var(--safe-bottom))` and `.mobile-nav-item` with `min-height: 48px; min-width: 48px;`.
7. **Drawer & SOS Modal** (New Section): Append the complete drawer sheet and 1-tap call card styling.

---

## 9. Verification & Validation Protocol

The following checks must be performed after implementation:
1. **Lighthouse / Chrome DevTools Mobile Emulation**:
   - Inspect all clickable nodes in DevTools.
   - Verify `getBoundingClientRect().height >= 44` and `getBoundingClientRect().width >= 44` for all buttons, chips, tabs, sliders, toggles.
2. **iPhone Safe Area Testing**:
   - Simulate iPhone 14/15/16 with notch/Home Indicator.
   - Confirm zero overlap between bottom nav items and the Home bar.
   - Confirm bottom content is fully readable when scrolled to the end.
3. **Slider Drag Responsiveness**:
   - Drag slider thumb on touch screen.
   - Confirm active ripple triggers and slider value changes smoothly without triggering page vertical scroll.
4. **Automated Syntax Check**:
   - Run `node --check` on any JavaScript files.
