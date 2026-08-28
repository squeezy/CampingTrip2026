# BRIEFING — 2026-08-28T23:37:30+07:00

## Mission
Formulate exact HTML & JS specification for Milestone 1 (Navigation & View Architecture) to eliminate triple nav redundancy, consolidate to a 2-view + Quick Drawer layout, and implement robust view switching in `app.js`.

## 🔒 My Identity
- Archetype: Explorer (Teamwork Explorer)
- Roles: Navigation & View Architecture Specification
- Working directory: d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m1_1
- Original parent: teamwork_preview_orchestrator (conv ID: 7fd6582b-6aa3-4ea0-9151-ef21112d7682)
- Milestone: M1 (UI Foundation & Navigation Consolidation)

## 🔒 Key Constraints
- Read-only investigation — do NOT modify project source code directly during exploration.
- Write analysis and handoff reports to `.agents/teamwork_preview_explorer_m1_1/`.
- Address requirements R1 (Eliminate Redundancy) and R2 (Driver Ergonomics) within view architecture scope.
- Maintain compatibility with Milestone 2 (Map & Stop Cards) and Milestone 3 (EV Simulator & Camp Drawer).

## Current Parent
- Conversation ID: 7fd6582b-6aa3-4ea0-9151-ef21112d7682
- Updated: 2026-08-28T23:37:30+07:00

## Investigation State
- **Explored paths**:
  - `index.html`: Header nav (lines 38-53), Hero section (lines 68-99), Tab sections 1-3 (lines 104-309), Bottom nav (lines 312-327).
  - `app.js`: Tab switching logic (lines 53-109), Map invalidation (lines 83-87), Event hooks.
  - `data.js`: `TRIP_DATA.places`, `TRIP_DATA.chargeAndChillHubs`, `TRIP_DATA.evCampingGuide`.
  - `PROJECT.md`: Feature inventory (F1-F10), milestones M1-M4 & M-E2E.
- **Key findings**:
  - Triple redundancy: Desktop header nav (3 buttons), Hero card buttons (3 buttons), Mobile bottom nav (3 buttons).
  - 3 tabs (`tab-map`, `tab-charge-chill`, `tab-simulator`) cause fragmentation between map stops and food/charging hubs.
  - Recommended consolidation: 2 primary views (`view-trip` and `view-simulator`) + 1 persistent/drawer Quick Action (`#drawer-camp-sos`).
  - View switching must handle URL hash routing (`#trip`, `#simulator`), Leaflet map resize (`invalidateSize`), and aria attributes.
- **Unexplored areas**: None. Scope clearly defined.

## Key Decisions Made
- Consolidate 3 tabs to 2 core views:
  1. `view-trip` (🗺️ แผนที่ & จุดแวะ / Trip & Route)
  2. `view-simulator` (⚡ จำลองแบต 2 คัน / 2-Car EV Simulator)
- Elevate Camp Mode & Emergency Hotlines into a dedicated drawer/modal (`#drawer-camp-sos` / `drawer-backdrop`) accessible from both header button and mobile bottom quick-action.
- Remove redundant hero `[data-goto-tab]` buttons and streamline the hero header.
- Implement URL hash sync (`window.location.hash`), popstate handling, keyboard accessibility (`role="tab"`, `aria-selected`, `aria-controls`), and smooth transitions without jarring layout jumps.

## Artifact Index
- `.agents/teamwork_preview_explorer_m1_1/DISPATCH.md` — Initial dispatch message
- `.agents/teamwork_preview_explorer_m1_1/BRIEFING.md` — Agent briefing & working state
- `.agents/teamwork_preview_explorer_m1_1/progress.md` — Step-by-step progress tracking
- `.agents/teamwork_preview_explorer_m1_1/analysis.md` — Detailed technical specification for HTML & JS navigation
- `.agents/teamwork_preview_explorer_m1_1/handoff.md` — 5-Component self-contained handoff report
