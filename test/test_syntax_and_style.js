/**
 * test_syntax_and_style.js
 * Automated test suite for JS syntax verification (node --check) and CSS syntax integrity.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { TestSuite, assert, assertEqual, assertMatch } = require('./test_helpers');

const suite = new TestSuite('Syntax & Style Validation');

const rootDir = path.resolve(__dirname, '..');
const appJsPath = path.join(rootDir, 'app.js');
const dataJsPath = path.join(rootDir, 'data.js');
const cssPath = path.join(rootDir, 'style.css');

// ============================================================================
// TIER 1: FEATURE COVERAGE (JS Syntax & CSS Braces)
// ============================================================================

// F9.1: JS Syntax check via node --check on app.js
suite.test('Tier 1: Syntax - app.js passes node --check with exit code 0', 1, () => {
  const result = execSync(`node --check "${appJsPath}"`, { stdio: 'pipe' });
  assertEqual(result.toString(), '', 'node --check on app.js should produce no error output');
});

// F9.2: JS Syntax check via node --check on data.js
suite.test('Tier 1: Syntax - data.js passes node --check with exit code 0', 1, () => {
  const result = execSync(`node --check "${dataJsPath}"`, { stdio: 'pipe' });
  assertEqual(result.toString(), '', 'node --check on data.js should produce no error output');
});

// F9.3: VM Script Compilation for app.js
suite.test('Tier 1: Syntax - app.js compiles successfully in Node.js VM', 1, () => {
  const code = fs.readFileSync(appJsPath, 'utf8');
  assert(() => new vm.Script(code), 'app.js must compile into a valid vm.Script');
});

// F9.4: VM Script Compilation for data.js
suite.test('Tier 1: Syntax - data.js compiles successfully in Node.js VM', 1, () => {
  const code = fs.readFileSync(dataJsPath, 'utf8');
  assert(() => new vm.Script(code), 'data.js must compile into a valid vm.Script');
});

// F9.5: CSS Balanced Braces
suite.test('Tier 1: CSS - style.css has balanced curly braces and clean rule blocks', 1, () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  let openBraces = 0;
  let closeBraces = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') openBraces++;
    if (css[i] === '}') closeBraces++;
  }
  assertEqual(openBraces, closeBraces, `Unbalanced CSS braces: ${openBraces} open vs ${closeBraces} close`);
  assert(openBraces > 20, `Expected at least 20 CSS rule blocks, got ${openBraces}`);
});

// ============================================================================
// TIER 2: BOUNDARY & EDGE CASES (CSS Formatting, Semicolons, Variables)
// ============================================================================

// T2.1: CSS Custom Property Usage
suite.test('Tier 2: Boundary - CSS custom properties follow valid var(--...) syntax', 2, () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  const varUsages = css.match(/var\(--[a-zA-Z0-9_-]+\)/g) || [];
  assert(varUsages.length >= 10, `Expected at least 10 CSS variable usages, got ${varUsages.length}`);
  varUsages.forEach(v => {
    assertMatch(v, /^var\(--[a-zA-Z0-9_-]+\)$/, `Invalid CSS var syntax: ${v}`);
  });
});

// T2.2: CSS Keyframes validity
suite.test('Tier 2: Boundary - CSS @keyframes animations are properly structured', 2, () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  const keyframes = css.match(/@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g) || [];
  assert(keyframes.length >= 1, 'CSS should define animations (e.g. fadeIn, pulsePin)');
});

// T2.3: No unclosed strings or comments in JS files
suite.test('Tier 2: Boundary - JS files do not contain unclosed multi-line comments', 2, () => {
  [appJsPath, dataJsPath].forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const commentOpens = (content.match(/\/\*/g) || []).length;
    const commentCloses = (content.match(/\*\//g) || []).length;
    assertEqual(commentOpens, commentCloses, `Unclosed multi-line comment in ${path.basename(filePath)}`);
  });
});

// T2.4: UTF-8 Encoding validation (No corrupt multibyte characters)
suite.test('Tier 2: Boundary - Thai characters in data.js and index.html are valid UTF-8', 2, () => {
  const dataContent = fs.readFileSync(dataJsPath, 'utf8');
  assert(dataContent.includes('บ้านไร่'), 'data.js contains valid Thai text');
  assert(dataContent.includes('ด่านช้าง'), 'data.js contains valid Thai text');
  assert(!dataContent.includes('\uFFFD'), 'data.js must not contain Unicode replacement character \\uFFFD');

  const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert(!htmlContent.includes('\uFFFD'), 'index.html must not contain Unicode replacement character \\uFFFD');
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL TESTING (HTML & CSS Selector Pairing)
// ============================================================================

suite.test('Tier 3: Pairwise - Key structural CSS classes correspond to HTML elements or JS templates', 3, () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  const combinedSource = html + appJs;

  const essentialClasses = [
    'header-wrapper',
    'nav-desktop',
    'mobile-nav-bar',
    'hero-card',
    'tab-content',
    'map-layout',
    'map-sidebar',
    'filter-chip',
    'place-card',
    'badge',
    'sim-panel',
    'custom-range'
  ];

  essentialClasses.forEach(cls => {
    assert(css.includes(`.${cls}`), `CSS must define style for .${cls}`);
    assert(combinedSource.includes(cls), `Source markup/scripts must use class .${cls}`);
  });
});

// ============================================================================
// TIER 4: REAL-WORLD CI/CD VALIDATION SCENARIOS
// ============================================================================

suite.test('Tier 4: Scenario 1 - Comprehensive repository lint and syntax health check', 4, () => {
  // Check test files also compile cleanly
  const testFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));
  assert(testFiles.length >= 4, `Expected at least 4 test files, found ${testFiles.length}`);

  testFiles.forEach(tf => {
    const fullPath = path.join(__dirname, tf);
    const checkRes = execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
    assertEqual(checkRes.toString(), '', `Test file ${tf} failed syntax check`);
  });
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
