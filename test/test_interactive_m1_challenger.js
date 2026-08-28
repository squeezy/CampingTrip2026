/**
 * test_interactive_m1_challenger.js
 * M1 Challenger 1 Empirical Adversarial Stress Testing & Interaction Verification Suite
 * 
 * Tiers 1-4:
 * Tier 1: Feature Coverage (Tab switching, hash sync, drawer lifecycle, map invalidateSize, theme persistence)
 * Tier 2: Boundary & Edge Cases (Invalid tab inputs, null map instance, body overflow restore, rapid cycles)
 * Tier 3: Pairwise Combinatorial (All tab aliases vs view states, drawer triggers vs dismissal methods)
 * Tier 4: Real-World Scenarios (Full mobile driver lifecycle & interactive journeys)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { TestSuite, assert, assertEqual } = require('./test_helpers');

const suite = new TestSuite('M1 Interactive & Adversarial Verification');

const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../style.css');
const appJsPath = path.resolve(__dirname, '../app.js');
const dataJsPath = path.resolve(__dirname, '../data.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');

// ============================================================================
// LIGHTWEIGHT DOM SIMULATOR (Tree-Structured & Event-Driven)
// ============================================================================
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
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this._attributes = {};
    this.classList = new MockClassList(this);
    if (className) {
      this._attributes['class'] = className;
      this.classList._initFromAttr(className);
    }
    if (id) this._attributes['id'] = id;
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this.style = {};
    this.textContent = '';
    this.innerHTML = '';
    this.value = '0';
  }

  setAttribute(name, value) {
    this._attributes[name] = String(value);
    if (name === 'class') this.classList._initFromAttr(value);
    if (name === 'id') this.id = String(value);
  }

  getAttribute(name) {
    return this._attributes[name] !== undefined ? this._attributes[name] : null;
  }

  removeAttribute(name) {
    delete this._attributes[name];
    if (name === 'class') this.classList._initFromAttr('');
    if (name === 'id') this.id = '';
  }

  hasAttribute(name) {
    return this._attributes[name] !== undefined;
  }

  addEventListener(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  }

  dispatchEvent(event) {
    const handlers = this.listeners[event.type] || [];
    handlers.forEach(h => h.call(this, event));
    return !event.defaultPrevented;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } });
  }

  focus() { this._isFocused = true; }
  blur() { this._isFocused = false; }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const selectors = selector.split(',').map(s => s.trim());

    const checkNode = (el) => {
      if (selectors.some(sel => matchesSimple(el, sel))) {
        results.push(el);
      }
      for (const child of el.children) {
        checkNode(child);
      }
    };

    for (const child of this.children) {
      checkNode(child);
    }
    return results;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
}

function matchesSimple(el, selector) {
  if (selector.includes(' ')) {
    const parts = selector.split(/\s+/);
    const lastPart = parts[parts.length - 1];
    if (!matchesSimple(el, lastPart)) return false;
    let current = el.parentNode;
    let idx = parts.length - 2;
    while (current && idx >= 0) {
      if (matchesSimple(current, parts[idx])) {
        idx--;
      }
      current = current.parentNode;
    }
    return idx < 0;
  }

  if (selector.startsWith('#') && !selector.includes('.') && !selector.includes('[')) {
    return el.id === selector.substring(1);
  }

  if (selector.startsWith('.') && !selector.includes('[')) {
    const classes = selector.split('.').filter(Boolean);
    return classes.every(c => el.classList.contains(c));
  }

  const attrMatch = selector.match(/^([a-zA-Z0-9_-]+)?(\.[a-zA-Z0-9_-]+)?\[([a-zA-Z0-9_-]+)(?:=["']?([^"']*)["']?)?\]$/);
  if (attrMatch) {
    const tag = attrMatch[1];
    const cls = attrMatch[2] ? attrMatch[2].substring(1) : null;
    const attr = attrMatch[3];
    const val = attrMatch[4];

    if (tag && el.tagName.toLowerCase() !== tag.toLowerCase()) return false;
    if (cls && !el.classList.contains(cls)) return false;
    if (!el.hasAttribute(attr)) return false;
    if (val !== undefined && el.getAttribute(attr) !== val) return false;
    return true;
  }

  if (/^[a-zA-Z0-9_-]+$/.test(selector)) {
    return el.tagName.toLowerCase() === selector.toLowerCase();
  }

  return false;
}

function parseHtmlTree(htmlStr) {
  const root = new MockElement('root');
  const VOID_TAGS = new Set(['meta', 'link', 'img', 'br', 'hr', 'input', '!doctype']);

  const stack = [root];
  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)([^>]*?)(\/)?>/g;
  let match;

  while ((match = tagRegex.exec(htmlStr)) !== null) {
    if (match[0].startsWith('<!--')) continue;

    const isClosing = Boolean(match[1]);
    const tagName = match[2].toLowerCase();
    const attrsStr = match[3] || '';
    const isSelfClosing = Boolean(match[4]) || VOID_TAGS.has(tagName);

    if (isClosing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName.toLowerCase() === tagName) {
          stack.length = i;
          break;
        }
      }
    } else {
      const el = new MockElement(tagName);
      const attrPairs = attrsStr.matchAll(/([a-zA-Z0-9_-]+)(?:=["']([^"']*)["'])?/g);
      for (const ap of attrPairs) {
        const name = ap[1];
        const val = ap[2] !== undefined ? ap[2] : '';
        el.setAttribute(name, val);
      }
      
      stack[stack.length - 1].appendChild(el);

      if (!isSelfClosing) {
        stack.push(el);
      }
    }
  }

  const html = root.querySelector('html') || new MockElement('html');
  const body = root.querySelector('body') || new MockElement('body');

  const documentMock = {
    documentElement: html,
    body: body,
    listeners: {},
    addEventListener(event, handler) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(handler);
    },
    removeEventListener(event, handler) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    },
    dispatchEvent(event) {
      const handlers = this.listeners[event.type] || [];
      handlers.forEach(h => h.call(this, event));
    },
    getElementById(id) {
      const search = (el) => {
        if (el.id === id) return el;
        for (const child of el.children) {
          const res = search(child);
          if (res) return res;
        }
        return null;
      };
      return search(root);
    },
    querySelector(selector) { return root.querySelector(selector); },
    querySelectorAll(selector) { return root.querySelectorAll(selector); }
  };

  return { root, html, body, documentMock };
}

function buildTestContext(initialHash = '') {
  const { root, html, body, documentMock } = parseHtmlTree(htmlContent);

  const storage = {};
  const localStorageMock = {
    getItem(k) { return storage[k] || null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
    clear() { Object.keys(storage).forEach(k => delete storage[k]); }
  };

  let currentHash = initialHash;
  const historyStates = [];
  const windowListeners = {};

  let invalidateCalls = 0;
  const mockMapInstance = {
    invalidateSize() { invalidateCalls++; },
    removeLayer() {},
    flyTo() {}
  };

  const windowMock = {
    location: {
      get hash() { return currentHash; },
      set hash(val) { currentHash = val; }
    },
    history: {
      pushState(state, title, url) {
        historyStates.push({ state, title, url });
        currentHash = url;
      }
    },
    localStorage: localStorageMock,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    addEventListener: (event, handler) => {
      if (!windowListeners[event]) windowListeners[event] = [];
      windowListeners[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (!windowListeners[event]) return;
      windowListeners[event] = windowListeners[event].filter(h => h !== handler);
    },
    dispatchEvent: (event) => {
      const handlers = windowListeners[event.type] || [];
      handlers.forEach(h => h.call(windowMock, event));
    },
    scrollTo: () => {},
    mapInstance: mockMapInstance,
    requestAnimationFrame: (cb) => { cb(); return 1; },
    setTimeout: (cb) => { cb(); return 1; },
    clearTimeout: () => {}
  };

  const lucideMock = { createIcons: () => {} };

  const LMock = {
    map: () => mockMapInstance,
    tileLayer: () => ({ addTo: () => ({}) }),
    layerGroup: () => ({ addTo: () => ({ clearLayers: () => {}, eachLayer: () => {} }) }),
    polyline: () => ({ addTo: () => ({ bindTooltip: () => ({}) }) }),
    divIcon: () => ({}),
    marker: () => ({ addTo: () => ({ bindPopup: () => ({}) }) })
  };

  const sandbox = {
    window: windowMock,
    document: documentMock,
    localStorage: localStorageMock,
    matchMedia: windowMock.matchMedia,
    scrollTo: windowMock.scrollTo,
    requestAnimationFrame: windowMock.requestAnimationFrame,
    setTimeout: windowMock.setTimeout,
    clearTimeout: windowMock.clearTimeout,
    lucide: lucideMock,
    L: LMock,
    console: console,
    mapInstance: mockMapInstance
  };

  vm.createContext(sandbox);
  vm.runInContext(dataJsContent, sandbox);
  vm.runInContext(appJsContent, sandbox);

  documentMock.dispatchEvent({ type: 'DOMContentLoaded' });

  return {
    sandbox,
    document: documentMock,
    window: windowMock,
    getInvalidateCalls: () => invalidateCalls,
    resetInvalidateCalls: () => { invalidateCalls = 0; },
    historyStates
  };
}

// ============================================================================
// TIER 1: FEATURE COVERAGE
// ============================================================================

suite.test('Tier 1: Initial Page Load activates View 1 (#tab-map) and syncs navigation elements', 1, () => {
  const env = buildTestContext();
  const doc = env.document;
  
  const mapPane = doc.getElementById('tab-map');
  const simPane = doc.getElementById('tab-simulator');
  const navTrip = doc.getElementById('navTabTrip');
  const navSim = doc.getElementById('navTabSim');
  const mobileTrip = doc.getElementById('mobileNavTrip');
  const mobileSim = doc.getElementById('mobileNavSim');

  assertEqual(mapPane.classList.contains('active'), true, 'tab-map must have .active class');
  assertEqual(mapPane.getAttribute('aria-hidden') !== 'true', true, 'tab-map must not be aria-hidden');
  assertEqual(simPane.classList.contains('active'), false, 'tab-simulator must not be active');
  assertEqual(navTrip.classList.contains('active'), true, 'navTabTrip button must be active');
  assertEqual(navSim.classList.contains('active'), false, 'navTabSim button must not be active');
  assertEqual(mobileTrip.classList.contains('active'), true, 'mobileNavTrip button must be active');
  assertEqual(mobileSim.classList.contains('active'), false, 'mobileNavSim button must not be active');
});

suite.test('Tier 1: Explicit tab switch to Simulator activates View 2 and updates URL hash to #simulator', 1, () => {
  const env = buildTestContext();
  const doc = env.document;
  const win = env.window;
  const switchTab = env.sandbox.switchTab;

  switchTab('tab-simulator');

  const mapPane = doc.getElementById('tab-map');
  const simPane = doc.getElementById('tab-simulator');
  const navTrip = doc.getElementById('navTabTrip');
  const navSim = doc.getElementById('navTabSim');

  assertEqual(simPane.classList.contains('active'), true, 'tab-simulator must be active');
  assertEqual(simPane.getAttribute('aria-hidden'), 'false', 'tab-simulator aria-hidden="false"');
  assertEqual(mapPane.classList.contains('active'), false, 'tab-map must not be active');
  assertEqual(mapPane.getAttribute('aria-hidden'), 'true', 'tab-map aria-hidden="true"');
  assertEqual(navSim.classList.contains('active'), true, 'navTabSim must be active');
  assertEqual(navSim.getAttribute('aria-selected'), 'true', 'navTabSim aria-selected="true"');
  assertEqual(navTrip.classList.contains('active'), false, 'navTabTrip must be inactive');
  assertEqual(win.location.hash, '#simulator', 'URL hash must equal #simulator');
});

suite.test('Tier 1: Camp Mode & SOS Quick Drawer opens and closes with accessible attributes', 1, () => {
  const env = buildTestContext();
  const doc = env.document;
  const drawer = doc.getElementById('drawerCampSos');
  const headerTrigger = doc.getElementById('btnOpenCampGuideHeader');
  const closeBtn = doc.getElementById('btnCloseCampGuide');

  assertEqual(drawer.classList.contains('is-open'), false, 'Drawer must be closed initially');

  headerTrigger.click();
  assertEqual(drawer.classList.contains('is-open'), true, 'Drawer must have .is-open class');
  assertEqual(drawer.getAttribute('aria-hidden'), 'false', 'Drawer aria-hidden must be false');
  assertEqual(headerTrigger.getAttribute('aria-expanded'), 'true', 'Trigger aria-expanded must be true');
  assertEqual(doc.body.style.overflow, 'hidden', 'Body scroll must be locked');

  closeBtn.click();
  assertEqual(drawer.classList.contains('is-open'), false, 'Drawer must be closed');
  assertEqual(drawer.getAttribute('aria-hidden'), 'true', 'Drawer aria-hidden must be true');
  assertEqual(headerTrigger.getAttribute('aria-expanded'), 'false', 'Trigger aria-expanded must be false');
  assertEqual(doc.body.style.overflow, '', 'Body scroll must be unlocked');
});

suite.test('Tier 1: Leaflet Map resize invalidation triggers on tab switches to map view', 1, () => {
  const env = buildTestContext();
  const switchTab = env.sandbox.switchTab;

  env.resetInvalidateCalls();
  switchTab('tab-simulator');
  assertEqual(env.getInvalidateCalls(), 0, 'No map resize call on simulator tab');

  switchTab('tab-map');
  assert(env.getInvalidateCalls() > 0, `invalidateSize must be called when switching to tab-map (got ${env.getInvalidateCalls()})`);
});

suite.test('Tier 1: Theme engine persists user preference in localStorage', 1, () => {
  const env = buildTestContext();
  const doc = env.document;
  const storage = env.sandbox.localStorage;
  const themeToggle = doc.getElementById('themeToggleBtn');

  assertEqual(doc.documentElement.getAttribute('data-theme'), 'light');
  themeToggle.click();
  assertEqual(doc.documentElement.getAttribute('data-theme'), 'dark');
  assertEqual(storage.getItem('ev_trip_theme'), 'dark');
  themeToggle.click();
  assertEqual(doc.documentElement.getAttribute('data-theme'), 'light');
  assertEqual(storage.getItem('ev_trip_theme'), 'light');
});

// ============================================================================
// TIER 2: BOUNDARY & EDGE CASES
// ============================================================================

suite.test('Tier 2: Boundary - Fuzzing invalid/malformed tab arguments gracefully falls back to tab-map', 2, () => {
  const env = buildTestContext();
  const doc = env.document;
  const switchTab = env.sandbox.switchTab;

  const testInputs = ['', null, undefined, 'unknown-id-1234', 8888, '#corrupted', '   '];
  testInputs.forEach(input => {
    switchTab('tab-simulator');
    switchTab(input);
    assertEqual(doc.getElementById('tab-map').classList.contains('active'), true, `Input "${input}" must fall back to tab-map`);
  });
});

suite.test('Tier 2: Boundary - Rapid tab switching fuzzing (100 switches) maintains strict DOM invariance', 2, () => {
  const env = buildTestContext();
  const doc = env.document;
  const switchTab = env.sandbox.switchTab;

  for (let i = 0; i < 100; i++) {
    const target = (i % 2 === 0) ? 'tab-simulator' : 'tab-map';
    switchTab(target);

    const activePanes = doc.querySelectorAll('.tab-content.active');
    assertEqual(activePanes.length, 1, `Iteration ${i}: Exactly 1 active tab pane allowed`);
    const expectedId = (i % 2 === 0) ? 'tab-simulator' : 'tab-map';
    assertEqual(activePanes[0].id, expectedId, `Iteration ${i}: Active pane must be ${expectedId}`);
  }
});

suite.test('Tier 2: Boundary - Drawer keyboard Escape dismisses open drawer, safely ignores non-Escape keys', 2, () => {
  const env = buildTestContext();
  const doc = env.document;
  const drawer = doc.getElementById('drawerCampSos');
  const headerTrigger = doc.getElementById('btnOpenCampGuideHeader');

  headerTrigger.click();
  assertEqual(drawer.classList.contains('is-open'), true);

  doc.dispatchEvent({ type: 'keydown', key: 'Enter' });
  assertEqual(drawer.classList.contains('is-open'), true, 'Must not close on Enter');

  doc.dispatchEvent({ type: 'keydown', key: 'Tab' });
  assertEqual(drawer.classList.contains('is-open'), true, 'Must not close on Tab');

  doc.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assertEqual(drawer.classList.contains('is-open'), false, 'Must close on Escape');
  assertEqual(doc.body.style.overflow, '', 'Body scroll restored');

  // Second Escape on closed drawer should not throw
  doc.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assertEqual(drawer.classList.contains('is-open'), false);
});

suite.test('Tier 2: Boundary - Rapid drawer open/close spam (50 cycles) leaves zero stuck body scroll locks', 2, () => {
  const env = buildTestContext();
  const doc = env.document;
  const openDrawer = env.sandbox.openCampSosDrawer;
  const closeDrawer = env.sandbox.closeCampSosDrawer;
  const drawer = doc.getElementById('drawerCampSos');

  for (let i = 0; i < 50; i++) {
    openDrawer();
    assertEqual(drawer.classList.contains('is-open'), true);
    assertEqual(doc.body.style.overflow, 'hidden');
    closeDrawer();
    assertEqual(drawer.classList.contains('is-open'), false);
    assertEqual(doc.body.style.overflow, '');
  }
});

suite.test('Tier 2: Boundary - switchTab handles uninitialized/null Leaflet map instance without crashing', 2, () => {
  const env = buildTestContext();
  const switchTab = env.sandbox.switchTab;

  env.window.mapInstance = null;
  env.sandbox.mapInstance = null;

  let threw = false;
  try {
    switchTab('tab-map');
    switchTab('tab-simulator');
    switchTab('tab-map');
  } catch (err) {
    threw = true;
  }

  assertEqual(threw, false, 'switchTab must handle null mapInstance safely');
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL TESTING
// ============================================================================

suite.test('Tier 3: Pairwise - Canonical and legacy aliases map 100% reliably to target views', 3, () => {
  const env = buildTestContext();
  const doc = env.document;
  const switchTab = env.sandbox.switchTab;

  const mapAliases = ['tab-map', 'tab-trip', 'view-trip', '#trip', '#map', '#charge-chill'];
  mapAliases.forEach(alias => {
    switchTab('tab-simulator');
    switchTab(alias);
    assertEqual(doc.getElementById('tab-map').classList.contains('active'), true, `Alias "${alias}" maps to tab-map`);
    assertEqual(doc.getElementById('tab-simulator').classList.contains('active'), false);
  });

  const simAliases = ['tab-simulator', 'view-simulator', '#simulator', '#sim'];
  simAliases.forEach(alias => {
    switchTab('tab-map');
    switchTab(alias);
    assertEqual(doc.getElementById('tab-simulator').classList.contains('active'), true, `Alias "${alias}" maps to tab-simulator`);
    assertEqual(doc.getElementById('tab-map').classList.contains('active'), false);
  });
});

suite.test('Tier 3: Pairwise - All Drawer triggers (Desktop Header, Mobile Bottom Nav) and dismissals (Close Btn, Backdrop, Escape) pair correctly', 3, () => {
  const env = buildTestContext();
  const doc = env.document;
  const drawer = doc.getElementById('drawerCampSos');
  const headerTrigger = doc.getElementById('btnOpenCampGuideHeader');
  const mobileTrigger = doc.getElementById('mobileNavCampGuide');
  const closeBtn = doc.getElementById('btnCloseCampGuide');
  const backdrop = doc.getElementById('drawerBackdrop');

  const triggers = [
    { name: 'Desktop Header Button', el: headerTrigger },
    { name: 'Mobile Bottom Nav Item', el: mobileTrigger }
  ];

  const dismissers = [
    { name: 'Close Button Click', fn: () => closeBtn.click() },
    { name: 'Backdrop Click', fn: () => backdrop.click() },
    { name: 'Escape Key Press', fn: () => doc.dispatchEvent({ type: 'keydown', key: 'Escape' }) }
  ];

  triggers.forEach(trig => {
    dismissers.forEach(dism => {
      trig.el.click();
      assertEqual(drawer.classList.contains('is-open'), true, `Drawer opened via ${trig.name}`);
      assertEqual(doc.body.style.overflow, 'hidden');
      dism.fn();
      assertEqual(drawer.classList.contains('is-open'), false, `Drawer closed via ${dism.name}`);
      assertEqual(doc.body.style.overflow, '');
    });
  });
});

// ============================================================================
// TIER 4: REAL-WORLD DRIVER SCENARIOS
// ============================================================================

suite.test('Tier 4: Scenario 1 - Mobile driver landing with #simulator URL hash immediately views battery tools', 4, () => {
  const env = buildTestContext('#simulator');
  const doc = env.document;
  assertEqual(doc.getElementById('tab-simulator').classList.contains('active'), true, 'Simulator view active on deep-link load');
  assertEqual(doc.getElementById('tab-map').classList.contains('active'), false);
});

suite.test('Tier 4: Scenario 2 - Driver 1-tap quick action buttons in Hero card execute seamless view switching', 4, () => {
  const env = buildTestContext();
  const doc = env.document;

  const simJumpBtn = doc.querySelector('[data-goto-tab="tab-simulator"]');
  const mapJumpBtn = doc.querySelector('[data-goto-tab="tab-map"]');

  assert(simJumpBtn !== null, 'Simulator quick jump button exists in Hero');
  assert(mapJumpBtn !== null, 'Map quick jump button exists in Hero');

  simJumpBtn.click();
  assertEqual(doc.getElementById('tab-simulator').classList.contains('active'), true, '1-tap jump to simulator active');

  mapJumpBtn.click();
  assertEqual(doc.getElementById('tab-map').classList.contains('active'), true, '1-tap jump to map active');
});

suite.test('Tier 4: Scenario 3 - Driver interactive workflow: Map -> Quick jump -> SOS Guide -> Escape -> Back to Map with Map resize invalidation', 4, () => {
  const env = buildTestContext();
  const doc = env.document;
  const drawer = doc.getElementById('drawerCampSos');
  const mobileTrigger = doc.getElementById('mobileNavCampGuide');
  const simJumpBtn = doc.querySelector('[data-goto-tab="tab-simulator"]');
  const navTripBtn = doc.getElementById('navTabTrip');

  // 1. Driver starts on Map
  assertEqual(doc.getElementById('tab-map').classList.contains('active'), true);

  // 2. Driver jumps to simulator
  simJumpBtn.click();
  assertEqual(doc.getElementById('tab-simulator').classList.contains('active'), true);

  // 3. Driver opens SOS Guide
  mobileTrigger.click();
  assertEqual(drawer.classList.contains('is-open'), true);
  assertEqual(doc.body.style.overflow, 'hidden');

  // 4. Driver dismisses SOS Guide via Escape
  doc.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assertEqual(drawer.classList.contains('is-open'), false);
  assertEqual(doc.body.style.overflow, '');

  // 5. Driver switches back to Map
  env.resetInvalidateCalls();
  navTripBtn.click();
  assertEqual(doc.getElementById('tab-map').classList.contains('active'), true);
  assert(env.getInvalidateCalls() > 0, 'Leaflet map resize invalidation fired successfully');
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
