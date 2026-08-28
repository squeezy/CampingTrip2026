/**
 * verify_data_integrity.js
 * Adversarial empirical test suite for Milestone 2 TRIP_DATA.places
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('====================================================');
console.log('  M2 EMPIRICAL CHALLENGER: DATA INTEGRITY TEST SUITE');
console.log('====================================================\n');

// Load data.js in isolated sandbox
const dataCode = fs.readFileSync(path.resolve(__dirname, '../../data.js'), 'utf8');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
const TRIP_DATA = vm.runInContext(dataCode + '\n;TRIP_DATA;', sandbox);

if (!TRIP_DATA) {
  console.error('FATAL: TRIP_DATA not found in data.js');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    if (details) console.error(`    Detail: ${details}`);
    failed++;
  }
}

// 1. Total Places Count Check
console.log('--- 1. Places Count Verification ---');
assert(Array.isArray(TRIP_DATA.places), 'TRIP_DATA.places is an array');
assert(TRIP_DATA.places.length === 20, `TRIP_DATA.places contains exactly 20 places (Found: ${TRIP_DATA.places.length})`);

// 2. Thailand Bounding Box Verification
// Thailand approximate bounding box:
// Latitude: 5.61° N to 20.46° N
// Longitude: 97.34° E to 105.64° E
console.log('\n--- 2. Thailand Bounding Box Geocoordinates Verification ---');
const TH_LAT_MIN = 5.61;
const TH_LAT_MAX = 20.46;
const TH_LNG_MIN = 97.34;
const TH_LNG_MAX = 105.64;

TRIP_DATA.places.forEach(place => {
  const isLatValid = typeof place.lat === 'number' && !isNaN(place.lat) && place.lat >= TH_LAT_MIN && place.lat <= TH_LAT_MAX;
  const isLngValid = typeof place.lng === 'number' && !isNaN(place.lng) && place.lng >= TH_LNG_MIN && place.lng <= TH_LNG_MAX;
  
  assert(
    isLatValid && isLngValid,
    `Place [${place.id}] (${place.name}) coords (${place.lat}, ${place.lng}) in Thailand bbox`,
    `lat: ${place.lat} [${TH_LAT_MIN}..${TH_LAT_MAX}], lng: ${place.lng} [${TH_LNG_MIN}..${TH_LNG_MAX}]`
  );
});

// 3. Phase Assignment & Distribution Verification
console.log('\n--- 3. Phase Assignment Verification ---');
const expectedPhases = {
  outbound: ['home', 'poi_samchuk', 'charger_danchang'],
  campsite: ['owlyard', 'charger_banrai_pea', 'rest_koomrimkhao', 'rest_baansuan', 'rest_chaika', 'rest_heiauan', 'rest_padthai', 'cafe_leleela', 'poi_giant_tree', 'poi_wat_tham_khao_wong'],
  inbound: ['poi_huppatat', 'charger_ptt_uthai_bypass', 'poi_watthasung', 'charger_nexmoev', 'charger_elex_egat_manorom', 'charger_ptt_manorom_ah2', 'poi_chainat_bird']
};

const phaseCounts = { outbound: 0, campsite: 0, inbound: 0, other: 0 };
TRIP_DATA.places.forEach(place => {
  if (['outbound', 'campsite', 'inbound'].includes(place.phase)) {
    phaseCounts[place.phase]++;
  } else {
    phaseCounts.other++;
  }
});

assert(phaseCounts.outbound === 3, `Outbound phase has exactly 3 places (Found: ${phaseCounts.outbound})`);
assert(phaseCounts.campsite === 10, `Campsite phase has exactly 10 places (Found: ${phaseCounts.campsite})`);
assert(phaseCounts.inbound === 7, `Inbound phase has exactly 7 places (Found: ${phaseCounts.inbound})`);
assert(phaseCounts.other === 0, `Zero places with invalid/unassigned phase (Found: ${phaseCounts.other})`);

// Check individual expected mapping
Object.entries(expectedPhases).forEach(([phase, ids]) => {
  ids.forEach(id => {
    const place = TRIP_DATA.places.find(p => p.id === id);
    assert(
      place && place.phase === phase,
      `Place [${id}] explicitly assigned to phase '${phase}' (Actual: ${place ? place.phase : 'NOT_FOUND'})`
    );
  });
});

// 4. Google Maps Directions URL Syntax Verification
console.log('\n--- 4. Google Maps Directions URL Syntax Verification ---');
const GOOGLE_MAPS_DIR_PREFIX = 'https://www.google.com/maps/dir/?api=1&destination=';

TRIP_DATA.places.forEach(place => {
  const hasNavUrl = typeof place.navUrl === 'string' && place.navUrl.length > 0;
  assert(hasNavUrl, `Place [${place.id}] has non-empty navUrl string`);
  
  if (hasNavUrl) {
    const startsWithCorrectPrefix = place.navUrl.startsWith(GOOGLE_MAPS_DIR_PREFIX);
    assert(
      startsWithCorrectPrefix,
      `Place [${place.id}] navUrl starts with standard prefix '${GOOGLE_MAPS_DIR_PREFIX}'`,
      `navUrl: ${place.navUrl}`
    );
    
    const destCoordsStr = place.navUrl.substring(GOOGLE_MAPS_DIR_PREFIX.length);
    const [latStr, lngStr] = destCoordsStr.split(',');
    const destLat = parseFloat(latStr);
    const destLng = parseFloat(lngStr);
    
    const latMatch = Math.abs(destLat - place.lat) < 0.000001;
    const lngMatch = Math.abs(destLng - place.lng) < 0.000001;
    
    assert(
      latMatch && lngMatch,
      `Place [${place.id}] destination coords (${destLat}, ${destLng}) match place coords (${place.lat}, ${place.lng})`,
      `Expected ${place.lat},${place.lng}, got ${destCoordsStr}`
    );
  }
});

// 5. EV Charging Stations Verification
console.log('\n--- 5. EV Charging Stations Power & Spec Verification ---');
const chargers = TRIP_DATA.places.filter(p => p.category === 'charger');
assert(chargers.length === 6, `Found 6 EV charging stations in places directory (Found: ${chargers.length})`);

chargers.forEach(ch => {
  const hasPowerKw = typeof ch.powerKw === 'number' && !isNaN(ch.powerKw) && ch.powerKw > 0;
  assert(
    hasPowerKw,
    `Charger [${ch.id}] has valid numeric powerKw: ${ch.powerKw} kW`,
    `Actual: ${ch.powerKw} (${typeof ch.powerKw})`
  );
  
  const hasPlugType = typeof ch.plugType === 'string' && ch.plugType.length > 0;
  assert(
    hasPlugType,
    `Charger [${ch.id}] has non-empty plugType specification: "${ch.plugType}"`
  );
  
  const hasNetworkApp = typeof ch.networkApp === 'string' && ch.networkApp.length > 0;
  assert(
    hasNetworkApp,
    `Charger [${ch.id}] has non-empty networkApp specification: "${ch.networkApp}"`
  );
});

// 6. Food Highlights Completeness Verification
console.log('\n--- 6. Food Highlights Array Verification ---');
TRIP_DATA.places.forEach(place => {
  const hasFoodHighlights = Array.isArray(place.foodHighlights) && place.foodHighlights.length > 0;
  assert(
    hasFoodHighlights,
    `Place [${place.id}] has non-empty foodHighlights array (Items: ${place.foodHighlights ? place.foodHighlights.length : 0})`,
    `Items: ${JSON.stringify(place.foodHighlights)}`
  );
});

console.log('\n====================================================');
console.log(`  DATA INTEGRITY RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
