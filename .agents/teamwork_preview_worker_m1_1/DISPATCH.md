## 2026-08-28T16:40:12Z
You are the M1 Implementation Worker (UI Foundation, Navigation Consolidation & Driver Ergonomics).
Your working directory: d:\Project\CampingTrip\.agents\teamwork_preview_worker_m1_1
Your parent is: teamwork_preview_orchestrator (conv ID: 7fd6582b-6aa3-4ea0-9151-ef21112d7682)

Read ORIGINAL_REQUEST.md at: d:\Project\CampingTrip\.agents\ORIGINAL_REQUEST.md
Read PROJECT.md at: d:\Project\CampingTrip\PROJECT.md
Read M1 Explorer 1 Report at: d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m1_1\handoff.md
Read M1 Explorer 2 Report at: d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m1_2\handoff.md
Read M1 Explorer 3 Report at: d:\Project\CampingTrip\.agents\teamwork_preview_explorer_m1_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- `d:\Project\CampingTrip\index.html`
- `d:\Project\CampingTrip\style.css`
- `d:\Project\CampingTrip\app.js` (Navigation routing and drawer toggle functions)
- Your `.agents` directory

Implementation Scope:
1. **Consolidate Navigation in `index.html`**:
   - Eliminate triple nav redundancy (remove duplicate hero goto-tab buttons and duplicate desktop/mobile clutter).
   - Create 2 primary views:
     - View 1: `tab-trip` / `view-trip` (🗺️ แผนที่ & จุดแวะ)
     - View 2: `tab-simulator` / `view-simulator` (⚡ จำลองแบต 2 คัน)
   - Add top quick action / header trigger for: ⛺ คู่มือแคมป์ & SOS (drawer/modal `#drawerCampSos`).
   - Clean mobile bottom navigation mirroring the 2 primary views + SOS drawer trigger.
2. **Apply High-Contrast Daylight Theme in `style.css`**:
   - Update `:root` and `[data-theme="dark"]` design tokens to meet/exceed WCAG AA 4.5:1 (deep forest green `#047857` / `#065f46`, text `#0f172a` / `#334155`, etc.).
   - Set all interactive tap targets to minimum 44x44px (or >= 48px).
   - Set custom range sliders to 48px touch height and 28-32px custom thumbs.
   - Add safe-area insets (`env(safe-area-inset-bottom)`) and proper container spacing.
3. **Wire Navigation and Drawer Logic in `app.js`**:
   - Implement `switchTab(tabId)` handling `#tab-trip` and `#tab-simulator`. Ensure `mapInstance.invalidateSize()` is called when switching to trip view.
   - Implement `openCampSosDrawer()` and `closeCampSosDrawer()`.
4. **Verification**:
   - Run `node test/run-tests.js` to ensure all tests pass.
   - Run `node --check app.js data.js`.
   - Write your handoff report to `d:\Project\CampingTrip\.agents\teamwork_preview_worker_m1_1\handoff.md`.
   - Send completion message via send_message to parent.
