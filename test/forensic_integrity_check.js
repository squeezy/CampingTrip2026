/**
 * forensic_integrity_check.js
 * Independent, exhaustive forensic audit script for Milestone 3 deliverables.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJsPath = path.resolve(__dirname, '../app.js');
const dataJsPath = path.resolve(__dirname, '../data.js');
const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../style.css');

const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Lightweight DOM Mock for Interactive Simulation
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

function createSandbox() {
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

  // Build simulator DOM
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
  const c1SliderLabel = register(new MockElement('SPAN', 'c1SliderLabel'));
  const c2SliderLabel = register(new MockElement('SPAN', 'c2SliderLabel'));
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

  // Climate Presets
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

let checksPassed = 0;
let checksFailed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    checksPassed++;
  } catch (e) {
    console.error(`  [FAIL] ${name}: ${e.message}`);
    checksFailed++;
  }
}

console.log('=== Milestones M3 Forensic Audit: Independent Verification ===\n');

// 1. Math/Physics Formula Verification
check('Physics Formula: Standard BYD Atto 3 Extended (60.5 kWh, eff 0.160, start 95%, 8h @ 1.0kW, no V2L)', () => {
  const { sandbox } = createSandbox();
  const res = sandbox.calculateEVEnergy({
    batteryCap: 60.5,
    efficiency: 0.160,
    startSoc: 95.0,
    sleepHours: 8.0,
    acPowerKw: 1.0,
    useV2L: false,
    driveDistanceKm: 45.0
  });

  // Expected calculations:
  // driveEnergy = 45 * 0.160 = 7.2 kWh
  // startKwh = 0.95 * 60.5 = 57.475 kWh
  // arrivalKwh = 57.475 - 7.2 = 50.275 kWh
  // arrivalSoc = (50.275 / 60.5) * 100 = 83.099%
  // sleepEnergy = 8 * 1.0 = 8.0 kWh
  // morningKwh = 50.275 - 8.0 = 42.275 kWh
  // morningSoc = (42.275 / 60.5) * 100 = 69.876% (~70%)
  // morningRange = 42.275 / 0.160 = 264.218 km (~264 km)
  // safetyRatio = 264.218 / 65.0 = 4.064x (~4.1x)

  if (Math.abs(res.driveEnergyKwh - 7.2) > 0.001) throw new Error(`Drive energy mismatch: ${res.driveEnergyKwh}`);
  if (Math.abs(res.arrivalKwh - 50.275) > 0.001) throw new Error(`Arrival kWh mismatch: ${res.arrivalKwh}`);
  if (Math.abs(res.arrivalSoc - 83.099) > 0.01) throw new Error(`Arrival SoC mismatch: ${res.arrivalSoc}`);
  if (Math.abs(res.sleepEnergyKwh - 8.0) > 0.001) throw new Error(`Sleep energy mismatch: ${res.sleepEnergyKwh}`);
  if (Math.abs(res.morningKwh - 42.275) > 0.001) throw new Error(`Morning kWh mismatch: ${res.morningKwh}`);
  if (Math.abs(res.morningSoc - 69.876) > 0.01) throw new Error(`Morning SoC mismatch: ${res.morningSoc}`);
  if (Math.abs(res.morningRangeKm - 264.218) > 0.1) throw new Error(`Morning range mismatch: ${res.morningRangeKm}`);
  if (Math.abs(res.safetyRatio - 4.064) > 0.05) throw new Error(`Safety ratio mismatch: ${res.safetyRatio}`);
  if (res.safetyStatus !== 'safe') throw new Error(`Expected safe status, got ${res.safetyStatus}`);
});

// 2. Clamping and Boundary tests
check('Boundary: Battery Capacity 0 returns safe clamped 0 results', () => {
  const { sandbox } = createSandbox();
  const res = sandbox.calculateEVEnergy({ batteryCap: 0 });
  if (res.morningSoc !== 0 || res.morningRangeKm !== 0 || res.safetyRatio !== 0 || res.safetyStatus !== 'danger') {
    throw new Error(`Invalid zero cap result: ${JSON.stringify(res)}`);
  }
});

check('Boundary: Depleted battery clamps to 0 and does not return negative values', () => {
  const { sandbox } = createSandbox();
  const res = sandbox.calculateEVEnergy({
    batteryCap: 20.0,
    efficiency: 0.20,
    startSoc: 50.0,
    sleepHours: 12.0,
    acPowerKw: 2.0,
    useV2L: true,
    v2lPowerKwh: 5.0,
    driveDistanceKm: 100.0
  });

  if (res.morningKwh < 0 || res.morningSoc < 0 || res.morningRangeKm < 0 || res.safetyRatio < 0) {
    throw new Error(`Negative values found: ${JSON.stringify(res)}`);
  }
  if (res.safetyStatus !== 'danger') {
    throw new Error(`Expected danger status for depleted battery`);
  }
});

// 3. Empirical check of all 18 Presets
check('Preservation & Authenticity: All 18 Presets execute real physics calculations without failure', () => {
  const { sandbox } = createSandbox();
  const presets = sandbox.TRIP_DATA.evPresets;
  if (!Array.isArray(presets) || presets.length !== 18) throw new Error('Invalid evPresets');

  presets.forEach(p => {
    const res = sandbox.calculateEVEnergy({
      batteryCap: p.batteryCap || p.capacity,
      efficiency: p.consumption || p.efficiency,
      startSoc: 95.0,
      sleepHours: 8.0,
      acPowerKw: 1.0,
      useV2L: false
    });
    if (!Number.isFinite(res.morningSoc) || res.morningSoc <= 0 || res.morningSoc > 100) {
      throw new Error(`Preset ${p.id} yielded invalid morningSoc: ${res.morningSoc}`);
    }
    if (!Number.isFinite(res.morningRangeKm) || res.morningRangeKm <= 0) {
      throw new Error(`Preset ${p.id} yielded invalid morningRange: ${res.morningRangeKm}`);
    }
  });
});

// 4. Interactive Simulation & State Synchronization
check('Interactive Engine: Preset change switches model, capacity, and triggers recalculation', () => {
  const { sandbox, document } = createSandbox();
  sandbox.initEVSimulator();

  const c1Select = document.getElementById('simCar1Model');
  c1Select.value = 'byd_seal_prm'; // 82.5 kWh, eff 0.170
  c1Select.dispatchEvent('change');

  if (document.getElementById('valCar1Cap').textContent !== '82.5 kWh') {
    throw new Error('valCar1Cap not updated');
  }
  if (document.getElementById('c1SliderLabel').textContent !== '82.5 kWh') {
    throw new Error('c1SliderLabel not updated');
  }
  const soc = parseInt(document.getElementById('c1MorningSoc').textContent);
  if (soc < 70) throw new Error(`Unexpected morning SoC for Seal Premium: ${soc}%`);
});

// 5. Climate Presets Sync
check('Interactive Engine: Climate Pill Eco / Normal / Chill updates state and AC slider', () => {
  const { sandbox, document } = createSandbox();
  sandbox.initEVSimulator();

  const pills = document.querySelectorAll('#climatePresetGroup .climate-pill');
  const chillPill = Array.from(pills).find(p => p.getAttribute('data-climate') === 'chill');
  chillPill.click();

  if (document.getElementById('valAcPower').textContent !== '1.4 kW/ชม.') {
    throw new Error('valAcPower not updated to 1.4 kW');
  }
  if (document.getElementById('simAcPower').value !== '1.4') {
    throw new Error('simAcPower input value not synced to 1.4');
  }
});

// 6. Custom AC Slider switches pills
check('Interactive Engine: Moving AC slider to custom value (1.2 kW) unsets climate pills', () => {
  const { sandbox, document } = createSandbox();
  sandbox.initEVSimulator();

  const acInput = document.getElementById('simAcPower');
  acInput.value = '1.2';
  acInput.dispatchEvent('input');

  const activePills = document.querySelectorAll('#climatePresetGroup .climate-pill.active');
  if (activePills.length !== 0) {
    throw new Error('Pills should not be active for custom AC power 1.2 kW');
  }
});

// 7. V2L Toggle and Drain Delta
check('Interactive Engine: V2L Toggle adds exactly +2.0 kWh to overnight energy calculation', () => {
  const { sandbox, document } = createSandbox();
  sandbox.initEVSimulator();

  const v2lToggle = document.getElementById('simV2lToggle');
  const initialSleep = parseFloat(document.getElementById('c1SleepEnergy').textContent);

  v2lToggle.checked = true;
  v2lToggle.dispatchEvent('change');

  const v2lSleep = parseFloat(document.getElementById('c1SleepEnergy').textContent);
  if (Math.abs(v2lSleep - initialSleep - 2.0) > 0.01) {
    throw new Error(`V2L delta expected 2.0 kWh, got ${v2lSleep - initialSleep}`);
  }
});

// 8. Visual Battery Cylinder & Safety Ratio Badges
check('Visual Battery Widget: Fluid height and color classes update correctly based on SoC', () => {
  const { sandbox, document } = createSandbox();
  sandbox.initEVSimulator();

  const fill1 = document.getElementById('c1BatteryFill');
  if (!fill1.style.height || !fill1.classList.contains('fill-green')) {
    throw new Error('Battery fill class / height mismatch for high SoC');
  }

  // Deplete battery to test red fill
  const c1Cap = document.getElementById('simCar1Cap');
  c1Cap.value = '35.0';
  c1Cap.dispatchEvent('input');

  const sleepInput = document.getElementById('simSleepHours');
  sleepInput.value = '12';
  sleepInput.dispatchEvent('input');

  const acInput = document.getElementById('simAcPower');
  acInput.value = '2.0';
  acInput.dispatchEvent('input');

  const v2lToggle = document.getElementById('simV2lToggle');
  v2lToggle.checked = true;
  v2lToggle.dispatchEvent('change');

  if (!fill1.classList.contains('fill-red')) {
    throw new Error(`Expected fill-red class on depleted battery, got ${fill1.getAttribute('class')}`);
  }
});

// 9. LocalStorage Recovery
check('State Persistence: State serializes to ev_convoy_sim_v2 and restores smoothly', () => {
  const { sandbox, localStorage } = createSandbox();
  sandbox.initEVSimulator();

  const saved = localStorage.getItem('ev_convoy_sim_v2');
  if (!saved) throw new Error('State not written to localStorage');

  const parsed = JSON.parse(saved);
  if (!parsed.car1Model || !parsed.car2Model || parsed.sleepHours !== 8) {
    throw new Error(`Invalid saved state: ${saved}`);
  }
});

console.log(`\n=== Summary: ${checksPassed} passed, ${checksFailed} failed ===`);
process.exit(checksFailed === 0 ? 0 : 1);
