# BRIEFING — 2026-08-28T16:47:19Z

## Mission
Formulate exact technical specification for Milestone 2: Bidirectional Marker <-> Card Synchronization and Mobile Leaflet Gesture Handling & Touch Ergonomics.

## 🔒 My Identity
- Archetype: explorer
- Roles: bidirectional-sync-spec, touch-ergonomics-spec, mobile-gesture-guard
- Working directory: d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m2_3
- Original parent: 7fd6582b-6aa3-4ea0-9151-ef21112d7682
- Milestone: M2 (Interactive Map & Synchronized Journey Stops)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement directly in project source code (proposals only via handoff & analysis files)
- Ensure WCAG AA compliance and Apple HIG / Android touch target sizing (>=44x44px, 48px for primary CTAs)
- Prevent mobile scroll-trapping while maintaining smooth touch interaction
- Ensure 100% test compatibility and clear verification commands

## Current Parent
- Conversation ID: 7fd6582b-6aa3-4ea0-9151-ef21112d7682
- Updated: 2026-08-28T16:47:19Z

## Investigation State
- **Explored paths**: `index.html`, `style.css`, `app.js`, `data.js`, `PROJECT.md`, `test/run-tests.js`, `test/test_dom_structure.js`
- **Key findings**:
  1. Card click currently flies map and opens popup but does not highlight active card or clean up sibling highlights.
  2. Marker click currently does not find `.place-card` by data-id, does not highlight card, and does not call `card.scrollIntoView()`.
  3. Single-finger mobile touch traps page scroll in `#map` without cooperative 2-finger gesture guard.
  4. Custom map pins are 44px visual, but need expanded invisible hit zones (`::before` pseudo-element with `inset: -8px`) and `touch-action: manipulation` to guarantee zero 300ms tap latency and reliable finger taps on bumpy road conditions.
- **Unexplored areas**: None. Codebase baseline and test suite are thoroughly mapped.

## Key Decisions Made
- Use `markersMap` dictionary lookup for O(1) marker access by `place.id`.
- Decouple marker click and card click via a unified `selectPlace(placeId, { fromMarker, flyMap })` method to avoid infinite recursion and ensure clean state updates.
- Implement zero-dependency Cooperative Gesture Handling on touch viewports (2-finger requirement + instructional overlay) to completely eliminate mobile scroll traps.
- Enforce >=44x44px for secondary interactive elements and >=48px for primary CTA buttons, with `touch-action: manipulation`.

## Artifact Index
- `d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m2_3\analysis.md` — In-depth technical analysis & specification
- `d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m2_3\handoff.md` — 5-component handoff report for Worker & Orchestrator
