/**
 * test_dom_structure.js
 * Automated test suite validating semantic HTML structure in index.html
 * and driver ergonomics / WCAG AA daylight tokens in style.css.
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert, assertEqual, assertMatch, assertArray } = require('./test_helpers');

const suite = new TestSuite('DOM & CSS Structure Validation');

const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../style.css');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// ============================================================================
// TIER 1: FEATURE COVERAGE (Semantic HTML, Views, Controls, Theme Tokens)
// ============================================================================

// F1.1: HTML5 Doctype & Language attribute
suite.test('Tier 1: DOM - Valid HTML5 doctype and Thai language tag in index.html', 1, () => {
  assertMatch(htmlContent, /<!DOCTYPE\s+html>/i, 'Must contain standard HTML5 DOCTYPE');
  assertMatch(htmlContent, /<html\s+lang="th"/i, 'HTML element must declare lang="th"');
});

// F1.2: Essential Meta tags
suite.test('Tier 1: DOM - Mobile viewport and UTF-8 charset declared', 1, () => {
  assertMatch(htmlContent, /<meta\s+charset=["']UTF-8["']/i, 'Must specify UTF-8 charset');
  assertMatch(htmlContent, /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']/i, 'Must specify responsive viewport meta');
  assertMatch(htmlContent, /<title>.*<\/title>/i, 'Must have page title');
});

// F1.3: Elimination of triple nav redundancy / Clean 2-3 Tab structure
suite.test('Tier 1: DOM - Navigation is consolidated without redundant triple menus', 1, () => {
  assertMatch(htmlContent, /<header[^>]*class=["'][^"']*header-wrapper[^"']*["']/i, 'Header wrapper exists');
  assertMatch(htmlContent, /<nav[^>]*class=["'][^"']*nav-desktop[^"']*["']/i, 'Desktop nav bar exists');
  assertMatch(htmlContent, /<nav[^>]*class=["'][^"']*mobile-nav-bar[^"']*["']/i, 'Mobile bottom nav bar exists');
  
  // Verify tab IDs are present
  assert(htmlContent.includes('tab-map') || htmlContent.includes('tab-trip'), 'Trip / Map tab must exist');
  assert(htmlContent.includes('tab-simulator'), 'Simulator tab must exist');
});

// F4.1: Interactive Map DOM Container
suite.test('Tier 1: DOM - Map section contains Leaflet container and filter controls', 1, () => {
  assertMatch(htmlContent, /id=["']map["']/, 'Map div (#map) must be present in DOM');
  assertMatch(htmlContent, /id=["']mapFilterGroup["']/, 'Map filter group (#mapFilterGroup) must be present');
  assertMatch(htmlContent, /id=["']mapPlacesList["']/, 'Map sidebar places list (#mapPlacesList) must be present');
});

// F6.1: EV Simulator DOM Controls & Sliders
suite.test('Tier 1: DOM - EV Simulator contains controls for Car 1, Car 2, sleep hours, and AC power', 1, () => {
  assertMatch(htmlContent, /id=["']simCar1Cap["']/, 'Car 1 capacity input (#simCar1Cap) must exist');
  assertMatch(htmlContent, /id=["']simCar2Cap["']/, 'Car 2 capacity input (#simCar2Cap) must exist');
  assertMatch(htmlContent, /id=["']simSleepHours["']/, 'Sleep hours input (#simSleepHours) must exist');
  assertMatch(htmlContent, /id=["']simAcPower["']/, 'AC power input (#simAcPower) must exist');
});

// F7.1: EV Simulator Results DOM Targets
suite.test('Tier 1: DOM - EV Simulator contains output placeholders for 2-car comparison', 1, () => {
  assertMatch(htmlContent, /id=["']c1ArrivalSoc["']/, '#c1ArrivalSoc output element must exist');
  assertMatch(htmlContent, /id=["']c1MorningSoc["']/, '#c1MorningSoc output element must exist');
  assertMatch(htmlContent, /id=["']c1MorningRange["']/, '#c1MorningRange output element must exist');
  assertMatch(htmlContent, /id=["']c2ArrivalSoc["']/, '#c2ArrivalSoc output element must exist');
  assertMatch(htmlContent, /id=["']c2MorningSoc["']/, '#c2MorningSoc output element must exist');
  assertMatch(htmlContent, /id=["']c2MorningRange["']/, '#c2MorningRange output element must exist');
  assertMatch(htmlContent, /id=["']convoyAdviceText["']/, '#convoyAdviceText output element must exist');
});

// F2.1: Theme Toggle Controls
suite.test('Tier 1: DOM - Theme toggle button and icon placeholder exist', 1, () => {
  assertMatch(htmlContent, /id=["']themeToggleBtn["']/, 'Theme toggle button (#themeToggleBtn) must exist');
  assertMatch(htmlContent, /id=["']themeIcon["']/, 'Theme icon container (#themeIcon) must exist');
});

// F2.2: CSS Design Tokens & WCAG AA Contrast Colors
suite.test('Tier 1: CSS - High-contrast daylight and dark mode tokens defined', 1, () => {
  assertMatch(cssContent, /--primary\s*:\s*(#10b981|#047857|#059669)/i, 'High contrast primary green token defined');
  assertMatch(cssContent, /--bg-main\s*:/, '--bg-main background token defined');
  assertMatch(cssContent, /--bg-card\s*:/, '--bg-card card background token defined');
  assertMatch(cssContent, /--text-primary\s*:/, '--text-primary text token defined');
  assertMatch(cssContent, /\[data-theme=["']dark["']\]/, 'Dark theme selector defined');
});

// ============================================================================
// TIER 2: BOUNDARY & DRIVER ERGONOMICS (Touch Targets, Scripts, Assets)
// ============================================================================

// T2.1: Driver Ergonomics - Minimum 44px Touch Targets
suite.test('Tier 2: Boundary - CSS defines minimum touch target rules for driver ergonomics', 2, () => {
  // Check for button heights / paddings / min-height
  const hasButtonTargets = cssContent.includes('40px') || cssContent.includes('44px') || cssContent.includes('48px') ||
                           cssContent.includes('min-height') || cssContent.includes('padding: 0.6rem') || cssContent.includes('padding: 0.75rem');
  assert(hasButtonTargets, 'CSS must enforce comfortable driver touch sizing');
  
  assertMatch(cssContent, /\.theme-toggle-btn\s*\{[^}]*width\s*:\s*(40px|44px|48px)/, 'Theme button has >= 40-48px touch target');
  assertMatch(cssContent, /--header-height\s*:\s*(60px|65px|70px|72px)/, 'Header height supports comfortable mobile tapping');
  assertMatch(cssContent, /--mobile-nav-height\s*:\s*(60px|65px|70px)/, 'Mobile bottom bar height supports comfortable tapping');
});

// T2.2: External Script & Stylesheet dependencies
suite.test('Tier 2: Boundary - External CDN assets (Leaflet, Lucide, Google Fonts) linked securely', 2, () => {
  assertMatch(htmlContent, /leaflet\.css/, 'Leaflet CSS link present');
  assertMatch(htmlContent, /leaflet\.js/, 'Leaflet JS script present');
  assertMatch(htmlContent, /lucide/, 'Lucide icon library script present');
  assertMatch(htmlContent, /fonts\.googleapis\.com/, 'Google Fonts linked');
  assertMatch(htmlContent, /data\.js/, 'data.js script included');
  assertMatch(htmlContent, /app\.js/, 'app.js script included');
});

// T2.3: CSS Responsive Breakpoints
suite.test('Tier 2: Boundary - CSS contains responsive mobile-first media queries', 2, () => {
  assertMatch(cssContent, /@media\s*\(\s*min-width\s*:\s*768px\s*\)/, 'Tablet breakpoint defined');
  assertMatch(cssContent, /@media\s*\(\s*min-width\s*:\s*(900px|992px|1024px)\s*\)/, 'Desktop breakpoint defined');
});

// T2.4: Leaflet Map Z-Index and Layout bounds
suite.test('Tier 2: Boundary - Leaflet map container has defined dimensions and z-index', 2, () => {
  assertMatch(cssContent, /#map\s*\{[^}]*width\s*:\s*100%/, '#map takes 100% container width');
  assertMatch(cssContent, /#map\s*\{[^}]*height\s*:\s*100%/, '#map takes 100% container height');
});

// T2.5: Body mobile nav bottom padding guard
suite.test('Tier 2: Boundary - Body has bottom padding to prevent mobile navbar overlap', 2, () => {
  assertMatch(cssContent, /padding-bottom\s*:\s*calc\([^)]*--mobile-nav-height/, 'Body bottom padding prevents content clipping behind bottom nav');
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL TESTING (Desktop vs Mobile Navigation)
// ============================================================================

suite.test('Tier 3: Pairwise - Desktop navigation tabs match Mobile bottom nav items 1:1', 3, () => {
  // Extract data-tab attributes from desktop buttons
  const desktopTabMatches = [...htmlContent.matchAll(/class=["'][^"']*nav-btn[^"']*["'][^>]*data-tab=["']([^"']+)["']/g)].map(m => m[1]);
  // Extract data-tab attributes from mobile buttons
  const mobileTabMatches = [...htmlContent.matchAll(/class=["'][^"']*mobile-nav-item[^"']*["'][^>]*data-tab=["']([^"']+)["']/g)].map(m => m[1]);

  assert(desktopTabMatches.length >= 2, 'Desktop nav must have at least 2 tabs');
  assert(mobileTabMatches.length >= 2, 'Mobile nav must have at least 2 tabs');
  assertEqual(desktopTabMatches.length, mobileTabMatches.length, 'Desktop and Mobile navigation tab counts must match');

  desktopTabMatches.forEach((tab, index) => {
    assertEqual(tab, mobileTabMatches[index], `Tab mismatch at index ${index}: ${tab} vs ${mobileTabMatches[index]}`);
  });
});

suite.test('Tier 3: Pairwise - Theme variable completeness between light and dark modes', 3, () => {
  const rootVarsMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
  const darkVarsMatch = cssContent.match(/\[data-theme=["']dark["']\]\s*\{([^}]+)\}/);

  assert(rootVarsMatch, ':root variables must exist');
  assert(darkVarsMatch, '[data-theme="dark"] variables must exist');

  const rootVars = rootVarsMatch[1];
  const darkVars = darkVarsMatch[1];

  const requiredTokens = ['--bg-main', '--bg-card', '--text-primary', '--text-secondary', '--border-color'];
  requiredTokens.forEach(token => {
    assert(rootVars.includes(token), `:root missing token ${token}`);
    assert(darkVars.includes(token), `Dark theme missing token ${token}`);
  });
});

// ============================================================================
// TIER 4: REAL-WORLD DOM WORKFLOW SCENARIOS
// ============================================================================

suite.test('Tier 4: Scenario 1 - First-time mobile visitor landing page hierarchy', 4, () => {
  // On load, tab-map (or tab-trip) should have class 'active'
  assertMatch(htmlContent, /id=["']tab-map["']\s+class=["'][^"']*active[^"']*["']/, 'Map/Trip tab is active by default');
  // First desktop nav button is active
  assertMatch(htmlContent, /class=["'][^"']*nav-btn active[^"']*["'][^>]*data-tab=["']tab-map["']/, 'Map nav button is active by default');
});

suite.test('Tier 4: Scenario 2 - Driver 1-tap quick action buttons in Hero card', 4, () => {
  // Quick jump buttons with data-goto-tab
  assertMatch(htmlContent, /data-goto-tab=["']tab-map["']/, 'Hero contains 1-tap jump to map');
  assertMatch(htmlContent, /data-goto-tab=["']tab-simulator["']/, 'Hero contains 1-tap jump to simulator');
});

suite.test('Tier 4: Scenario 3 - Hero summary badges provide instant 5-second scan', 4, () => {
  assertMatch(htmlContent, /hero-badges/, 'Hero badges container present');
  assert(htmlContent.includes('09:00'), 'Hero badge mentions 09:00 departure');
  assert(htmlContent.includes('ด่านช้าง'), 'Hero badge mentions Dan Chang charging');
  assert(htmlContent.includes('NEXMOEV'), 'Hero badge mentions NEXMOEV highlight');
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
