# 2-Car EV Simulator & State Engine — Comprehensive In-Depth Survey & Architecture Analysis

**Author:** Explorer 3 (2-Car EV Simulator & State Engine Specialist)  
**Date:** 2026-08-28  
**Scope:** Investigation of EV models, battery models, AC power budget calculations, overnight energy consumption, UI/UX ergonomics, and state management in `d:\Project\CampingTrip`.

---

## 1. Executive Summary

The EV Camping Trip application currently contains a foundational 2-car calculation routine inside `app.js` (lines 393–452) and static guide parameters in `data.js` (lines 521–589). While functionally operational, the current simulator suffers from **high cognitive friction, hardcoded assumptions, missing presets, unrendered guide data, and raw text-heavy output** instead of intuitive visual feedback.

### Key Opportunities Identified:
1. **Model Presets vs. Manual Guesswork**: Drivers currently have to manually drag sliders from 35 to 110 kWh. Providing 1-tap presets for popular Thai EVs (BYD Atto 3, Dolphin, Seal, Tesla Model Y/3, MG4, Good Cat, Deepal S07) drastically simplifies onboarding.
2. **Intuitive Climate Settings vs. Raw kW/h**: Replacing the abstract "0.6 – 2.0 kW" slider with 3 clear environmental presets (❄️ 20–22°C / 🍃 24–25°C / ☀️ 26–28°C) removes math intimidation.
3. **Missing V2L Camp Cooking Load**: Drivers frequently use V2L for electric hotpots/kettles (1.5–2.5 kWh); an optional 1-tap V2L toggle brings real-world camp fidelity.
4. **Visual Battery Timeline & Safety Ratio**: Replacing static text lines with animated visual battery meters, a 4-step energy breakdown timeline (Depart ➔ Arrive ➔ Sleep ➔ Morning), and an instant **Convoy Safety Ratio** (Remaining km vs. Distance to next charger) gives drivers instant certainty in under 3 seconds.
5. **Surfacing Dormant Guide Data**: `data.js` already contains detailed Camp Mode instructions for 6 EV brands (`carBrandsCampMode`), `proTips`, and `emergencyContacts`, but none are rendered in the UI.

---

## 2. Codebase Investigation & State Engine Findings

### 2.1 Code Structure & File Locations
- **`data.js`** (lines 521–589): Contains `evCampingGuide` with rules of thumb, brand-by-brand instructions for Tesla, BYD, MG, GWM, Changan, Aion, pro-tips, and emergency numbers.
  - *Observation*: Lines 530–588 are defined in data structures but completely unreferenced and unrendered in `index.html` or `app.js`.
- **`app.js`** (lines 393–452): Implements `initEVSimulator()` with event listeners on 4 range sliders (`#simCar1Cap`, `#simCar2Cap`, `#simSleepHours`, `#simAcPower`).
- **`index.html`** (lines 175–308): Tab 3 (`#tab-simulator`) defines the control sliders, result cards, and advice box.
- **`style.css`** (lines 698–825): Defines `.simulator-layout`, `.sim-panel`, `.sim-slider-group`, `.two-car-grid`, and `.car-profile-card`.

### 2.2 Mathematical Engine & Underlying Assumptions in Current Code

The current simulation in `app.js` executes the following calculations on every `input` event:
```javascript
const sleepEnergyUsed = sleepHours * acPower;
const car1SleepPercent = (sleepEnergyUsed / car1Cap) * 100;
const car2SleepPercent = (sleepEnergyUsed / car2Cap) * 100;

const danChangToOwlYardKwh = 7.2;
const car1ArrivalSoc = Math.max(0, 95 - (danChangToOwlYardKwh / car1Cap) * 100);
const car2ArrivalSoc = Math.max(0, 95 - (danChangToOwlYardKwh / car2Cap) * 100);

const car1MorningSoc = Math.max(0, car1ArrivalSoc - car1SleepPercent);
const car2MorningSoc = Math.max(0, car2ArrivalSoc - car2SleepPercent);

const car1MorningRange = ((car1MorningSoc / 100) * car1Cap / 16) * 100;
const car2MorningRange = ((car2MorningSoc / 100) * car2Cap / 16) * 100;
```

#### Analytical Breakdown of Existing Logic:
1. **Fixed Dan Chang Departure SoC (95%)**: Assumes both cars charge to 95% at PTT Dan Chang.
2. **Fixed Leg Consumption (7.2 kWh)**: 45 km @ $160\text{ Wh/km} = 7.2\text{ kWh}$.
3. **Fixed Driving Consumption Factor (16 kWh / 100 km)**: Used for calculating remaining morning range ($R = \text{usable kWh} / 0.16$).
4. **Hardcoded Text Template**: Renders static text into `#convoyAdviceText` on line 436.

### 2.3 UX Friction Points & Cognitive Overload
| UX Friction Point | Current Implementation | User Experience Impact |
| :--- | :--- | :--- |
| **No Vehicle Presets** | Sliders from 35 to 110 kWh with generic labels ("City", "Standard"). | Drivers must look up net battery kWh on Google; causes friction. |
| **Abstract AC Power Slider** | Slider from 0.6 to 2.0 kW with step 0.1. | Drivers do not know whether 25°C is 0.8, 1.0, or 1.5 kW. |
| **No V2L Allowance** | 0 kWh accounted for camp gear/cooking. | If drivers cook shabu/hotpot (+2 kWh), morning battery estimates will be inaccurate. |
| **Missing Visual Battery Meters** | Raw text: `83%`, `8.0 kWh (13%)`, `70%`, `~262 กม.`. | Hard to scan at a glance while on the road. |
| **Lack of Downstream Target Context** | Shows remaining range (`262 km`) without context of next charger. | Drivers still wonder: "Is 262 km enough to get to the next charger?" (Next charger is 65 km away). |
| **Unrendered Brand Guides** | Unused `carBrandsCampMode` in `data.js`. | Drivers must search YouTube for how to disable daytime lights in camp mode. |

---

## 3. Mathematical & Energy Calculation Specification

### 3.1 Formal Energy Balance Equation

For vehicle $i \in \{1, 2\}$ with battery capacity $C_i$ (kWh) and driving consumption rate $e_i$ (kWh/km, default $0.16$):

$$E_{\text{drive}} = d_{\text{leg}} \times e_i \quad (d_{\text{leg}} = 45\text{ km}, E_{\text{drive}} = 7.2\text{ kWh})$$

$$SoC_{\text{arr}, i} = SoC_{\text{dep}} - \left( \frac{E_{\text{drive}}}{C_i} \times 100 \right)$$

$$E_{\text{camp}} = (t_{\text{sleep}} \times P_{\text{climate}}) + E_{\text{v2l}}$$

$$\Delta SoC_{\text{camp}, i} = \left( \frac{E_{\text{camp}}}{C_i} \right) \times 100$$

$$SoC_{\text{morn}, i} = \max\left(0, SoC_{\text{arr}, i} - \Delta SoC_{\text{camp}, i}\right)$$

$$R_{\text{morn}, i} = \frac{C_i \times (SoC_{\text{morn}, i} / 100)}{e_i}$$

### 3.2 Climate & Temperature Mapping Matrix
Instead of asking drivers for raw kW numbers, the engine maps real-world camping night conditions:

| Climate Mode | Ambient & Cabin Setting | Estimated AC Load ($P_{\text{climate}}$) | Typical 8h Energy |
| :--- | :--- | :--- | :--- |
| **❄️ หนาว / เย็นสบาย (Cool)** | Outside 18–22°C, Cabin set to 24–25°C | **0.8 kW/ชม.** | 6.4 kWh |
| **🍃 อากาศปกติ (Comfort - Recommended)** | Outside 23–26°C, Cabin set to 24°C | **1.0 kW/ชม.** | 8.0 kWh |
| **☀️ อบอ้าว / ร้อนชื้น (Warm)** | Outside 27–32°C, Cabin set to 22–23°C | **1.4 kW/ชม.** | 11.2 kWh |

### 3.3 Convoy Safety Ratio & Risk Thresholds
The morning route from Owl Yard to the primary return charger hubs:
- Distance to **PTT Station Bypass Uthai Thani (ทล.333)** via Hup Pa Tat: **$d_{\text{next}} = 65\text{ km}$**.
- Alternative nearest emergency charger (**PEA VOLTA Ban Rai**): **$d_{\text{emergency}} = 5\text{ km}$**.
- Distance to **⭐ NEXMOEV Mega Station**: **$d_{\text{nexmo}} = 105\text{ km}$**.

$$\text{Safety Ratio}_i = \frac{R_{\text{morn}, i}}{d_{\text{next}}}$$

| Safety Status | Ratio Criteria | Visual Badge | Dynamic Recommendation |
| :--- | :--- | :--- | :--- |
| 🟢 **ปลอดภัยมาก (Super Safe)** | $\text{Ratio} \ge 2.5\times$ ($R_{\text{morn}} \ge 160\text{ km}$) | `badge-green` | "แบตฯ เหลือเฟือ เที่ยวหุบป่าตาด + วัดท่าซุง แล้วไปชาร์จที่ NEXMOEV ได้สบาย!" |
| 🟡 **เพียงพอ (Moderate)** | $1.5\times \le \text{Ratio} < 2.5\times$ ($100\text{ km} \le R_{\text{morn}} < 160\text{ km}$) | `badge-amber` | "เพียงพอสำหรับทริป แนะนำแวะเติมไฟสั้นๆ 15 นาทีที่ ปตท.เลี่ยงเมืองอุทัยฯ" |
| 🔴 **ควรระวัง (Low Margin)** | $\text{Ratio} < 1.5\times$ ($R_{\text{morn}} < 100\text{ km}$) | `badge-red` | "แบตเตอรี่ค่อนข้างจำกัด แนะนำแวะชาร์จที่ PEA VOLTA บ้านไร่ (5 กม.) ก่อนออกเดินทาง" |

---

## 4. Vehicle Preset Database (Thai EV Market 2026)

To eliminate manual capacity entry, the following EV preset database is recommended for integration:

```javascript
const EV_PRESET_MODELS = [
  { id: "byd_atto3_ext", name: "BYD Atto 3 (Extended)", capacity: 60.5, efficiency: 0.160, brand: "byd" },
  { id: "byd_atto3_std", name: "BYD Atto 3 (Standard)", capacity: 49.9, efficiency: 0.155, brand: "byd" },
  { id: "byd_dolphin_std", name: "BYD Dolphin (Standard)", capacity: 44.9, efficiency: 0.140, brand: "byd" },
  { id: "byd_dolphin_ext", name: "BYD Dolphin (Extended)", capacity: 60.5, efficiency: 0.150, brand: "byd" },
  { id: "byd_seal_dyn", name: "BYD Seal (Dynamic)", capacity: 61.4, efficiency: 0.155, brand: "byd" },
  { id: "byd_seal_prm", name: "BYD Seal (Premium/AWD)", capacity: 82.5, efficiency: 0.170, brand: "byd" },
  { id: "tesla_my_rwd", name: "Tesla Model Y (RWD)", capacity: 60.0, efficiency: 0.160, brand: "tesla" },
  { id: "tesla_my_lr", name: "Tesla Model Y (Long Range)", capacity: 78.1, efficiency: 0.170, brand: "tesla" },
  { id: "tesla_m3_rwd", name: "Tesla Model 3 (RWD)", capacity: 60.0, efficiency: 0.145, brand: "tesla" },
  { id: "mg_mg4_std", name: "MG4 Electric (Standard)", capacity: 51.0, efficiency: 0.155, brand: "mg" },
  { id: "mg_mg4_lr", name: "MG4 Electric (Long Range)", capacity: 64.0, efficiency: 0.160, brand: "mg" },
  { id: "mg_zs_ev", name: "MG ZS EV", capacity: 50.3, efficiency: 0.170, brand: "mg" },
  { id: "gwm_goodcat_400", name: "ORA Good Cat 400 Pro", capacity: 47.8, efficiency: 0.145, brand: "gwm" },
  { id: "gwm_goodcat_500", name: "ORA Good Cat 500 Ultra", capacity: 63.1, efficiency: 0.150, brand: "gwm" },
  { id: "changan_s07", name: "Deepal S07", capacity: 66.8, efficiency: 0.170, brand: "changan" },
  { id: "changan_l07", name: "Deepal L07", capacity: 66.8, efficiency: 0.160, brand: "changan" },
  { id: "aion_y_plus", name: "Aion Y Plus 490/510", capacity: 63.2, efficiency: 0.160, brand: "aion" },
  { id: "custom", name: "กำหนดขนาดเอง (Custom)", capacity: 60.0, efficiency: 0.160, brand: "custom" }
];
```

---

## 5. Streamlined Visual Widget & UX Architecture Design

### 5.1 Widget Layout Architecture
```
+-----------------------------------------------------------------------------------+
|  🔋 2-Car Convoy Camp & Energy Simulator                                          |
+-----------------------------------------------------------------------------------+
|  [🚗 คันที่ 1: BYD Atto 3 (60.5 kWh) ▼]   [🚙 คันที่ 2: BYD Dolphin (44.9 kWh) ▼] |
|  [ ปรับแต่งความจุเอง (Slider / Stepper) ]                                         |
+-----------------------------------------------------------------------------------+
|  🏕️ สภาพแวดล้อม & การนอนในรถ                                                      |
|  - อุณหภูมิกลางคืน: [ ❄️ หนาว (20°C) ]  [ 🍃 สบาย (24-25°C) ★ ]  [ ☀️ ร้อน (28°C) ]  |
|  - ชั่วโมงนอนเปิดแอร์:  [ 6 ชม. ]  [ 8 ชม. ★ ]  [ 10 ชม. ]                          |
|  - ระบบ V2L:        [  OFF  |  ON 🍲 ทำอาหาร/ต้มน้ำ (+2.0 kWh) ]                   |
+-----------------------------------------------------------------------------------+
|  📊 ผลการประเมินพลังงานขบวน 2 คัน (Side-by-Side Visual Battery Meters)             |
|                                                                                   |
|  🚗 รถคันที่ 1 (Atto 3 - 60.5 kWh)         🚙 รถคันที่ 2 (Dolphin - 44.9 kWh)      |
|  +-------------------------------------+   +-------------------------------------+|
|  | ตื่นเช้าเหลือ: 70% (~265 กม.)       |   | ตื่นเช้าเหลือ: 61% (~195 กม.)       ||
|  | [██████████████░░░░░] 🟢 ปลอดภัย 4.1x|   | [████████████░░░░░░] 🟢 ปลอดภัย 3.0x||
|  |                                     |   |                                     ||
|  | ⚡ ชาร์จเต็มด่านช้าง: 95%            |   | ⚡ ชาร์จเต็มด่านช้าง: 95%            ||
|  | 🚗 ขับเข้าแคมป์:   -11.9% (7.2 kWh) |   | 🚗 ขับเข้าแคมป์:   -16.0% (7.2 kWh) ||
|  | ⛺ เปิดแอร์นอน 8h:  -13.2% (8.0 kWh) |   | ⛺ เปิดแอร์นอน 8h:  -17.8% (8.0 kWh) ||
|  | ☀️ เช้าพร้อมลุย:   70% (~265 กม.)   |   | ☀️ เช้าพร้อมลุย:   61% (~195 กม.)   ||
|  +-------------------------------------+   +-------------------------------------+|
+-----------------------------------------------------------------------------------+
|  💡 คำแนะนำสรุปการเดินทางสำหรับขบวน (Convoy Intelligence & Next Stop Plan)         |
|  "ทั้ง 2 คันมีระยะทางเหลือเกิน 65 กม. สบายๆ (เหลือมากกว่า 3 เท่า)                 |
|   ตื่นเช้าสามารถเที่ยว หุบป่าตาด ➔ วัดท่าซุง แล้วไปชาร์จที่ NEXMOEV พยุหะคีรี ได้!"|
+-----------------------------------------------------------------------------------+
|  📖 คู่มือตั้งค่า Camp Mode รถแต่ละยี่ห้อ (Tesla / BYD / MG / GWM / Changan / Aion)|
+-----------------------------------------------------------------------------------+
```

### 5.2 Visual Battery Gauge Design
- Cylinder battery bar with SVG/CSS styling:
  - 100% – 50%: Glowing Green (`#10b981`)
  - 49% – 25%: Amber (`#f59e0b`)
  - < 25%: Warning Red (`#ef4444`)
- Subtle segment marker lines at 25%, 50%, 75%.
- Linear color transition with zero layout shifts.

### 5.3 Integrated Brand Camp Mode Reference
Integrate an accordion/segmented tab rendering `data.js` `carBrandsCampMode` so users can tap their brand logo/name and immediately see:
- Exact menu steps for keeping AC running.
- How to turn off Daytime Running Lights (DRL).
- Screen sleep & lock behavior.

---

## 6. State Management & Persistence Architecture

### 6.1 Reactive State Structure
```javascript
const SimState = {
  car1: {
    presetId: "byd_atto3_ext",
    capacity: 60.5,
    efficiency: 0.160,
    name: "BYD Atto 3 (Extended)"
  },
  car2: {
    presetId: "byd_dolphin_std",
    capacity: 44.9,
    efficiency: 0.140,
    name: "BYD Dolphin (Standard)"
  },
  environment: {
    climateMode: "normal", // "cool" (0.8), "normal" (1.0), "warm" (1.4)
    acPower: 1.0,
    sleepHours: 8,
    useV2L: false,
    v2lPower: 2.0
  }
};
```

### 6.2 Persistence Contract
- Save state to `localStorage.getItem('ev_convoy_sim_v2')` on change.
- Restore state seamlessly on page load with fallback defaults.
- Zero dependency on external frameworks (pure vanilla JS).

---

## 7. Implementation Blueprint & Recommendations

1. **`data.js`**:
   - Add `EV_PRESET_MODELS` array with real-world battery capacities and efficiency ratings.
   - Retain and reference `carBrandsCampMode`, `proTips`, and `emergencyContacts`.
2. **`app.js`**:
   - Refactor `initEVSimulator()` to use `SimState`.
   - Implement `renderPresetSelects()`, `calculateConvoyEnergy()`, `updateSimView()`, and `renderBrandGuides()`.
3. **`index.html`**:
   - Update Tab 3 markup to host model preset selectors, climate pill buttons, V2L toggle, visual battery meters, and brand guide accordion.
4. **`style.css`**:
   - Add responsive styles for visual battery gauges, segmented pill buttons, side-by-side comparison cards, and high-contrast mobile tap targets (minimum 44x44px).
5. **Validation**:
   - Ensure all JS passes `node --check`.

---

## 8. Conclusion

The proposed 2-Car EV Simulator overhaul transforms a basic math formula into a rich, driver-first visual decision tool. It eliminates math anxiety, accounts for real camping scenarios (climate + V2L), surfaces dormant knowledge, and gives drivers immediate confidence in their battery safety margins before and during the trip.
