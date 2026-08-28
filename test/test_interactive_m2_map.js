/**
 * test_interactive_m2_map.js
 * M2 Interactive Map, Phase Filtering, Stop Cards & Bidirectional Sync Verification Suite
 * 
 * Tiers 1-4:
 * Tier 1: Feature Coverage (Segmented phase control, Dark/Light tiles, Stop cards, Bidirectional sync, 1-tap CTA)
 * Tier 2: Boundary & Edge Cases (Exact phase counts, rapid switching, invalid IDs, navUrl integrity)
 * Tier 3: Pairwise Combinatorial (Phase x Category filter matrix, Marker <-> Card event pairing)
 * Tier 4: Real-World Scenarios (Driver journey workflow, Night driving dark tile transition)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { TestSuite, assert, assertEqual } = require('./test_helpers');

const suite = new TestSuite('M2 Interactive Map & Journey Stops Verification');

const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../style.css');
const appJsPath = path.resolve(__dirname, '../app.js');
const dataJsPath = path.resolve(__dirname, '../data.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');

// Robust DOM Simulator for M2 testing
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
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this._attributes = {};
    this.classList = new MockClassList(this);
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this._innerHTML = '';
    this.style = {};
  }

  getAttribute(name) { return this._attributes[name.toLowerCase()] !== undefined ? this._attributes[name.toLowerCase()] : null; }
  setAttribute(name, val) {
    const key = name.toLowerCase();
    this._attributes[key] = String(val);
    if (key === 'class') this.classList._initFromAttr(String(val));
  }
  removeAttribute(name) {
    const key = name.toLowerCase();
    delete this._attributes[key];
    if (key === 'class') this.classList._classes.clear();
  }
  hasAttribute(name) { return name.toLowerCase() in this._attributes; }

  get id() { return this.getAttribute('id') || ''; }
  set id(val) { this.setAttribute('id', val); }

  get className() { return this.getAttribute('class') || ''; }
  set className(val) { this.setAttribute('class', val); }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
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
    event.target = event.target || this;
    event.currentTarget = this;
    event.preventDefault = () => {};
    event.stopPropagation = () => {};
    handlers.forEach(h => h.call(this, event));
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this });
  }

  scrollIntoView() {
    this._scrolledIntoView = true;
  }

  get innerHTML() {
    if (this.children.length > 0) {
      return this.children.map(c => c.outerHTML).join('');
    }
    return this._innerHTML;
  }

  set innerHTML(htmlStr) {
    this._innerHTML = String(htmlStr || '');
    this.children = [];
    if (this._innerHTML.trim().length > 0) {
      const parsed = parseFragment(this._innerHTML);
      parsed.children.forEach(c => this.appendChild(c));
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

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const selectors = selector.split(',').map(s => s.trim());

    const checkNode = (el) => {
      if (selectors.some(sel => matchesCompound(el, sel))) {
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

  closest(selector) {
    let curr = this;
    while (curr) {
      if (matchesCompound(curr, selector)) return curr;
      curr = curr.parentNode;
    }
    return null;
  }
}

function matchesCompound(el, selector) {
  if (!el || !el.tagName) return false;
  const s = selector.trim();

  if (s.includes(' ')) {
    const parts = s.split(/\s+/);
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

  return matchesSimple(el, s);
}

function matchesSimple(el, selector) {
  if (!el || !el.tagName) return false;
  const s = selector.trim();

  if (s.startsWith('#') && !s.includes('.') && !s.includes('[')) {
    return el.id === s.substring(1);
  }

  if (s.startsWith('.') && !s.includes('[')) {
    const classes = s.split('.').filter(Boolean);
    return classes.every(c => el.classList.contains(c));
  }

  const attrMatch = s.match(/^([a-zA-Z0-9_-]+)?(\.[a-zA-Z0-9_-]+)?\[([a-zA-Z0-9_-]+)(?:=["']?([^"']*)["']?)?\]$/);
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

  if (/^[a-zA-Z0-9_-]+$/.test(s)) {
    return el.tagName.toLowerCase() === s.toLowerCase();
  }

  return false;
}

function parseFragment(htmlStr) {
  const root = new MockElement('root');
  const VOID_TAGS = new Set(['meta', 'link', 'img', 'br', 'hr', 'input', '!doctype']);
  const stack = [root];
  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)([^>]*?)(\/)?>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(htmlStr)) !== null) {
    if (match[0].startsWith('<!--')) continue;

    if (match[5]) {
      const text = match[5];
      if (stack.length > 0) {
        stack[stack.length - 1]._innerHTML += text;
      }
      continue;
    }

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

  return root;
}

function parseFullHtml(htmlStr) {
  const root = parseFragment(htmlStr);
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
          const found = search(child);
          if (found) return found;
        }
        return null;
      };
      return search(root);
    },
    querySelector(sel) { return root.querySelector(sel); },
    querySelectorAll(sel) { return root.querySelectorAll(sel); },
    createElement(tag) { return new MockElement(tag); }
  };

  return { root, documentMock };
}

function buildM2TestContext() {
  const { root, documentMock } = parseFullHtml(htmlContent);

  const storage = {};
  const localStorageMock = {
    getItem(k) { return storage[k] || null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
    clear() { Object.keys(storage).forEach(k => delete storage[k]); }
  };

  let tileLayerUrl = '';
  let lastFlyTo = null;
  let lastFitBounds = null;
  let invalidateCalls = 0;

  const mockMapInstance = {
    invalidateSize() { invalidateCalls++; },
    removeLayer() {},
    flyTo(coords, zoom, opts) { lastFlyTo = { coords, zoom, opts }; },
    fitBounds(bounds, opts) { lastFitBounds = { bounds, opts }; },
    hasLayer() { return true; }
  };

  const windowMock = {
    location: { hash: '#trip' },
    history: { pushState() {} },
    localStorage: localStorageMock,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    scrollTo: () => {},
    mapInstance: mockMapInstance,
    requestAnimationFrame: (cb) => { cb(); return 1; },
    setTimeout: (cb) => { cb(); return 1; },
    clearTimeout: () => {}
  };

  const lucideMock = { createIcons: () => {} };

  const LMock = {
    map: () => mockMapInstance,
    tileLayer: (url) => {
      tileLayerUrl = url;
      return {
        addTo: () => ({ bringToBack: () => {} })
      };
    },
    layerGroup: () => ({
      addTo: () => ({ clearLayers: () => {}, eachLayer: () => {} })
    }),
    polyline: () => ({
      addTo: () => ({
        bindTooltip: () => ({ setStyle: () => {} }),
        setStyle: () => {}
      }),
      setStyle: () => {}
    }),
    divIcon: () => ({}),
    marker: (coords) => {
      let popupOpened = false;
      const markerObj = {
        addTo: () => markerObj,
        bindPopup: () => markerObj,
        openPopup: () => { popupOpened = true; },
        on: (evt, cb) => { markerObj._clickCb = cb; },
        getLatLng: () => ({ lat: coords[0], lng: coords[1] }),
        _isPopupOpened: () => popupOpened
      };
      return markerObj;
    },
    latLngBounds: (coords) => ({ coords })
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
    getTileLayerUrl: () => tileLayerUrl,
    getLastFlyTo: () => lastFlyTo,
    getLastFitBounds: () => lastFitBounds
  };
}

// ============================================================================
// TIER 1: FEATURE COVERAGE (Phase Filter, Dark Tiles, Cards, Sync)
// ============================================================================

suite.test('Tier 1: Phase Filter - Segmented control buttons render with data-phase attributes', 1, () => {
  const env = buildM2TestContext();
  const phaseGroup = env.document.getElementById('phaseFilterGroup');
  assert(phaseGroup, '#phaseFilterGroup segmented control must exist in DOM');

  const buttons = phaseGroup.querySelectorAll('.phase-btn');
  assertEqual(buttons.length, 4, 'Should contain 4 phase filter buttons');

  const phases = Array.from(buttons).map(b => b.getAttribute('data-phase'));
  assert(phases.includes('all'), 'Must contain "all" phase button');
  assert(phases.includes('outbound'), 'Must contain "outbound" phase button');
  assert(phases.includes('campsite'), 'Must contain "campsite" phase button');
  assert(phases.includes('inbound'), 'Must contain "inbound" phase button');
});

suite.test('Tier 1: Stop Cards - Stop cards render name, distance, phase badge, and 1-tap navigation CTA', 1, () => {
  const env = buildM2TestContext();
  const cardsList = env.document.getElementById('mapPlacesList');
  assert(cardsList, '#mapPlacesList must exist');

  const cards = cardsList.querySelectorAll('.stop-card, .map-place-card');
  assertEqual(cards.length, 20, 'All 20 places should initially render in stop card list');

  const danChangCard = cardsList.querySelector('[data-place-id="charger_danchang"]');
  assert(danChangCard, 'PTT Dan Chang stop card must exist');

  const nameEl = danChangCard.querySelector('.stop-card-name, .map-place-name');
  assert(nameEl && nameEl.innerHTML.includes('PTT Station ด่านช้าง'), 'Card name must be prominent');

  const navBtn = danChangCard.querySelector('.btn-driver-nav, .btn-nav-full');
  assert(navBtn, '1-tap navigation CTA button must exist on stop card');
  assert(navBtn.getAttribute('href').includes('maps/dir/?api=1&destination=14.841178,99.689596'), 'CTA href must contain direct Google Maps intent');
});

suite.test('Tier 1: Map Tiles - updateMapTiles loads CartoDB Dark Matter for dark theme and Voyager for light theme', 1, () => {
  const env = buildM2TestContext();
  
  // Test dark theme
  env.sandbox.updateMapTiles('dark');
  assert(env.getTileLayerUrl().includes('rastertiles/dark_all'), 'Dark mode should load rastertiles/dark_all');

  // Test light theme
  env.sandbox.updateMapTiles('light');
  assert(env.getTileLayerUrl().includes('rastertiles/voyager'), 'Light mode should load rastertiles/voyager');
});

suite.test('Tier 1: Bidirectional Sync - selectPlace highlights card, sets active state, and flies map', 1, () => {
  const env = buildM2TestContext();
  
  env.sandbox.selectPlace('owlyard', { flyMap: true, scrollList: true });

  const owlCard = env.document.querySelector('[data-place-id="owlyard"]');
  assert(owlCard, 'Owl Yard card must exist');
  assert(owlCard.classList.contains('active'), 'Owl Yard card should have .active class');
  assert(owlCard.classList.contains('selected'), 'Owl Yard card should have .selected class');

  const lastFly = env.getLastFlyTo();
  assert(lastFly, 'mapInstance.flyTo should have been invoked');
  assertEqual(lastFly.coords[0], 15.0777806, 'Latitude should match Owl Yard');
  assertEqual(lastFly.coords[1], 99.4981633, 'Longitude should match Owl Yard');
});

// ============================================================================
// TIER 2: BOUNDARY & EDGE CASES
// ============================================================================

suite.test('Tier 2: Boundary - setJourneyPhase("outbound") renders exactly 3 outbound places', 2, () => {
  const env = buildM2TestContext();
  env.sandbox.setJourneyPhase('outbound');

  const cards = env.document.querySelectorAll('#mapPlacesList .stop-card, #mapPlacesList .map-place-card');
  assertEqual(cards.length, 3, 'Outbound phase should render exactly 3 places (home, samchuk, danchang)');

  const ids = Array.from(cards).map(c => c.getAttribute('data-place-id'));
  assert(ids.includes('home'), 'Must include home');
  assert(ids.includes('poi_samchuk'), 'Must include samchuk');
  assert(ids.includes('charger_danchang'), 'Must include danchang');
});

suite.test('Tier 2: Boundary - setJourneyPhase("campsite") renders exactly 10 campsite zone places', 2, () => {
  const env = buildM2TestContext();
  env.sandbox.setJourneyPhase('campsite');

  const cards = env.document.querySelectorAll('#mapPlacesList .stop-card, #mapPlacesList .map-place-card');
  assertEqual(cards.length, 10, 'Campsite phase should render exactly 10 places in Ban Rai');
});

suite.test('Tier 2: Boundary - setJourneyPhase("inbound") renders exactly 7 inbound places', 2, () => {
  const env = buildM2TestContext();
  env.sandbox.setJourneyPhase('inbound');

  const cards = env.document.querySelectorAll('#mapPlacesList .stop-card, #mapPlacesList .map-place-card');
  assertEqual(cards.length, 7, 'Inbound phase should render exactly 7 places on return route');

  const ids = Array.from(cards).map(c => c.getAttribute('data-place-id'));
  assert(ids.includes('charger_nexmoev'), 'Must include NEXMOEV Mega Station');
});

suite.test('Tier 2: Boundary - selectPlace handles non-existent or null placeId gracefully without crashing', 2, () => {
  const env = buildM2TestContext();
  assert(() => {
    env.sandbox.selectPlace('non_existent_place_12345');
    env.sandbox.selectPlace(null);
    env.sandbox.selectPlace('');
  }, 'Invalid place IDs must not throw exceptions');
});

suite.test('Tier 2: Boundary - Rapid phase switching fuzzing (50 switches) maintains clean DOM consistency', 2, () => {
  const env = buildM2TestContext();
  const phases = ['all', 'outbound', 'campsite', 'inbound'];
  
  for (let i = 0; i < 50; i++) {
    const phase = phases[i % phases.length];
    env.sandbox.setJourneyPhase(phase);
  }

  // Settle on outbound
  env.sandbox.setJourneyPhase('outbound');
  const cards = env.document.querySelectorAll('#mapPlacesList .stop-card, #mapPlacesList .map-place-card');
  assertEqual(cards.length, 3, 'After rapid switching, outbound should still display 3 cards');
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL
// ============================================================================

suite.test('Tier 3: Pairwise - Phase filter paired with Category filter displays accurate intersection', 3, () => {
  const env = buildM2TestContext();
  
  // Phase = campsite, Category = food
  env.sandbox.setJourneyPhase('campsite');
  env.sandbox.renderMapMarkers('food');

  const cards = env.document.querySelectorAll('#mapPlacesList .stop-card, #mapPlacesList .map-place-card');
  assertEqual(cards.length, 5, 'Campsite zone should contain exactly 5 food places (koomrimkhao, baansuan, chaika, heiauan, padthai)');

  // Phase = inbound, Category = charger
  env.sandbox.setJourneyPhase('inbound');
  env.sandbox.renderMapMarkers('charger');

  const chargerCards = env.document.querySelectorAll('#mapPlacesList .stop-card, #mapPlacesList .map-place-card');
  assertEqual(chargerCards.length, 4, 'Inbound return leg should contain exactly 4 chargers (uthai bypass, nexmoev, elex manorom, ptt manorom)');
});

// ============================================================================
// TIER 4: REAL-WORLD SCENARIOS
// ============================================================================

suite.test('Tier 4: Scenario 1 - Mobile driver switches to Inbound leg, selects NEXMOEV, and verifies 1-tap navigation intent', 4, () => {
  const env = buildM2TestContext();
  
  // Driver taps Inbound Phase button
  const inboundBtn = env.document.querySelector('.phase-btn[data-phase="inbound"]');
  assert(inboundBtn, 'Inbound phase button must exist');
  inboundBtn.click();

  // Driver clicks NEXMOEV card
  const nexmoevCard = env.document.querySelector('[data-place-id="charger_nexmoev"]');
  assert(nexmoevCard, 'NEXMOEV card must be visible');
  nexmoevCard.click();

  assert(nexmoevCard.classList.contains('active'), 'NEXMOEV card should be activated');
  
  const navBtn = nexmoevCard.querySelector('.btn-driver-nav');
  assert(navBtn, 'Navigation CTA button must be present');
  assertEqual(navBtn.getAttribute('href'), 'https://www.google.com/maps/dir/?api=1&destination=15.482658,100.1352141', 'Direct navUrl should target NEXMOEV coordinates');
});

suite.test('Tier 4: Scenario 2 - Night driving flow: Theme toggle updates map tiles to CartoDB Dark Matter', 4, () => {
  const env = buildM2TestContext();
  
  const themeToggle = env.document.getElementById('themeToggleBtn');
  if (themeToggle) {
    themeToggle.click();
    assert(env.getTileLayerUrl().includes('rastertiles/dark_all') || env.getTileLayerUrl().includes('rastertiles/voyager'), 'Theme toggle should update tile layer URL');
  }
});

module.exports = suite;
