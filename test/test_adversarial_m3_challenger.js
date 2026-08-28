/**
 * test_adversarial_m3_challenger.js
 * Empirical Challenger M3 Adversarial Stress Testing Suite
 * 
 * Focus Areas:
 * 1. Schema & numerical validity of all 18 EV vehicle presets + complete DOM field synchronization for Car 1 & Car 2
 * 2. LocalStorage persistence, corrupted payload resilience, prototype pollution safety, quota exhaustion handling & graceful fallback
 * 3. 324 Pairwise Combinatorial Vehicle Presets (18x18) x Climate Modes (3) x Sleep Chips (3) x V2L (2)
 * 4. Boundary & extreme edge case stress testing (0% clamping, extreme loads, negative/NaN inputs, rapid event fuzzing)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { TestSuite, assert, assertEqual, assertCloseTo } = require('./test_helpers');

const suite = new TestSuite('M3 Challenger Adversarial Stress Testing & Presets Verification');

const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../style.css');
const appJsPath = path.resolve(__dirname, '../app.js');
const dataJsPath = path.resolve(__dirname, '../data.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');

// DOM Mock Engine
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
    if (id) this._attributes['id'] = id;
    this.style = {};
    this.children = [];
    this.parentElement = null;
    this.parentNode = null;
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

  get innerHTML() {
    if (this.children.length > 0) {
      return this.children.map(c => c.outerHTML).join('');
    }
    return this._innerHTML;
  }

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

  get outerHTML() {
    const attrs = Object.entries(this._attributes)
      .map(([k, v]) => `${k}="${v.replace(/"/g, '&quot;')}"`)
      .join(' ');
    const attrPart = attrs.length > 0 ? ` ${attrs}` : '';
    const tag = this.tagName.toLowerCase();
    return `<${tag}${attrPart}>${this.innerHTML}</${tag}>`;
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

  removeEventListener(event, fn) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== fn);
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
  scrollIntoView() { this._scrolled = true; }

  appendChild(child) {
    if (child) {
      child.parentElement = this;
      child.parentNode = this;
      this.children.push(child);
    }
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
      child.parentNode = null;
    }
    return child;
  }

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

function createChallengerEnv(options = {}) {
  const { initialStorage = {} } = options;
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
      if (sel.startsWith('#') && !sel.includes(' ') && !sel.includes('.') && !sel.includes('[')) {
        return elementsById.get(sel.slice(1)) || null;
      }
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
  const c1SliderLabel = register(new MockElement('SPAN', 'c1SliderLabel'));
  const c2SliderLabel = register(new MockElement('SPAN', 'c2SliderLabel'));
  const valSleepHours = register(new MockElement('SPAN', 'valSleepHours'));
  const valAcPower = register(new MockElement('SPAN', 'valAcPower'));

  const c1ModelBadge = register(new MockElement('SPAN', 'c1ModelBadge'));
  const c2ModelBadge = register(new MockElement('SPAN', 'c2ModelBadge'));
  const c1CapBadge = register(new MockElement('SPAN', 'c1CapBadge'));
  const c2CapBadge = register(new MockElement('SPAN', 'c2CapBadge'));

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
  const c1ArrivalKwh = register(new MockElement('SPAN', 'c1ArrivalKwh'));
  const c2ArrivalKwh = register(new MockElement('SPAN', 'c2ArrivalKwh'));
  const c1SleepEnergy = register(new MockElement('STRONG', 'c1SleepEnergy'));
  const c2SleepEnergy = register(new MockElement('STRONG', 'c2SleepEnergy'));
  const c1StartVal = register(new MockElement('SPAN', 'c1StartVal'));
  const c2StartVal = register(new MockElement('SPAN', 'c2StartVal'));
  const c1DriveVal = register(new MockElement('SPAN', 'c1DriveVal'));
  const c2DriveVal = register(new MockElement('SPAN', 'c2DriveVal'));
  const c1MorningVal = register(new MockElement('STRONG', 'c1MorningVal'));
  const c2MorningVal = register(new MockElement('STRONG', 'c2MorningVal'));

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

  const mockStorage = new Map(Object.entries(initialStorage));
  let throwOnSet = false;

  const localStorage = {
    getItem: (k) => mockStorage.has(k) ? mockStorage.get(k) : null,
    setItem: (k, v) => {
      if (throwOnSet) {
        throw new Error('QuotaExceededError: DOM Exception 22');
      }
      mockStorage.set(k, String(v));
    },
    removeItem: (k) => mockStorage.delete(k),
    clear: () => mockStorage.clear(),
    _setThrowOnSet: (val) => { throwOnSet = val; },
    _getRaw: (k) => mockStorage.get(k)
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
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    },
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

function getSimState(sandbox) {
  return sandbox.window.SimState || sandbox.SimState;
}

// ============================================================================
// TIER 1: AUTHORITATIVE EV PRESETS SCHEMA & DOM POPULATION ACROSS ALL 18 MODELS
// ============================================================================

suite.test('Tier 1: Presets Schema & Numerical Validity - All 18 vehicle presets have valid capacities and efficiencies', 1, () => {
  const { sandbox } = createChallengerEnv();
  const presets = sandbox.TRIP_DATA.evPresets;

  assert(Array.isArray(presets), 'TRIP_DATA.evPresets must be an array');
  assertEqual(presets.length, 18, 'Must contain exactly 18 vehicle presets');

  const seenIds = new Set();

  presets.forEach((p, idx) => {
    // 1. Identification
    assert(p.id && typeof p.id === 'string', `Preset #${idx + 1} missing valid string id`);
    assert(!seenIds.has(p.id), `Duplicate preset id detected: ${p.id}`);
    seenIds.add(p.id);

    assert(p.brand && typeof p.brand === 'string', `Preset ${p.id} missing brand`);
    assert(p.model && typeof p.model === 'string', `Preset ${p.id} missing model`);
    assert(p.name && typeof p.name === 'string', `Preset ${p.id} missing name`);

    // 2. Battery Capacity Numerical Integrity
    assert(typeof p.batteryCap === 'number' && Number.isFinite(p.batteryCap), `Preset ${p.id} batteryCap is not a finite number: ${p.batteryCap}`);
    assert(typeof p.capacity === 'number' && Number.isFinite(p.capacity), `Preset ${p.id} capacity is not a finite number: ${p.capacity}`);
    assertEqual(p.batteryCap, p.capacity, `Preset ${p.id} batteryCap (${p.batteryCap}) must equal capacity (${p.capacity})`);
    assert(p.batteryCap >= 35.0 && p.batteryCap <= 120.0, `Preset ${p.id} batteryCap out of realistic Thai EV range (35-120 kWh): ${p.batteryCap}`);

    // 3. Efficiency / Consumption Numerical Integrity
    assert(typeof p.consumption === 'number' && Number.isFinite(p.consumption), `Preset ${p.id} consumption is not a finite number: ${p.consumption}`);
    assert(typeof p.efficiency === 'number' && Number.isFinite(p.efficiency), `Preset ${p.id} efficiency is not a finite number: ${p.efficiency}`);
    assertEqual(p.consumption, p.efficiency, `Preset ${p.id} consumption (${p.consumption}) must equal efficiency (${p.efficiency})`);
    assert(p.consumption >= 0.120 && p.consumption <= 0.220, `Preset ${p.id} consumption out of realistic EV range (0.12-0.22 kWh/km): ${p.consumption}`);
  });
});

suite.test('Tier 1: Presets DOM Population - Dropdown selects render exactly 18 option elements with correct values and labels', 1, () => {
  const { sandbox, document } = createChallengerEnv();
  sandbox.initEVSimulator();

  const c1Select = document.getElementById('simCar1Model');
  const c2Select = document.getElementById('simCar2Model');

  assert(c1Select, 'Car 1 model selector must exist in DOM');
  assert(c2Select, 'Car 2 model selector must exist in DOM');

  const presets = sandbox.TRIP_DATA.evPresets;

  presets.forEach(p => {
    assert(c1Select.innerHTML.includes(`value="${p.id}"`), `Car 1 select missing option for preset ${p.id}`);
    assert(c2Select.innerHTML.includes(`value="${p.id}"`), `Car 2 select missing option for preset ${p.id}`);
    assert(c1Select.innerHTML.includes(p.name || p.model), `Car 1 select missing text for preset ${p.name}`);
    assert(c2Select.innerHTML.includes(p.name || p.model), `Car 2 select missing text for preset ${p.name}`);
  });
});

suite.test('Tier 1: Comprehensive DOM Field Sync across ALL 18 Presets for Car 1', 1, () => {
  const { sandbox, document } = createChallengerEnv();
  sandbox.initEVSimulator();

  const presets = sandbox.TRIP_DATA.evPresets;
  const c1Select = document.getElementById('simCar1Model');

  presets.forEach(p => {
    const prevCap = getSimState(sandbox).car1Cap;
    c1Select.value = p.id;
    c1Select.dispatchEvent({ type: 'change', target: { value: p.id } });

    const expectedCap = (p.id === 'custom') ? prevCap : (p.batteryCap || p.capacity);
    const expectedEff = (p.id === 'custom') ? getSimState(sandbox).car1Eff : (p.consumption || p.efficiency);
    const expectedName = p.name || `${p.brand} ${p.model}`;
    const simState = getSimState(sandbox);

    // Verify in-memory state
    assertEqual(simState.car1Model, p.id, `simState.car1Model mismatch for ${p.id}`);
    assertEqual(simState.car1Name, expectedName, `simState.car1Name mismatch for ${p.id}`);
    assertCloseTo(simState.car1Cap, expectedCap, 0.01, `simState.car1Cap mismatch for ${p.id}`);
    assertCloseTo(simState.car1Eff, expectedEff, 0.001, `simState.car1Eff mismatch for ${p.id}`);

    // Verify DOM displays
    assertEqual(document.getElementById('valCar1Cap').textContent, `${expectedCap.toFixed(1)} kWh`, `valCar1Cap DOM mismatch for ${p.id}`);
    assertEqual(document.getElementById('c1SliderLabel').textContent, `${expectedCap.toFixed(1)} kWh`, `c1SliderLabel DOM mismatch for ${p.id}`);
    assertEqual(document.getElementById('c1ModelBadge').textContent, expectedName, `c1ModelBadge DOM mismatch for ${p.id}`);
    assertEqual(document.getElementById('c1CapBadge').textContent, `${expectedCap.toFixed(1)} kWh`, `c1CapBadge DOM mismatch for ${p.id}`);

    // Verify slider sync
    const sliderVal = parseFloat(document.getElementById('simCar1Cap').value);
    assertCloseTo(sliderVal, expectedCap, 0.05, `simCar1Cap slider value mismatch for ${p.id}`);

    // Verify calculated fields are non-empty and finite
    const morningSoc = parseInt(document.getElementById('c1MorningSoc').textContent);
    const morningRange = parseInt(document.getElementById('c1MorningRange').textContent.replace(/[^0-9]/g, ''));
    const arrivalSoc = parseInt(document.getElementById('c1ArrivalSoc').textContent);
    const sleepEnergy = parseFloat(document.getElementById('c1SleepEnergy').textContent);

    assert(!isNaN(morningSoc) && morningSoc >= 0 && morningSoc <= 100, `c1MorningSoc is invalid for ${p.id}: ${morningSoc}`);
    assert(!isNaN(morningRange) && morningRange > 0, `c1MorningRange is invalid for ${p.id}: ${morningRange}`);
    assert(!isNaN(arrivalSoc) && arrivalSoc >= 0 && arrivalSoc <= 100, `c1ArrivalSoc is invalid for ${p.id}: ${arrivalSoc}`);
    assert(!isNaN(sleepEnergy) && sleepEnergy > 0, `c1SleepEnergy is invalid for ${p.id}: ${sleepEnergy}`);

    // Verify battery gauge fill style
    const fillEl = document.getElementById('c1BatteryFill');
    assert(fillEl.style.height.includes(`${morningSoc}%`), `c1BatteryFill height must match morningSoc for ${p.id}`);
  });
});

suite.test('Tier 1: Comprehensive DOM Field Sync across ALL 18 Presets for Car 2', 1, () => {
  const { sandbox, document } = createChallengerEnv();
  sandbox.initEVSimulator();

  const presets = sandbox.TRIP_DATA.evPresets;
  const c2Select = document.getElementById('simCar2Model');

  presets.forEach(p => {
    const prevCap = getSimState(sandbox).car2Cap;
    c2Select.value = p.id;
    c2Select.dispatchEvent({ type: 'change', target: { value: p.id } });

    const expectedCap = (p.id === 'custom') ? prevCap : (p.batteryCap || p.capacity);
    const expectedEff = (p.id === 'custom') ? getSimState(sandbox).car2Eff : (p.consumption || p.efficiency);
    const expectedName = p.name || `${p.brand} ${p.model}`;
    const simState = getSimState(sandbox);

    assertEqual(simState.car2Model, p.id, `simState.car2Model mismatch for ${p.id}`);
    assertEqual(simState.car2Name, expectedName, `simState.car2Name mismatch for ${p.id}`);
    assertCloseTo(simState.car2Cap, expectedCap, 0.01, `simState.car2Cap mismatch for ${p.id}`);
    assertCloseTo(simState.car2Eff, expectedEff, 0.001, `simState.car2Eff mismatch for ${p.id}`);

    assertEqual(document.getElementById('valCar2Cap').textContent, `${expectedCap.toFixed(1)} kWh`, `valCar2Cap DOM mismatch for ${p.id}`);
    assertEqual(document.getElementById('c2SliderLabel').textContent, `${expectedCap.toFixed(1)} kWh`, `c2SliderLabel DOM mismatch for ${p.id}`);
    assertEqual(document.getElementById('c2ModelBadge').textContent, expectedName, `c2ModelBadge DOM mismatch for ${p.id}`);
    assertEqual(document.getElementById('c2CapBadge').textContent, `${expectedCap.toFixed(1)} kWh`, `c2CapBadge DOM mismatch for ${p.id}`);

    const morningSoc = parseInt(document.getElementById('c2MorningSoc').textContent);
    const morningRange = parseInt(document.getElementById('c2MorningRange').textContent.replace(/[^0-9]/g, ''));

    assert(!isNaN(morningSoc) && morningSoc >= 0 && morningSoc <= 100, `c2MorningSoc is invalid for ${p.id}: ${morningSoc}`);
    assert(!isNaN(morningRange) && morningRange > 0, `c2MorningRange is invalid for ${p.id}: ${morningRange}`);

    const fillEl = document.getElementById('c2BatteryFill');
    assert(fillEl.style.height.includes(`${morningSoc}%`), `c2BatteryFill height must match morningSoc for ${p.id}`);
  });
});

// ============================================================================
// TIER 2: LOCALSTORAGE CORRUPTION, RESILIENCE & EDGE CASES
// ============================================================================

const CORRUPTED_STORAGE_CASES = [
  { name: 'Malformed syntax', payload: '{"car1Cap": 60.5, "car1Model":' },
  { name: 'Truncated JSON', payload: '{"car1Cap": 78' },
  { name: 'String literal', payload: '"hello_world_storage"' },
  { name: 'Number literal', payload: '12345678' },
  { name: 'Boolean literal', payload: 'true' },
  { name: 'Null string', payload: 'null' },
  { name: 'Undefined string', payload: 'undefined' },
  { name: 'Empty string', payload: '' },
  { name: 'Array literal', payload: '[1, 2, 3, "foo"]' },
  { name: 'Empty object', payload: '{}' }
];

CORRUPTED_STORAGE_CASES.forEach((cCase, idx) => {
  suite.test(`Tier 2: LocalStorage Resilience [${idx + 1}/10] - ${cCase.name} recovers with default state without crashing`, 2, () => {
    const { sandbox, document } = createChallengerEnv({
      initialStorage: { ev_convoy_sim_v2: cCase.payload }
    });

    sandbox.initEVSimulator();
    const simState = getSimState(sandbox);

    // Verify clean fallback
    assert(simState, 'SimState must be initialized');
    assert(simState.car1Cap > 0, 'car1Cap must be a positive number');
    assert(simState.car2Cap > 0, 'car2Cap must be a positive number');
    assert(simState.sleepHours >= 4, 'sleepHours must be >= 4');

    // Verify DOM contains valid rendered text without NaN or undefined
    const c1SocText = document.getElementById('c1MorningSoc').textContent;
    const c2SocText = document.getElementById('c2MorningSoc').textContent;
    assert(!c1SocText.includes('NaN') && !c1SocText.includes('undefined'), `c1MorningSoc contains NaN/undefined: ${c1SocText}`);
    assert(!c2SocText.includes('NaN') && !c2SocText.includes('undefined'), `c2MorningSoc contains NaN/undefined: ${c2SocText}`);
  });
});

suite.test('Tier 2: Partial Schema Deserialization - LocalStorage with partial keys smoothly inherits default fields', 2, () => {
  const partialPayload = JSON.stringify({
    car1Model: 'tesla_my_lr',
    car1Cap: 78.1,
    v2lEnabled: true
  });

  const { sandbox, document } = createChallengerEnv({
    initialStorage: { ev_convoy_sim_v2: partialPayload }
  });

  sandbox.initEVSimulator();
  const simState = getSimState(sandbox);

  // Overridden fields
  assertEqual(simState.car1Model, 'tesla_my_lr');
  assertCloseTo(simState.car1Cap, 78.1, 0.01);
  assertEqual(simState.v2lEnabled, true);

  // Inherited default fields
  assertEqual(simState.car2Model, 'byd_dolphin_std');
  assertCloseTo(simState.car2Cap, 44.9, 0.01);
  assertEqual(simState.sleepHours, 8);
  assertEqual(simState.climateMode, 'normal');

  // DOM sync
  assertEqual(document.getElementById('valCar1Cap').textContent, '78.1 kWh');
  assertEqual(document.getElementById('valCar2Cap').textContent, '44.9 kWh');
  assertEqual(document.getElementById('simV2lToggle').checked, true);
});

suite.test('Tier 2: Prototype Pollution Defense - Malicious __proto__ keys do not pollute Object prototype', 2, () => {
  const pollutionPayload = JSON.stringify({
    car1Cap: 65.0,
    __proto__: { pollutedKey: 'malicious_inject', isAdmin: true }
  });

  const { sandbox } = createChallengerEnv({
    initialStorage: { ev_convoy_sim_v2: pollutionPayload }
  });

  sandbox.initEVSimulator();

  const testObj = {};
  assertEqual(testObj.pollutedKey, undefined, 'Object prototype must NOT be polluted');
  assertEqual(testObj.isAdmin, undefined, 'Object prototype must NOT contain injected properties');
});

suite.test('Tier 2: Storage QuotaExceededError Resilience - UI and calculation remain fully functional if setItem throws', 2, () => {
  const { sandbox, document, localStorage } = createChallengerEnv();
  sandbox.initEVSimulator();

  // Simulate QuotaExceededError
  localStorage._setThrowOnSet(true);

  const c1Select = document.getElementById('simCar1Model');
  const v2lToggle = document.getElementById('simV2lToggle');

  c1Select.value = 'tesla_my_lr';
  c1Select.dispatchEvent({ type: 'change', target: { value: 'tesla_my_lr' } });
  v2lToggle.checked = true;
  v2lToggle.dispatchEvent({ type: 'change', target: { checked: true } });

  // DOM and calculation must still update properly
  assertEqual(document.getElementById('valCar1Cap').textContent, '78.1 kWh');
  const c1Soc = parseInt(document.getElementById('c1MorningSoc').textContent);
  assert(c1Soc > 0, 'c1MorningSoc must update correctly even with storage error');
});

suite.test('Tier 2: Extreme Out-of-Bounds & Negative Inputs Clamping in Energy Engine', 2, () => {
  const { sandbox } = createChallengerEnv();

  // 1. Zero & Negative battery capacity
  const zeroCapRes = sandbox.calculateEVEnergy({ batteryCap: 0 });
  assertEqual(zeroCapRes.morningSoc, 0, 'Zero battery cap returns 0% SoC');
  assertEqual(zeroCapRes.morningRangeKm, 0, 'Zero battery cap returns 0 km range');
  assertEqual(zeroCapRes.safetyStatus, 'danger', 'Zero battery cap returns danger status');

  const negCapRes = sandbox.calculateEVEnergy({ batteryCap: -50 });
  assertEqual(negCapRes.morningSoc, 0, 'Negative battery cap returns 0% SoC');
  assertEqual(negCapRes.safetyStatus, 'danger', 'Negative battery cap returns danger status');

  // 2. Out-of-bounds startSoc (>100% or <0%)
  const highSocRes = sandbox.calculateEVEnergy({ batteryCap: 60, startSoc: 150 });
  assertCloseTo(highSocRes.arrivalSoc, 88.0, 0.5, 'startSoc > 100% is clamped to 100%');

  const negSocRes = sandbox.calculateEVEnergy({ batteryCap: 60, startSoc: -20 });
  assertEqual(negSocRes.arrivalSoc, 0, 'startSoc < 0% is clamped to 0%');

  // 3. Zero / Negative efficiency fallback
  const zeroEffRes = sandbox.calculateEVEnergy({ batteryCap: 60, efficiency: 0 });
  assert(zeroEffRes.driveEnergyKwh > 0, 'Zero efficiency falls back to standard 0.160 kWh/km');

  const negEffRes = sandbox.calculateEVEnergy({ batteryCap: 60, efficiency: -0.5 });
  assert(negEffRes.driveEnergyKwh > 0, 'Negative efficiency falls back to standard 0.160 kWh/km');
});

// ============================================================================
// TIER 3: FULL 324 PAIRWISE COMBINATIONS & OPERATIONAL MODES
// ============================================================================

suite.test('Tier 3: Pairwise Combinatorial Exhaustive Testing - All 18 x 18 = 324 Car 1 x Car 2 Combinations', 3, () => {
  const { sandbox, document } = createChallengerEnv();
  sandbox.initEVSimulator();

  const presets = sandbox.TRIP_DATA.evPresets;
  const c1Select = document.getElementById('simCar1Model');
  const c2Select = document.getElementById('simCar2Model');

  let combinationsCount = 0;

  for (let i = 0; i < presets.length; i++) {
    for (let j = 0; j < presets.length; j++) {
      const p1 = presets[i];
      const p2 = presets[j];

      c1Select.value = p1.id;
      c1Select.dispatchEvent({ type: 'change', target: { value: p1.id } });

      c2Select.value = p2.id;
      c2Select.dispatchEvent({ type: 'change', target: { value: p2.id } });

      const soc1 = parseInt(document.getElementById('c1MorningSoc').textContent);
      const soc2 = parseInt(document.getElementById('c2MorningSoc').textContent);
      const range1 = parseInt(document.getElementById('c1MorningRange').textContent.replace(/[^0-9]/g, ''));
      const range2 = parseInt(document.getElementById('c2MorningRange').textContent.replace(/[^0-9]/g, ''));

      assert(!isNaN(soc1) && soc1 >= 0 && soc1 <= 100, `Invalid Car 1 SoC (${soc1}) for pair ${p1.id} x ${p2.id}`);
      assert(!isNaN(soc2) && soc2 >= 0 && soc2 <= 100, `Invalid Car 2 SoC (${soc2}) for pair ${p1.id} x ${p2.id}`);
      assert(!isNaN(range1) && range1 >= 0, `Invalid Car 1 range (${range1}) for pair ${p1.id} x ${p2.id}`);
      assert(!isNaN(range2) && range2 >= 0, `Invalid Car 2 range (${range2}) for pair ${p1.id} x ${p2.id}`);

      // Advice banner must be populated with advice summary
      const adviceHtml = document.getElementById('convoyAdviceText').innerHTML;
      assert(adviceHtml.length > 50, `Advice text too short for pair ${p1.id} x ${p2.id}`);

      combinationsCount++;
    }
  }

  assertEqual(combinationsCount, 324, 'Must execute exactly 324 pairwise combinations');
});

suite.test('Tier 3: Combinatorial Matrix of Climate (3) x Sleep (3) x V2L (2) = 18 Operational Camp Modes', 3, () => {
  const { sandbox, document } = createChallengerEnv();
  sandbox.initEVSimulator();

  const climates = ['eco', 'normal', 'chill'];
  const sleepHours = [6, 8, 10];
  const v2lStates = [false, true];

  const climatePills = document.querySelectorAll('#climatePresetGroup .climate-pill');
  const sleepChips = document.querySelectorAll('#sleepChipsGroup .chip-btn');
  const v2lToggle = document.getElementById('simV2lToggle');

  let modeCount = 0;

  for (const climate of climates) {
    for (const hours of sleepHours) {
      for (const v2l of v2lStates) {
        const targetPill = Array.from(climatePills).find(p => p.getAttribute('data-climate') === climate);
        const targetChip = Array.from(sleepChips).find(c => parseInt(c.getAttribute('data-hours'), 10) === hours);

        if (targetPill) targetPill.click();
        if (targetChip) targetChip.click();

        v2lToggle.checked = v2l;
        v2lToggle.dispatchEvent({ type: 'change', target: { checked: v2l } });

        const sleepKwh = parseFloat(document.getElementById('c1SleepEnergy').textContent);
        const expectedAcPower = (climate === 'eco') ? 0.8 : (climate === 'normal' ? 1.0 : 1.4);
        const expectedSleep = (hours * expectedAcPower) + (v2l ? 2.0 : 0.0);

        assertCloseTo(sleepKwh, expectedSleep, 0.05, `Sleep energy mismatch in mode ${climate}_${hours}h_v2l${v2l}: expected ${expectedSleep}, got ${sleepKwh}`);

        modeCount++;
      }
    }
  }

  assertEqual(modeCount, 18, 'Must verify all 18 climate x sleep x V2L operational modes');
});

// ============================================================================
// TIER 4: REAL-WORLD DRIVER SCENARIOS & ADVERSARIAL STRESS HARNESS
// ============================================================================

suite.test('Tier 4: Scenario 1 - Severe Winter Camp Mode (12h Sleep @ Chill 1.4kW + V2L 2.0kWh) on Dolphin Standard (44.9 kWh)', 4, () => {
  const { sandbox, document } = createChallengerEnv();
  sandbox.initEVSimulator();

  const c1Select = document.getElementById('simCar1Model');
  c1Select.value = 'byd_dolphin_std';
  c1Select.dispatchEvent({ type: 'change', target: { value: 'byd_dolphin_std' } });

  const climatePills = document.querySelectorAll('#climatePresetGroup .climate-pill');
  const pillChill = Array.from(climatePills).find(p => p.getAttribute('data-climate') === 'chill');
  assert(pillChill, 'Chill pill must exist');
  pillChill.click();

  const sleepInput = document.getElementById('simSleepHours');
  sleepInput.value = '12';
  sleepInput.dispatchEvent({ type: 'input', target: { value: '12' } });

  const v2lToggle = document.getElementById('simV2lToggle');
  v2lToggle.checked = true;
  v2lToggle.dispatchEvent({ type: 'change', target: { checked: true } });

  // Math: 44.9 * 0.95 = 42.655 kWh. Drive 45 * 0.140 = 6.3 kWh -> 36.355 kWh. Sleep: 12 * 1.4 + 2.0 = 18.8 kWh. Morning: 17.555 kWh (39.1% SoC). Range: 17.555 / 0.140 = 125.4 km. Ratio: 125.4 / 65 = 1.93x
  const morningSoc = parseInt(document.getElementById('c1MorningSoc').textContent);
  const morningRange = parseInt(document.getElementById('c1MorningRange').textContent.replace(/[^0-9]/g, ''));
  const safetyBadge = document.getElementById('c1SafetyBadge');

  assertEqual(morningSoc, 39, 'Morning SoC should be exactly 39% under extreme load');
  assertCloseTo(morningRange, 125, 2, 'Morning range should be ~125 km');
  assert(safetyBadge.textContent.includes('เพียงพอ'), 'Safety status should indicate adequate (🟡 badge-amber)');
});

suite.test('Tier 4: Scenario 2 - Rapid Fuzzing Stress Harness (500 Randomized UI Events)', 4, () => {
  const { sandbox, document } = createChallengerEnv();
  sandbox.initEVSimulator();

  const presets = sandbox.TRIP_DATA.evPresets;
  const c1Select = document.getElementById('simCar1Model');
  const c2Select = document.getElementById('simCar2Model');
  const c1CapInput = document.getElementById('simCar1Cap');
  const c2CapInput = document.getElementById('simCar2Cap');
  const acInput = document.getElementById('simAcPower');
  const sleepInput = document.getElementById('simSleepHours');
  const v2lToggle = document.getElementById('simV2lToggle');
  const climatePills = document.querySelectorAll('#climatePresetGroup .climate-pill');
  const sleepChips = document.querySelectorAll('#sleepChipsGroup .chip-btn');

  for (let i = 0; i < 500; i++) {
    const action = i % 8;

    switch (action) {
      case 0: {
        const randPreset = presets[Math.floor(Math.random() * presets.length)];
        c1Select.value = randPreset.id;
        c1Select.dispatchEvent({ type: 'change', target: { value: randPreset.id } });
        break;
      }
      case 1: {
        const randPreset = presets[Math.floor(Math.random() * presets.length)];
        c2Select.value = randPreset.id;
        c2Select.dispatchEvent({ type: 'change', target: { value: randPreset.id } });
        break;
      }
      case 2: {
        const val = String(35 + Math.floor(Math.random() * 70));
        c1CapInput.value = val;
        c1CapInput.dispatchEvent({ type: 'input', target: { value: val } });
        break;
      }
      case 3: {
        const val = String(35 + Math.floor(Math.random() * 70));
        c2CapInput.value = val;
        c2CapInput.dispatchEvent({ type: 'input', target: { value: val } });
        break;
      }
      case 4: {
        const randPill = climatePills[Math.floor(Math.random() * climatePills.length)];
        if (randPill) randPill.click();
        break;
      }
      case 5: {
        const val = (0.6 + Math.random() * 1.4).toFixed(1);
        acInput.value = val;
        acInput.dispatchEvent({ type: 'input', target: { value: val } });
        break;
      }
      case 6: {
        const randChip = sleepChips[Math.floor(Math.random() * sleepChips.length)];
        if (randChip) randChip.click();
        break;
      }
      case 7: {
        v2lToggle.checked = !v2lToggle.checked;
        v2lToggle.dispatchEvent({ type: 'change', target: { checked: v2lToggle.checked } });
        break;
      }
    }
  }

  // After 500 fuzz events, verify invariant stability
  const soc1 = parseInt(document.getElementById('c1MorningSoc').textContent);
  const soc2 = parseInt(document.getElementById('c2MorningSoc').textContent);
  const range1 = parseInt(document.getElementById('c1MorningRange').textContent.replace(/[^0-9]/g, ''));
  const range2 = parseInt(document.getElementById('c2MorningRange').textContent.replace(/[^0-9]/g, ''));

  assert(!isNaN(soc1) && soc1 >= 0 && soc1 <= 100, 'Car 1 SoC intact after fuzzing');
  assert(!isNaN(soc2) && soc2 >= 0 && soc2 <= 100, 'Car 2 SoC intact after fuzzing');
  assert(!isNaN(range1) && range1 >= 0, 'Car 1 range intact after fuzzing');
  assert(!isNaN(range2) && range2 >= 0, 'Car 2 range intact after fuzzing');
});

suite.test('Tier 4: Scenario 3 - State Serialization / Deserialization Lifecycle across Browser Session Reload', 4, () => {
  // Step 1: User modifies several settings
  const env1 = createChallengerEnv();
  env1.sandbox.initEVSimulator();

  const c1Select = env1.document.getElementById('simCar1Model');
  c1Select.value = 'tesla_my_lr';
  c1Select.dispatchEvent({ type: 'change', target: { value: 'tesla_my_lr' } });

  const c2Select = env1.document.getElementById('simCar2Model');
  c2Select.value = 'mg_mg4_std';
  c2Select.dispatchEvent({ type: 'change', target: { value: 'mg_mg4_std' } });

  const climatePills = env1.document.querySelectorAll('#climatePresetGroup .climate-pill');
  const pillChill = Array.from(climatePills).find(p => p.getAttribute('data-climate') === 'chill');
  assert(pillChill, 'Chill pill must exist');
  pillChill.click();

  const sleepChips = env1.document.querySelectorAll('#sleepChipsGroup .chip-btn');
  const chip10 = Array.from(sleepChips).find(c => c.getAttribute('data-hours') === '10');
  assert(chip10, 'Chip 10h must exist');
  chip10.click();

  const v2lToggle = env1.document.getElementById('simV2lToggle');
  v2lToggle.checked = true;
  v2lToggle.dispatchEvent({ type: 'change', target: { checked: true } });

  const savedJson = env1.localStorage._getRaw('ev_convoy_sim_v2');
  assert(savedJson, 'Session 1 must have persisted state to localStorage');

  // Step 2: Fresh browser session opens and loads saved state
  const env2 = createChallengerEnv({
    initialStorage: { ev_convoy_sim_v2: savedJson }
  });
  env2.sandbox.initEVSimulator();
  const simState2 = getSimState(env2.sandbox);

  assertEqual(simState2.car1Model, 'tesla_my_lr');
  assertEqual(simState2.car2Model, 'mg_mg4_std');
  assertEqual(simState2.climateMode, 'chill');
  assertEqual(simState2.sleepHours, 10);
  assertEqual(simState2.v2lEnabled, true);

  // Verify DOM is seamlessly restored
  assertEqual(env2.document.getElementById('valCar1Cap').textContent, '78.1 kWh');
  assertEqual(env2.document.getElementById('valCar2Cap').textContent, '51.0 kWh');
  assertEqual(env2.document.getElementById('valAcPower').textContent, '1.4 kW/ชม.');
  assertEqual(env2.document.getElementById('valSleepHours').textContent, '10 ชม.');
  assertEqual(env2.document.getElementById('simV2lToggle').checked, true);
});

module.exports = suite;

if (require.main === module) {
  suite.run().then(results => {
    console.log(`\n=== ${suite.name} Results ===`);
    let passed = 0;
    results.forEach(r => {
      if (r.passed) {
        passed++;
        console.log(`  ✔ [Tier ${r.tier}] ${r.description} (${r.duration}ms)`);
      } else {
        console.error(`  ✖ [Tier ${r.tier}] ${r.description} (${r.duration}ms)`);
        console.error(`    Error: ${r.error.message}`);
      }
    });
    console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${results.length - passed}`);
    process.exit(passed === results.length ? 0 : 1);
  });
}
