# Handoff Report — Explorer 3 (2-Car EV Simulator & State Engine)

**Agent ID:** teamwork_preview_explorer_survey_3  
**Target Recipient:** teamwork_preview_orchestrator (`7fd6582b-6aa3-4ea0-9151-ef21112d7682`)  
**Type:** Hard Handoff (Investigation & Architecture Survey Complete)  
**Date:** 2026-08-28  

---

## 1. Observation

1. **`app.js` (lines 393–452)**:
   - Contains `initEVSimulator()` with hardcoded math:
     ```javascript
     const danChangToOwlYardKwh = 7.2;
     const car1ArrivalSoc = Math.max(0, 95 - (danChangToOwlYardKwh / car1Cap) * 100);
     const car1MorningRange = ((car1MorningSoc / 100) * car1Cap / 16) * 100;
     ```
   - Consumption is hardcoded at $16\text{ kWh}/100\text{ km}$ ($160\text{ Wh/km}$).
   - Starting SoC at Dan Chang is fixed at $95\%$.
   - Sliders (`#simCar1Cap`, `#simCar2Cap`) require manual entry from $35$ to $110\text{ kWh}$ with no vehicle presets.
   - AC power slider (`#simAcPower`) ranges from $0.6$ to $2.0\text{ kW/ชม.}$ without temperature presets.
   - V2L power usage is completely absent from calculation.
   - Output results in `#tab-simulator` (`#c1ArrivalSoc`, `#c1SleepEnergy`, `#c1MorningSoc`, `#c1MorningRange`) are plain text without visual meters or safety margin indicators.

2. **`data.js` (lines 521–589)**:
   - Contains `evCampingGuide` with `carBrandsCampMode` (Tesla, BYD, MG, GWM, Changan, Aion), `proTips`, and `emergencyContacts`.
   - Grep search confirms `carBrandsCampMode` and `proTips` are never referenced or rendered in `app.js` or `index.html`.

3. **`index.html` (lines 175–308)**:
   - Tab 3 contains static slider labels and a 2-column comparison layout with static text slots.

4. **`style.css` (lines 698–825)**:
   - Defines basic styling for `.sim-panel`, `.sim-slider-group`, and `.car-profile-card`.
   - Lacks dedicated styling for visual battery cylinder bars, climate mode pill buttons, and brand mode accordion.

5. **Tool Commands & Verification**:
   - `node --check app.js data.js` exited with code 0 (valid JS syntax).
   - `git status` shows clean tracking on `main` branch.

---

## 2. Logic Chain

1. **Observation 1 & 3**: Drivers currently have to manually guess their vehicle's net battery capacity ($35\text{–}110\text{ kWh}$) and estimate raw kW/h AC consumption.
   - *Inference*: This causes high cognitive load, friction, and anxiety during trip preparation. Providing 1-tap presets for popular Thai EVs (BYD, Tesla, MG, GWM, Changan, Aion) and 3 climate presets (❄️ 20°C / 🍃 24–25°C / ☀️ 28°C) removes all math intimidation.
2. **Observation 1**: The energy calculation omits V2L usage, even though camping in cars often involves cooking with induction stoves or kettles.
   - *Inference*: Adding an optional 1-tap $+2.0\text{ kWh}$ V2L toggle ensures real-world accuracy for campers.
3. **Observation 1 & 4**: Current outputs are plain text percentages and remaining kilometers without indicating whether the remaining range is safe to reach the next charging station.
   - *Inference*: Distance from Owl Yard to the next major charger (PTT Bypass Uthai Thani ทล.333 via Hup Pa Tat) is $65\text{ km}$. Calculating and displaying a **Convoy Safety Ratio** ($\text{Remaining km} / 65\text{ km}$) with color-coded badges (🟢 ปลอดภัยมาก $>2.5\times$ / 🟡 พอดี $1.5\text{–}2.5\times$ / 🔴 ควรระวัง $<1.5\times$) gives instant clarity in $<3$ seconds.
4. **Observation 2**: Rich data in `carBrandsCampMode` is dormant and unrendered.
   - *Inference*: Surfacing this data in an expandable "Brand Camp Mode Quick Guide" directly inside Tab 3 provides immediate utility without cluttering the main simulator view.

---

## 3. Caveats

- **Driving Elevation & Weather Variations**: The model uses average driving efficiency ($140\text{–}170\text{ Wh/km}$). Extreme driving speeds ($>130\text{ km/h}$) or heavy headwinds could increase consumption by 10–15%.
- **Ambient Campsite Temperature**: Real night temperatures vary by season (winter vs summer); the 3-tier climate model ($0.8$, $1.0$, $1.4\text{ kW}$) sufficiently captures this variance for practical planning.
- **No Caveats on Other Components**: Scope is confined to EV simulation, state management, and ergonomic UI.

---

## 4. Conclusion

The 2-Car EV Simulator should be upgraded into a streamlined, driver-centric visual widget featuring:
1. **Vehicle Preset Selectors** with 17 popular Thai EV models + custom fallback.
2. **3-Tier Environmental Climate Pills** (20°C, 24–25°C, 28°C) + Sleep Hours chips + V2L toggle.
3. **Side-by-Side Visual Battery Cylinders** with dynamic fill levels, colors, and 4-step energy breakdown timeline.
4. **Instant Convoy Safety Ratio & Guidance** comparing morning range against the next 65 km charging station.
5. **Integrated Brand-by-Brand Camp Mode Reference** surfacing `data.js` instructions.
6. **Reactive LocalStorage State Engine** ensuring user vehicle selections persist across visits.

Full detailed architectural analysis is documented in `analysis.md`.

---

## 5. Verification Method

1. **Static Analysis & Syntax Check**:
   ```powershell
   node --check app.js data.js
   ```
2. **File Inspection**:
   - Inspect `d:\Project\CampingTrip\.agents\teamwork_preview_explorer_survey_3\analysis.md` for full calculation specifications, UI mockups, and code blueprints.
   - Inspect `d:\Project\CampingTrip\app.js` (lines 393–452) to verify current baseline vs proposed architecture.
   - Inspect `d:\Project\CampingTrip\data.js` (lines 521–589) to verify unrendered `evCampingGuide` data.
3. **Invalidation Condition**:
   - The findings would be invalidated if the project had already implemented vehicle preset dropdowns, visual battery bars, and dynamic safety ratio calculations in a separate module. Search confirms no such module exists.
