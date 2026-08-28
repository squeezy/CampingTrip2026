## 2026-08-28T17:00:23Z
You are the M3 Implementation Worker (2-Car EV Simulator Engine, Presets & Visual Widgets).
Your working directory: d:\Project\CampingTrip\.agents\teamwork_preview_worker_m3_1
Your parent is: teamwork_preview_orchestrator (conv ID: 7fd6582b-6aa3-4ea0-9151-ef21112d7682)

Read ORIGINAL_REQUEST.md at: d:\Project\CampingTrip\.agents\ORIGINAL_REQUEST.md
Read PROJECT.md at: d:\Project\CampingTrip\PROJECT.md
Read Survey 3 Report at: d:\Project\CampingTrip\.agents\teamwork_preview_explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- d:\Project\CampingTrip\data.js
- d:\Project\CampingTrip\app.js
- d:\Project\CampingTrip\index.html
- d:\Project\CampingTrip\style.css
- Your .agents directory

Implementation Scope:
1. EV Vehicle Presets in data.js (TRIP_DATA.evPresets):
   - Add array of popular Thai EV models (BYD Atto 3 Standard/Extended, Dolphin Standard/Extended, Seal Dynamic/Premium/Performance, Sealion 6, Tesla Model 3 RWD/LR, Model Y RWD/LR, MG4, MG ZS EV, Deepal S07/L07, Ora Good Cat 400/500/GT, Aion Y Plus, etc.) with id, brand, model, batteryCap (kWh), consumption (kWh/100km or Wh/km).
   - Include 'custom' option.
2. Streamlined Visual Controls in index.html & app.js:
   - Car 1 and Car 2 model selector dropdowns (or preset buttons) populated from TRIP_DATA.evPresets.
   - When a preset is selected, automatically update battery capacity (with optional custom slider disclosure if 'custom' is selected).
   - 3-Tier Climate Preset Pills: ?? ??????? 20°C (1.4 kW), ?? ???? 24-25°C (1.0 kW), ?? ???????? 28°C (0.8 kW) + custom slider.
   - 1-Tap V2L Load Toggle: ? V2L ??????? / ?????????? (+2.0 kWh).
   - Sleep Duration Quick Chips: 6 ??., 8 ??., 10 ??. + slider (4–12 ??.).
3. Visual Battery Cylinders & Safety Ratio Gauge:
   - Render side-by-side animated battery visual bars (dynamic percentage height/fill, green/yellow/red color thresholds).
   - Display energy breakdown timeline: Arrival SoC & kWh, Overnight Camp & V2L Drain, Morning SoC & kWh, Morning Driving Range (km).
   - Calculate Convoy Safety Margin ratio vs next 65 km charging station (PTT Bypass Uthai Thani ??.333): Morning Range / 65 km.
   - Display color-coded safety status badge: ?? ?????????? (> 2.5x), ?? ???? (1.5x - 2.5x), ?? ???????? (< 1.5x).
4. Camp Mode & SOS Quick Drawer Integration:
   - Render brand-specific camp mode steps (Tesla, BYD, MG, GWM, Deepal, Aion) and 1-tap tel: emergency hotlines from TRIP_DATA.evCampingGuide.
5. State Persistence:
   - Save simulator settings (Car 1/Car 2 models, climate mode, sleep hours, V2L state) to localStorage and restore on load.
6. Verification:
   - Run node test/run-tests.js (must pass 100% assertions).
   - Run node --check app.js data.js.
   - Write your handoff report to d:\Project\CampingTrip\.agents\teamwork_preview_worker_m3_1\handoff.md.
   - Send completion message via send_message to parent.
