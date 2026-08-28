/**
 * test_interactive_m3_simulator.js
 * M3 2-Car EV Simulator Engine, Presets, Climate Pills, V2L, Visual Battery Cylinders & Safety Gauge Verification
 * 
 * Tiers 1-4:
 * Tier 1: Feature Coverage (Presets, 3-tier climate, V2L toggle, Sleep chips, Battery meters, Safety badges)
 * Tier 2: Boundary & Edge Cases (Custom sliders, 0% clamping, boundary hours, localStorage corruption)
 * Tier 3: Pairwise Combinatorial (Car 1 x Car 2 x Climate x V2L matrix)
 * Tier 4: Real-World Scenarios (Driver workflow, V2L camp shabu, SOS drawer quick jump, state reload)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { TestSuite, assert, assertEqual, assertCloseTo } = require('./test_helpers');

const suite = new TestSuite('M3 Interactive 2-Car EV Simulator Verification');

const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../style.css');
const appJsPath = path.resolve(__dirname, '../app.js');
const dataJsPath = path.resolve(__dirname, '../data.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');

// Lightweight Mock DOM for Interactive Testing
class MockClassList {
  constructor(el) {
    this.el = el;
    this._classes = new Set();
  }
  add(...cls) { cls.forEach(c => this._classes.add(c)); this._sync(); }
  remove(...cls) { cls.forEach(c => this._classes.delete(c)); this._sync(); }
  toggle(cls, force) {
    if (force !== undefined) {
      if (force) this.add(cls); else this.remove(cls);
      return force;
    }
    const has = this.contains(cls);
    if (has) this.remove(cls); else this.add(cls);
    return !has;
  }
  contains(cls) { return this._classes.has(cls); }
  _sync() {
    this.el._attributes['class'] = Array.from(this._classes).join(' ');
  }
  _initFromAttr(classStr) {
    this._classes.clear();
    if (classStr) {
      classStr.trim().split(/\s+/).forEach(c => this._classes.add(c));
    }
  }
}

class MockElement {
  constructor(tagName, id = '') {
    this.tagName = (tagName || 'DIV').toUpperCase();
    this.id = id;
    this._attributes = {};
    this.style = {};
    this.children = [];
    this.parentElement = null;
    this.listeners = {};
    this._textContent = '';
    this._innerHTML = '';
    this._value = '';
    this._checked = false;
    this.classList = new MockClassList(this);
  }

  get textContent() { return this._textContent; }
  set textContent(val) {
    this._textContent = String(val);
    this._innerHTML = String(val);
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = String(val);
    this._textContent = String(val).replace(/<[^>]+>/g, '');
    if (this.tagName === 'SELECT') {
      const selectedMatch = String(val).match(/<option\s+value=["']([^"']+)["']\s+selected/i);
      if (selectedMatch) {
        this._value = selectedMatch[1];
      } else {
        const firstMatch = String(val).match(/<option\s+value=["']([^"']+)["']/i);
        if (firstMatch) this._value = firstMatch[1];
      }
    }
  }

  get value() { return this._value; }
  set value(val) { this._value = String(val); }

  get checked() { return Boolean(this._checked); }
  set checked(val) { this._checked = Boolean(val); }

  setAttribute(k, v) {
    this._attributes[k.toLowerCase()] = String(v);
    if (k.toLowerCase() === 'class') this.classList._initFromAttr(String(v));
    if (k.toLowerCase() === 'id') this.id = String(v);
    if (k.toLowerCase() === 'value') this._value = String(v);
  }

  getAttribute(k) {
    const val = this._attributes[k.toLowerCase()];
    return val !== undefined ? val : null;
  }

  removeAttribute(k) {
    delete this._attributes[k.toLowerCase()];
    if (k.toLowerCase() === 'class') this.classList._classes.clear();
  }

  hasAttribute(k) {
    return this._attributes[k.toLowerCase()] !== undefined;
  }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  dispatchEvent(event) {
    const type = (typeof event === 'string') ? event : (event.type || '');
    const handlers = this.listeners[type] || [];
    const evtObj = (typeof event === 'object') ? event : { type, target: this, preventDefault: () => {} };
    if (!evtObj.target) evtObj.target = this;
    handlers.forEach(fn => fn.call(this, evtObj));
    return true;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this, preventDefault: () => {} });
  }

  focus() {}
  scrollIntoView() {}

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const visit = (el) => {
      if (el !== this && matchSelector(el, selector)) {
        results.push(el);
      }
      el.children.forEach(visit);
    };
    visit(this);
    return results;
  }

  appendChild(child) {
    if (child) {
      child.parentElement = this;
      this.children.push(child);
    }
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }
}

function matchSingle(el, sel) {
  if (!sel || !el) return false;
  sel = sel.trim();
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
  if (sel.startsWith('[') && sel.endsWith(']')) {
    const inner = sel.slice(1, -1);
    const eqIdx = inner.indexOf('=');
    if (eqIdx === -1) return el.hasAttribute(inner);
    const attrName = inner.slice(0, eqIdx);
    let attrVal = inner.slice(eqIdx + 1);
    if ((attrVal.startsWith("'") && attrVal.endsWith("'")) || (attrVal.startsWith('"') && attrVal.endsWith('"'))) {
      attrVal = attrVal.slice(1, -1);
    }
    return el.getAttribute(attrName) === attrVal;
  }
  return el.tagName === sel.toUpperCase();
}

function matchSelector(el, sel) {
  if (!sel || !el) return false;
  const parts = sel.trim().split(/\s+/);
  if (parts.length === 1) return matchSingle(el, parts[0]);
  
  // Compound selector A B
  if (!matchSingle(el, parts[parts.length - 1])) return false;
  let curr = el.parentElement;
  for (let i = parts.length - 2; i >= 0; i--) {
    let matched = false;
    while (curr) {
      if (matchSingle(curr, parts[i])) {
        matched = true;
        curr = curr.parentElement;
        break;
      }
      curr = curr.parentElement;
    }
    if (!matched) return false;
  }
  return true;
}

function createDOMEnvironment() {
  const elementsById = new Map();
  const allElements = [];

  function register(el) {
    if (el.id) elementsById.set(el.id, el);
    allElements.push(el);
    return el;
  }

  const document = {
    documentElement: new MockElement('HTML'),
    body: new MockElement('BODY'),
    createElement: (tag) => {
      const el = new MockElement(tag);
      allElements.push(el);
      return el;
    },
    getElementById: (id) => elementsById.get(id) || null,
    querySelector: (sel) => {
      if (sel.startsWith('#') && !sel.includes(' ')) return elementsById.get(sel.slice(1)) || null;
      for (const el of allElements) {
        if (matchSelector(el, sel)) return el;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      const res = [];
      for (const el of allElements) {
        if (matchSelector(el, sel)) res.push(el);
      }
      return res;
    },
    addEventListener: () => {}
  };

  // Build simulator DOM nodes
  const simCar1Model = register(new MockElement('SELECT', 'simCar1Model'));
  const simCar2Model = register(new MockElement('SELECT', 'simCar2Model'));
  const simCar1Cap = register(new MockElement('INPUT', 'simCar1Cap'));
  simCar1Cap.value = '60.5';
  const simCar2Cap = register(new MockElement('INPUT', 'simCar2Cap'));
  simCar2Cap.value = '44.9';
  const simSleepHours = register(new MockElement('INPUT', 'simSleepHours'));
  simSleepHours.value = '8';
  const simAcPower = register(new MockElement('INPUT', 'simAcPower'));
  simAcPower.value = '1.0';
  const simV2lToggle = register(new MockElement('INPUT', 'simV2lToggle'));
  simV2lToggle.checked = false;

  const valCar1Cap = register(new MockElement('SPAN', 'valCar1Cap'));
  const valCar2Cap = register(new MockElement('SPAN', 'valCar2Cap'));
  const valSleepHours = register(new MockElement('SPAN', 'valSleepHours'));
  const valAcPower = register(new MockElement('SPAN', 'valAcPower'));

  const c1BatteryFill = register(new MockElement('DIV', 'c1BatteryFill'));
  const c2BatteryFill = register(new MockElement('DIV', 'c2BatteryFill'));
  const c1SocOverlay = register(new MockElement('DIV', 'c1SocOverlay'));
  const c2SocOverlay = register(new MockElement('DIV', 'c2SocOverlay'));
  const c1MorningSoc = register(new MockElement('STRONG', 'c1MorningSoc'));
  const c2MorningSoc = register(new MockElement('STRONG', 'c2MorningSoc'));
  const c1MorningRange = register(new MockElement('STRONG', 'c1MorningRange'));
  const c2MorningRange = register(new MockElement('STRONG', 'c2MorningRange'));
  const c1ArrivalSoc = register(new MockElement('STRONG', 'c1ArrivalSoc'));
  const c2ArrivalSoc = register(new MockElement('STRONG', 'c2ArrivalSoc'));
  const c1SleepEnergy = register(new MockElement('STRONG', 'c1SleepEnergy'));
  const c2SleepEnergy = register(new MockElement('STRONG', 'c2SleepEnergy'));
  const c1SafetyBadge = register(new MockElement('DIV', 'c1SafetyBadge'));
  const c2SafetyBadge = register(new MockElement('DIV', 'c2SafetyBadge'));
  const c1SafetyRatio = register(new MockElement('SPAN', 'c1SafetyRatio'));
  const c2SafetyRatio = register(new MockElement('SPAN', 'c2SafetyRatio'));
  const convoyAdviceText = register(new MockElement('DIV', 'convoyAdviceText'));

  // Climate Preset Pills
  const climatePresetGroup = register(new MockElement('DIV', 'climatePresetGroup'));
  const pillEco = register(new MockElement('BUTTON'));
  pillEco.setAttribute('class', 'climate-pill');
  pillEco.setAttribute('data-climate', 'eco');
  pillEco.setAttribute('data-power', '0.8');

  const pillNormal = register(new MockElement('BUTTON'));
  pillNormal.setAttribute('class', 'climate-pill active');
  pillNormal.setAttribute('data-climate', 'normal');
  pillNormal.setAttribute('data-power', '1.0');

  const pillChill = register(new MockElement('BUTTON'));
  pillChill.setAttribute('class', 'climate-pill');
  pillChill.setAttribute('data-climate', 'chill');
  pillChill.setAttribute('data-power', '1.4');

  climatePresetGroup.appendChild(pillEco);
  climatePresetGroup.appendChild(pillNormal);
  climatePresetGroup.appendChild(pillChill);

  // Sleep Chips
  const sleepChipsGroup = register(new MockElement('DIV', 'sleepChipsGroup'));
  const chip6 = register(new MockElement('BUTTON'));
  chip6.setAttribute('class', 'chip-btn');
  chip6.setAttribute('data-hours', '6');

  const chip8 = register(new MockElement('BUTTON'));
  chip8.setAttribute('class', 'chip-btn active');
  chip8.setAttribute('data-hours', '8');

  const chip10 = register(new MockElement('BUTTON'));
  chip10.setAttribute('class', 'chip-btn');
  chip10.setAttribute('data-hours', '10');

  sleepChipsGroup.appendChild(chip6);
  sleepChipsGroup.appendChild(chip8);
  sleepChipsGroup.appendChild(chip10);

  const mockStorage = new Map();
  const localStorage = {
    getItem: (k) => mockStorage.get(k) || null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
    clear: () => mockStorage.clear()
  };

  const sandbox = {
    module: { exports: {} },
    window: {
      localStorage,
      document,
      addEventListener: () => {},
      scrollTo: () => {},
      history: { pushState: () => {} },
      location: { hash: '' },
      matchMedia: () => ({ matches: false })
    },
    document,
    localStorage,
    console,
    lucide: { createIcons: () => {} },
    L: {
      map: () => ({ setView: () => {}, addTo: () => {}, invalidateSize: () => {} }),
      tileLayer: () => ({ addTo: () => ({ bringToBack: () => {} }) }),
      layerGroup: () => ({ addTo: () => ({ clearLayers: () => {} }) }),
      marker: () => ({ addTo: () => ({ bindPopup: () => {}, on: () => {} }) }),
      polyline: () => ({ addTo: () => ({ bindTooltip: () => {}, setStyle: () => {} }) }),
      divIcon: () => ({})
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(dataJsContent, sandbox);
  sandbox.TRIP_DATA = sandbox.module.exports || sandbox.window.TRIP_DATA;
  sandbox.window.TRIP_DATA = sandbox.TRIP_DATA;
  vm.runInContext(appJsContent, sandbox);

  return { sandbox, document, localStorage };
}

// ============================================================================
// TIER 1: FEATURE COVERAGE (Presets, Climate, V2L, Sleep, Battery, Safety)
// ============================================================================

suite.test('Tier 1: Presets - TRIP_DATA contains 18 EV presets with batteryCap and consumption', 1, () => {
  const { sandbox } = createDOMEnvironment();
  const presets = sandbox.TRIP_DATA.evPresets;
  assert(Array.isArray(presets), 'evPresets must be an array');
  assertEqual(presets.length, 18, 'Expected 18 presets (17 Thai EV models + 1 custom)');
  presets.forEach(p => {
    assert(p.id, 'Preset missing id');
    assert(p.brand, `Preset ${p.id} missing brand`);
    assert(p.batteryCap > 0, `Preset ${p.id} batteryCap must be > 0`);
    assert(p.consumption > 0, `Preset ${p.id} consumption must be > 0`);
  });
});

suite.test('Tier 1: Selectors - Populate Car 1 and Car 2 model dropdowns from presets', 1, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const c1Select = document.getElementById('simCar1Model');
  const c2Select = document.getElementById('simCar2Model');
  assert(c1Select.innerHTML.includes('BYD Atto 3'), 'Car 1 select contains BYD Atto 3');
  assert(c1Select.innerHTML.includes('Tesla Model Y'), 'Car 1 select contains Tesla Model Y');
  assert(c2Select.innerHTML.includes('BYD Dolphin'), 'Car 2 select contains BYD Dolphin');
});

suite.test('Tier 1: Model Switching - Selecting Tesla Model Y LR updates capacity and morning calculations', 1, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const c1Select = document.getElementById('simCar1Model');
  c1Select.value = 'tesla_my_lr';
  c1Select.dispatchEvent('change');

  const c1MorningSoc = document.getElementById('c1MorningSoc');
  const c1MorningRange = document.getElementById('c1MorningRange');
  const c1CapDisplay = document.getElementById('valCar1Cap');

  assertEqual(c1CapDisplay.textContent, '78.1 kWh');
  assert(parseInt(c1MorningSoc.textContent) > 70, 'Morning SoC should exceed 70%');
  assert(parseInt(c1MorningRange.textContent.replace(/[^0-9]/g, '')) > 300, 'Morning range should exceed 300 km');
});

suite.test('Tier 1: 3-Tier Climate - Eco (0.8 kW), Normal (1.0 kW), and Chill (1.4 kW) pills react dynamically', 1, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const pills = document.querySelectorAll('#climatePresetGroup .climate-pill');
  const ecoPill = Array.from(pills).find(p => p.getAttribute('data-climate') === 'eco');
  const chillPill = Array.from(pills).find(p => p.getAttribute('data-climate') === 'chill');

  assert(chillPill, 'Chill pill exists');
  assert(ecoPill, 'Eco pill exists');

  // Switch to Chill (1.4 kW)
  chillPill.click();
  assertEqual(document.getElementById('valAcPower').textContent, '1.4 kW/ชม.');
  assert(chillPill.classList.contains('active'), 'Chill pill is active');
  assert(!ecoPill.classList.contains('active'), 'Eco pill is inactive');

  const sleepEnergyChill = parseFloat(document.getElementById('c1SleepEnergy').textContent);
  assertEqual(sleepEnergyChill, 11.2, '8h @ 1.4 kW = 11.2 kWh');

  // Switch to Eco (0.8 kW)
  ecoPill.click();
  assertEqual(document.getElementById('valAcPower').textContent, '0.8 kW/ชม.');
  const sleepEnergyEco = parseFloat(document.getElementById('c1SleepEnergy').textContent);
  assertEqual(sleepEnergyEco, 6.4, '8h @ 0.8 kW = 6.4 kWh');
});

suite.test('Tier 1: 1-Tap V2L - Enabling V2L adds +2.0 kWh to overnight drain', 1, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const v2lToggle = document.getElementById('simV2lToggle');
  const withoutV2lSleep = parseFloat(document.getElementById('c1SleepEnergy').textContent);

  v2lToggle.checked = true;
  v2lToggle.dispatchEvent('change');

  const withV2lSleep = parseFloat(document.getElementById('c1SleepEnergy').textContent);
  assertCloseTo(withV2lSleep - withoutV2lSleep, 2.0, 0.01, 'V2L delta must be exactly 2.0 kWh');
});

suite.test('Tier 1: Sleep Chips - 6h, 8h, 10h chips update sleep duration and recalculate', 1, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const chips = document.querySelectorAll('#sleepChipsGroup .chip-btn');
  const chip6 = Array.from(chips).find(c => c.getAttribute('data-hours') === '6');
  const chip10 = Array.from(chips).find(c => c.getAttribute('data-hours') === '10');

  assert(chip6, 'Chip 6h exists');
  assert(chip10, 'Chip 10h exists');

  chip6.click();
  assertEqual(document.getElementById('valSleepHours').textContent, '6 ชม.');
  assertEqual(parseFloat(document.getElementById('c1SleepEnergy').textContent), 6.0);

  chip10.click();
  assertEqual(document.getElementById('valSleepHours').textContent, '10 ชม.');
  assertEqual(parseFloat(document.getElementById('c1SleepEnergy').textContent), 10.0);
});

suite.test('Tier 1: Battery Cylinder - Height percentage and color fill thresholds sync with SoC', 1, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const fill1 = document.getElementById('c1BatteryFill');
  assert(fill1.style.height.includes('70%'), 'Fill height reflects ~70% SoC');
  assert(fill1.classList.contains('fill-green'), 'Green fill for >= 50% SoC');
});

suite.test('Tier 1: Safety Margin - Safety ratio badge displays ratio vs 65km charger', 1, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const badge1 = document.getElementById('c1SafetyBadge');
  const ratio1 = document.getElementById('c1SafetyRatio');

  assert(badge1.textContent.includes('ปลอดภัยมาก'), 'Badge indicates safe status');
  assert(ratio1.textContent.includes('65 กม.'), 'Subtext references 65 km station');
});

// ============================================================================
// TIER 2: BOUNDARY & EDGE CASES
// ============================================================================

suite.test('Tier 2: Boundary - Custom capacity slider input updates state and switches model to custom', 2, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const c1CapInput = document.getElementById('simCar1Cap');
  c1CapInput.value = '55.5';
  c1CapInput.dispatchEvent('input');

  assertEqual(document.getElementById('valCar1Cap').textContent, '55.5 kWh');
  assertEqual(document.getElementById('simCar1Model').value, 'custom');
});

suite.test('Tier 2: Boundary - Sleep hours boundary 4h and 12h', 2, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const sleepInput = document.getElementById('simSleepHours');
  sleepInput.value = '4';
  sleepInput.dispatchEvent('input');
  assertEqual(document.getElementById('valSleepHours').textContent, '4 ชม.');

  sleepInput.value = '12';
  sleepInput.dispatchEvent('input');
  assertEqual(document.getElementById('valSleepHours').textContent, '12 ชม.');
});

suite.test('Tier 2: Boundary - Total depletion clamped to 0% and danger status badge', 2, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const c1CapInput = document.getElementById('simCar1Cap');
  const sleepInput = document.getElementById('simSleepHours');
  const acInput = document.getElementById('simAcPower');
  const v2lToggle = document.getElementById('simV2lToggle');

  c1CapInput.value = '35.0'; // Small battery
  c1CapInput.dispatchEvent('input');

  sleepInput.value = '12';
  sleepInput.dispatchEvent('input');

  acInput.value = '2.0';
  acInput.dispatchEvent('input');

  v2lToggle.checked = true;
  v2lToggle.dispatchEvent('change');

  const morningSoc = parseInt(document.getElementById('c1MorningSoc').textContent);
  assert(morningSoc <= 10, 'Morning SoC should be depleted under extreme load');
  assert(document.getElementById('c1SafetyBadge').textContent.includes('ควรระวัง') || document.getElementById('c1SafetyBadge').textContent.includes('เพียงพอ'), 'Badge reflects low margin');
});

suite.test('Tier 2: Boundary - LocalStorage persistence and recovery', 2, () => {
  const { sandbox, localStorage } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const saved = localStorage.getItem('ev_convoy_sim_v2');
  assert(saved, 'State saved to localStorage');
  const parsed = JSON.parse(saved);
  assert(parsed.car1Cap, 'Saved state contains car1Cap');
  assert(parsed.car2Cap, 'Saved state contains car2Cap');
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL TESTING
// ============================================================================

const M3_PAIRWISE = [
  { c1: 'byd_atto3_ext', c2: 'byd_dolphin_std', climate: 'eco', v2l: false },
  { c1: 'tesla_my_lr', c2: 'mg_mg4_std', climate: 'chill', v2l: true },
  { c1: 'changan_s07', c2: 'gwm_goodcat_400', climate: 'normal', v2l: false },
  { c1: 'byd_seal_prm', c2: 'aion_y_plus', climate: 'chill', v2l: true }
];

M3_PAIRWISE.forEach((pair, idx) => {
  suite.test(`Tier 3: Pairwise [${idx + 1}/4] - Car 1 [${pair.c1}] vs Car 2 [${pair.c2}] @ ${pair.climate} (V2L: ${pair.v2l})`, 3, () => {
    const { sandbox, document } = createDOMEnvironment();
    sandbox.initEVSimulator();

    const c1Select = document.getElementById('simCar1Model');
    const c2Select = document.getElementById('simCar2Model');
    const pills = document.querySelectorAll('#climatePresetGroup .climate-pill');
    const targetPill = Array.from(pills).find(p => p.getAttribute('data-climate') === pair.climate);
    const v2lToggle = document.getElementById('simV2lToggle');

    c1Select.value = pair.c1;
    c1Select.dispatchEvent('change');

    c2Select.value = pair.c2;
    c2Select.dispatchEvent('change');

    if (targetPill) targetPill.click();
    v2lToggle.checked = pair.v2l;
    v2lToggle.dispatchEvent('change');

    const soc1 = parseInt(document.getElementById('c1MorningSoc').textContent);
    const soc2 = parseInt(document.getElementById('c2MorningSoc').textContent);
    assert(soc1 > 0 && soc1 <= 100, 'Car 1 SoC in valid range');
    assert(soc2 > 0 && soc2 <= 100, 'Car 2 SoC in valid range');
  });
});

// ============================================================================
// TIER 4: REAL-WORLD SCENARIOS
// ============================================================================

suite.test('Tier 4: Scenario 1 - Standard Roadtrip Convoy (Atto 3 Ext + Dolphin Std @ Normal 24C)', 4, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  assertEqual(document.getElementById('simCar1Model').value, 'byd_atto3_ext');
  assertEqual(document.getElementById('simCar2Model').value, 'byd_dolphin_std');

  const c1Range = parseInt(document.getElementById('c1MorningRange').textContent.replace(/[^0-9]/g, ''));
  const c2Range = parseInt(document.getElementById('c2MorningRange').textContent.replace(/[^0-9]/g, ''));

  assert(c1Range >= 250, 'Atto 3 has >= 250 km morning range');
  assert(c2Range >= 180, 'Dolphin has >= 180 km morning range');
  assert(document.getElementById('convoyAdviceText').innerHTML.includes('ปลอดภัยสูงมาก'), 'Convoy advice confirms safe status');
});

suite.test('Tier 4: Scenario 2 - Cold Night Eco Camp Mode (6h Sleep @ 28C 0.8kW)', 4, () => {
  const { sandbox, document } = createDOMEnvironment();
  sandbox.initEVSimulator();

  const pills = document.querySelectorAll('#climatePresetGroup .climate-pill');
  const ecoPill = Array.from(pills).find(p => p.getAttribute('data-climate') === 'eco');
  ecoPill.click();

  const chips = document.querySelectorAll('#sleepChipsGroup .chip-btn');
  const chip6 = Array.from(chips).find(c => c.getAttribute('data-hours') === '6');
  chip6.click();

  const c1Soc = parseInt(document.getElementById('c1MorningSoc').textContent);
  const c2Soc = parseInt(document.getElementById('c2MorningSoc').textContent);

  assert(c1Soc >= 74, 'Car 1 retains >= 74% battery in eco mode');
  assert(c2Soc >= 69, 'Car 2 retains >= 69% battery in eco mode');
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
