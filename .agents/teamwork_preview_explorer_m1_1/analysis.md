# Technical Specification: Navigation & View Architecture (Milestone 1)

> **Author:** M1 Explorer 1 (Navigation & View Architecture)  
> **Target Milestone:** Milestone 1 (UI Foundation & Driver Ergonomics)  
> **Status:** Specification Complete & Ready for Implementation  
> **Associated Features:** F1 (Navigation & Layout Consolidation), F8 (Brand Camp Guide & SOS Drawer)  

---

## 1. Executive Summary & Problem Analysis

The EV Camping Trip application currently suffers from **triple navigation redundancy**, fragmented view architecture, and accessibility issues that create cognitive friction for road trip drivers:

1. **Triple Navigation Redundancy**:
   - **Desktop Header Nav** (`index.html:39-52`): 3 buttons (`tab-map`, `tab-charge-chill`, `tab-simulator`).
   - **Hero Quick Action Strip** (`index.html:84-97`): 3 buttons (`data-goto-tab="tab-map"`, `data-goto-tab="tab-charge-chill"`, `data-goto-tab="tab-simulator"`).
   - **Mobile Bottom Navigation Bar** (`index.html:313-326`): Fixed 3 buttons (`tab-map`, `tab-charge-chill`, `tab-simulator`).
   - *Impact*: On a mobile screen, a driver sees 6 redundant buttons before reaching any interactive content.

2. **Fragmented Information Architecture**:
   - Tab 1 (`#tab-map`) shows stop points and distances, while Tab 2 (`#tab-charge-chill`) shows food, charging specs, and chill tips for the same route.
   - Drivers must flip back and forth between tabs to match a geographic stop with its dining/charging facilities.
   - High-value data (`TRIP_DATA.evCampingGuide` with brand-specific EV camp steps and emergency hotlines) is completely unrendered in the UI.

3. **Accessibility & Viewport Defect**:
   - `index.html:5` sets `maximum-scale=1.0, user-scalable=no`, which violates WCAG 1.4.4 (Resize Text) and prevents drivers from zooming in on detailed stop info.

---

## 2. Target 2-View + Quick Drawer Architecture

To eliminate redundancy and establish a clean, driver-first experience, we consolidate the interface into **2 primary views** and **1 persistent quick action drawer**:

```
┌────────────────────────────────────────────────────────────────────────┐
│  🚗 EV Camp Trip Planner          [⛺ คู่มือ & SOS]  [🌙 Theme Toggle] │
├────────────────────────────────────────────────────────────────────────┤
│  ⚡ HERO OVERVIEW (Departure, Strategy, NEXMOEV, 2-Car Convoy Badges)   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [VIEW 1: view-trip] (Active by default / #trip)                       │
│  🗺️ แผนที่ & จุดแวะ (Trip & Route View)                               │
│  - 🟢 ขาไป (Outbound) vs 🟡 ขากลับ (Inbound) Direction Banner         │
│  - Category Filter Chips (ทั้งหมด / ⚡ จุดชาร์จ / 🍽️ ของกิน / ⛺ แคมป์)  │
│  - Synchronized Stop List & Leaflet Interactive Map                    │
│                                                                        │
│  [VIEW 2: view-simulator] (#simulator)                                 │
│  ⚡ จำลองแบต 2 คัน (2-Car EV Camp Simulator)                            │
│  - Vehicle Model Presets & Battery Capacity Sliders                    │
│  - Climate & Sleep Hours Controls                                      │
│  - Overnight Battery Drain Comparison & Convoy Safety Margin           │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [QUICK ACTION DRAWER / MODAL: #drawer-camp-sos]                       │
│  ⛺ คู่มือแคมป์ & สายด่วนฉุกเฉิน (Camp Mode Guides & SOS Hotlines)       │
│  - 1-Tap Brand Camp Steps (Tesla, BYD, MG, GWM, Deepal, Aion)          │
│  - Pro Camping Tips (Sunshades, Mattress, V2L, Climate 24-25°C)        │
│  - 1-Tap Emergency Phone Dialers (NEXMOEV, PluZ, PEA, EleX, 1193, 1669)│
├────────────────────────────────────────────────────────────────────────┤
│  📱 MOBILE BOTTOM BAR: [🗺️ แผนที่&จุดแวะ] [⚡ จำลองแบต] [⛺ คู่มือ&SOS]  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed DOM Specification for `index.html`

### 3.1 Viewport & Meta Tags Fix (`index.html:1-8`)
Replace restrictive viewport with standard scalable viewport:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 3.2 Header & Navigation Redesign (`index.html:25-64`)
Consolidate desktop navigation to 2 tabs with full ARIA `role="tablist"` support, plus add the Camp Guide & SOS action button:

```html
<!-- Top Header Navigation -->
<header class="header-wrapper">
  <div class="container header-container">
    <div class="logo-group">
      <div class="logo-icon">
        <i data-lucide="tent-tree" style="width: 22px; height: 22px;"></i>
      </div>
      <div class="logo-text">
        <h1>EV Camp Trip Planner</h1>
        <p>แผนที่ทิศทาง • จุดแวะชาร์จ & กิน • Owl Yard บ้านไร่ • NEXMOEV</p>
      </div>
    </div>

    <!-- Desktop Nav Tabs (2 Consolidated Views) -->
    <nav class="nav-desktop" role="tablist" aria-label="Main Navigation">
      <button class="nav-btn active" id="navTabTrip" data-view="view-trip" role="tab" aria-selected="true" aria-controls="view-trip">
        <i data-lucide="map" style="width: 18px; height: 18px;"></i>
        <span>🗺️ แผนที่ & จุดแวะ</span>
      </button>
      <button class="nav-btn" id="navTabSim" data-view="view-simulator" role="tab" aria-selected="false" aria-controls="view-simulator">
        <i data-lucide="battery-charging" style="width: 18px; height: 18px;"></i>
        <span>⚡ จำลองแบต 2 คัน</span>
      </button>
    </nav>

    <!-- Header Actions (Camp Guide Modal Trigger + Theme Switcher) -->
    <div class="header-actions">
      <button id="btnOpenCampGuideHeader" class="header-action-btn" title="คู่มือแคมป์ & เบอร์ฉุกเฉิน" aria-label="เปิดคู่มือแคมป์และเบอร์ฉุกเฉิน" aria-haspopup="dialog">
        <i data-lucide="book-open" style="width: 18px; height: 18px;"></i>
        <span class="btn-text-desktop">คู่มือ & SOS</span>
      </button>
      <button id="themeToggleBtn" class="theme-toggle-btn" title="เปลี่ยนธีม มืด/สว่าง" aria-label="เปลี่ยนธีม">
        <span id="themeIcon">
          <i data-lucide="moon" style="width: 20px; height: 20px;"></i>
        </span>
      </button>
    </div>
  </div>
</header>
```

### 3.3 Streamlined Hero Section (`index.html:68-99`)
Eliminate the duplicate 3-button strip (`[data-goto-tab]`). Keep the essential trip status chips and overview:

```html
<!-- Hero Card Overview -->
<section class="hero-section">
  <div class="hero-card">
    <div class="hero-badges">
      <span class="badge badge-green">⏰ ออก 09:00 น. ขับสบายๆ ชิลๆ</span>
      <span class="badge badge-amber">⚡ ชาร์จเต็มช่วงด่านช้างก่อนเข้าแคมป์</span>
      <span class="badge badge-purple">⭐ ไฮไลท์ขากลับ: NEXMOEV 12 หัวชาร์จ + นวดฟรี</span>
      <span class="badge badge-blue">🚗 ขบวน 2 คัน (คำนวณแยกคันได้)</span>
    </div>
    
    <h2 class="hero-title">แผนที่ทิศทาง & จุดแวะชาร์จกินข้าว ทริปแคมป์ปิ้งบ้านไร่</h2>
    <p class="hero-desc">
      คู่มือการเดินทางสำหรับขบวน EV 2 คัน (นนทบุรี ➔ Owl Yard บ้านไร่ ➔ NEXMOEV): ดูเส้นทาง <strong>🟢 ขาไป vs 🟡 ขากลับ</strong>, ค้นหาจุดแวะชาร์จที่มีร้านอาหาร/กาแฟในตัว และคำนวณไฟเปิดแอร์นอนในรถได้อย่างแม่นยำ
    </p>
  </div>
</section>
```

### 3.4 Consolidated View 1: `view-trip` (`index.html:104-175`)
Merges the map and stop directory into a single unified view container:

```html
<!-- ==================================================================== -->
<!-- VIEW 1: TRIP & ROUTE (MAP + STOPS + CHARGE/CHILL) -->
<!-- ==================================================================== -->
<section id="view-trip" class="view-content active" role="tabpanel" aria-labelledby="navTabTrip">
  <div class="section-header">
    <h2 class="section-title">
      <i data-lucide="map-pin" style="color: var(--primary);"></i>
      <span>แผนที่ทิศทาง & จุดแวะทั้งหมด (🟢 ขาไป ➔ 🟡 ขากลับ)</span>
    </h2>
    <p class="section-desc">คลิกที่หมุดบนแผนที่หรือการ์ดสถานที่เพื่อดูข้อมูลร้านอาหาร จุดชาร์จ และกดเปิด Google Maps นำทางได้ทันที</p>
  </div>

  <!-- Direction Flow Legend Box -->
  <div class="route-legend-card">
    <div class="legend-row">
      <span class="legend-dot dot-outbound"></span>
      <div>
        <strong>🟢 เส้นทางขาไป:</strong> ออก 09:00 น. นนทบุรี ➔ สุพรรณบุรี (สามชุก) ➔ PTT ด่านช้าง (★ ชาร์จเต็ม 90-95%) ➔ Owl Yard บ้านไร่ (~220 กม.)
      </div>
    </div>
    <div class="legend-row legend-row-inbound">
      <span class="legend-dot dot-inbound"></span>
      <div>
        <strong>🟡 เส้นทางขากลับ:</strong> บ้านไร่ ➔ หุบป่าตาด ➔ วัดท่าซุง ➔ ⭐ NEXMOEV พยุหะคีรี (12 ตู้ 120 kW + นวดแอร์ฟรี) ➔ ชัยนาท ➔ สายเอเชียกลับบ้าน (~325 กม.)
      </div>
    </div>
  </div>

  <div class="map-layout">
    <!-- Map Sidebar / Stop Cards Directory -->
    <div class="map-sidebar">
      <div>
        <div class="sidebar-filter-title">
          กรองตามหมวดหมู่
        </div>
        <div id="mapFilterGroup" class="filter-group">
          <!-- Injected dynamically by JS -->
        </div>
      </div>

      <div class="sidebar-places-title">
        สถานที่และจุดชาร์จทั้งหมด
      </div>

      <div id="mapPlacesList" class="map-places-list">
        <!-- Injected dynamically by JS -->
      </div>
    </div>

    <!-- Map Leaflet Container -->
    <div class="map-container-wrapper">
      <div id="map"></div>
    </div>
  </div>
</section>
```

### 3.5 Consolidated View 2: `view-simulator` (`index.html:177-308`)
Preserves all calculator inputs, sliders, and result displays:

```html
<!-- ==================================================================== -->
<!-- VIEW 2: 2-CAR EV SIMULATOR -->
<!-- ==================================================================== -->
<section id="view-simulator" class="view-content" role="tabpanel" aria-labelledby="navTabSim">
  <div class="section-header">
    <h2 class="section-title">
      <i data-lucide="battery-charging" style="color: var(--primary);"></i>
      <span>เครื่องคำนวณแบตเตอรี่ & เปรียบเทียบ 2 คัน (2-Car EV Simulator)</span>
    </h2>
    <p class="section-desc">ปรับความจุแบตเตอรี่ของรถคันที่ 1 และคันที่ 2 เพื่อดูการใช้พลังงานแอร์ตอนนอนและระยะทางที่เหลือของทั้งสองคัน</p>
  </div>

  <div class="simulator-layout">
    <!-- Simulator Controls -->
    <div class="sim-panel">
      <h3 class="sim-panel-title">
        <i data-lucide="sliders" style="color: var(--primary); width: 20px; height: 20px;"></i>
        <span>ตั้งค่าความจุแบตเตอรี่รถทั้ง 2 คัน</span>
      </h3>

      <!-- Car 1 Battery Capacity -->
      <div class="sim-slider-group group-car1">
        <div class="sim-slider-header">
          <span class="sim-label text-car1">🚗 รถคันที่ 1 (Car 1 Battery)</span>
          <span id="valCar1Cap" class="sim-val-display">60 kWh</span>
        </div>
        <input type="range" id="simCar1Cap" class="custom-range" min="35" max="110" step="1" value="60" aria-label="ความจุแบตเตอรี่รถคันที่ 1">
        <div class="slider-scale-labels">
          <span>35 kWh (City)</span>
          <span>60 kWh (Standard)</span>
          <span>100+ kWh</span>
        </div>
      </div>

      <!-- Car 2 Battery Capacity -->
      <div class="sim-slider-group group-car2">
        <div class="sim-slider-header">
          <span class="sim-label text-car2">🚙 รถคันที่ 2 (Car 2 Battery)</span>
          <span id="valCar2Cap" class="sim-val-display text-car2">50 kWh</span>
        </div>
        <input type="range" id="simCar2Cap" class="custom-range range-car2" min="35" max="110" step="1" value="50" aria-label="ความจุแบตเตอรี่รถคันที่ 2">
        <div class="slider-scale-labels">
          <span>35 kWh (City)</span>
          <span>50 kWh (Standard)</span>
          <span>100+ kWh</span>
        </div>
      </div>

      <!-- Camping Sleep Hours -->
      <div class="sim-slider-group">
        <div class="sim-slider-header">
          <span class="sim-label">จำนวนชั่วโมงนอนเปิดแอร์ในรถ (Sleep Hours)</span>
          <span id="valSleepHours" class="sim-val-display">8 ชม.</span>
        </div>
        <input type="range" id="simSleepHours" class="custom-range" min="4" max="12" step="1" value="8" aria-label="ชั่วโมงนอนเปิดแอร์">
      </div>

      <!-- AC Power Consumption -->
      <div class="sim-slider-group">
        <div class="sim-slider-header">
          <span class="sim-label">การกินไฟของแอร์ขณะจอดนอน (AC Power)</span>
          <span id="valAcPower" class="sim-val-display">1.0 kW/ชม.</span>
        </div>
        <input type="range" id="simAcPower" class="custom-range" min="0.6" max="2.0" step="0.1" value="1.0" aria-label="การกินไฟของแอร์">
        <div class="slider-subtext">
          ที่อุณหภูมิ 24-25°C แอร์จะกินไฟประมาณ 0.8 - 1.2 kW ต่อชั่วโมง
        </div>
      </div>
    </div>

    <!-- 2-Car Comparison Results -->
    <div>
      <div class="two-car-grid">
        <!-- Car 1 Results -->
        <div class="car-profile-card card-car1">
          <div class="car-profile-header">
            <span class="car-title text-car1">🚗 รถคันที่ 1</span>
            <span class="badge badge-green">ความจุหลัก</span>
          </div>
          <div class="car-stats-list">
            <div class="stat-row">
              <span>ถึง Owl Yard เหลือ:</span>
              <strong id="c1ArrivalSoc" class="text-car1">83%</strong>
            </div>
            <div class="stat-row">
              <span>ใช้ไฟแอร์ทั้งคืน:</span>
              <strong id="c1SleepEnergy" class="text-amber">8.0 kWh (13%)</strong>
            </div>
            <div class="stat-row stat-row-total">
              <span>ตื่นเช้าเหลือแบตฯ:</span>
              <strong id="c1MorningSoc" class="stat-highlight text-car1">70%</strong>
            </div>
            <div class="stat-row">
              <span>วิ่งต่อได้อีก:</span>
              <strong id="c1MorningRange">~262 กม.</strong>
            </div>
          </div>
        </div>

        <!-- Car 2 Results -->
        <div class="car-profile-card card-car2">
          <div class="car-profile-header">
            <span class="car-title text-car2">🚙 รถคันที่ 2</span>
            <span class="badge badge-blue">ความจุรอง</span>
          </div>
          <div class="car-stats-list">
            <div class="stat-row">
              <span>ถึง Owl Yard เหลือ:</span>
              <strong id="c2ArrivalSoc" class="text-car2">81%</strong>
            </div>
            <div class="stat-row">
              <span>ใช้ไฟแอร์ทั้งคืน:</span>
              <strong id="c2SleepEnergy" class="text-amber">8.0 kWh (16%)</strong>
            </div>
            <div class="stat-row stat-row-total">
              <span>ตื่นเช้าเหลือแบตฯ:</span>
              <strong id="c2MorningSoc" class="stat-highlight text-car2">65%</strong>
            </div>
            <div class="stat-row">
              <span>วิ่งต่อได้อีก:</span>
              <strong id="c2MorningRange">~203 กม.</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Convoy Advice Text -->
      <div class="sim-panel">
        <div id="convoyAdviceText" class="convoy-advice-text">
          <!-- Injected dynamically -->
        </div>
      </div>
    </div>
  </div>
</section>
```

### 3.6 Brand Camp Guide & Emergency SOS Drawer (`#drawer-camp-sos`)
Rendered directly before the mobile bottom bar:

```html
<!-- ==================================================================== -->
<!-- QUICK ACTION DRAWER: CAMP MODE GUIDE & SOS HOTLINES -->
<!-- ==================================================================== -->
<div id="drawerCampSos" class="drawer-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
  <div class="drawer-backdrop" id="drawerBackdrop"></div>
  <div class="drawer-sheet" tabindex="-1">
    <div class="drawer-header">
      <div class="drawer-header-title">
        <i data-lucide="tent-tree" style="color: var(--primary); width: 22px; height: 22px;"></i>
        <h3 id="drawerTitle">คู่มือแคมป์ & สายด่วนฉุกเฉิน</h3>
      </div>
      <button id="btnCloseCampGuide" class="drawer-close-btn" aria-label="ปิดหน้าต่าง">
        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
      </button>
    </div>

    <div class="drawer-body">
      <!-- Brand Camp Mode Accordion / Cards -->
      <div class="drawer-section">
        <h4 class="drawer-section-title">
          <i data-lucide="car" style="width: 18px; height: 18px; color: var(--primary);"></i>
          <span>วิธีตั้งค่า Camp Mode แยกตามยี่ห้อรถ</span>
        </h4>
        <div id="brandCampGuideContainer" class="brand-camp-container">
          <!-- Injected dynamically from data.js -->
        </div>
      </div>

      <!-- Pro Camping Tips -->
      <div class="drawer-section">
        <h4 class="drawer-section-title">
          <i data-lucide="sparkles" style="width: 18px; height: 18px; color: var(--amber);"></i>
          <span>เทคนิคและข้อแนะนำการนอนในรถ (Pro Tips)</span>
        </h4>
        <div id="proTipsContainer" class="pro-tips-container">
          <!-- Injected dynamically from data.js -->
        </div>
      </div>

      <!-- 1-Tap Emergency Hotlines -->
      <div class="drawer-section">
        <h4 class="drawer-section-title">
          <i data-lucide="phone-call" style="width: 18px; height: 18px; color: #ef4444;"></i>
          <span>เบอร์โทรฉุกเฉิน & ผู้ให้บริการสถานีชาร์จ (1-Tap Call)</span>
        </h4>
        <div id="emergencyContactsContainer" class="emergency-contacts-grid">
          <!-- Injected dynamically from data.js -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### 3.7 Mobile Bottom Navigation Bar (`index.html:313-326`)
Sleek, ergonomic 3-action bar with >=48px touch targets:

```html
<!-- Mobile Bottom Navigation Bar -->
<nav class="mobile-nav-bar" role="tablist" aria-label="Mobile Navigation">
  <button class="mobile-nav-item active" id="mobileNavTrip" data-view="view-trip" role="tab" aria-selected="true" aria-controls="view-trip">
    <i data-lucide="map"></i>
    <span>แผนที่ & จุดแวะ</span>
  </button>
  <button class="mobile-nav-item" id="mobileNavSim" data-view="view-simulator" role="tab" aria-selected="false" aria-controls="view-simulator">
    <i data-lucide="battery-charging"></i>
    <span>จำลองแบต 2 คัน</span>
  </button>
  <button class="mobile-nav-item" id="mobileNavCampGuide" aria-haspopup="dialog" aria-expanded="false">
    <i data-lucide="tent-tree"></i>
    <span>คู่มือ & SOS</span>
  </button>
</nav>
```

---

## 4. Detailed JavaScript Specification for `app.js`

### 4.1 View Router & Tab Synchronization Logic

```javascript
// --------------------------------------------------------------------------
// Navigation & View Controller
// --------------------------------------------------------------------------
const VIEW_IDS = ['view-trip', 'view-simulator'];
const VIEW_HASH_MAP = {
  '#trip': 'view-trip',
  '#map': 'view-trip',
  '#charge-chill': 'view-trip',
  '#simulator': 'view-simulator',
  '#sim': 'view-simulator'
};

function initNavigation() {
  const desktopButtons = document.querySelectorAll('.nav-desktop .nav-btn');
  const mobileButtons = document.querySelectorAll('.mobile-nav-bar .mobile-nav-item[data-view]');
  const viewPanes = document.querySelectorAll('.view-content');

  function switchView(targetViewId, updateHash = true) {
    if (!VIEW_IDS.includes(targetViewId)) {
      targetViewId = 'view-trip';
    }

    // 1. Toggle View Panes
    viewPanes.forEach(pane => {
      const isActive = pane.id === targetViewId;
      pane.classList.toggle('active', isActive);
      pane.setAttribute('aria-hidden', (!isActive).toString());
    });

    // 2. Update Desktop Buttons
    desktopButtons.forEach(btn => {
      const isActive = btn.getAttribute('data-view') === targetViewId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive.toString());
    });

    // 3. Update Mobile Buttons
    mobileButtons.forEach(btn => {
      const isActive = btn.getAttribute('data-view') === targetViewId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive.toString());
    });

    // 4. Update URL Hash
    if (updateHash) {
      const hash = targetViewId === 'view-simulator' ? '#simulator' : '#trip';
      if (window.location.hash !== hash) {
        history.pushState(null, '', hash);
      }
    }

    // 5. Invalidate Leaflet Map Size when switching to Trip view
    if (targetViewId === 'view-trip' && window.mapInstance) {
      requestAnimationFrame(() => {
        window.mapInstance.invalidateSize();
      });
      setTimeout(() => {
        if (window.mapInstance) window.mapInstance.invalidateSize();
      }, 150);
    }

    // 6. Smooth Scroll to Top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Bind click listeners on desktop nav
  desktopButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.getAttribute('data-view'));
    });
  });

  // Bind click listeners on mobile nav
  mobileButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.getAttribute('data-view'));
    });
  });

  // Handle URL hash on initial load
  function handleInitialRoute() {
    const hash = window.location.hash.toLowerCase();
    const matchedView = VIEW_HASH_MAP[hash] || 'view-trip';
    switchView(matchedView, false);
  }

  // Listen for browser Back/Forward navigation
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.toLowerCase();
    const matchedView = VIEW_HASH_MAP[hash] || 'view-trip';
    switchView(matchedView, false);
  });

  handleInitialRoute();
}
```

### 4.2 Camp Guide & Emergency SOS Drawer Controller

```javascript
// --------------------------------------------------------------------------
// Camp Guide & SOS Drawer Management
// --------------------------------------------------------------------------
function initCampGuideDrawer() {
  const drawer = document.getElementById('drawerCampSos');
  const backdrop = document.getElementById('drawerBackdrop');
  const closeBtn = document.getElementById('btnCloseCampGuide');
  const headerTrigger = document.getElementById('btnOpenCampGuideHeader');
  const mobileTrigger = document.getElementById('mobileNavCampGuide');

  if (!drawer) return;

  function openDrawer() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (mobileTrigger) mobileTrigger.setAttribute('aria-expanded', 'true');
    if (headerTrigger) headerTrigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Focus close button or first interactive element
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (mobileTrigger) mobileTrigger.setAttribute('aria-expanded', 'false');
    if (headerTrigger) headerTrigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (headerTrigger) headerTrigger.addEventListener('click', openDrawer);
  if (mobileTrigger) mobileTrigger.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  // Dismiss on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Render Drawer Content from TRIP_DATA.evCampingGuide
  renderCampGuideContent();
}

function renderCampGuideContent() {
  const guideData = TRIP_DATA.evCampingGuide;
  if (!guideData) return;

  // 1. Render Brand Camp Modes
  const brandContainer = document.getElementById('brandCampGuideContainer');
  if (brandContainer && guideData.carBrandsCampMode) {
    brandContainer.innerHTML = guideData.carBrandsCampMode.map(brand => `
      <div class="brand-camp-card">
        <div class="brand-camp-header">
          <strong>${brand.brand}</strong>
          <span class="badge badge-green">${brand.modeName}</span>
        </div>
        <p class="brand-camp-steps">${brand.steps}</p>
      </div>
    `).join('');
  }

  // 2. Render Pro Tips
  const tipsContainer = document.getElementById('proTipsContainer');
  if (tipsContainer && guideData.proTips) {
    tipsContainer.innerHTML = guideData.proTips.map(tip => `
      <div class="pro-tip-item">
        <strong class="pro-tip-title">💡 ${tip.title}</strong>
        <p class="pro-tip-desc">${tip.desc}</p>
      </div>
    `).join('');
  }

  // 3. Render Emergency Contacts (1-Tap Dialers)
  const contactsContainer = document.getElementById('emergencyContactsContainer');
  if (contactsContainer && guideData.emergencyContacts) {
    contactsContainer.innerHTML = guideData.emergencyContacts.map(contact => `
      <a href="tel:${contact.phone.replace(/[^0-9]/g, '')}" class="emergency-contact-card">
        <div class="emergency-contact-info">
          <span class="contact-name">${contact.name}</span>
          <strong class="contact-phone">${contact.phone}</strong>
        </div>
        <div class="contact-call-btn">
          <i data-lucide="phone" style="width: 16px; height: 16px;"></i>
          <span>โทร</span>
        </div>
      </a>
    `).join('');
  }

  lucide.createIcons();
}
```

---

## 5. CSS Specifications for Drawer & Navigation Sizing

To support the HTML/JS changes, the following CSS rules must be provided in `style.css`:

```css
/* ==========================================================================
   Consolidated Views & Drawer Overlay Styling
   ========================================================================== */

/* View Containers */
.view-content {
  display: none;
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.view-content.active {
  display: block;
}

/* Header Actions */
.header-action-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  min-height: 44px;
  border-radius: var(--radius-full);
  background: var(--bg-card-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-action-btn:hover {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
}

@media (max-width: 640px) {
  .btn-text-desktop {
    display: none;
  }
  .header-action-btn {
    padding: 0.55rem;
    min-width: 44px;
    justify-content: center;
  }
}

/* Drawer Overlay & Modal */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
  visibility: hidden;
  transition: visibility 0.3s ease;
}

.drawer-overlay.is-open {
  pointer-events: auto;
  visibility: visible;
}

.drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.drawer-overlay.is-open .drawer-backdrop {
  opacity: 1;
}

.drawer-sheet {
  position: relative;
  width: 100%;
  max-width: 520px;
  height: 100%;
  background: var(--bg-card);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  z-index: 1;
}

.drawer-overlay.is-open .drawer-sheet {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card-subtle);
}

.drawer-header-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.drawer-close-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.drawer-close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-card-subtle);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem 5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.drawer-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

/* Brand Camp Cards */
.brand-camp-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.brand-camp-card {
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
}

.brand-camp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.brand-camp-steps {
  font-size: 0.825rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* Pro Tips */
.pro-tips-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.pro-tip-item {
  background: rgba(245, 158, 11, 0.06);
  border-left: 3px solid var(--amber);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
}

.pro-tip-title {
  display: block;
  font-size: 0.875rem;
  color: var(--amber-dark, #b45309);
  margin-bottom: 0.25rem;
}

.pro-tip-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin: 0;
}

/* Emergency Contacts Grid */
.emergency-contacts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
}

.emergency-contact-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  min-height: 52px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.emergency-contact-card:hover {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.contact-name {
  display: block;
  font-size: 0.825rem;
  color: var(--text-secondary);
}

.contact-phone {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.contact-call-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #ef4444;
  color: #ffffff;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-full);
  font-size: 0.825rem;
  font-weight: 700;
  flex-shrink: 0;
}
```

---

## 6. Verification Checklist & Success Criteria

1. **Elimination of Nav Redundancy**:
   - Total nav button count on load reduced from **9 buttons** (3 desktop + 3 hero + 3 mobile) to **2 desktop tabs / 3 mobile items** with zero duplicate buttons in the hero section.
2. **Smooth View Switching & URL Hash Routing**:
   - Tapping either desktop tab or mobile bottom item switches between `view-trip` and `view-simulator` in <100ms without layout jump.
   - Browser URL hash changes to `#trip` or `#simulator`, and pressing browser Back/Forward navigates between views.
3. **Map Resizing & Zero Glitch**:
   - Switching back to `view-trip` triggers `window.mapInstance.invalidateSize()` properly, leaving no gray/unrendered Leaflet tiles.
4. **Camp Guide & SOS Drawer**:
   - Tapping "คู่มือ & SOS" on desktop header or mobile bar opens `#drawerCampSos`.
   - Pressing `Escape`, tapping the close button, or tapping the backdrop closes the drawer and restores body scrolling.
   - All 6 emergency phone numbers (`tel:0863114422`, `tel:1365`, `tel:1129`, `tel:024361111`, `tel:1193`, `tel:1669`) are formatted for 1-tap dialing.
5. **Accessibility & WCAG AA**:
   - Full keyboard navigation with `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, and `aria-hidden` attributes.
   - Viewport meta tag supports user scaling.
