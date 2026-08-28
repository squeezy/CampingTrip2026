/**
 * verify_touch_targets_css.js
 * Adversarial empirical test suite for CSS touch target bounds and driver ergonomics.
 */

const fs = require('fs');
const path = require('path');

console.log('===========================================================');
console.log('  M2 EMPIRICAL CHALLENGER: CSS TOUCH TARGETS TEST SUITE');
console.log('===========================================================\n');

const cssContent = fs.readFileSync(path.resolve(__dirname, '../../style.css'), 'utf8');
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

let passed = 0;
let failed = 0;
let warnings = 0;

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

function warn(message, details = '') {
  console.warn(`  ⚠️ WARN: ${message}`);
  if (details) console.warn(`    Detail: ${details}`);
  warnings++;
}

// 1. Verify .btn-driver-nav (>=48px touch target)
console.log('--- 1. .btn-driver-nav 1-Tap Navigation CTA Target Verification ---');
const btnDriverNavMatch = cssContent.match(/\.btn-driver-nav\s*\{([^}]+)\}/s);
assert(btnDriverNavMatch !== null, '.btn-driver-nav rule exists in style.css');

if (btnDriverNavMatch) {
  const body = btnDriverNavMatch[1];
  const minHeightMatch = body.match(/min-height:\s*(\d+)px/);
  assert(minHeightMatch !== null, '.btn-driver-nav explicitly defines min-height');
  if (minHeightMatch) {
    const minHeight = parseInt(minHeightMatch[1], 10);
    assert(minHeight >= 48, `.btn-driver-nav min-height is >= 48px (Actual: ${minHeight}px)`);
  }
  
  const touchActionMatch = body.match(/touch-action:\s*manipulation/);
  assert(touchActionMatch !== null, '.btn-driver-nav defines touch-action: manipulation to eliminate mobile 300ms tap delay');
  
  const displayMatch = body.match(/display:\s*(inline-flex|flex)/);
  assert(displayMatch !== null, '.btn-driver-nav uses flex/inline-flex layout for centered tap surface');
}

// 2. Verify .custom-map-pin & Invisible Touch Cylinder (60x60px target)
console.log('\n--- 2. Map Pin Touch Cylinder (60x60px) Verification ---');
const pinMatch = cssContent.match(/\.custom-map-pin\s*\{([^}]+)\}/s);
assert(pinMatch !== null, '.custom-map-pin rule exists in style.css');

if (pinMatch) {
  const body = pinMatch[1];
  const widthMatch = body.match(/width:\s*(\d+)px/);
  const heightMatch = body.match(/height:\s*(\d+)px/);
  const minWidthMatch = body.match(/min-width:\s*(\d+)px/);
  const minHeightMatch = body.match(/min-height:\s*(\d+)px/);
  
  const baseW = widthMatch ? parseInt(widthMatch[1], 10) : 0;
  const baseH = heightMatch ? parseInt(heightMatch[1], 10) : 0;
  assert(baseW >= 44 && baseH >= 44, `.custom-map-pin base visual size is >= 44x44px (Actual: ${baseW}x${baseH}px)`);
  
  const pinBeforeMatch = cssContent.match(/\.custom-map-pin::before\s*\{([^}]+)\}/s);
  assert(pinBeforeMatch !== null, '.custom-map-pin::before pseudo-element exists for touch cylinder expansion');
  
  if (pinBeforeMatch) {
    const beforeBody = pinBeforeMatch[1];
    const insetMatch = beforeBody.match(/inset:\s*-?(\d+)px/);
    assert(insetMatch !== null, '.custom-map-pin::before defines inset expansion');
    
    if (insetMatch) {
      const insetVal = parseInt(insetMatch[1], 10);
      // Mathematical touch cylinder diameter: base + 2 * inset
      const touchDiameter = baseW + (2 * insetVal);
      assert(
        touchDiameter >= 60,
        `Map pin touch cylinder diameter is >= 60px (Math: ${baseW}px base + 2 * ${insetVal}px inset = ${touchDiameter}px)`,
        `Calculated touch diameter: ${touchDiameter}px (Expected: >= 60px)`
      );
    }
  }
}

// 3. Verify .phase-chip / .phase-btn (>=44px touch target)
console.log('\n--- 3. Journey Phase Filter Buttons / Chips Verification ---');
// Check index.html for phase element class names
const htmlPhaseButtons = htmlContent.match(/class="[^"]*phase-[^"]*"/g);
console.log(`  Info: Phase classes in index.html: ${JSON.stringify(htmlPhaseButtons)}`);

const phaseChipInCSS = cssContent.match(/\.phase-chip\s*\{([^}]+)\}/s);
const phaseBtnInCSS = cssContent.match(/\.phase-btn\s*\{([^}]+)\}/s);
const filterChipInCSS = cssContent.match(/\.filter-chip\s*\{([^}]+)\}/s);

console.log(`  Info: .phase-chip in style.css: ${!!phaseChipInCSS}`);
console.log(`  Info: .phase-btn in style.css: ${!!phaseBtnInCSS}`);
console.log(`  Info: .filter-chip in style.css: ${!!filterChipInCSS}`);

if (phaseBtnInCSS) {
  const body = phaseBtnInCSS[1];
  const minHeightMatch = body.match(/min-height:\s*(\d+)px/);
  if (minHeightMatch) {
    const minHeight = parseInt(minHeightMatch[1], 10);
    assert(minHeight >= 44, `.phase-btn min-height is >= 44px (Actual: ${minHeight}px)`);
  } else {
    assert(false, '.phase-btn missing min-height declaration in style.css');
  }
} else if (phaseChipInCSS) {
  const body = phaseChipInCSS[1];
  const minHeightMatch = body.match(/min-height:\s*(\d+)px/);
  if (minHeightMatch) {
    const minHeight = parseInt(minHeightMatch[1], 10);
    assert(minHeight >= 44, `.phase-chip min-height is >= 44px (Actual: ${minHeight}px)`);
  }
} else {
  // Neither .phase-btn nor .phase-chip is defined in style.css
  warn(
    '.phase-btn and .phase-chip are not explicitly defined in style.css',
    'HTML defines #phaseFilterGroup with class="phase-btn", but style.css lacks .phase-btn / .phase-chip rule block.'
  );
}

// 4. Verify Category Filter Chips (.filter-chip >= 44px)
console.log('\n--- 4. Category Filter Chips (.filter-chip) Verification ---');
if (filterChipInCSS) {
  const body = filterChipInCSS[1];
  const minHeightMatch = body.match(/min-height:\s*(\d+)px/);
  assert(minHeightMatch !== null, '.filter-chip defines min-height');
  if (minHeightMatch) {
    const minH = parseInt(minHeightMatch[1], 10);
    assert(minH >= 44, `.filter-chip min-height is >= 44px (Actual: ${minH}px)`);
  }
}

// 5. Global Touch Target Variable in :root
console.log('\n--- 5. Global Design Tokens for Touch Target Verification ---');
const touchMinTargetMatch = cssContent.match(/--touch-min-target:\s*(\d+)px/);
assert(touchMinTargetMatch !== null, '--touch-min-target defined in CSS :root');
if (touchMinTargetMatch) {
  const val = parseInt(touchMinTargetMatch[1], 10);
  assert(val >= 44, `--touch-min-target is >= 44px (Actual: ${val}px)`);
}

console.log('\n===========================================================');
console.log(`  CSS TOUCH TARGET RESULTS: ${passed} PASSED, ${failed} FAILED, ${warnings} WARNINGS`);
console.log('===========================================================\n');
