/**
 * verify_dom_phase_bounds.js
 * Empirical measurement of DOM element styling and touch targets.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const cssContent = fs.readFileSync(path.resolve(__dirname, '../../style.css'), 'utf8');

const dom = new JSDOM(htmlContent, {
  runScripts: 'outside-only',
  resources: 'usable'
});

const { window } = dom;
const { document } = window;

// Inject CSS into JSDOM head
const styleEl = document.createElement('style');
styleEl.textContent = cssContent;
document.head.appendChild(styleEl);

console.log('===========================================================');
console.log('  M2 EMPIRICAL CHALLENGER: DOM TOUCH TARGET MEASUREMENTS');
console.log('===========================================================\n');

// 1. Check .btn-driver-nav
console.log('--- 1. .btn-driver-nav CTA Buttons ---');
// Mock a stop card in DOM with .btn-driver-nav
const mockCard = document.createElement('div');
mockCard.className = 'stop-card';
mockCard.innerHTML = `<a class="btn-driver-nav" href="#"><span>นำทางด้วย Google Maps</span></a>`;
document.body.appendChild(mockCard);

const navBtn = document.querySelector('.btn-driver-nav');
const navBtnStyle = window.getComputedStyle(navBtn);
console.log(`  .btn-driver-nav minHeight: ${navBtnStyle.minHeight}`);
console.log(`  .btn-driver-nav display: ${navBtnStyle.display}`);
console.log(`  .btn-driver-nav touchAction: ${navBtnStyle.touchAction}`);

// 2. Check .custom-map-pin
console.log('\n--- 2. .custom-map-pin Pin Elements ---');
const mockPin = document.createElement('div');
mockPin.className = 'custom-map-pin pin-charger';
document.body.appendChild(mockPin);

const pinStyle = window.getComputedStyle(mockPin);
console.log(`  .custom-map-pin width: ${pinStyle.width}, height: ${pinStyle.height}`);
console.log(`  .custom-map-pin minWidth: ${pinStyle.minWidth}, minHeight: ${pinStyle.minHeight}`);

// 3. Check #phaseFilterGroup .phase-btn
console.log('\n--- 3. #phaseFilterGroup .phase-btn Elements ---');
const phaseBtns = document.querySelectorAll('#phaseFilterGroup .phase-btn');
console.log(`  Found ${phaseBtns.length} phase buttons in #phaseFilterGroup`);

phaseBtns.forEach((btn, idx) => {
  const btnStyle = window.getComputedStyle(btn);
  console.log(`  Phase button ${idx} (${btn.getAttribute('data-phase')}):`);
  console.log(`    minHeight: ${btnStyle.minHeight}`);
  console.log(`    minWidth: ${btnStyle.minWidth}`);
  console.log(`    background: ${btnStyle.background || btnStyle.backgroundColor}`);
  console.log(`    padding: ${btnStyle.padding}`);
  console.log(`    touchAction: ${btnStyle.touchAction}`);
});

console.log('\n===========================================================');
