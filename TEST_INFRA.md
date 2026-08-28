# E2E Test Infra: EV Camping Trip Web App

## Test Philosophy
- Requirement-driven, opaque-box testing derived directly from `ORIGINAL_REQUEST.md`.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing across Tiers 1-4.
- Independent validation of DOM elements, tap targets, high contrast tokens, calculation engine accuracy, stop card data completeness, and syntax integrity.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenarios) |
|---|---------|----------------------|:----------------:|:-----------------:|:-----------------:|:------------------:|
| F1 | Navigation & View Consolidation | R1 | 5 | 5 | ✓ | ✓ |
| F2 | High Contrast & Touch Targets | R2 | 5 | 5 | ✓ | ✓ |
| F3 | Unified Journey Model & 3-Phase Tagging | R1, R3 | 5 | 5 | ✓ | ✓ |
| F4 | Interactive Map & Gesture Guard | R3 | 5 | 5 | ✓ | ✓ |
| F5 | Stop Cards & 1-Tap Navigation | R2, R3 | 5 | 5 | ✓ | ✓ |
| F6 | 2-Car EV Simulator Engine | R4 | 5 | 5 | ✓ | ✓ |
| F7 | Visual Battery Widgets & Safety Gauges | R4 | 5 | 5 | ✓ | ✓ |
| F8 | Camp Guide & Emergency SOS Drawer | R1, R2 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Test Runner**: Node.js automated test harness (`node test/run-tests.js`).
- **Test Files**:
  - `test/test_calculations.js`: Rigorous mathematical verification for EV battery consumption, AC power drain, V2L, morning SoC, remaining driving range, and Convoy Safety Margin across all 17 vehicle models and custom inputs.
  - `test/test_data_integrity.js`: Verifies every stop in `TRIP_DATA.places` contains required fields (`phase`, `lat`, `lng`, `distanceFromOrigin`, `navUrl`, `category`, `subCategory`, `name`), charging power (kW), and valid Google Maps URLs.
  - `test/test_dom_structure.js`: Validates semantic HTML structure in `index.html`, elimination of duplicate navbars/tabs, presence of high-contrast CSS tokens, >=44px touch targets, and absence of broken references.
  - `test/test_syntax_and_style.js`: Validates JS syntax (`node --check`), CSS validity, and ensures dead CSS rules are pruned.
- **Pass/Fail Semantics**: All tests must exit with code 0, displaying full test count and passing tier breakdown.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Expected Outcome |
|---|----------|--------------------|------------------|
| 1 | Outbound Leg Driver Navigation | F1, F3, F4, F5 | User filters to "🟢 ขาไป", taps nearest 120kW+ charger (Dan Chang), triggers 1-tap Google Maps navigation. |
| 2 | Campsite Dinner & Attraction Search | F1, F3, F4, F5 | User switches to "🏕️ รอบแคมป์", verifies all 10 Ban Rai spots are distinct and navigable. |
| 3 | 2-Car Overnight Camp Mode Budgeting | F6, F7 | Driver selects "BYD Atto 3 Standard" + "Tesla Model Y LR", sets 8h sleep @ 24°C + V2L. Verifies morning battery % and safety margin to next 65km charger. |
| 4 | Low Battery Extreme Case Warning | F6, F7 | Small battery EV (35 kWh) with 12h heavy AC (1.4 kW) triggers 🔴 Caution/Warning safety badge. |
| 5 | Roadside Emergency Camp Troubleshooting | F1, F8 | Driver opens Camp Guide drawer, checks BYD camp mode instructions and taps PEA / Tourist Police hotline. |

## Coverage Thresholds
- Tier 1: ≥40 test cases (≥5 per feature across 8 features)
- Tier 2: ≥40 boundary / extreme value test cases
- Tier 3: ≥10 cross-feature pairwise combination tests
- Tier 4: ≥5 realistic road trip workload scenarios
- **Total Suite Minimum: ≥95 test assertions**
