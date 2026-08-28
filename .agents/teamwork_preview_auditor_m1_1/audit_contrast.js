function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return [ (num >> 16) & 255, (num >> 8) & 255, num & 255 ];
}

function contrast(hex1, hex2) {
  const l1 = luminance(...hexToRgb(hex1));
  const l2 = luminance(...hexToRgb(hex2));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const tests = [
  ['Primary Green (#047857) on White (#ffffff)', contrast('#047857', '#ffffff')],
  ['Primary Hover (#065f46) on White (#ffffff)', contrast('#065f46', '#ffffff')],
  ['Secondary Blue (#1d4ed8) on White (#ffffff)', contrast('#1d4ed8', '#ffffff')],
  ['Accent Amber (#b45309) on White (#ffffff)', contrast('#b45309', '#ffffff')],
  ['Accent Red (#b91c1c) on White (#ffffff)', contrast('#b91c1c', '#ffffff')],
  ['Accent Purple (#7e22ce) on White (#ffffff)', contrast('#7e22ce', '#ffffff')],
  ['Text Primary (#0f172a) on White (#ffffff)', contrast('#0f172a', '#ffffff')],
  ['Text Secondary (#334155) on White (#ffffff)', contrast('#334155', '#ffffff')],
  ['Text Muted (#475569) on White (#ffffff)', contrast('#475569', '#ffffff')],
  ['Badge Green (#065f46 on #d1fae5)', contrast('#065f46', '#d1fae5')],
  ['Badge Amber (#b45309 on #fef3c7)', contrast('#b45309', '#fef3c7')],
  ['Badge Blue (#1d4ed8 on #dbeafe)', contrast('#1d4ed8', '#dbeafe')],
  ['Badge Red (#b91c1c on #fee2e2)', contrast('#b91c1c', '#fee2e2')],
  ['Badge Purple (#7e22ce on #f3e8ff)', contrast('#7e22ce', '#f3e8ff')],
  ['Dark Primary (#34d399) on Dark Card (#131b2e)', contrast('#34d399', '#131b2e')],
  ['Dark Text Primary (#f8fafc) on Dark Card (#131b2e)', contrast('#f8fafc', '#131b2e')],
  ['Dark Text Secondary (#cbd5e1) on Dark Card (#131b2e)', contrast('#cbd5e1', '#131b2e')],
  ['Dark Text Muted (#94a3b8) on Dark Card (#131b2e)', contrast('#94a3b8', '#131b2e')],
  ['Dark Amber (#fbbf24) on Dark Card (#131b2e)', contrast('#fbbf24', '#131b2e')],
  ['Dark Red (#f87171) on Dark Card (#131b2e)', contrast('#f87171', '#131b2e')],
];

console.log('=== WCAG Contrast Results (Target: >= 4.5:1 for AA) ===');
let allPass = true;
tests.forEach(([label, ratio]) => {
  const ok = ratio >= 4.5;
  if (!ok) allPass = false;
  console.log(`${ok ? 'PASS' : 'FAIL'} [${ratio.toFixed(2)}:1] - ${label}`);
});
console.log('Overall contrast compliance:', allPass ? 'ALL PASS (WCAG AA)' : 'FAILED');
