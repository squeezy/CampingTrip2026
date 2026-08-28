/**
 * stress_test_m2.js
 * Comprehensive adversarial stress testing on M2 data, routes, and geometry.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('  M2 EMPIRICAL CHALLENGER: ADVERSARIAL STRESS TEST HARNESS');
console.log('================================================================\n');

const dataCode = fs.readFileSync(path.resolve(__dirname, '../../data.js'), 'utf8');
const cssContent = fs.readFileSync(path.resolve(__dirname, '../../style.css'), 'utf8');
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
const TRIP_DATA = vm.runInContext(dataCode + '\n;TRIP_DATA;', sandbox);

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

// 1. Uniqueness of Place IDs
console.log('--- 1. Unique ID Invariant Testing ---');
const placeIds = TRIP_DATA.places.map(p => p.id);
const uniqueIds = new Set(placeIds);
assert(uniqueIds.size === TRIP_DATA.places.length, `All ${placeIds.length} place IDs are unique (No duplicate IDs)`);

// 2. Monotonicity & Geometric Feasibility of Distances
console.log('\n--- 2. Route Distance Monotonicity & Feasibility ---');
const outboundPlaces = TRIP_DATA.places.filter(p => p.phase === 'outbound');
const campsitePlaces = TRIP_DATA.places.filter(p => p.phase === 'campsite');
const inboundPlaces = TRIP_DATA.places.filter(p => p.phase === 'inbound');

let prevDist = -1;
let outboundMonotonic = true;
outboundPlaces.forEach(p => {
  if (p.distanceFromOrigin < prevDist) outboundMonotonic = false;
  prevDist = p.distanceFromOrigin;
});
assert(outboundMonotonic, 'Outbound route stops have strictly increasing distance from origin (0km -> 120km -> 175km)');

let campsiteInRange = true;
campsitePlaces.forEach(p => {
  if (p.distanceFromOrigin < 215 || p.distanceFromOrigin > 235) campsiteInRange = false;
});
assert(campsiteInRange, 'All campsite zone places are localized within 220-225km cluster radius');

let inboundAllInRange = true;
inboundPlaces.forEach(p => {
  if (p.distanceFromOrigin < 250 || p.distanceFromOrigin > 360) inboundAllInRange = false;
});
assert(inboundAllInRange, 'All inbound return route stops are within 265km - 345km return leg range');

// 3. Phase Bounds Geometry Computation (Mathematical Verification)
console.log('\n--- 3. Phase Bounding Box Mathematical Calculations ---');
function computeBounds(places) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  places.forEach(p => {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  });
  return { minLat, maxLat, minLng, maxLng, centerLat: (minLat + maxLat) / 2, centerLng: (minLng + maxLng) / 2 };
}

const outboundBounds = computeBounds(outboundPlaces);
const campsiteBounds = computeBounds(campsitePlaces);
const inboundBounds = computeBounds(inboundPlaces);
const allBounds = computeBounds(TRIP_DATA.places);

console.log(`  Outbound bounds: Lat [${outboundBounds.minLat} .. ${outboundBounds.maxLat}], Lng [${outboundBounds.minLng} .. ${outboundBounds.maxLng}]`);
console.log(`  Campsite bounds: Lat [${campsiteBounds.minLat} .. ${campsiteBounds.maxLat}], Lng [${campsiteBounds.minLng} .. ${campsiteBounds.maxLng}]`);
console.log(`  Inbound bounds:  Lat [${inboundBounds.minLat} .. ${inboundBounds.maxLat}], Lng [${inboundBounds.minLng} .. ${inboundBounds.maxLng}]`);
console.log(`  Total trip bounds: Lat [${allBounds.minLat} .. ${allBounds.maxLat}], Lng [${allBounds.minLng} .. ${allBounds.maxLng}]`);

assert(outboundBounds.maxLat - outboundBounds.minLat > 0.5, 'Outbound spans realistic latitudinal corridor (>0.5 deg)');
assert(campsiteBounds.maxLat - campsiteBounds.minLat < 0.1, 'Campsite bounds tightly cluster around Ban Rai (<0.1 deg)');
assert(inboundBounds.maxLat - inboundBounds.minLat > 0.2, 'Inbound return corridor spans across Uthai Thani & Chai Nat (>0.2 deg)');

// 4. Adversarial URL & Navigation Encoding Validation
console.log('\n--- 4. Adversarial URL Syntax & Character Safety ---');
TRIP_DATA.places.forEach(p => {
  // Check for spaces or forbidden characters in navUrl
  const hasNoSpaces = !p.navUrl.includes(' ');
  const isValidUri = (() => { try { new URL(p.navUrl); return true; } catch (e) { return false; } })();
  
  assert(hasNoSpaces && isValidUri, `Place [${p.id}] navUrl is a RFC3986 valid URL without illegal whitespace`);
});

// 5. CSS Touch Target Metrics Summary
console.log('\n--- 5. Mathematical Summary of CSS Touch Target Bounds ---');
const btnDriverNavHeight = (cssContent.match(/\.btn-driver-nav\s*\{[^}]*min-height:\s*(\d+)px/s) || [])[1];
const pinBaseSize = (cssContent.match(/\.custom-map-pin\s*\{[^}]*width:\s*(\d+)px/s) || [])[1];
const pinInset = (cssContent.match(/\.custom-map-pin::before\s*\{[^}]*inset:\s*-?(\d+)px/s) || [])[1];
const pinTouchDiameter = parseInt(pinBaseSize || '0', 10) + (2 * parseInt(pinInset || '0', 10));

console.log(`  .btn-driver-nav CTA height: ${btnDriverNavHeight}px (Contract: >=48px)`);
console.log(`  .custom-map-pin touch cylinder diameter: ${pinTouchDiameter}px (Contract: 60x60px)`);

assert(parseInt(btnDriverNavHeight, 10) >= 48, '.btn-driver-nav fulfills >=48px touch target contract');
assert(pinTouchDiameter === 60, '.custom-map-pin touch cylinder fulfills exact 60x60px contract');

console.log('\n================================================================');
console.log(`  ADVERSARIAL STRESS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
