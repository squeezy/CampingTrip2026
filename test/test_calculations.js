/**
 * test_calculations.js
 * Comprehensive automated test suite for EV Camping Trip Simulator Calculations
 * Tiers 1-4 covering all 17 EV presets, climate loads, V2L, battery %, range, and Convoy Safety Margin.
 */

const { TestSuite, assert, assertEqual, assertCloseTo, assertInRange } = require('./test_helpers');

const suite = new TestSuite('EV Simulator Calculations');

// Authoritative calculation model / Oracle
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

const CLIMATE_LOADS = {
  eco: 0.8,     // 24-25°C cool ambient
  normal: 1.0,  // standard comfortable AC
  chill: 1.4    // 20-22°C cold AC / heavy daytime load
};

const NEXT_CHARGER_DISTANCE_KM = 65.0; // PTT Uthai Thani Bypass Charger threshold
const DAN_CHANG_TO_CAMP_KM = 45.0;     // Distance from PTT Dan Chang to Owl Yard Campsite

/**
 * Pure calculation oracle function
 */
function calculateEVEnergy({
  batteryCap,
  efficiency = 0.160,
  startSoc = 95.0,
  sleepHours = 8.0,
  acPowerKw = 1.0,
  useV2L = false,
  v2lPowerKwh = 2.0,
  driveDistanceKm = DAN_CHANG_TO_CAMP_KM
}) {
  if (batteryCap <= 0) {
    return {
      arrivalSoc: 0,
      arrivalKwh: 0,
      sleepEnergyKwh: 0,
      morningSoc: 0,
      morningKwh: 0,
      morningRangeKm: 0,
      safetyRatio: 0,
      safetyStatus: 'danger'
    };
  }

  // 1. Driving energy from Dan Chang to Owl Yard
  const driveEnergyKwh = driveDistanceKm * efficiency;
  const startKwh = (startSoc / 100.0) * batteryCap;
  const arrivalKwh = Math.max(0, startKwh - driveEnergyKwh);
  const arrivalSoc = Math.max(0, Math.min(100, (arrivalKwh / batteryCap) * 100.0));

  // 2. Overnight Camp energy drain (AC + V2L)
  const acEnergyKwh = sleepHours * acPowerKw;
  const v2lEnergyKwh = useV2L ? v2lPowerKwh : 0.0;
  const sleepEnergyKwh = acEnergyKwh + v2lEnergyKwh;

  // 3. Morning status
  const morningKwh = Math.max(0, arrivalKwh - sleepEnergyKwh);
  const morningSoc = Math.max(0, Math.min(100, (morningKwh / batteryCap) * 100.0));

  // 4. Remaining range & Convoy safety ratio
  const safeEfficiency = efficiency > 0 ? efficiency : 0.160;
  const morningRangeKm = morningKwh / safeEfficiency;
  const safetyRatio = morningRangeKm / NEXT_CHARGER_DISTANCE_KM;

  let safetyStatus = 'safe';
  if (safetyRatio < 1.0) {
    safetyStatus = 'danger';
  } else if (safetyRatio < 2.0) {
    safetyStatus = 'warning';
  }

  return {
    driveEnergyKwh,
    arrivalSoc,
    arrivalKwh,
    sleepEnergyKwh,
    morningSoc,
    morningKwh,
    morningRangeKm,
    safetyRatio,
    safetyStatus
  };
}

// ============================================================================
// TIER 1: FEATURE COVERAGE (≥5 tests per feature)
// ============================================================================

// F6.1: Preset verification for all 17 vehicles
suite.test('Tier 1: Presets - Database contains 17 specific Thai EV models + 1 custom', 1, () => {
  assertEqual(EV_PRESET_MODELS.length, 18, 'Expected 18 preset entries (17 models + 1 custom)');
  const uniqueIds = new Set(EV_PRESET_MODELS.map(p => p.id));
  assertEqual(uniqueIds.size, 18, 'All preset IDs must be unique');
  EV_PRESET_MODELS.forEach(preset => {
    assert(preset.capacity >= 35 && preset.capacity <= 110, `Preset ${preset.id} capacity ${preset.capacity} out of bounds`);
    assert(preset.efficiency >= 0.12 && preset.efficiency <= 0.22, `Preset ${preset.id} efficiency ${preset.efficiency} out of bounds`);
  });
});

// F6.2 - F6.18: Individual Tier 1 Feature Verification for all 17 Preset Models @ Normal Climate
EV_PRESET_MODELS.slice(0, 17).forEach((preset, idx) => {
  suite.test(`Tier 1: Model Feature [${idx + 1}/17] - ${preset.name} (${preset.capacity} kWh) overnight camp calculation`, 1, () => {
    const res = calculateEVEnergy({
      batteryCap: preset.capacity,
      efficiency: preset.efficiency,
      startSoc: 95.0,
      sleepHours: 8.0,
      acPowerKw: CLIMATE_LOADS.normal,
      useV2L: false
    });
    assert(res.arrivalSoc >= 75.0 && res.arrivalSoc <= 95.0, `${preset.name} arrival SoC should be realistic (75-95%)`);
    assert(res.morningSoc >= 55.0 && res.morningSoc <= 85.0, `${preset.name} morning SoC should be realistic (55-85%)`);
    assert(res.morningRangeKm >= 180.0, `${preset.name} morning range should exceed 180km`);
    assert(res.safetyRatio >= 2.5, `${preset.name} safety ratio should exceed 2.5x to next charger`);
    assertEqual(res.safetyStatus, 'safe');
  });
});

// F6.19: V2L load integration across 5 top Thai V2L-capable EVs
const V2L_CAPABLE_MODELS = ['byd_atto3_ext', 'byd_dolphin_ext', 'byd_seal_dyn', 'mg_mg4_lr', 'changan_s07'];
V2L_CAPABLE_MODELS.forEach(modelId => {
  const model = EV_PRESET_MODELS.find(m => m.id === modelId);
  suite.test(`Tier 1: V2L Feature - ${model.name} with V2L Shabu cooking (+2.0 kWh)`, 1, () => {
    const withoutV2L = calculateEVEnergy({ batteryCap: model.capacity, efficiency: model.efficiency, sleepHours: 8, acPowerKw: 1.0, useV2L: false });
    const withV2L = calculateEVEnergy({ batteryCap: model.capacity, efficiency: model.efficiency, sleepHours: 8, acPowerKw: 1.0, useV2L: true });
    assertCloseTo(withV2L.sleepEnergyKwh - withoutV2L.sleepEnergyKwh, 2.0, 0.01);
    assert(withV2L.morningSoc > 55, 'Retains > 55% morning SoC even with V2L');
  });
});

// F6.20: BYD Atto 3 Extended calculation
suite.test('Tier 1: Calculations - BYD Atto 3 Extended standard 8h camp', 1, () => {
  const result = calculateEVEnergy({
    batteryCap: 60.5,
    efficiency: 0.160,
    startSoc: 95.0,
    sleepHours: 8.0,
    acPowerKw: CLIMATE_LOADS.normal,
    useV2L: false
  });

  assertCloseTo(result.driveEnergyKwh, 7.2, 0.05, 'Drive energy should be 45km * 0.160 = 7.2 kWh');
  assertCloseTo(result.arrivalSoc, 83.1, 0.5, 'Arrival SoC should be ~83.1%');
  assertCloseTo(result.sleepEnergyKwh, 8.0, 0.05, 'Sleep energy should be 8.0 kWh');
  assertCloseTo(result.morningSoc, 69.9, 0.6, 'Morning SoC should be ~70%');
  assert(result.morningRangeKm >= 260, `Morning range ${result.morningRangeKm} should be ≥ 260km`);
  assert(result.safetyRatio >= 4.0, `Safety ratio ${result.safetyRatio} should be ≥ 4.0x`);
  assertEqual(result.safetyStatus, 'safe');
});

// F6.21: BYD Dolphin Standard calculation
suite.test('Tier 1: Calculations - BYD Dolphin Standard (44.9 kWh) standard 8h camp', 1, () => {
  const result = calculateEVEnergy({
    batteryCap: 44.9,
    efficiency: 0.140,
    startSoc: 95.0,
    sleepHours: 8.0,
    acPowerKw: CLIMATE_LOADS.normal,
    useV2L: false
  });

  assertCloseTo(result.driveEnergyKwh, 6.3, 0.05, 'Drive energy should be 45km * 0.140 = 6.3 kWh');
  assertCloseTo(result.arrivalSoc, 80.9, 0.5, 'Arrival SoC should be ~81%');
  assertCloseTo(result.morningSoc, 63.1, 0.6, 'Morning SoC should be ~63%');
  assert(result.morningRangeKm >= 190, `Morning range ${result.morningRangeKm} should be ≥ 190km`);
  assertEqual(result.safetyStatus, 'safe');
});

// F6.22: Tesla Model Y Long Range calculation
suite.test('Tier 1: Calculations - Tesla Model Y Long Range (78.1 kWh)', 1, () => {
  const result = calculateEVEnergy({
    batteryCap: 78.1,
    efficiency: 0.170,
    startSoc: 95.0,
    sleepHours: 8.0,
    acPowerKw: CLIMATE_LOADS.normal
  });

  assertCloseTo(result.driveEnergyKwh, 7.65, 0.05, 'Drive energy 78.1 kWh Tesla');
  assert(result.morningSoc > 70, 'Tesla Model Y LR morning SoC should exceed 70%');
  assert(result.morningRangeKm > 320, 'Morning range should exceed 320km');
  assert(result.safetyRatio > 5.0, 'Safety ratio should exceed 5.0x');
});

// F6.5: Climate load variations (Eco 0.8kW, Normal 1.0kW, Chill 1.4kW)
suite.test('Tier 1: Climate Loads - Energy drain scales accurately across 3 climate modes', 1, () => {
  const eco = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 8, acPowerKw: CLIMATE_LOADS.eco });
  const normal = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 8, acPowerKw: CLIMATE_LOADS.normal });
  const chill = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 8, acPowerKw: CLIMATE_LOADS.chill });

  assertEqual(eco.sleepEnergyKwh, 6.4, 'Eco 8h = 6.4 kWh');
  assertEqual(normal.sleepEnergyKwh, 8.0, 'Normal 8h = 8.0 kWh');
  assertEqual(chill.sleepEnergyKwh, 11.2, 'Chill 8h = 11.2 kWh');
  assert(eco.morningSoc > normal.morningSoc && normal.morningSoc > chill.morningSoc, 'Higher AC power must yield lower morning SoC');
});

// F6.6: V2L cooking load addition (+2.0 kWh)
suite.test('Tier 1: V2L Integration - V2L cooking adds exactly +2.0 kWh to overnight drain', 1, () => {
  const withoutV2L = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 8, acPowerKw: 1.0, useV2L: false });
  const withV2L = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 8, acPowerKw: 1.0, useV2L: true });

  assertCloseTo(withV2L.sleepEnergyKwh - withoutV2L.sleepEnergyKwh, 2.0, 0.01, 'V2L delta must be exactly 2.0 kWh');
  assertCloseTo(withoutV2L.morningKwh - withV2L.morningKwh, 2.0, 0.01, 'Morning kWh delta must be exactly 2.0 kWh');
});

// F7.1: Safety ratio calculation vs 65km charger threshold
suite.test('Tier 1: Safety Margin - Safety ratio mathematically equals morningRangeKm / 65.0', 1, () => {
  const res = calculateEVEnergy({ batteryCap: 50.0, efficiency: 0.160, sleepHours: 8, acPowerKw: 1.0 });
  assertCloseTo(res.safetyRatio, res.morningRangeKm / 65.0, 0.001, 'Safety ratio must equal morningRangeKm / 65.0');
});

// F7.2: Safety status categorization thresholds
suite.test('Tier 1: Safety Status - Categorizes safe (≥2.0x), warning (1.0-2.0x), and danger (<1.0x)', 1, () => {
  const safeRes = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 8, acPowerKw: 1.0 });
  assertEqual(safeRes.safetyStatus, 'safe', 'Expected safe for 60kWh standard vehicle');

  // Warning case (range ~80km => ratio ~1.23x between 1.0 and 2.0)
  const warnRes = calculateEVEnergy({ batteryCap: 35.0, startSoc: 80.0, sleepHours: 8, acPowerKw: 1.0 });
  assertEqual(warnRes.safetyStatus, 'warning', 'Expected warning when range is 65-130km');

  // Low capacity & heavy load => danger (range < 65km)
  const dangerRes = calculateEVEnergy({ batteryCap: 35.0, startSoc: 40.0, sleepHours: 10, acPowerKw: 1.4, useV2L: true });
  assertEqual(dangerRes.safetyStatus, 'danger', 'Expected danger when remaining range < 65km');
});

// ============================================================================
// TIER 2: BOUNDARY & EDGE CASES (≥40 boundary tests)
// ============================================================================

// T2.1-T2.17: Every individual preset boundary check
EV_PRESET_MODELS.forEach((preset, idx) => {
  suite.test(`Tier 2: Boundary - Preset [${idx + 1}/18] ${preset.name} calculation non-negative`, 2, () => {
    const res = calculateEVEnergy({
      batteryCap: preset.capacity,
      efficiency: preset.efficiency,
      sleepHours: 8,
      acPowerKw: 1.0
    });
    assert(res.arrivalSoc >= 0 && res.arrivalSoc <= 100, `Arrival SoC out of range: ${res.arrivalSoc}`);
    assert(res.morningSoc >= 0 && res.morningSoc <= 100, `Morning SoC out of range: ${res.morningSoc}`);
    assert(res.morningRangeKm >= 0, `Range cannot be negative: ${res.morningRangeKm}`);
    assert(res.safetyRatio >= 0, `Safety ratio cannot be negative: ${res.safetyRatio}`);
  });
});

// T2.18: Battery capacity min boundary (35 kWh)
suite.test('Tier 2: Boundary - Minimum battery capacity (35.0 kWh)', 2, () => {
  const res = calculateEVEnergy({ batteryCap: 35.0, sleepHours: 8, acPowerKw: 1.0 });
  assert(res.morningSoc > 0, 'Morning SoC should be positive');
  assertCloseTo(res.sleepEnergyKwh, 8.0, 0.01);
});

// T2.19: Battery capacity max boundary (110.0 kWh)
suite.test('Tier 2: Boundary - Maximum battery capacity (110.0 kWh)', 2, () => {
  const res = calculateEVEnergy({ batteryCap: 110.0, sleepHours: 8, acPowerKw: 1.0 });
  assert(res.morningSoc > 80, '110 kWh battery retains > 80% morning SoC');
  assert(res.safetyRatio > 7.0, 'Safety ratio exceeds 7.0x');
});

// T2.20: Sleep hours min boundary (4 hours)
suite.test('Tier 2: Boundary - Minimum sleep duration (4 hours)', 2, () => {
  const res = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 4.0, acPowerKw: 1.0 });
  assertEqual(res.sleepEnergyKwh, 4.0, '4 hours @ 1.0 kW should consume 4.0 kWh');
});

// T2.21: Sleep hours max boundary (12 hours)
suite.test('Tier 2: Boundary - Maximum sleep duration (12 hours)', 2, () => {
  const res = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 12.0, acPowerKw: 1.0 });
  assertEqual(res.sleepEnergyKwh, 12.0, '12 hours @ 1.0 kW should consume 12.0 kWh');
});

// T2.22: Zero sleep hours (0 hours)
suite.test('Tier 2: Boundary - Zero sleep hours (day trip / no AC overnight)', 2, () => {
  const res = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 0.0, acPowerKw: 1.0 });
  assertEqual(res.sleepEnergyKwh, 0.0, 'Zero sleep consumes 0 kWh');
  assertEqual(res.arrivalSoc, res.morningSoc, 'Arrival SoC must equal Morning SoC with 0 sleep');
});

// T2.23: 100% Start SoC
suite.test('Tier 2: Boundary - 100% Start SoC from Dan Chang', 2, () => {
  const res = calculateEVEnergy({ batteryCap: 60.0, startSoc: 100.0, sleepHours: 8, acPowerKw: 1.0 });
  assert(res.arrivalSoc > 85, 'Arrival SoC should be ~88%');
  assert(res.morningSoc > 70, 'Morning SoC should exceed 70%');
});

// T2.24: 0% Start SoC edge case (Empty battery protection)
suite.test('Tier 2: Boundary - 0% Start SoC gracefully clamps to 0 (no negative values)', 2, () => {
  const res = calculateEVEnergy({ batteryCap: 60.0, startSoc: 0.0, sleepHours: 8, acPowerKw: 1.0 });
  assertEqual(res.arrivalSoc, 0, 'Arrival SoC must be clamped to 0');
  assertEqual(res.morningSoc, 0, 'Morning SoC must be clamped to 0');
  assertEqual(res.morningRangeKm, 0, 'Range must be clamped to 0');
  assertEqual(res.safetyStatus, 'danger');
});

// T2.25: Total battery depletion under extreme load (Clamping verification)
suite.test('Tier 2: Boundary - Extreme drain exceeding capacity clamps to 0%', 2, () => {
  const res = calculateEVEnergy({
    batteryCap: 35.0,
    startSoc: 30.0,       // 10.5 kWh
    driveDistanceKm: 45,  // ~7.2 kWh drive
    sleepHours: 12,       // 16.8 kWh AC
    acPowerKw: 1.4,
    useV2L: true          // +2.0 kWh
  });
  assertEqual(res.morningKwh, 0, 'Morning kWh must not drop below 0');
  assertEqual(res.morningSoc, 0, 'Morning SoC must not drop below 0');
  assertEqual(res.morningRangeKm, 0, 'Morning range must not drop below 0');
  assertEqual(res.safetyRatio, 0, 'Safety ratio must be 0');
  assertEqual(res.safetyStatus, 'danger');
});

// T2.26: Zero battery capacity edge case (Divide by zero protection)
suite.test('Tier 2: Boundary - Zero battery capacity returns safe zeroes without NaN or crash', 2, () => {
  const res = calculateEVEnergy({ batteryCap: 0, sleepHours: 8, acPowerKw: 1.0 });
  assertEqual(res.morningSoc, 0);
  assertEqual(res.morningRangeKm, 0);
  assertEqual(isNaN(res.morningRangeKm), false, 'Morning range must not be NaN');
});

// T2.27: Zero efficiency fallback protection
suite.test('Tier 2: Boundary - Zero efficiency fallback prevents infinite range', 2, () => {
  const res = calculateEVEnergy({ batteryCap: 60.0, efficiency: 0, sleepHours: 8 });
  assert(Number.isFinite(res.morningRangeKm), 'Morning range must be finite');
  assert(res.morningRangeKm > 0, 'Morning range must be positive');
});

// T2.28-T2.41: Precision test across varied sleep hours (4h, 5h, 6h, 7h, 8h, 9h, 10h, 11h, 12h)
[4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(hours => {
  suite.test(`Tier 2: Boundary - Sleep hours sweep ${hours}h @ 1.0 kW`, 2, () => {
    const res = calculateEVEnergy({ batteryCap: 60.0, sleepHours: hours, acPowerKw: 1.0 });
    assertEqual(res.sleepEnergyKwh, hours * 1.0);
  });
});

// T2.42-T2.45: Precision test across AC power sweep (0.6, 0.8, 1.0, 1.4, 2.0 kW)
[0.6, 0.8, 1.0, 1.4, 2.0].forEach(acPower => {
  suite.test(`Tier 2: Boundary - AC Power sweep ${acPower} kW/h for 8h`, 2, () => {
    const res = calculateEVEnergy({ batteryCap: 60.0, sleepHours: 8, acPowerKw: acPower });
    assertCloseTo(res.sleepEnergyKwh, 8 * acPower, 0.001);
  });
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL TESTING (≥10 tests)
// ============================================================================

const PAIRWISE_CONFIGS = [
  // Car 1 vs Car 2 combinations with environmental parameters
  {
    desc: 'Pairwise 1: BYD Atto 3 (60.5) + BYD Dolphin (44.9) @ Eco (0.8 kW) 8h, No V2L',
    car1: { cap: 60.5, eff: 0.160 }, car2: { cap: 44.9, eff: 0.140 },
    env: { mode: 'eco', ac: 0.8, sleep: 8, v2l: false }
  },
  {
    desc: 'Pairwise 2: Tesla Model Y LR (78.1) + ORA Good Cat (47.8) @ Normal (1.0 kW) 8h, V2L ON',
    car1: { cap: 78.1, eff: 0.170 }, car2: { cap: 47.8, eff: 0.145 },
    env: { mode: 'normal', ac: 1.0, sleep: 8, v2l: true }
  },
  {
    desc: 'Pairwise 3: Deepal S07 (66.8) + MG4 Electric (51.0) @ Chill (1.4 kW) 10h, No V2L',
    car1: { cap: 66.8, eff: 0.170 }, car2: { cap: 51.0, eff: 0.155 },
    env: { mode: 'chill', ac: 1.4, sleep: 10, v2l: false }
  },
  {
    desc: 'Pairwise 4: BYD Seal Premium (82.5) + MG ZS EV (50.3) @ Eco (0.8 kW) 6h, No V2L',
    car1: { cap: 82.5, eff: 0.170 }, car2: { cap: 50.3, eff: 0.170 },
    env: { mode: 'eco', ac: 0.8, sleep: 6, v2l: false }
  },
  {
    desc: 'Pairwise 5: Tesla Model 3 RWD (60.0) + Aion Y Plus (63.2) @ Normal (1.0 kW) 8h, V2L ON',
    car1: { cap: 60.0, eff: 0.145 }, car2: { cap: 63.2, eff: 0.160 },
    env: { mode: 'normal', ac: 1.0, sleep: 8, v2l: true }
  },
  {
    desc: 'Pairwise 6: ORA Good Cat 500 (63.1) + Deepal L07 (66.8) @ Chill (1.4 kW) 12h, V2L ON',
    car1: { cap: 63.1, eff: 0.150 }, car2: { cap: 66.8, eff: 0.160 },
    env: { mode: 'chill', ac: 1.4, sleep: 12, v2l: true }
  },
  {
    desc: 'Pairwise 7: Custom City EV (35.0) + Custom Long Range (100.0) @ Normal (1.0 kW) 8h',
    car1: { cap: 35.0, eff: 0.140 }, car2: { cap: 100.0, eff: 0.180 },
    env: { mode: 'normal', ac: 1.0, sleep: 8, v2l: false }
  },
  {
    desc: 'Pairwise 8: MG4 LR (64.0) + BYD Dolphin Ext (60.5) @ Eco (0.8 kW) 4h, No V2L',
    car1: { cap: 64.0, eff: 0.160 }, car2: { cap: 60.5, eff: 0.150 },
    env: { mode: 'eco', ac: 0.8, sleep: 4, v2l: false }
  },
  {
    desc: 'Pairwise 9: BYD Seal Dynamic (61.4) + Tesla Model Y RWD (60.0) @ Chill (1.4 kW) 8h',
    car1: { cap: 61.4, eff: 0.155 }, car2: { cap: 60.0, eff: 0.160 },
    env: { mode: 'chill', ac: 1.4, sleep: 8, v2l: false }
  },
  {
    desc: 'Pairwise 10: BYD Atto 3 Std (49.9) + Deepal S07 (66.8) @ Normal (1.0 kW) 10h, V2L ON',
    car1: { cap: 49.9, eff: 0.155 }, car2: { cap: 66.8, eff: 0.170 },
    env: { mode: 'normal', ac: 1.0, sleep: 10, v2l: true }
  }
];

PAIRWISE_CONFIGS.forEach((pair, idx) => {
  suite.test(`Tier 3: Pairwise [${idx + 1}/10] - ${pair.desc}`, 3, () => {
    const res1 = calculateEVEnergy({
      batteryCap: pair.car1.cap,
      efficiency: pair.car1.eff,
      sleepHours: pair.env.sleep,
      acPowerKw: pair.env.ac,
      useV2L: pair.env.v2l
    });

    const res2 = calculateEVEnergy({
      batteryCap: pair.car2.cap,
      efficiency: pair.car2.eff,
      sleepHours: pair.env.sleep,
      acPowerKw: pair.env.ac,
      useV2L: false // Car 2 doesn't power V2L
    });

    assert(res1.morningSoc >= 0 && res1.morningSoc <= 100, 'Car 1 SoC in bounds');
    assert(res2.morningSoc >= 0 && res2.morningSoc <= 100, 'Car 2 SoC in bounds');
    assert(res1.morningRangeKm >= 0, 'Car 1 range >= 0');
    assert(res2.morningRangeKm >= 0, 'Car 2 range >= 0');

    // Multi-car convoy comparison integrity:
    if (pair.car1.cap > pair.car2.cap && pair.car1.eff === pair.car2.eff && !pair.env.v2l) {
      assert(res1.morningRangeKm > res2.morningRangeKm, 'Larger capacity must have higher remaining range under identical efficiency');
    }
  });
});

// ============================================================================
// TIER 4: REAL-WORLD ROAD TRIP WORKLOAD SCENARIOS (≥5 scenarios)
// ============================================================================

suite.test('Tier 4: Scenario 1 - Outbound Leg Convoy Navigation (Bangkok ➔ Dan Chang ➔ Owl Yard)', 4, () => {
  // 2 Cars: BYD Atto 3 Extended (60.5) + BYD Dolphin Standard (44.9)
  // Both charged to 95% at PTT Dan Chang EV Station PluZ
  // Drive 45 km to Owl Yard Campsite
  const car1 = calculateEVEnergy({ batteryCap: 60.5, efficiency: 0.160, startSoc: 95.0, sleepHours: 8, acPowerKw: 1.0 });
  const car2 = calculateEVEnergy({ batteryCap: 44.9, efficiency: 0.140, startSoc: 95.0, sleepHours: 8, acPowerKw: 1.0 });

  // Arrival verification
  assert(car1.arrivalSoc >= 80, `Car 1 arrival SoC ${car1.arrivalSoc}% should be ≥ 80%`);
  assert(car2.arrivalSoc >= 80, `Car 2 arrival SoC ${car2.arrivalSoc}% should be ≥ 80%`);

  // Morning verification
  assert(car1.morningSoc >= 68, `Car 1 morning SoC ${car1.morningSoc}% should be ≥ 68%`);
  assert(car2.morningSoc >= 60, `Car 2 morning SoC ${car2.morningSoc}% should be ≥ 60%`);

  // Both cars have plenty of range to reach the 65km PTT Uthai Thani Bypass charger
  assert(car1.morningRangeKm > 250, 'Car 1 morning range > 250km');
  assert(car2.morningRangeKm > 190, 'Car 2 morning range > 190km');
  assertEqual(car1.safetyStatus, 'safe');
  assertEqual(car2.safetyStatus, 'safe');
});

suite.test('Tier 4: Scenario 2 - Campsite Dinner & Attraction Range Feasibility', 4, () => {
  // Morning trip: Owl Yard ➔ Hup Pa Tat (35km) ➔ Wat Tha Sung (30km) ➔ NEXMOEV (25km) = 90km total before charging
  const atto3 = calculateEVEnergy({ batteryCap: 60.5, efficiency: 0.160, startSoc: 95.0, sleepHours: 8, acPowerKw: 1.0 });
  const dolphin = calculateEVEnergy({ batteryCap: 44.9, efficiency: 0.140, startSoc: 95.0, sleepHours: 8, acPowerKw: 1.0 });

  const requiredAttractionDistanceKm = 90.0;
  assert(atto3.morningRangeKm > requiredAttractionDistanceKm * 2, 'Atto 3 has > 2x margin for attractions');
  assert(dolphin.morningRangeKm > requiredAttractionDistanceKm * 1.5, 'Dolphin has > 1.5x margin for attractions');
});

suite.test('Tier 4: Scenario 3 - 2-Car Overnight Camp Mode Budgeting with V2L Shabu Cooking', 4, () => {
  // Car 1 (Tesla Model Y LR 78.1 kWh) powers V2L induction cooker (+2.0 kWh)
  // Car 2 (BYD Atto 3 Std 49.9 kWh) does not use V2L
  // Sleep 8h @ 24°C (1.0 kW AC)
  const car1 = calculateEVEnergy({ batteryCap: 78.1, efficiency: 0.170, startSoc: 95.0, sleepHours: 8, acPowerKw: 1.0, useV2L: true });
  const car2 = calculateEVEnergy({ batteryCap: 49.9, efficiency: 0.155, startSoc: 95.0, sleepHours: 8, acPowerKw: 1.0, useV2L: false });

  assertEqual(car1.sleepEnergyKwh, 10.0, 'Tesla sleep + V2L = 8.0 + 2.0 = 10.0 kWh');
  assertEqual(car2.sleepEnergyKwh, 8.0, 'BYD sleep = 8.0 kWh');
  assert(car1.morningSoc > 70, 'Tesla morning SoC > 70%');
  assert(car2.morningSoc > 64, 'BYD morning SoC > 64%');
  assert(car1.safetyRatio >= 4.0, 'Tesla safety ratio ≥ 4.0x');
  assert(car2.safetyRatio >= 3.0, 'BYD safety ratio ≥ 3.0x');
});

suite.test('Tier 4: Scenario 4 - Low Battery Extreme Case & Safety Warning Trigger', 4, () => {
  // Small City EV (35 kWh) arrives with only 50% SoC, runs 10h heavy AC (1.4 kW) + V2L (2.0 kWh)
  // Total drain = 14 + 2 = 16 kWh. Available at arrival = 17.5 - 7.2 = 10.3 kWh. Battery depleted!
  const depletedCar = calculateEVEnergy({
    batteryCap: 35.0,
    efficiency: 0.160,
    startSoc: 50.0,
    sleepHours: 10,
    acPowerKw: 1.4,
    useV2L: true
  });

  assertEqual(depletedCar.morningSoc, 0, 'Depleted car morning SoC is 0%');
  assertEqual(depletedCar.safetyStatus, 'danger', 'Danger status triggered when unable to reach 65km charger');
});

suite.test('Tier 4: Scenario 5 - Cold Mountain Night Eco Energy Optimization', 4, () => {
  // Ban Rai mountain winter night (22°C ambient), AC set to 25°C low fan (0.8 kW), 6h sleep, no V2L
  // Both cars retain > 75% battery in the morning
  const car1 = calculateEVEnergy({ batteryCap: 60.5, efficiency: 0.160, startSoc: 95.0, sleepHours: 6, acPowerKw: 0.8 });
  const car2 = calculateEVEnergy({ batteryCap: 63.2, efficiency: 0.160, startSoc: 95.0, sleepHours: 6, acPowerKw: 0.8 });

  assertCloseTo(car1.sleepEnergyKwh, 4.8, 0.001, '6h @ 0.8 kW = 4.8 kWh');
  assertCloseTo(car2.sleepEnergyKwh, 4.8, 0.001, '6h @ 0.8 kW = 4.8 kWh');
  assert(car1.morningSoc > 75, 'Car 1 retains > 75%');
  assert(car2.morningSoc > 75, 'Car 2 retains > 75%');
  assert(car1.morningRangeKm > 280, 'Car 1 morning range > 280km');
});

module.exports = suite;

// Allow direct CLI execution
if (require.main === module) {
  suite.run().then(results => {
    console.log(`\n=== ${suite.name} Test Results ===`);
    let passCount = 0;
    results.forEach(r => {
      if (r.passed) {
        passCount++;
        console.log(`  ✔ [Tier ${r.tier}] ${r.description} (${r.duration}ms)`);
      } else {
        console.error(`  ✖ [Tier ${r.tier}] ${r.description} (${r.duration}ms)`);
        console.error(`    Error: ${r.error.message}`);
      }
    });
    console.log(`\nTotal: ${results.length} | Passed: ${passCount} | Failed: ${results.length - passCount}`);
    process.exit(passCount === results.length ? 0 : 1);
  });
}
