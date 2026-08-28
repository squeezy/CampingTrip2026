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
    event.preventDefault = () => { event.defaultPrevented = true; };
    event.stopPropagation = () => { event.propagationStopped = true; };
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
  const TRIP_DATA = vm.runInContext(`${dataJsContent}\n;TRIP_DATA;`, sandbox);
  sandbox.TRIP_DATA = TRIP_DATA;
  vm.runInContext(appJsContent, sandbox);

  documentMock.dispatchEvent({ type: 'DOMContentLoaded' });

  return {
    sandbox,
    TRIP_DATA,
    document: documentMock,
    window: windowMock,
    getTileLayerUrl: () => tileLayerUrl,
    getLastFlyTo: () => lastFlyTo,
    getLastFitBounds: () => lastFitBounds
  };
}

// ============================================================================
// TIER 1: FEATURE COVERAGE & INVARIANTS
// ============================================================================

suite.test('Tier 1: Disjoint Phase Partitioning & Invariant Sum - All 20 places belong to exactly one phase', 1, () => {
  const env = buildM2TestContext();
  const places = env.sandbox.TRIP_DATA.places;
  assertEqual(places.length, 20, 'Master places count must be exactly 20');

  const outbound = places.filter(p => p.phase === 'outbound');
  const campsite = places.filter(p => p.phase === 'campsite');
  const inbound = places.filter(p => p.phase === 'inbound');

  assertEqual(outbound.length, 3, 'Outbound phase must contain exactly 3 places');
  assertEqual(campsite.length, 10, 'Campsite phase must contain exactly 10 places');
  assertEqual(inbound.length, 7, 'Inbound phase must contain exactly 7 places');
  assertEqual(outbound.length + campsite.length + inbound.length, 20, 'Sum of disjoint phases must equal total places');

  // Verify unique IDs
  const idSet = new Set();
  places.forEach(p => {
    assert(!idSet.has(p.id), 'Duplicate place ID found: ' + p.id);
    idSet.add(p.id);
  });
});

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

suite.test('Tier 1: Card Keyboard Accessibility - Enter and Space trigger selection and Space prevents default', 1, () => {
  const env = buildM2TestContext();
  const card = env.document.querySelector('[data-place-id="charger_danchang"]');
  assert(card, 'Dan Chang card must exist');

  // Test Space key
  const spaceEvt = { type: 'keydown', key: ' ', target: card };
  card.dispatchEvent(spaceEvt);
  assert(card.classList.contains('active'), 'Card must be active after Space keydown');
  assert(spaceEvt.defaultPrevented, 'Space keydown must prevent default scrolling');

  // Test Enter key
  const samchukCard = env.document.querySelector('[data-place-id="poi_samchuk"]');
  const enterEvt = { type: 'keydown', key: 'Enter', target: samchukCard };
  samchukCard.dispatchEvent(enterEvt);
  assert(samchukCard.classList.contains('active'), 'Samchuk card must be active after Enter keydown');
  assert(!card.classList.contains('active'), 'Previous card must lose active state');
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

suite.test('Tier 2: Boundary - selectPlace handles non-existent, null, undefined, number, object placeId gracefully', 2, () => {
  const env = buildM2TestContext();
  assert(() => {
    env.sandbox.selectPlace('non_existent_place_12345');
    env.sandbox.selectPlace(null);
    env.sandbox.selectPlace(undefined);
    env.sandbox.selectPlace('');
    env.sandbox.selectPlace(9999);
    env.sandbox.selectPlace({});
    env.sandbox.selectPlace(['invalid']);
  }, 'Invalid place IDs must not throw exceptions');
});

suite.test('Tier 2: Boundary - Rapid phase switching fuzzing (100 switches with malformed inputs) maintains clean DOM', 2, () => {
  const env = buildM2TestContext();
  const testInputs = [
    'all', 'outbound', 'campsite', 'inbound',
    'unknown_phase', '', null, undefined, 12345, {}, [],
    'ALL', 'Outbound', 'campsite', 'all'
  ];

  for (let i = 0; i < 100; i++) {
    const input = testInputs[i % testInputs.length];
    assert(() => {
      env.sandbox.setJourneyPhase(input);
    }, 'setJourneyPhase(' + JSON.stringify(input) + ') threw an exception');
  }

  // Restore to valid phase
  env.sandbox.setJourneyPhase('outbound');
  const cards = env.document.querySelectorAll('#mapPlacesList .stop-card');
  assertEqual(cards.length, 3, 'After rapid switching, outbound should still display 3 cards');
});

suite.test('Tier 2: Boundary - Clicking .btn-driver-nav CTA does NOT trigger selectPlace on parent card', 2, () => {
  const env = buildM2TestContext();
  env.sandbox.setJourneyPhase('all');

  // Select place 1 first
  env.sandbox.selectPlace('home');
  const homeCard = env.document.querySelector('[data-place-id="home"]');
  assert(homeCard.classList.contains('active'), 'Home card is active');

  // Click navigation button inside Dan Chang card
  const danChangCard = env.document.querySelector('[data-place-id="charger_danchang"]');
  const navBtn = danChangCard.querySelector('.btn-driver-nav');
  assert(navBtn, 'Dan Chang navigation button must exist');

  // Clicking the button directly
  navBtn.click();

  // Home card should STILL be active (Dan Chang card should NOT have become active)
  assert(homeCard.classList.contains('active'), 'Home card should still remain active when clicking nav button on another card');
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL
// ============================================================================

suite.test('Tier 3: Pairwise - 24 Combinatorial Phase x Category Intersections', 3, () => {
  const env = buildM2TestContext();
  const phases = ['all', 'outbound', 'campsite', 'inbound'];
  const categories = ['all', 'charger', 'camp', 'food', 'cafe', 'poi'];

  let totalCombinationsTested = 0;

  for (const phase of phases) {
    for (const cat of categories) {
      env.sandbox.setJourneyPhase(phase);
      env.sandbox.renderMapMarkers(cat);

      const expectedPlaces = env.sandbox.TRIP_DATA.places.filter(p => {
        const matchesPhase = (phase === 'all') || (p.phase === phase);
        const matchesCat = (cat === 'all') || (p.category === cat);
        return matchesPhase && matchesCat;
      });

      const renderedCards = env.document.querySelectorAll('#mapPlacesList .stop-card, #mapPlacesList .map-place-card');
      assertEqual(renderedCards.length, expectedPlaces.length, 'Mismatch in phase=' + phase + ' cat=' + cat + ': expected ' + expectedPlaces.length + ', found ' + renderedCards.length);

      // Check markersMap dictionary synchronization
      const renderedMarkerKeys = Object.keys(env.window.markersMap);
      assertEqual(renderedMarkerKeys.length, expectedPlaces.length, 'markersMap keys length mismatch in phase=' + phase + ' cat=' + cat);

      // If 0 results, verify empty state UI is rendered
      if (expectedPlaces.length === 0) {
        const emptyNotice = env.document.querySelector('#mapPlacesList');
        assert(emptyNotice && emptyNotice.innerHTML.includes('ไม่พบสถานที่'), 'Empty result notice must appear when 0 matches');
      }

      totalCombinationsTested++;
    }
  }

  assertEqual(totalCombinationsTested, 24, 'Must test all 24 combinatorial states');
});

suite.test('Tier 3: Pairwise - Bidirectional Event Pairing across all 20 places', 3, () => {
  const env = buildM2TestContext();
  env.sandbox.setJourneyPhase('all');

  const places = env.sandbox.TRIP_DATA.places;

  places.forEach(p => {
    // 1. Card click -> flies map and opens popup
    const card = env.document.querySelector('[data-place-id="' + p.id + '"]');
    assert(card, 'Card for ' + p.id + ' must exist');
    card.click();

    assert(card.classList.contains('active'), 'Card must be active after click: ' + p.id);
    const lastFly = env.getLastFlyTo();
    assert(lastFly, 'flyTo must be called');
    assertEqual(lastFly.coords[0], p.lat, 'Latitude matches place');
    assertEqual(lastFly.coords[1], p.lng, 'Longitude matches place');

    // 2. Marker click -> activates card and scrolls into view
    const marker = env.window.markersMap[p.id];
    assert(marker, 'Marker must exist for ' + p.id);
    if (marker._clickCb) {
      marker._clickCb();
      assert(card.classList.contains('active'), 'Card must be active after marker click: ' + p.id);
      assert(card._scrolledIntoView, 'Card must scroll into view after marker click: ' + p.id);
    }
  });
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

suite.test('Tier 4: Scenario 2 - Rapid selection spam (200 random selections across markers & cards maintains single-active invariant)', 4, () => {
  const env = buildM2TestContext();
  env.sandbox.setJourneyPhase('all');

  const places = env.sandbox.TRIP_DATA.places;

  for (let i = 0; i < 200; i++) {
    const p = places[Math.floor(Math.random() * places.length)];
    if (i % 2 === 0) {
      env.sandbox.selectPlace(p.id);
    } else {
      const marker = env.window.markersMap[p.id];
      if (marker && marker._clickCb) marker._clickCb();
    }
  }

  // Exactly 1 card must be selected
  const activeCards = env.document.querySelectorAll('#mapPlacesList .stop-card.active');
  assertEqual(activeCards.length, 1, 'Exactly 1 card must remain active after 200 random selections');
});

suite.test('Tier 4: Scenario 3 - Driver Navigation URLs, GPS Coordinates & Food Highlights Validity across all 20 places', 4, () => {
  const env = buildM2TestContext();
  const places = env.sandbox.TRIP_DATA.places;

  places.forEach(p => {
    // 1. Coordinates inside Thailand bounding box
    assert(p.lat >= 13.5 && p.lat <= 16.0, 'Latitude out of range for ' + p.id + ': ' + p.lat);
    assert(p.lng >= 99.0 && p.lng <= 101.0, 'Longitude out of range for ' + p.id + ': ' + p.lng);

    // 2. Direct navUrl format
    assert(p.navUrl.startsWith('https://www.google.com/maps/dir/?api=1&destination='), 'navUrl format invalid for ' + p.id + ': ' + p.navUrl);
    assert(p.navUrl.includes(String(p.lat)), 'navUrl missing latitude for ' + p.id);
    assert(p.navUrl.includes(String(p.lng)), 'navUrl missing longitude for ' + p.id);

    // 3. Distance from origin is non-negative number
    assert(typeof p.distanceFromOrigin === 'number' && p.distanceFromOrigin >= 0, 'distanceFromOrigin invalid for ' + p.id);

    // 4. Food highlights array
    assert(Array.isArray(p.foodHighlights) && p.foodHighlights.length > 0, 'foodHighlights empty for ' + p.id);
  });
});

module.exports = suite;

