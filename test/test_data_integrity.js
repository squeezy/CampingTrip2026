/**
 * test_data_integrity.js
 * Comprehensive automated test suite for TRIP_DATA in data.js
 * Validates places, charging specs, maps URLs, coordinates, Charge & Chill hubs, and camp guide.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { TestSuite, assert, assertEqual, assertCloseTo, assertMatch, assertArray, assertInRange } = require('./test_helpers');

const suite = new TestSuite('Data Integrity (TRIP_DATA)');

// Load TRIP_DATA from data.js in a sandbox
function loadTripData() {
  const dataPath = path.resolve(__dirname, '../data.js');
  const code = fs.readFileSync(dataPath, 'utf8');
  const context = { window: {}, console };
  vm.createContext(context);
  return vm.runInContext(`${code}\n;TRIP_DATA;`, context);
}

const TRIP_DATA = loadTripData();

// Allowed categories
const VALID_CATEGORIES = ['all', 'charger', 'camp', 'food', 'cafe', 'poi'];
const VALID_ITEM_CATEGORIES = ['charger', 'camp', 'food', 'cafe', 'poi'];

// Expected brand instructions in camp guide
const EXPECTED_BRANDS = ['Tesla', 'BYD', 'MG', 'GWM', 'Changan', 'Aion'];

// ============================================================================
// TIER 1: FEATURE COVERAGE (Places, Hubs, Categories, Camp Guide)
// ============================================================================

// F3.1: TRIP_DATA existence and core structure
suite.test('Tier 1: Data Model - TRIP_DATA exists and contains all required root keys', 1, () => {
  assert(TRIP_DATA, 'TRIP_DATA should be defined');
  assert(TRIP_DATA.tripInfo, 'TRIP_DATA.tripInfo is required');
  assert(TRIP_DATA.places, 'TRIP_DATA.places is required');
  assert(TRIP_DATA.chargeAndChillHubs, 'TRIP_DATA.chargeAndChillHubs is required');
  assert(TRIP_DATA.categories, 'TRIP_DATA.categories is required');
  assert(TRIP_DATA.evCampingGuide, 'TRIP_DATA.evCampingGuide is required');
});

// F3.2: Place items contract
suite.test('Tier 1: Places - All places have id, name, category, coordinates, and navigation URL', 1, () => {
  assert(Array.isArray(TRIP_DATA.places), 'TRIP_DATA.places must be an array');
  assertEqual(TRIP_DATA.places.length, 20, `Expected exactly 20 places, got ${TRIP_DATA.places.length}`);

  TRIP_DATA.places.forEach((place, index) => {
    assert(place.id && typeof place.id === 'string', `Place [${index}] missing valid id`);
    assert(place.name && typeof place.name === 'string', `Place [${place.id}] missing valid name`);
    assert(VALID_ITEM_CATEGORIES.includes(place.category), `Place [${place.id}] has invalid category "${place.category}"`);
    assert(['outbound', 'campsite', 'inbound'].includes(place.phase), `Place [${place.id}] has invalid phase "${place.phase}"`);
    assert(typeof place.lat === 'number' && !isNaN(place.lat), `Place [${place.id}] invalid lat`);
    assert(typeof place.lng === 'number' && !isNaN(place.lng), `Place [${place.id}] invalid lng`);
    assert(typeof place.distanceFromOrigin === 'number', `Place [${place.id}] distanceFromOrigin must be number`);
    assert(place.navUrl && place.navUrl.startsWith('https://www.google.com/maps/dir/?api=1&destination='), `Place [${place.id}] missing standard navUrl direct intent`);
    assert(Array.isArray(place.foodHighlights) && place.foodHighlights.length >= 1, `Place [${place.id}] missing foodHighlights`);
    assert(place.description && place.description.length > 5, `Place [${place.id}] missing descriptive text`);
  });
});

// F3.3: Charging station specifications
suite.test('Tier 1: Chargers - All charger places contain valid power ratings and network details', 1, () => {
  const chargers = TRIP_DATA.places.filter(p => p.category === 'charger');
  assert(chargers.length >= 4, `Expected at least 4 chargers, got ${chargers.length}`);

  chargers.forEach(charger => {
    assert(charger.chargerInfo || charger.powerKw, `Charger [${charger.id}] missing charger specifications`);
    if (charger.chargerInfo) {
      assert(charger.chargerInfo.power, `Charger [${charger.id}] missing power spec`);
      assert(charger.chargerInfo.network, `Charger [${charger.id}] missing network name`);
    }
  });
});

// F3.4: Charge & Chill Hubs verification
suite.test('Tier 1: Hubs - All 6 Charge & Chill hubs contain food, charging, and chill advice', 1, () => {
  assertArray(TRIP_DATA.chargeAndChillHubs, 6, 'Expected exactly 6 Charge & Chill hubs');
  TRIP_DATA.chargeAndChillHubs.forEach(hub => {
    assert(hub.id, 'Hub missing id');
    assert(hub.name, `Hub [${hub.id}] missing name`);
    assert(hub.chargerSpecs, `Hub [${hub.id}] missing chargerSpecs`);
    assertArray(hub.whatToEatAndChill, 2, `Hub [${hub.id}] must list food & chill recommendations`);
    assert(hub.chillAdvice, `Hub [${hub.id}] missing chillAdvice`);
    assert(hub.mapsUrl, `Hub [${hub.id}] missing mapsUrl`);
  });
});

// F3.5 - F3.10: Individual Tier 1 Feature validation for each Hub
TRIP_DATA.chargeAndChillHubs.forEach((hub, idx) => {
  suite.test(`Tier 1: Hub Feature [${idx + 1}/6] - ${hub.name} data completeness`, 1, () => {
    assert(hub.id && hub.id.startsWith('hub-'), 'Hub id format valid');
    assert(hub.badge, 'Hub has promotional badge');
    assert(hub.distanceFromHome, 'Hub has distance description');
    assert(hub.whatToEatAndChill.length >= 2, 'Hub has restaurant recommendations');
    assert(hub.chargerSpecs.includes('DC') || hub.chargerSpecs.includes('kW'), 'Hub specs mention DC fast charging');
  });
});

// F8.1: Brand Camp Mode Guide
suite.test('Tier 1: Camp Guide - EV Camping Guide includes all required vehicle brands', 1, () => {
  const guide = TRIP_DATA.evCampingGuide;
  assert(guide, 'evCampingGuide must exist');
  assertArray(guide.carBrandsCampMode, 5, 'Must contain at least 5 car brand instructions');

  const brandText = guide.carBrandsCampMode.map(b => b.brand).join(' ');
  EXPECTED_BRANDS.forEach(brand => {
    assert(brandText.includes(brand), `Camp mode guide missing instructions for brand: ${brand}`);
  });
});

// F8.2 - F8.7: Individual Tier 1 Feature validation for each car brand guide
EXPECTED_BRANDS.forEach(brand => {
  suite.test(`Tier 1: Camp Guide Brand [${brand}] - Contains clear operational steps and mode name`, 1, () => {
    const brandGuide = TRIP_DATA.evCampingGuide.carBrandsCampMode.find(b => b.brand.toLowerCase().includes(brand.toLowerCase()));
    assert(brandGuide, `Guide for brand ${brand} must exist`);
    assert(brandGuide.modeName && brandGuide.modeName.length > 2, `Brand ${brand} must have mode name`);
    assert(brandGuide.steps && brandGuide.steps.length > 10, `Brand ${brand} must have detailed steps`);
  });
});

// F8.8: Emergency Roadside Contacts
suite.test('Tier 1: SOS - Emergency contacts contain key hotline numbers with valid telephone strings', 1, () => {
  const contacts = TRIP_DATA.evCampingGuide.emergencyContacts;
  assertArray(contacts, 4, 'Must have at least 4 emergency contacts');

  contacts.forEach(contact => {
    assert(contact.name && contact.name.length > 2, 'Contact missing name');
    assert(contact.phone && contact.phone.length >= 3, `Contact [${contact.name}] missing phone number`);
    assertMatch(contact.phone, /^[0-9\-+ ]+$/, `Contact [${contact.name}] phone number invalid format: ${contact.phone}`);
  });
});

// ============================================================================
// TIER 2: BOUNDARY & EDGE CASES (Coordinates, IDs, URLs, Numerical Ranges)
// ============================================================================

// T2.1: Place IDs are strictly unique
suite.test('Tier 2: Boundary - All Place IDs are unique without any collisions', 2, () => {
  const ids = TRIP_DATA.places.map(p => p.id);
  const uniqueIds = new Set(ids);
  assertEqual(ids.length, uniqueIds.size, 'Duplicate place IDs detected in TRIP_DATA.places');
});

// T2.2: Geographic coordinate bounds for Central & Western Thailand (BKK -> Uthai Thani)
suite.test('Tier 2: Boundary - All place coordinates fall within valid geographic bounds of Thailand trip route', 2, () => {
  TRIP_DATA.places.forEach(place => {
    // Latitude roughly 13.5 (Bangkok) to 16.0 (Nakhon Sawan/Uthai Thani)
    assertInRange(place.lat, 13.0, 16.5, `Place [${place.id}] latitude ${place.lat} out of Thailand route range`);
    // Longitude roughly 99.0 (Ban Rai) to 101.0 (Bangkok/Asian Highway)
    assertInRange(place.lng, 99.0, 101.0, `Place [${place.id}] longitude ${place.lng} out of Thailand route range`);
  });
});

// T2.3: Distance from origin bounds (0 km to 600 km)
suite.test('Tier 2: Boundary - Distance from origin values are non-negative and realistic for trip loop', 2, () => {
  TRIP_DATA.places.forEach(place => {
    assert(place.distanceFromOrigin >= 0, `Place [${place.id}] distance cannot be negative: ${place.distanceFromOrigin}`);
    assert(place.distanceFromOrigin <= 600, `Place [${place.id}] distance exceeds maximum loop bounds: ${place.distanceFromOrigin}`);
  });
  const homePlace = TRIP_DATA.places.find(p => p.id === 'home');
  assert(homePlace, 'Home place is required');
  assertEqual(homePlace.distanceFromOrigin, 0, 'Home distanceFromOrigin must be 0');
});

// T2.4: Google Maps URLs valid HTTPS format
suite.test('Tier 2: Boundary - Navigation URLs start with valid Google Maps HTTPS patterns', 2, () => {
  TRIP_DATA.places.forEach(place => {
    const url = place.mapsUrl || place.navUrl;
    assert(url.startsWith('https://'), `Place [${place.id}] URL must be secure HTTPS`);
    const isGoogleMaps = url.includes('maps.app.goo.gl') || url.includes('maps.google.com') || url.includes('google.com/maps');
    assert(isGoogleMaps, `Place [${place.id}] URL is not a recognized Google Maps URL: ${url}`);
  });
});

// T2.5: Highlighting flags integrity
suite.test('Tier 2: Boundary - Highlight attributes are boolean or string flags', 2, () => {
  TRIP_DATA.places.forEach(place => {
    if (place.highlight !== undefined) {
      assert(typeof place.highlight === 'boolean' || typeof place.highlight === 'string', `Place [${place.id}] invalid highlight flag`);
    }
  });
});

// T2.6-T2.11: Specific validation for each Charge & Chill Hub
TRIP_DATA.chargeAndChillHubs.forEach((hub, idx) => {
  suite.test(`Tier 2: Boundary - Hub [${idx + 1}/6] ${hub.name} coordinate and specs validation`, 2, () => {
    assertInRange(hub.lat, 13.0, 16.5, `Hub [${hub.id}] lat out of bounds`);
    assertInRange(hub.lng, 99.0, 101.0, `Hub [${hub.id}] lng out of bounds`);
    assert(hub.whatToEatAndChill.length >= 2, `Hub [${hub.id}] must have multiple food options`);
    assert(hub.mapsUrl.startsWith('https://'), `Hub [${hub.id}] mapsUrl must be HTTPS`);
  });
});

// T2.12: Origin and Destination metadata
suite.test('Tier 2: Boundary - Trip Info origin and destination coordinates are exact', 2, () => {
  const origin = TRIP_DATA.tripInfo.origin;
  const dest = TRIP_DATA.tripInfo.destination;
  assertCloseTo(origin.lat, 13.817, 0.05, 'Origin lat around Nonthaburi');
  assertCloseTo(origin.lng, 100.414, 0.05, 'Origin lng around Nonthaburi');
  assertCloseTo(dest.lat, 15.077, 0.05, 'Owl Yard lat in Ban Rai');
  assertCloseTo(dest.lng, 99.498, 0.05, 'Owl Yard lng in Ban Rai');
});

// T2.13: Highlight Mega Charger NEXMOEV details
suite.test('Tier 2: Boundary - NEXMOEV Mega Charger contains 12 guns and 120kW fast charge specs', 2, () => {
  const nexmo = TRIP_DATA.places.find(p => p.id === 'charger_nexmoev');
  assert(nexmo, 'NEXMOEV charger must exist');
  assert(nexmo.chargerInfo.guns.includes('12'), 'NEXMOEV must advertise 12 charging guns');
  assert(nexmo.chargerInfo.power.includes('120 kW'), 'NEXMOEV power must be 120 kW');
  assertEqual(nexmo.isSuperHighlight, true, 'NEXMOEV should be marked as super highlight');
});

// T2.14: Owl Yard campsite opening and facilities
suite.test('Tier 2: Boundary - Owl Yard campsite contains Car Camping guidelines and tips', 2, () => {
  const owlyard = TRIP_DATA.places.find(p => p.id === 'owlyard');
  assert(owlyard, 'Owl Yard must exist in places');
  assertEqual(owlyard.category, 'camp');
  assert(owlyard.tips.includes('Camp Mode') || owlyard.tips.includes('แอร์'), 'Owl Yard must have EV camp tips');
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL TESTING (Categories vs Places Matrix)
// ============================================================================

// T3.1: Category distribution completeness
suite.test('Tier 3: Pairwise - Every defined category has at least one place entry', 3, () => {
  VALID_ITEM_CATEGORIES.forEach(cat => {
    const matching = TRIP_DATA.places.filter(p => p.category === cat);
    assert(matching.length > 0, `Category "${cat}" has no matching places in directory`);
  });
});

// T3.2: Food & Cafe places near Ban Rai
suite.test('Tier 3: Pairwise - Ban Rai local area contains restaurants, cafes, and attractions', 3, () => {
  const banRaiPlaces = TRIP_DATA.places.filter(p => p.distanceFromOrigin >= 210 && p.distanceFromOrigin <= 230);
  assert(banRaiPlaces.some(p => p.category === 'food'), 'Ban Rai must have food options');
  assert(banRaiPlaces.some(p => p.category === 'cafe'), 'Ban Rai must have cafe options');
  assert(banRaiPlaces.some(p => p.category === 'poi'), 'Ban Rai must have attractions');
  assert(banRaiPlaces.some(p => p.category === 'camp'), 'Ban Rai must have campsite');
});

// T3.3: Route direction summary matches hubs
suite.test('Tier 3: Pairwise - Outbound and Inbound route summaries reference main chargers', 3, () => {
  const route = TRIP_DATA.routeDirectionOverview;
  assert(route.outbound.keyChargingStrategy.includes('ด่านช้าง'), 'Outbound strategy must mention Dan Chang');
  assert(route.inbound.keyChargingStrategy.includes('NEXMOEV'), 'Inbound strategy must mention NEXMOEV');
});

// ============================================================================
// TIER 4: REAL-WORLD DATA USAGE SCENARIOS
// ============================================================================

suite.test('Tier 4: Scenario 1 - Driver searches for Dan Chang PTT Charger before campsite', 4, () => {
  const danchang = TRIP_DATA.places.find(p => p.id === 'charger_danchang');
  assert(danchang, 'PTT Dan Chang charger found');
  assertEqual(danchang.distanceFromOrigin, 175);
  assert(danchang.chargerInfo.power.includes('120 kW'));
  assert(danchang.tips.includes('85-95%'), 'Tips must advise 85-95% charging before camp');
});

suite.test('Tier 4: Scenario 2 - Campsite Evening Dinner Query (Koom Rim Khao & Baan Suan)', 4, () => {
  const koomrimkhao = TRIP_DATA.places.find(p => p.id === 'rest_koomrimkhao');
  assert(koomrimkhao, 'Koom Rim Khao restaurant found');
  assert(koomrimkhao.recommendedMenu.length >= 3, 'Menu items present');
  assert(koomrimkhao.phone, 'Phone number available for dinner reservations');
});

suite.test('Tier 4: Scenario 3 - Next Morning Sightseeing Query (Hup Pa Tat Jurassic Valley)', 4, () => {
  const huppatat = TRIP_DATA.places.find(p => p.id === 'poi_huppatat');
  assert(huppatat, 'Hup Pa Tat found');
  assert(huppatat.distanceFromOrigin > 220, 'Hup Pa Tat is along inbound route');
  assert(huppatat.openingHours, 'Opening hours provided');
});

suite.test('Tier 4: Scenario 4 - BYD Driver Camp Mode Lookup', 4, () => {
  const bydGuide = TRIP_DATA.evCampingGuide.carBrandsCampMode.find(b => b.brand.includes('BYD'));
  assert(bydGuide, 'BYD camp mode instructions found');
  assert(bydGuide.steps.includes('DRL') || bydGuide.steps.includes('แอร์'), 'Steps detail DRL and AC operation');
});

suite.test('Tier 4: Scenario 5 - Emergency PEA VOLTA Hotline Lookup', 4, () => {
  const pea = TRIP_DATA.evCampingGuide.emergencyContacts.find(c => c.name.includes('PEA VOLTA'));
  assert(pea, 'PEA VOLTA emergency contact found');
  assertEqual(pea.phone, '1129');
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
