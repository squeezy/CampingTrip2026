## 2026-08-28T16:36:38Z
You are the E2E Test Suite Creator.
Your working directory: d:\Project\CampingTrip\.agents\teamwork_preview_test_writer_e2e
Your parent is: teamwork_preview_orchestrator (conv ID: 7fd6582b-6aa3-4ea0-9151-ef21112d7682)

Read ORIGINAL_REQUEST.md at: d:\Project\CampingTrip\.agents\ORIGINAL_REQUEST.md
Read PROJECT.md at: d:\Project\CampingTrip\PROJECT.md
Read TEST_INFRA.md at: d:\Project\CampingTrip\TEST_INFRA.md

Task:
Implement the complete automated opaque-box test suite for the project in the `d:\Project\CampingTrip\test\` directory.

Your exclusive write ownership: files in `d:\Project\CampingTrip\test\` and your `.agents` folder. DO NOT modify application source code (index.html, style.css, app.js, data.js).

Create the following files in `d:\Project\CampingTrip\test\`:
1. `test/run-tests.js`: Main test runner executing all test suites, aggregating pass/fail counts, and printing tier breakdowns (Tier 1-4). Exits with 0 on pass, non-zero on failure.
2. `test/test_calculations.js`: Tests for EV Simulator calculations (17 vehicle presets, climate power load 0.8/1.0/1.4 kW, sleep hours, V2L +2.0 kWh, arrival SoC, morning battery %, morning remaining range, Convoy Safety Ratio vs 65km charger threshold). Covers happy path, edge cases (0% / 100% SoC, 35kWh to 110kWh battery caps, 4h to 12h sleep).
3. `test/test_data_integrity.js`: Validates `TRIP_DATA` in `data.js` - ensures all places have `id`, `name`, `category`, `phase` ('outbound'|'campsite'|'inbound'), `lat`, `lng`, `distanceFromOrigin`, `navUrl` (valid Google Maps directions URL), charging stations have `powerKw`, and camp guide has brand instructions.
4. `test/test_dom_structure.js`: Validates `index.html` and `style.css` - verifies semantic structure, elimination of triple nav redundancy, 2 clean main views (`tab-trip`, `tab-simulator`), camp SOS drawer, >=44px touch target rules, and WCAG AA contrast tokens.
5. `test/test_syntax_and_style.js`: Validates syntax of JS files (`node --check app.js data.js`) and checks absence of dead CSS selectors.

When complete:
- Execute `node test/run-tests.js` to verify test runner execution.
- Create `TEST_READY.md` at `d:\Project\CampingTrip\TEST_READY.md` summarizing the test suite, command, and coverage counts per tier.
- Write handoff to `d:\Project\CampingTrip\.agents\teamwork_preview_test_writer_e2e\handoff.md`.
- Send completion message via send_message to parent (conv ID: 7fd6582b-6aa3-4ea0-9151-ef21112d7682).
