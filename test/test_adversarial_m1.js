/**
 * Empirical WCAG 2.1 AA Contrast Ratio & Touch Target Bounds Verification Harness
 * Author: M1 Challenger 2 (Empirical Adversarial Review)
 */

const fs = require('fs');
const path = require('path');
const { parseCssDeclarations } = require('./css_parser_helper');

// ==========================================================================
// 1. W3C WCAG 2.1 Relative Luminance & Contrast Ratio Implementation
// ==========================================================================
function sRGBtoLin(colorChannel) {
  const c = colorChannel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 1.0
  };
}

function parseRgba(rgbaStr) {
  const match = rgbaStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) throw new Error(`Invalid RGB/RGBA string: ${rgbaStr}`);
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1.0
  };
}

function compositeColor(fgRgba, bgHex) {
  const bg = hexToRgb(bgHex);
  const a = fgRgba.a;
  return {
    r: Math.round(fgRgba.r * a + bg.r * (1 - a)),
    g: Math.round(fgRgba.g * a + bg.g * (1 - a)),
    b: Math.round(fgRgba.b * a + bg.b * (1 - a)),
    a: 1.0
  };
}

function relativeLuminance(rgb) {
  const rLin = sRGBtoLin(rgb.r);
  const gLin = sRGBtoLin(rgb.g);
  const bLin = sRGBtoLin(rgb.b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function contrastRatio(rgb1, rgb2) {
  const L1 = relativeLuminance(rgb1);
  const L2 = relativeLuminance(rgb2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getBaseProperties(ruleBlocks, targetSelector) {
  const merged = {};
  ruleBlocks.forEach(rb => {
    if (!rb.media && (rb.selector === targetSelector || rb.selector.endsWith(' ' + targetSelector))) {
      Object.assign(merged, rb.declarations);
    }
  });
  return merged;
}

// ==========================================================================
// 2. Test Execution
// ==========================================================================
console.log('======================================================================');
console.log('  EMPIRICAL ADVERSARIAL STRESS TEST: WCAG AA CONTRAST & TOUCH TARGETS');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const resultsLog = [];

function recordTest(category, name, ratioOrVal, requiredThreshold, passed, details = '') {
  totalTests++;
  if (passed) passedTests++;
  else failedTests++;

  const status = passed ? '✔ PASS' : '✖ FAIL';
  const logLine = `[${status}] [${category}] ${name.padEnd(52)} | Result: ${ratioOrVal} (Req: ${requiredThreshold}) ${details}`;
  console.log(logLine);
  resultsLog.push({ category, name, ratioOrVal, requiredThreshold, passed, details });
}

function testContrast(category, name, fgInput, bgInput, minRequired = 4.5, isComposite = false, compositeBase = null) {
  let fgRgb = (typeof fgInput === 'string' && fgInput.startsWith('#')) ? hexToRgb(fgInput) : (typeof fgInput === 'string' ? parseRgba(fgInput) : fgInput);
  let bgRgb = (typeof bgInput === 'string' && bgInput.startsWith('#')) ? hexToRgb(bgInput) : (typeof bgInput === 'string' ? parseRgba(bgInput) : bgInput);

  if (isComposite && compositeBase) {
    if (fgRgb.a !== undefined && fgRgb.a < 1.0) fgRgb = compositeColor(fgRgb, compositeBase);
    if (bgRgb.a !== undefined && bgRgb.a < 1.0) bgRgb = compositeColor(bgRgb, compositeBase);
  }

  const ratio = contrastRatio(fgRgb, bgRgb);
  const pass = ratio >= minRequired;
  recordTest(category, name, `${ratio.toFixed(2)}:1`, `>= ${minRequired}:1`, pass);
}

// --------------------------------------------------------------------------
// SUITE 1: Light Mode Daylight Contrast (WCAG AA Normal Text >= 4.5:1)
// --------------------------------------------------------------------------
console.log('\n--- 1. LIGHT MODE DAYLIGHT TOKENS CONTRAST ---');
const lightSurfaces = [
  { name: 'Card (#ffffff)', hex: '#ffffff' },
  { name: 'Base (#f8fafc)', hex: '#f8fafc' },
  { name: 'Subtle (#f1f5f9)', hex: '#f1f5f9' }
];

const lightTokens = [
  { name: 'Primary Text (#0f172a)', hex: '#0f172a' },
  { name: 'Secondary Text (#334155)', hex: '#334155' },
  { name: 'Muted Text (#475569)', hex: '#475569' },
  { name: 'Primary Forest Green (#047857)', hex: '#047857' },
  { name: 'Primary Hover (#065f46)', hex: '#065f46' },
  { name: 'Secondary Electric Blue (#1d4ed8)', hex: '#1d4ed8' },
  { name: 'Secondary Hover (#1e40af)', hex: '#1e40af' },
  { name: 'Accent Amber (#b45309)', hex: '#b45309' },
  { name: 'Accent Red (#b91c1c)', hex: '#b91c1c' },
  { name: 'Accent Purple (#7e22ce)', hex: '#7e22ce' }
];

lightSurfaces.forEach(s => {
  lightTokens.forEach(t => {
    testContrast('Light Token', `${t.name} on ${s.name}`, t.hex, s.hex, 4.5);
  });
});

// --------------------------------------------------------------------------
// SUITE 2: Light Mode Status Badges & Action Buttons
// --------------------------------------------------------------------------
console.log('\n--- 2. LIGHT MODE BADGES & BUTTONS ---');
testContrast('Badge', 'Badge Green (Text #065f46 on #d1fae5)', '#065f46', '#d1fae5', 4.5);
testContrast('Badge', 'Badge Blue (Text #1d4ed8 on #dbeafe)', '#1d4ed8', '#dbeafe', 4.5);
testContrast('Badge', 'Badge Amber (Text #b45309 on #fef3c7)', '#b45309', '#fef3c7', 4.5);
testContrast('Badge', 'Badge Purple (Text #7e22ce on #f3e8ff)', '#7e22ce', '#f3e8ff', 4.5);
testContrast('Badge', 'Badge Red (Text #b91c1c on #fee2e2)', '#b91c1c', '#fee2e2', 4.5);

testContrast('Button', 'White Button Label on Primary (#047857)', '#ffffff', '#047857', 4.5);
testContrast('Button', 'White Button Label on Primary Hover (#065f46)', '#ffffff', '#065f46', 4.5);
testContrast('Button', 'White Button Label on Secondary (#1d4ed8)', '#ffffff', '#1d4ed8', 4.5);
testContrast('Button', 'White SOS Call Label on Red (#b91c1c)', '#ffffff', '#b91c1c', 4.5);
testContrast('Button', 'Popup Nav Button White on #047857', '#ffffff', '#047857', 4.5);

// --------------------------------------------------------------------------
// SUITE 3: Dark Mode Glare-Free Contrast (WCAG AA Normal Text >= 4.5:1)
// --------------------------------------------------------------------------
console.log('\n--- 3. DARK MODE NIGHT DRIVING TOKENS CONTRAST ---');
const darkSurfaces = [
  { name: 'Dark Card (#131b2e)', hex: '#131b2e' },
  { name: 'Dark Base (#0b1120)', hex: '#0b1120' },
  { name: 'Dark Subtle (#1e293b)', hex: '#1e293b' }
];

const darkTokens = [
  { name: 'Dark Primary Text (#f8fafc)', hex: '#f8fafc' },
  { name: 'Dark Secondary Text (#cbd5e1)', hex: '#cbd5e1' },
  { name: 'Dark Muted Text (#94a3b8)', hex: '#94a3b8' },
  { name: 'Dark Primary Emerald (#34d399)', hex: '#34d399' },
  { name: 'Dark Primary Hover (#6ee7b7)', hex: '#6ee7b7' },
  { name: 'Dark Secondary Sky Blue (#60a5fa)', hex: '#60a5fa' },
  { name: 'Dark Secondary Hover (#93c5fd)', hex: '#93c5fd' },
  { name: 'Dark Accent Amber (#fbbf24)', hex: '#fbbf24' },
  { name: 'Dark Accent Red (#f87171)', hex: '#f87171' },
  { name: 'Dark Accent Purple (#c084fc)', hex: '#c084fc' }
];

darkSurfaces.forEach(s => {
  darkTokens.forEach(t => {
    testContrast('Dark Token', `${t.name} on ${s.name}`, t.hex, s.hex, 4.5);
  });
});

// --------------------------------------------------------------------------
// SUITE 4: Dark Mode Alpha-Composited Badges
// --------------------------------------------------------------------------
console.log('\n--- 4. DARK MODE ALPHA-COMPOSITED BADGES ---');
const darkBadges = [
  { name: 'Dark Badge Green (#6ee7b7 on rgba(52,211,153,0.16))', textHex: '#6ee7b7', bgRgba: 'rgba(52, 211, 153, 0.16)' },
  { name: 'Dark Badge Blue (#93c5fd on rgba(96,165,250,0.16))', textHex: '#93c5fd', bgRgba: 'rgba(96, 165, 250, 0.16)' },
  { name: 'Dark Badge Amber (#fcd34d on rgba(251,191,36,0.16))', textHex: '#fcd34d', bgRgba: 'rgba(251, 191, 36, 0.16)' },
  { name: 'Dark Badge Purple (#d8b4fe on rgba(192,132,252,0.16))', textHex: '#d8b4fe', bgRgba: 'rgba(192, 132, 252, 0.16)' },
  { name: 'Dark Badge Red (#fca5a5 on rgba(248,113,113,0.16))', textHex: '#fca5a5', bgRgba: 'rgba(248, 113, 113, 0.16)' }
];

darkBadges.forEach(b => {
  const compBg = compositeColor(parseRgba(b.bgRgba), '#131b2e');
  testContrast('Dark Badge', b.name, b.textHex, compBg, 4.5);
});

// --------------------------------------------------------------------------
// SUITE 5: Map Custom Marker Pins (WCAG 2.1 Non-Text Graphical UI >= 3.0:1)
// --------------------------------------------------------------------------
console.log('\n--- 5. MAP PINS & GRAPHICAL CONTRAST (WCAG Non-Text UI >= 3.0:1) ---');
const mapPinGradients = [
  { name: 'Pin Charger (#047857 -> #065f46)', start: '#047857', end: '#065f46' },
  { name: 'Pin Camp (#b45309 -> #92400e)', start: '#b45309', end: '#92400e' },
  { name: 'Pin Food (#b91c1c -> #991b1b)', start: '#b91c1c', end: '#991b1b' },
  { name: 'Pin Cafe (#7e22ce -> #6b21a8)', start: '#7e22ce', end: '#6b21a8' },
  { name: 'Pin POI (#1d4ed8 -> #1e40af)', start: '#1d4ed8', end: '#1e40af' },
  { name: 'Pin Home (#0284c7 -> #0369a1)', start: '#0284c7', end: '#0369a1' }
];

mapPinGradients.forEach(pin => {
  testContrast('Map Pin', `White Icon on ${pin.name} Start`, '#ffffff', pin.start, 3.0);
  testContrast('Map Pin', `White Icon on ${pin.name} End`, '#ffffff', pin.end, 3.0);
});

// --------------------------------------------------------------------------
// SUITE 6: Touch Target Bounds & Ergonomic Dimension Assertions
// --------------------------------------------------------------------------
console.log('\n--- 6. TOUCH TARGET BOUNDS (>= 44x44px or >= 48px) ---');
const cssPath = path.join(__dirname, '..', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const ruleBlocks = parseCssDeclarations(cssContent);

const touchTargets = [
  { selector: '.theme-toggle-btn', minW: 44, minH: 44 },
  { selector: '.header-action-btn', minW: 44, minH: 44 },
  { selector: '.nav-btn', minW: 44, minH: 44 },
  { selector: '.filter-chip', minW: 48, minH: 44 },
  { selector: '.custom-map-pin', minW: 44, minH: 44 },
  { selector: '.pin-super-highlight', minW: 48, minH: 48 },
  { selector: '.leaflet-control-zoom-in', minW: 44, minH: 44 },
  { selector: '.leaflet-control-zoom-out', minW: 44, minH: 44 },
  { selector: '.leaflet-popup-close-button', minW: 44, minH: 44 },
  { selector: '.popup-nav-btn', minH: 44 },
  { selector: '.btn-nav-full', minH: 48 },
  { selector: '.custom-range', minH: 48 },
  { selector: '.drawer-close-btn', minW: 44, minH: 44 },
  { selector: '.emergency-contact-card', minH: 52 },
  { selector: '.mobile-nav-item', minW: 48, minH: 48 }
];

touchTargets.forEach(target => {
  const props = getBaseProperties(ruleBlocks, target.selector);
  const hVal = props['min-height'] || props['height'] || '0px';
  const wVal = props['min-width'] || props['width'] || '0px';
  const hNum = parseInt(hVal, 10);
  const wNum = parseInt(wVal, 10);

  let passH = true;
  let passW = true;

  if (target.minH) {
    passH = (hNum >= target.minH);
  }
  if (target.minW) {
    passW = (wNum >= target.minW);
  }

  const pass = passH && passW;
  const dimensionStr = `Width: ${wVal} (req >= ${target.minW || 'any'}px), Height: ${hVal} (req >= ${target.minH || 'any'}px)`;
  recordTest('Touch Target', `Element ${target.selector}`, `${wNum || '-'}x${hNum || '-'}px`, `>= ${target.minW || '-'}x${target.minH || '-'}px`, pass, `[${dimensionStr}]`);
});

// --------------------------------------------------------------------------
// SUITE 7: Viewport Accessibility & Responsive Ergonomics
// --------------------------------------------------------------------------
console.log('\n--- 7. VIEWPORT & SAFE AREA ERGONOMICS ---');
const htmlPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Viewport must not restrict user scaling (WCAG 1.4.4)
const viewportHasNoScaleRestriction = !htmlContent.includes('user-scalable=no') && !htmlContent.includes('maximum-scale=1.0');
recordTest('Viewport', 'Viewport allows user pinch-to-zoom (WCAG 1.4.4)', viewportHasNoScaleRestriction ? 'Unrestricted' : 'Restricted', 'Unrestricted', viewportHasNoScaleRestriction);

// Body has bottom padding for mobile navbar clearance (Base style)
const bodyBasePaddingBottom = getBaseProperties(ruleBlocks, 'body')['padding-bottom'];
const hasMobileClearance = bodyBasePaddingBottom && bodyBasePaddingBottom.includes('var(--mobile-nav-height)');
recordTest('Safe Area', 'Body padding-bottom prevents mobile navbar overlap', bodyBasePaddingBottom || 'None', 'var(--mobile-nav-height) + safe-inset', Boolean(hasMobileClearance));

// Sliders touch-action is pan-x
const sliderTouchAction = getBaseProperties(ruleBlocks, '.custom-range')['touch-action'];
recordTest('Touch Action', 'Range slider touch-action set to pan-x', sliderTouchAction || 'None', 'pan-x', sliderTouchAction === 'pan-x');

// --------------------------------------------------------------------------
// Final Summary & Verdict Output
// --------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`  FINAL VERDICT SUMMARY: ${passedTests}/${totalTests} Tests Passed (${failedTests} Failed)`);
console.log('======================================================================\n');

if (failedTests > 0) {
  console.error(`  ✖ VERDICT: REQUEST_CHANGES — ${failedTests} empirical tests failed.`);
  process.exit(1);
} else {
  console.log(`  ✔ VERDICT: APPROVE — 100% of WCAG AA contrast & touch target tests passed.`);
  process.exit(0);
}
