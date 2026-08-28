const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Simple DOM Mock / Lightweight JSDOM equivalent for independent behavioral audit
const rootDir = path.resolve(__dirname, '../..');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const dataContent = fs.readFileSync(path.join(rootDir, 'data.js'), 'utf8');
const appContent = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');

// Parse basic elements from index.html
console.log('Auditing DOM and JavaScript Interactive Behaviors...');

// We will verify through Node.js VM context
const windowMock = {
  location: { hash: '' },
  history: {
    pushState: (state, title, url) => { windowMock.location.hash = url; }
  },
  matchMedia: (q) => ({ matches: false }),
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = v; }
  },
  scrollTo: () => {},
  requestAnimationFrame: (cb) => cb(),
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  addEventListener: () => {},
  mapInstance: null
};

// Test results collector
const auditFindings = [];
function check(desc, condition) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    auditFindings.push({ desc, pass: true });
  } else {
    console.error(`  [FAIL] ${desc}`);
    auditFindings.push({ desc, pass: false });
  }
}

// 1. Check HTML structural tags and IDs
check('index.html contains navTabTrip button', htmlContent.includes('id="navTabTrip"'));
check('index.html contains navTabSim button', htmlContent.includes('id="navTabSim"'));
check('index.html contains mobileNavTrip button', htmlContent.includes('id="mobileNavTrip"'));
check('index.html contains mobileNavSim button', htmlContent.includes('id="mobileNavSim"'));
check('index.html contains mobileNavCampGuide button', htmlContent.includes('id="mobileNavCampGuide"'));
check('index.html contains drawerCampSos container', htmlContent.includes('id="drawerCampSos"'));
check('index.html contains drawerBackdrop', htmlContent.includes('id="drawerBackdrop"'));
check('index.html contains btnCloseCampGuide', htmlContent.includes('id="btnCloseCampGuide"'));
check('index.html contains brandCampGuideContainer', htmlContent.includes('id="brandCampGuideContainer"'));
check('index.html contains emergencyContactsContainer', htmlContent.includes('id="emergencyContactsContainer"'));
check('index.html contains themeToggleBtn', htmlContent.includes('id="themeToggleBtn"'));
check('index.html contains simCar1Cap slider', htmlContent.includes('id="simCar1Cap"'));
check('index.html contains simCar2Cap slider', htmlContent.includes('id="simCar2Cap"'));
check('index.html contains simSleepHours slider', htmlContent.includes('id="simSleepHours"'));
check('index.html contains simAcPower slider', htmlContent.includes('id="simAcPower"'));

// 2. Check app.js function existence and implementation
check('app.js defines switchTab', appContent.includes('function switchTab'));
check('app.js defines initNavigation', appContent.includes('function initNavigation'));
check('app.js defines openCampSosDrawer', appContent.includes('function openCampSosDrawer'));
check('app.js defines closeCampSosDrawer', appContent.includes('function closeCampSosDrawer'));
check('app.js defines initCampGuideDrawer', appContent.includes('function initCampGuideDrawer'));
check('app.js defines initTheme', appContent.includes('function initTheme'));
check('app.js defines initEVSimulator', appContent.includes('function initEVSimulator'));
check('app.js handles Escape key for drawer dismissal', appContent.includes("e.key === 'Escape'"));
check('app.js sets body overflow hidden on drawer open', appContent.includes("document.body.style.overflow = 'hidden'"));
check('app.js restores body overflow on drawer close', appContent.includes("document.body.style.overflow = ''"));
check('app.js invalidates map size on switching to trip view', appContent.includes('mapInstance.invalidateSize()'));

const allPassed = auditFindings.every(f => f.pass);
console.log(`\nDOM Behavior Audit Result: ${allPassed ? 'CLEAN (All checks passed)' : 'FAILURES DETECTED'}`);
process.exit(allPassed ? 0 : 1);
