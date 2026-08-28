# Project: EV Camping Trip Web App UX & Usability Overhaul

## Architecture
Single-page, mobile-driver-first web application designed for 2-car EV convoy road trips (Bangkok to Owl Yard Camp, Ban Rai, Uthai Thani).
- **Core Stack**: Vanilla JavaScript (ES6+), HTML5 semantic markup, CSS3 custom properties & responsive layout, Leaflet.js interactive mapping, Lucide icons.
- **State Management**: Reactive in-memory state engine with `localStorage` persistence for vehicle configurations, active journey phase, and user preferences.
- **UX Paradigm**: Radical consolidation of fragmented tabs into 2 streamlined, high-contrast views with progressive disclosure and zero text walls:
  1. **Trip & Route View**: Leaflet interactive map synchronized with a 3-phase journey feed (🟢 ขาไป / 🏕️ รอบแคมป์ & บ้านไร่ / 🟡 ขากลับ), direct 1-tap Google Maps navigation, charging speed badges, and food highlights.
  2. **2-Car EV Camp Simulator View**: Visual battery cylinders, 1-tap Thai EV vehicle presets, 3-tier climate presets, V2L load toggle, and Convoy Safety Margin gauge.
  3. **Camp Mode & SOS Quick Drawer**: Collapsible 1-tap brand-specific camp mode guides (Tesla, BYD, MG, GWM, Deepal, Aion) and emergency roadside hotlines.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Navigation & Layout Consolidation | Consolidate triple navigation redundancy and redundant tabs into a clean 2-view bar + header theme toggle | M1 | Survey / R1 |
| F2 | High-Contrast Daylight Theme & Touch Ergonomics | WCAG AA compliant daylight tokens (#047857, #0f172a, #475569) and >=44x44px tap targets | M1 | Survey / R2 |
| F3 | Unified Journey Data Model & Phase Tagging | Enrich `TRIP_DATA.places` with `phase` ('outbound' / 'campsite' / 'inbound'), `powerKw`, `plugType`, `foodHighlights`, and direct `navUrl` | M2 | Survey / R1, R3 |
| F4 | Interactive Leaflet Map Polish & Gesture Guard | Prevent mobile scroll trap, fix dark mode tiles (CartoDB Dark Matter), and add phase zoom presets (`fitBounds`) | M2 | Survey / R3 |
| F5 | Synchronized Stop Cards & 1-Tap Navigation | Driver stop cards with direct Google Maps navigation, structured charging/food pills, and bidirectional marker-card sync | M2 | Survey / R2, R3 |
| F6 | Streamlined 2-Car EV Simulator Engine & Presets | 17 Thai EV vehicle presets, 3-tier climate presets, V2L load calculation, and convoy safety ratio | M3 | Survey / R4 |
| F7 | Visual Battery Widgets & Safety Gauges | Animated visual battery cylinders with color-coded morning range and safety ratio to next 65km charger | M3 | Survey / R4 |
| F8 | Brand Camp Guide & Emergency SOS Drawer | Expandable drawer rendering brand-by-brand camp instructions and 1-tap phone dialers | M3 | Survey / R1, R2 |
| F9 | Dead CSS Cleanup & Code Maintainability | Prune ~380 lines of unused CSS and validate syntax across all JS files (`node --check`) | M4 | Survey / Acceptance |
| F10 | Comprehensive Automated E2E Test Suite | Automated test runner and 4-tier opaque-box test suite verifying all features, calculations, and data | M-E2E | Dual Track |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | UI Foundation & Driver Ergonomics | Navigation consolidation, header/footer cleanup, WCAG AA daylight contrast, >=44px touch targets | None | DONE |
| M2 | Interactive Map & Synchronized Journey Stops | Leaflet dark/light tiles, gesture scroll guard, 3-phase journey filtering, bidirectional sync, 1-tap nav cards | M1 | DONE |
| M3 | 2-Car EV Simulator & Camp Mode Drawer | Vehicle presets, climate presets, V2L toggle, visual battery meters, convoy safety ratio, SOS drawer | M1 | PLANNED |
| M4 | Code Cleanup, Optimization & CSS Pruning | Remove dead CSS rules, harmonize styling, optimize assets, verify zero regressions | M2, M3 | PLANNED |
| M-E2E | E2E Testing Suite & Test Harness | Automated test suite covering Tiers 1-4 (feature coverage, boundary cases, pairwise, real-world scenarios) | M1 | PLANNED |
| M-FINAL | Final Verification, Hardening & Git Commit | Pass 100% E2E tests, run adversarial checks, syntax validation (`node --check`), commit to local git repo | M4, M-E2E | PLANNED |

## Interface Contracts
### `TRIP_DATA.places` Object Contract
```typescript
interface PlaceItem {
  id: string;
  name: string;
  subCategory: string;
  category: 'camp' | 'charger' | 'food' | 'cafe' | 'poi';
  phase: 'outbound' | 'campsite' | 'inbound';
  lat: number;
  lng: number;
  distanceFromOrigin: number; // km from origin (Mega Bangna)
  powerKw?: number; // e.g. 120, 160, 360
  plugType?: string; // e.g. 'CCS2 2 หัว', 'PEA VOLTA 50kW'
  networkApp?: string; // e.g. 'EleXA', 'PEA VOLTA', 'Evolt'
  foodHighlights?: string[]; // e.g. ['ผัดไทยโบราณ', 'กาแฟสด']
  description: string;
  navUrl: string; // https://www.google.com/maps/dir/?api=1&destination=lat,lng
  openHours?: string;
  highlight?: string;
}
```

### `EVSimulator` State Contract
```typescript
interface EVProfile {
  brand: string;
  model: string;
  batteryCap: number; // kWh
  consumption: number; // kWh / 100km
}

interface SimState {
  car1: EVProfile;
  car2: EVProfile;
  climateMode: 'chill' | 'normal' | 'eco'; // 1.4kW, 1.0kW, 0.8kW
  sleepHours: number; // 4 to 12 hours
  v2lEnabled: boolean; // +2.0 kWh
}

interface SimResult {
  arrivalSoc: number; // %
  arrivalKwh: number; // kWh
  sleepEnergyKwh: number; // kWh
  morningSoc: number; // %
  morningKwh: number; // kWh
  morningRangeKm: number; // km
  safetyRatio: number; // morningRangeKm / 65km (distance to next PTT bypass charger)
  safetyStatus: 'safe' | 'warning' | 'danger';
}
```

## Code Layout
- `d:\Project\CampingTrip\index.html`: Main semantic HTML structure, clean 2-view containers, navigation bar, map container, stop cards list, simulator widget, SOS drawer.
- `d:\Project\CampingTrip\style.css`: High-contrast design tokens, responsive CSS grid/flexbox, Leaflet map styling, battery meter animations, driver-first tap target sizing.
- `d:\Project\CampingTrip\data.js`: Unified trip datasets, enriched 3-phase places data, EV vehicle presets, brand camp guides, emergency numbers.
- `d:\Project\CampingTrip\app.js`: Application controller, view routing, map initialization & bidirectional sync, simulator calculation engine, local storage persistence.
- `d:\Project\CampingTrip\test\`: Automated test suite, test harness, calculation unit tests, and DOM/data integrity assertions.
