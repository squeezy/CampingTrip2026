/**
 * forensic_adversarial_stress.js
 * Adversarial stress testing for Milestone 3 EV Simulator Engine
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJsPath = path.resolve(__dirname, '../app.js');
const dataJsPath = path.resolve(__dirname, '../data.js');

const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');

const sandbox = {
  module: { exports: {} },
  window: { localStorage: { getItem: () => null, setItem: () => {} }, document: { addEventListener: () => {} } },
  document: { addEventListener: () => {} },
  localStorage: { getItem: () => null, setItem: () => {} },
  console
};

vm.createContext(sandbox);
vm.runInContext(dataJsContent, sandbox);
sandbox.TRIP_DATA = sandbox.module.exports || sandbox.window.TRIP_DATA;
sandbox.window.TRIP_DATA = sandbox.TRIP_DATA;
vm.runInContext(appJsContent, sandbox);

const calc = sandbox.calculateEVEnergy;

let stressPassed = 0;
let stressFailed = 0;

function stress(name, fn) {
  try {
    fn();
    console.log(`  [PASS STRESS] ${name}`);
    stressPassed++;
  } catch (e) {
    console.error(`  [FAIL STRESS] ${name}: ${e.message}`);
    stressFailed++;
  }
}

console.log('=== Milestone 3 Adversarial Stress Testing ===\n');

stress('Adversarial 1: Null/undefined/string/NaN arguments', () => {
  const res = calc({
    batteryCap: 'invalid',
    efficiency: null,
    startSoc: undefined,
    sleepHours: 'NaN',
    acPowerKw: {},
    useV2L: 'yes'
  });
  if (res.morningSoc !== 0 || res.morningKwh !== 0 || res.safetyStatus !== 'danger') {
    throw new Error(`Failed to handle NaN inputs: ${JSON.stringify(res)}`);
  }
});

stress('Adversarial 2: Zero drive distance, zero sleep hours, zero AC', () => {
  const res = calc({
    batteryCap: 100.0,
    efficiency: 0.150,
    startSoc: 95.0,
    sleepHours: 0,
    acPowerKw: 0,
    useV2L: false,
    driveDistanceKm: 0
  });

  if (res.driveEnergyKwh !== 0) throw new Error(`Drive energy should be 0, got ${res.driveEnergyKwh}`);
  if (res.sleepEnergyKwh !== 0) throw new Error(`Sleep energy should be 0, got ${res.sleepEnergyKwh}`);
  if (Math.abs(res.arrivalSoc - 95.0) > 0.001) throw new Error(`Arrival SoC should be 95%, got ${res.arrivalSoc}`);
  if (Math.abs(res.morningSoc - 95.0) > 0.001) throw new Error(`Morning SoC should be 95%, got ${res.morningSoc}`);
});

stress('Adversarial 3: Giant battery (200 kWh) with high consumption (0.300 kWh/km)', () => {
  const res = calc({
    batteryCap: 200.0,
    efficiency: 0.300,
    startSoc: 100.0,
    sleepHours: 10,
    acPowerKw: 1.5,
    useV2L: true,
    v2lPowerKwh: 3.0,
    driveDistanceKm: 45.0
  });

  // drive: 45 * 0.3 = 13.5 kWh
  // start: 200 kWh
  // arrival: 200 - 13.5 = 186.5 kWh (93.25%)
  // sleep: 10 * 1.5 + 3 = 18 kWh
  // morning: 186.5 - 18 = 168.5 kWh (84.25%)
  // range: 168.5 / 0.3 = 561.67 km
  // ratio: 561.67 / 65 = 8.64x
  if (Math.abs(res.morningSoc - 84.25) > 0.01) throw new Error(`Morning SoC mismatch: ${res.morningSoc}`);
  if (Math.abs(res.morningRangeKm - 561.67) > 0.1) throw new Error(`Morning range mismatch: ${res.morningRangeKm}`);
  if (res.safetyStatus !== 'safe') throw new Error(`Expected safe status`);
});

stress('Adversarial 4: Negative input numbers', () => {
  const res = calc({
    batteryCap: -50.0,
    efficiency: -0.15,
    startSoc: -20,
    sleepHours: -5,
    acPowerKw: -1.0,
    useV2L: false
  });
  if (res.morningSoc !== 0 || res.morningKwh !== 0 || res.safetyStatus !== 'danger') {
    throw new Error(`Negative battery cap not handled safely: ${JSON.stringify(res)}`);
  }
});

stress('Adversarial 5: Start SoC over 100% clamped to 100%', () => {
  const res = calc({
    batteryCap: 100.0,
    efficiency: 0.160,
    startSoc: 150.0, // Over 100%
    sleepHours: 0,
    acPowerKw: 0,
    useV2L: false,
    driveDistanceKm: 0
  });
  if (Math.abs(res.arrivalSoc - 100.0) > 0.001) {
    throw new Error(`Arrival SoC was not clamped to 100%, got ${res.arrivalSoc}`);
  }
});

console.log(`\n=== Stress Summary: ${stressPassed} passed, ${stressFailed} failed ===`);
process.exit(stressFailed === 0 ? 0 : 1);
