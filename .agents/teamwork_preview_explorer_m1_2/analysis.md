# High-Contrast Daylight & Glare-Free Dark Mode Design Token Specification
**Milestone 1 — UI Foundation & Driver Ergonomics**
**Author**: M1 Explorer 2 (High-Contrast Daylight Theme)
**Target File**: `d:\Project\CampingTrip\style.css`

---

## 1. Executive Summary

Road trip drivers navigating in daylight face severe screen glare, bright ambient sunlight, and polarized sunglasses, while night drivers need low-glare, high-legibility interfaces. The existing `style.css` tokens fail WCAG AA 4.5:1 contrast in critical areas:
- Light mode primary `#10b981` on `#ffffff` is **2.54:1** (severely washed out).
- Light mode muted text `#94a3b8` on `#ffffff` is **2.56:1** (nearly invisible).
- Light mode status badges (Amber `#f59e0b` on `#fef0da` at **1.91:1**, Green `#10b981` on `#dbf5ec` at **2.21:1**) fail drastically.
- Dark mode muted text `#64748b` on `#131b2e` is **3.61:1** (below 4.5:1).
- Card borders (`#e2e8f0` in light mode, `#1e293b` in dark mode) lack visual definition.

This specification provides mathematically verified CSS design tokens and component rules where **100% of text and background pairs exceed WCAG AA 4.5:1 (with most exceeding 7.0:1 WCAG AAA)**, accompanied by driver-first `>= 44x44px` touch ergonomics.

---

## 2. WCAG Contrast Mathematical Verification Matrix

Relative luminance and contrast ratios were calculated using the standard WCAG 2.1 formula:
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

### 2.1 Light Mode (Sunlight Driving Readability)

| Token / Element | Foreground | Background | Previous Ratio | New Ratio | WCAG AA Status |
|---|---|---|---|---|---|
| `--text-primary` | `#0f172a` (Slate 900) | `#ffffff` (Card) | 17.85:1 | **17.85:1** | ✅ PASS (AAA) |
| `--text-secondary` | `#334155` (Slate 700) | `#ffffff` (Card) | 7.58:1 (`#475569`) | **10.35:1** | ✅ PASS (AAA) |
| `--text-muted` | `#475569` (Slate 600) | `#ffffff` (Card) | 2.56:1 (`#94a3b8` ❌) | **7.58:1** | ✅ PASS (AAA) |
| `--text-muted` (on subtle) | `#475569` (Slate 600) | `#f1f5f9` (Subtle) | 2.36:1 ❌ | **6.92:1** | ✅ PASS (AA/AAA) |
| `--primary` (Text/Links) | `#047857` (Forest Green 700) | `#ffffff` (Card) | 2.54:1 (`#10b981` ❌) | **5.48:1** | ✅ PASS (AA) |
| `--primary-hover` / Accent | `#065f46` (Forest Green 800) | `#ffffff` (Card) | 3.52:1 ❌ | **7.68:1** | ✅ PASS (AAA) |
| `--secondary` (Electric Blue) | `#1d4ed8` (Blue 700) | `#ffffff` (Card) | 3.53:1 (`#3b82f6` ❌) | **6.70:1** | ✅ PASS (AAA) |
| `--accent-amber` | `#b45309` (Amber 700) | `#ffffff` (Card) | 2.12:1 (`#f59e0b` ❌) | **5.02:1** | ✅ PASS (AA) |
| `--accent-red` | `#b91c1c` (Red 700) | `#ffffff` (Card) | 3.65:1 (`#ef4444` ❌) | **6.47:1** | ✅ PASS (AAA) |
| `--accent-purple` | `#7e22ce` (Purple 700) | `#ffffff` (Card) | 4.02:1 (`#8b5cf6` ❌) | **6.98:1** | ✅ PASS (AAA) |
| `badge-green` | `#065f46` | `#d1fae5` (Emerald 100) | 2.21:1 ❌ | **6.78:1** | ✅ PASS (AAA) |
| `badge-blue` | `#1d4ed8` | `#dbeafe` (Blue 100) | 3.09:1 ❌ | **5.49:1** | ✅ PASS (AA) |
| `badge-amber` | `#b45309` | `#fef3c7` (Amber 100) | 1.91:1 ❌ | **4.51:1** | ✅ PASS (AA) |
| `badge-purple` | `#7e22ce` | `#f3e8ff` (Purple 100) | 3.53:1 ❌ | **5.92:1** | ✅ PASS (AA) |
| `badge-red` | `#b91c1c` | `#fee2e2` (Red 100) | 3.10:1 ❌ | **5.30:1** | ✅ PASS (AA) |

### 2.2 Dark Mode (Glare-Free Night Driving)

| Token / Element | Foreground | Background | Previous Ratio | New Ratio | WCAG AA Status |
|---|---|---|---|---|---|
| `--text-primary` | `#f8fafc` (Slate 50) | `#131b2e` (Dark Card) | 16.40:1 | **16.40:1** | ✅ PASS (AAA) |
| `--text-secondary` | `#cbd5e1` (Slate 300) | `#131b2e` (Dark Card) | 11.56:1 | **11.56:1** | ✅ PASS (AAA) |
| `--text-muted` | `#94a3b8` (Slate 400) | `#131b2e` (Dark Card) | 3.61:1 (`#64748b` ❌) | **6.69:1** | ✅ PASS (AAA) |
| `--primary` (Emerald) | `#34d399` (Emerald 400) | `#131b2e` (Dark Card) | 6.76:1 (`#10b981`) | **8.93:1** | ✅ PASS (AAA) |
| `--secondary` | `#60a5fa` (Blue 400) | `#131b2e` (Dark Card) | 4.82:1 | **6.75:1** | ✅ PASS (AAA) |
| `--accent-amber` | `#fbbf24` (Amber 400) | `#131b2e` (Dark Card) | 8.25:1 | **10.28:1** | ✅ PASS (AAA) |
| `--accent-red` | `#f87171` (Red 400) | `#131b2e` (Dark Card) | 4.90:1 | **6.20:1** | ✅ PASS (AAA) |
| `--accent-purple` | `#c084fc` (Purple 400) | `#131b2e` (Dark Card) | 5.20:1 | **6.49:1** | ✅ PASS (AAA) |
| `badge-green` (Dark) | `#6ee7b7` | `rgba(52, 211, 153, 0.16)` | 4.80:1 | **7.81:1** | ✅ PASS (AAA) |
| `badge-blue` (Dark) | `#93c5fd` | `rgba(59, 130, 246, 0.16)` | 4.50:1 | **7.48:1** | ✅ PASS (AAA) |
| `badge-amber` (Dark) | `#fcd34d` | `rgba(245, 158, 11, 0.16)` | 5.10:1 | **8.59:1** | ✅ PASS (AAA) |
| `badge-purple` (Dark) | `#d8b4fe` | `rgba(168, 85, 247, 0.16)` | 4.60:1 | **7.91:1** | ✅ PASS (AAA) |
| `badge-red` (Dark) | `#fca5a5` | `rgba(239, 68, 68, 0.16)` | 4.70:1 | **7.57:1** | ✅ PASS (AAA) |

---

## 3. Exact CSS Token Specification for `style.css`

The following code replaces the `:root` and `[data-theme="dark"]` token declarations at the top of `style.css`:

```css
/* ==========================================================================
   EV Camping Trip - Modern Responsive Design System & Tokens
   ========================================================================== */

:root {
  --font-sans: 'Prompt', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color-scheme: light dark;

  /* Primary & Accent Colors (WCAG AA Daylight Compliant) */
  --primary: #047857;         /* Deep Forest Green (5.48:1 on #fff) */
  --primary-hover: #065f46;   /* Forest Green 800 (7.68:1 on #fff) */
  --primary-light: #d1fae5;   /* Emerald 100 */
  --primary-glow: rgba(4, 120, 87, 0.22);
  
  --secondary: #1d4ed8;       /* High-Contrast Electric Blue 700 (6.70:1 on #fff) */
  --secondary-hover: #1e40af;
  --secondary-light: #dbeafe;
  
  --accent-amber: #b45309;    /* High-Contrast Amber 700 (5.02:1 on #fff) */
  --accent-amber-light: #fef3c7;
  --accent-red: #b91c1c;      /* High-Contrast Red 700 (6.47:1 on #fff) */
  --accent-red-light: #fee2e2;
  --accent-purple: #7e22ce;   /* High-Contrast Purple 700 (6.98:1 on #fff) */
  --accent-purple-light: #f3e8ff;
  
  /* Neutral Colors (Light Mode - Daylight Readable) */
  --bg-main: #f8fafc;
  --bg-card: #ffffff;
  --bg-card-subtle: #f1f5f9;
  --text-primary: #0f172a;    /* Slate 900 (17.85:1 on #fff) */
  --text-secondary: #334155;  /* Slate 700 (10.35:1 on #fff) */
  --text-muted: #475569;      /* Slate 600 (7.58:1 on #fff) */
  --border-color: #cbd5e1;    /* Slate 300 - Crisp daylight border */
  --border-subtle: #e2e8f0;   /* Slate 200 */
  
  /* Shadows & Elevation */
  --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.08);
  --shadow-md: 0 4px 8px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.06);
  --shadow-lg: 0 10px 18px -3px rgba(15, 23, 42, 0.12), 0 4px 8px -4px rgba(15, 23, 42, 0.06);
  --shadow-xl: 0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
  --glass-bg: rgba(255, 255, 255, 0.92);
  --glass-border: rgba(203, 213, 225, 0.6);
  
  /* Radii & Layout Dimensions */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
  
  --header-height: 70px;
  --mobile-nav-height: 68px;
  --touch-min-target: 44px;
}

[data-theme="dark"] {
  /* Primary & Accent Colors (Glare-Free Night Driving) */
  --primary: #34d399;         /* Vibrant Emerald 400 (8.93:1 on dark card) */
  --primary-hover: #6ee7b7;   /* Emerald 300 */
  --primary-light: rgba(52, 211, 153, 0.16);
  --primary-glow: rgba(52, 211, 153, 0.28);
  
  --secondary: #60a5fa;       /* Sky Blue 400 (6.75:1 on dark card) */
  --secondary-hover: #93c5fd;
  --secondary-light: rgba(96, 165, 250, 0.16);
  
  --accent-amber: #fbbf24;    /* Warm Amber 400 (10.28:1 on dark card) */
  --accent-amber-light: rgba(251, 191, 36, 0.16);
  --accent-red: #f87171;      /* Coral Red 400 (6.20:1 on dark card) */
  --accent-red-light: rgba(248, 113, 113, 0.16);
  --accent-purple: #c084fc;   /* Bright Purple 400 (6.49:1 on dark card) */
  --accent-purple-light: rgba(192, 132, 252, 0.16);

  /* Neutral Colors (Dark Mode) */
  --bg-main: #0b1120;         /* Slate 950 Deep Night Base */
  --bg-card: #131b2e;         /* Elevated Card Background */
  --bg-card-subtle: #1e293b;  /* Slate 800 Interactive/Nested Item */
  --text-primary: #f8fafc;    /* Slate 50 (16.40:1 on dark card) */
  --text-secondary: #cbd5e1;  /* Slate 300 (11.56:1 on dark card) */
  --text-muted: #94a3b8;      /* Slate 400 (6.69:1 on dark card) */
  --border-color: #334155;    /* Slate 700 - Crisp boundary without glare */
  --border-subtle: #1e293b;   /* Slate 800 */
  
  /* Glassmorphism & Elevation */
  --glass-bg: rgba(19, 27, 46, 0.92);
  --glass-border: rgba(255, 255, 255, 0.12);
  --shadow-md: 0 4px 8px -1px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 10px 18px -3px rgba(0, 0, 0, 0.55);
}
```

---

## 4. Component Level High-Contrast Rules

### 4.1 Status Badges & Pills
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.3;
  border: 1px solid transparent;
}

/* Light Mode Badges (High Contrast Borders & Text) */
.badge-green {
  background: var(--primary-light);
  color: var(--primary-hover);
  border-color: #a7f3d0;
}
.badge-blue {
  background: var(--secondary-light);
  color: var(--secondary);
  border-color: #bfdbfe;
}
.badge-amber {
  background: var(--accent-amber-light);
  color: var(--accent-amber);
  border-color: #fde68a;
}
.badge-purple {
  background: var(--accent-purple-light);
  color: var(--accent-purple);
  border-color: #e9d5ff;
}
.badge-red {
  background: var(--accent-red-light);
  color: var(--accent-red);
  border-color: #fecaca;
}

/* Dark Mode Badges */
[data-theme="dark"] .badge-green {
  background: var(--primary-light);
  color: #6ee7b7;
  border-color: rgba(52, 211, 153, 0.35);
}
[data-theme="dark"] .badge-blue {
  background: var(--secondary-light);
  color: #93c5fd;
  border-color: rgba(96, 165, 250, 0.35);
}
[data-theme="dark"] .badge-amber {
  background: var(--accent-amber-light);
  color: #fcd34d;
  border-color: rgba(251, 191, 36, 0.35);
}
[data-theme="dark"] .badge-purple {
  background: var(--accent-purple-light);
  color: #d8b4fe;
  border-color: rgba(192, 132, 252, 0.35);
}
[data-theme="dark"] .badge-red {
  background: var(--accent-red-light);
  color: #fca5a5;
  border-color: rgba(248, 113, 113, 0.35);
}
```

### 4.2 Hop Cards, Place Cards & Panels
```css
/* Card Container */
.hop-card,
.place-card,
.sim-panel,
.car-profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.hop-card:hover,
.place-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

/* Metric Pills */
.metric-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.metric-pill.dist {
  background: var(--primary-light);
  color: var(--primary);
  border-color: rgba(4, 120, 87, 0.25);
}

.metric-pill.time {
  background: var(--secondary-light);
  color: var(--secondary);
  border-color: rgba(29, 78, 216, 0.25);
}

[data-theme="dark"] .metric-pill.dist {
  background: rgba(52, 211, 153, 0.16);
  color: #6ee7b7;
  border-color: rgba(52, 211, 153, 0.35);
}

[data-theme="dark"] .metric-pill.time {
  background: rgba(59, 130, 246, 0.16);
  color: #93c5fd;
  border-color: rgba(96, 165, 250, 0.35);
}
```

---

## 5. Driver-First Touch Ergonomics (>= 44x44px)

Under bumpy road and driving situations, tap targets must be large and forgiving:

```css
/* 1. Theme Toggle Button */
.theme-toggle-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

/* 2. Mobile Bottom Navigation Bar & Items */
.mobile-nav-bar {
  height: var(--mobile-nav-height);
  padding: 0 0.25rem;
}

.mobile-nav-item {
  min-height: 48px;
  min-width: 48px;
  padding: 0.5rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  transition: color 0.2s ease, transform 0.15s ease;
}

.mobile-nav-item:active {
  transform: scale(0.95);
}

.mobile-nav-item.active {
  color: var(--primary);
}

/* 3. Action Buttons */
.btn-nav-full,
.popup-nav-btn {
  min-height: 46px;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* 4. Filter Chips */
.filter-chip {
  min-height: 44px;
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

/* 5. Custom Range Slider Ergonomics */
.custom-range {
  height: 8px;
  border-radius: 4px;
}

.custom-range::-webkit-slider-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  -webkit-appearance: none;
}
```

---

## 6. Implementation Checklist for M1

- [ ] Update `:root` variables in `style.css` (lines 5-46)
- [ ] Update `[data-theme="dark"]` variables in `style.css` (lines 48-61)
- [ ] Update `.badge` and `.badge-*` rules in `style.css` (lines 256-271)
- [ ] Add dark mode badge override rules `[data-theme="dark"] .badge-*`
- [ ] Update `.metric-pill` and dark mode `.metric-pill` rules (lines 647-670)
- [ ] Ensure all interactive buttons, toggle buttons, and filter chips adhere to minimum 44px tap target size
- [ ] Update range slider thumb size to 28px for one-thumb mobile operation
- [ ] Validate CSS syntax and verify 100% WCAG AA 4.5:1 contrast in light & dark modes
