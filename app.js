// ==========================================================================
// EV Camping Trip - Application Logic & Interactivity (Clean 2-View Architecture)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initCampGuideDrawer();
  initMap();
  initChargeAndChill();
  initEVSimulator();
  lucide.createIcons();
});

// --------------------------------------------------------------------------
// 1. Theme Management (Light / Dark)
// --------------------------------------------------------------------------
function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('ev_trip_theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('ev_trip_theme', newTheme);
      updateThemeIcon(newTheme);
      
      if (window.mapInstance) {
        updateMapTiles(newTheme);
      }
    });
  }
}

function updateThemeIcon(theme) {
  const iconContainer = document.getElementById('themeIcon');
  if (iconContainer) {
    iconContainer.innerHTML = theme === 'dark' 
      ? '<i data-lucide="sun" style="width: 20px; height: 20px;"></i>'
      : '<i data-lucide="moon" style="width: 20px; height: 20px;"></i>';
    lucide.createIcons();
  }
}

// --------------------------------------------------------------------------
// 2. Navigation & View Routing (2 Consolidated Primary Views)
// --------------------------------------------------------------------------
const VIEW_MAP = {
  'tab-map': 'tab-map',
  'tab-trip': 'tab-map',
  'view-trip': 'tab-map',
  '#trip': 'tab-map',
  '#map': 'tab-map',
  '#charge-chill': 'tab-map',
  'tab-simulator': 'tab-simulator',
  'view-simulator': 'tab-simulator',
  '#simulator': 'tab-simulator',
  '#sim': 'tab-simulator'
};

function switchTab(targetTabId, updateHash = true) {
  const canonicalId = VIEW_MAP[targetTabId] || 'tab-map';
  const desktopButtons = document.querySelectorAll('.nav-desktop .nav-btn');
  const mobileButtons = document.querySelectorAll('.mobile-nav-bar .mobile-nav-item[data-tab], .mobile-nav-bar .mobile-nav-item[data-view]');
  const tabPanes = document.querySelectorAll('.tab-content, .view-content');

  // 1. Toggle Tab / View Panes
  tabPanes.forEach(pane => {
    const isActive = (pane.id === canonicalId);
    pane.classList.toggle('active', isActive);
    pane.setAttribute('aria-hidden', (!isActive).toString());
  });

  // 2. Update Desktop Navigation Buttons
  desktopButtons.forEach(btn => {
    const tabAttr = btn.getAttribute('data-tab');
    const viewAttr = btn.getAttribute('data-view');
    const isMatch = (VIEW_MAP[tabAttr] === canonicalId || VIEW_MAP[viewAttr] === canonicalId);
    btn.classList.toggle('active', isMatch);
    btn.setAttribute('aria-selected', isMatch.toString());
  });

  // 3. Update Mobile Navigation Buttons
  mobileButtons.forEach(btn => {
    const tabAttr = btn.getAttribute('data-tab');
    const viewAttr = btn.getAttribute('data-view');
    const isMatch = (VIEW_MAP[tabAttr] === canonicalId || VIEW_MAP[viewAttr] === canonicalId);
    btn.classList.toggle('active', isMatch);
    btn.setAttribute('aria-selected', isMatch.toString());
  });

  // 4. Synchronize URL Hash
  if (updateHash && window.history && window.history.pushState) {
    const newHash = (canonicalId === 'tab-simulator') ? '#simulator' : '#trip';
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
  }

  // 5. Invalidate Leaflet Map Size on Switching to Trip View
  if (canonicalId === 'tab-map' && window.mapInstance) {
    requestAnimationFrame(() => {
      if (window.mapInstance) window.mapInstance.invalidateSize();
    });
    setTimeout(() => {
      if (window.mapInstance) window.mapInstance.invalidateSize();
    }, 150);
  }

  // 6. Smooth Scroll to Top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Global alias for external invocations
window.switchTab = switchTab;
window.switchView = switchTab;

function initNavigation() {
  const desktopButtons = document.querySelectorAll('.nav-desktop .nav-btn');
  const mobileButtons = document.querySelectorAll('.mobile-nav-bar .mobile-nav-item[data-tab], .mobile-nav-bar .mobile-nav-item[data-view]');

  desktopButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab') || btn.getAttribute('data-view');
      switchTab(target);
    });
  });

  mobileButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab') || btn.getAttribute('data-view');
      switchTab(target);
    });
  });

  document.querySelectorAll('[data-goto-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-goto-tab'));
    });
  });

  // Handle URL hash on initial load
  function handleInitialRoute() {
    const hash = window.location.hash.toLowerCase();
    if (hash && VIEW_MAP[hash]) {
      switchTab(VIEW_MAP[hash], false);
    }
  }

  // Listen for browser Back/Forward navigation
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.toLowerCase();
    const matched = VIEW_MAP[hash] || 'tab-map';
    switchTab(matched, false);
  });

  handleInitialRoute();
}

// --------------------------------------------------------------------------
// 3. Camp Guide & Emergency SOS Drawer Management
// --------------------------------------------------------------------------
function openCampSosDrawer() {
  const drawer = document.getElementById('drawerCampSos');
  const mobileTrigger = document.getElementById('mobileNavCampGuide');
  const headerTrigger = document.getElementById('btnOpenCampGuideHeader');
  const closeBtn = document.getElementById('btnCloseCampGuide');

  if (!drawer) return;
  drawer.classList.add('is-open');
  drawer.classList.add('active');
  drawer.setAttribute('aria-hidden', 'false');
  if (mobileTrigger) mobileTrigger.setAttribute('aria-expanded', 'true');
  if (headerTrigger) headerTrigger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';

  if (closeBtn) closeBtn.focus();
}

function closeCampSosDrawer() {
  const drawer = document.getElementById('drawerCampSos');
  const mobileTrigger = document.getElementById('mobileNavCampGuide');
  const headerTrigger = document.getElementById('btnOpenCampGuideHeader');

  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawer.classList.remove('active');
  drawer.setAttribute('aria-hidden', 'true');
  if (mobileTrigger) mobileTrigger.setAttribute('aria-expanded', 'false');
  if (headerTrigger) headerTrigger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

window.openCampSosDrawer = openCampSosDrawer;
window.closeCampSosDrawer = closeCampSosDrawer;

function initCampGuideDrawer() {
  const drawer = document.getElementById('drawerCampSos');
  const backdrop = document.getElementById('drawerBackdrop');
  const closeBtn = document.getElementById('btnCloseCampGuide');
  const headerTrigger = document.getElementById('btnOpenCampGuideHeader');
  const mobileTrigger = document.getElementById('mobileNavCampGuide');

  if (!drawer) return;

  if (headerTrigger) headerTrigger.addEventListener('click', openCampSosDrawer);
  if (mobileTrigger) mobileTrigger.addEventListener('click', openCampSosDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeCampSosDrawer);
  if (backdrop) backdrop.addEventListener('click', closeCampSosDrawer);

  // Dismiss on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (drawer.classList.contains('is-open') || drawer.classList.contains('active'))) {
      closeCampSosDrawer();
    }
  });

  renderCampGuideContent();
}

function renderCampGuideContent() {
  if (typeof TRIP_DATA === 'undefined' || !TRIP_DATA.evCampingGuide) return;
  const guideData = TRIP_DATA.evCampingGuide;

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
      <a href="tel:${contact.phone.replace(/[^0-9]/g, '')}" class="emergency-contact-card" aria-label="โทร ${contact.name}">
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

// --------------------------------------------------------------------------
// 4. Interactive Leaflet Map with Directional Colored Routes
// --------------------------------------------------------------------------
let mapInstance = null;
let mapTileLayer = null;
let markersLayerGroup = null;
let outboundPolyline = null;
let inboundPolyline = null;
let currentActiveFilter = 'all';
let currentActivePhase = 'all';
let markersMap = {};

function initMap() {
  const mapElement = document.getElementById('map');
  const mapContainer = document.querySelector('.map-container-wrapper') || mapElement;
  if (!mapElement) return;

  mapInstance = L.map('map', {
    center: [14.75, 99.95],
    zoom: 9,
    zoomControl: true
  });
  window.mapInstance = mapInstance;
  window.markersMap = markersMap;
  window.selectPlace = selectPlace;
  window.setJourneyPhase = setJourneyPhase;

  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  updateMapTiles(theme);

  markersLayerGroup = L.layerGroup().addTo(mapInstance);

  initPhaseFilters();
  renderMapFilters();
  drawDirectionalRoutes();
  renderMapMarkers();
  initMapGestureGuard(mapInstance, mapContainer);

  // Ensure map tiles render sharply
  setTimeout(() => {
    mapInstance.invalidateSize();
  }, 300);
}

function updateMapTiles(theme) {
  if (!mapInstance) return;

  if (mapTileLayer) {
    mapInstance.removeLayer(mapTileLayer);
  }

  const currentTheme = theme || document.documentElement.getAttribute('data-theme') || 'light';
  const isDark = (currentTheme === 'dark');

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  mapTileLayer = L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance);

  if (mapTileLayer.bringToBack) {
    mapTileLayer.bringToBack();
  }
}

function initMapGestureGuard(map, mapContainer) {
  if (!map || !mapContainer) return;

  let overlay = mapContainer.querySelector ? mapContainer.querySelector('.map-gesture-overlay') : null;
  if (!overlay && typeof document !== 'undefined' && typeof document.createElement === 'function') {
    overlay = document.createElement('div');
    overlay.className = 'map-gesture-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="map-gesture-pill">
        <i data-lucide="hand" style="width: 18px; height: 18px;"></i>
        <span>📱 ใช้ 2 นิ้วเพื่อเลื่อนแผนที่ (Use 2 fingers to pan)</span>
      </div>
    `;
    if (typeof mapContainer.appendChild === 'function') mapContainer.appendChild(overlay);
    if (window.lucide && typeof window.lucide.createIcons === 'function') lucide.createIcons();
  }

  if (!overlay) return;

  const isTouchDevice = (typeof window !== 'undefined' && 'ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  if (!isTouchDevice) return;

  if (map.dragging && typeof map.dragging.disable === 'function') {
    map.dragging.disable();
  }

  let gestureHintTimeout = null;
  function showGestureHint() {
    overlay.classList.add('is-visible');
    clearTimeout(gestureHintTimeout);
    gestureHintTimeout = setTimeout(() => {
      overlay.classList.remove('is-visible');
    }, 1500);
  }

  mapContainer.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length >= 2) {
      if (map.dragging && typeof map.dragging.enable === 'function') map.dragging.enable();
      overlay.classList.remove('is-visible');
    } else {
      if (map.dragging && typeof map.dragging.disable === 'function') map.dragging.disable();
    }
  }, { passive: true });

  mapContainer.addEventListener('touchmove', (e) => {
    const isDraggingEnabled = map.dragging && typeof map.dragging.enabled === 'function' && map.dragging.enabled();
    if (e.touches && e.touches.length === 1 && !isDraggingEnabled) {
      showGestureHint();
    }
  }, { passive: true });

  mapContainer.addEventListener('touchend', (e) => {
    if (!e.touches || e.touches.length < 2) {
      if (map.dragging && typeof map.dragging.disable === 'function') map.dragging.disable();
    }
  }, { passive: true });

  mapContainer.addEventListener('mousedown', () => {
    if (map.dragging && typeof map.dragging.enable === 'function') map.dragging.enable();
  });
}

function initPhaseFilters() {
  const phaseGroup = document.getElementById('phaseFilterGroup');
  if (!phaseGroup) return;

  phaseGroup.querySelectorAll('.phase-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const phase = btn.getAttribute('data-phase') || 'all';
      setJourneyPhase(phase);
    });
  });
}

function setJourneyPhase(phase) {
  currentActivePhase = phase;

  const phaseGroup = document.getElementById('phaseFilterGroup');
  if (phaseGroup) {
    phaseGroup.querySelectorAll('.phase-btn').forEach(btn => {
      const isMatch = (btn.getAttribute('data-phase') === phase);
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch.toString());
    });
  }

  renderMapMarkers();
  updateRoutePolylines(phase);
  zoomToPhaseBounds(phase);
}

function getFilteredPlaces() {
  if (typeof TRIP_DATA === 'undefined' || !TRIP_DATA.places) return [];

  return TRIP_DATA.places.filter(place => {
    // 1. Phase Matching
    let matchesPhase = false;
    if (currentActivePhase === 'all') {
      matchesPhase = true;
    } else if (place.phase) {
      matchesPhase = (place.phase === currentActivePhase);
    } else {
      if (currentActivePhase === 'outbound') {
        matchesPhase = ['home', 'poi_samchuk', 'charger_danchang'].includes(place.id);
      } else if (currentActivePhase === 'campsite') {
        matchesPhase = ['owlyard', 'charger_banrai_pea', 'rest_koomrimkhao', 'rest_baansuan', 'rest_chaika', 'rest_heiauan', 'rest_padthai', 'cafe_leleela', 'poi_giant_tree', 'poi_wat_tham_khao_wong'].includes(place.id);
      } else if (currentActivePhase === 'inbound') {
        matchesPhase = ['poi_huppatat', 'charger_ptt_uthai_bypass', 'poi_watthasung', 'charger_nexmoev', 'charger_elex_egat_manorom', 'charger_ptt_manorom_ah2', 'poi_chainat_bird'].includes(place.id);
      }
    }

    // 2. Category Matching
    const matchesCategory = (currentActiveFilter === 'all') || (place.category === currentActiveFilter);

    return matchesPhase && matchesCategory;
  });
}

const PHASE_BOUNDS_PRESETS = {
  all: [
    [13.80, 99.40],
    [15.55, 100.45]
  ],
  outbound: [
    [13.80, 99.45],
    [15.12, 100.45]
  ],
  campsite: [
    [15.02, 99.44],
    [15.11, 99.55]
  ],
  inbound: [
    [13.80, 99.58],
    [15.52, 100.20]
  ]
};

function zoomToPhaseBounds(phase) {
  if (!mapInstance || typeof mapInstance.fitBounds !== 'function') return;

  const activePlaces = getFilteredPlaces();
  if (activePlaces.length > 0 && typeof L !== 'undefined' && typeof L.latLngBounds === 'function') {
    const coords = activePlaces.map(p => [p.lat, p.lng]);
    const bounds = L.latLngBounds(coords);
    const maxZoom = (phase === 'campsite') ? 14 : 12;
    mapInstance.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: maxZoom,
      animate: true,
      duration: 0.6
    });
  } else if (PHASE_BOUNDS_PRESETS[phase]) {
    mapInstance.fitBounds(PHASE_BOUNDS_PRESETS[phase], {
      padding: [40, 40],
      maxZoom: (phase === 'campsite') ? 14 : 12,
      animate: true,
      duration: 0.6
    });
  }
}

function updateRoutePolylines(phase) {
  if (!mapInstance) return;

  const hasOutbound = mapInstance.hasLayer ? mapInstance.hasLayer(outboundPolyline) : false;
  const hasInbound = mapInstance.hasLayer ? mapInstance.hasLayer(inboundPolyline) : false;

  if (phase === 'all') {
    if (outboundPolyline && !hasOutbound && typeof outboundPolyline.addTo === 'function') outboundPolyline.addTo(mapInstance);
    if (inboundPolyline && !hasInbound && typeof inboundPolyline.addTo === 'function') inboundPolyline.addTo(mapInstance);
    if (outboundPolyline && typeof outboundPolyline.setStyle === 'function') outboundPolyline.setStyle({ opacity: 0.95, weight: 5 });
    if (inboundPolyline && typeof inboundPolyline.setStyle === 'function') inboundPolyline.setStyle({ opacity: 0.95, weight: 5 });
  } else if (phase === 'outbound') {
    if (outboundPolyline && !hasOutbound && typeof outboundPolyline.addTo === 'function') outboundPolyline.addTo(mapInstance);
    if (inboundPolyline && hasInbound && typeof mapInstance.removeLayer === 'function') mapInstance.removeLayer(inboundPolyline);
    if (outboundPolyline && typeof outboundPolyline.setStyle === 'function') outboundPolyline.setStyle({ opacity: 1.0, weight: 6 });
  } else if (phase === 'campsite') {
    if (outboundPolyline && hasOutbound && typeof mapInstance.removeLayer === 'function') mapInstance.removeLayer(outboundPolyline);
    if (inboundPolyline && hasInbound && typeof mapInstance.removeLayer === 'function') mapInstance.removeLayer(inboundPolyline);
  } else if (phase === 'inbound') {
    if (outboundPolyline && hasOutbound && typeof mapInstance.removeLayer === 'function') mapInstance.removeLayer(outboundPolyline);
    if (inboundPolyline && !hasInbound && typeof inboundPolyline.addTo === 'function') inboundPolyline.addTo(mapInstance);
    if (inboundPolyline && typeof inboundPolyline.setStyle === 'function') inboundPolyline.setStyle({ opacity: 1.0, weight: 6 });
  }
}

function renderMapFilters() {
  const filterContainer = document.getElementById('mapFilterGroup');
  if (!filterContainer || typeof TRIP_DATA === 'undefined' || !TRIP_DATA.categories) return;

  filterContainer.innerHTML = TRIP_DATA.categories.map(cat => `
    <button class="filter-chip ${cat.id === currentActiveFilter ? 'active' : ''}" data-cat="${cat.id}">
      <i data-lucide="${cat.icon}" style="width: 14px; height: 14px;"></i>
      <span>${cat.name}</span>
    </button>
  `).join('');

  filterContainer.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentActiveFilter = btn.getAttribute('data-cat');
      renderMapMarkers();
    });
  });
}

function selectPlace(placeId, options = {}) {
  const {
    fromMarker = false,
    flyMap = true,
    openPopup = true,
    scrollList = true,
    zoom = 14
  } = options;

  if (!placeId || typeof TRIP_DATA === 'undefined' || !TRIP_DATA.places) return;
  const place = TRIP_DATA.places.find(p => p.id === placeId);
  if (!place) return;

  // 1. Synchronize DOM Card Elements
  const allCards = document.querySelectorAll('.map-place-card, .stop-card, .place-card');
  let targetCard = null;

  allCards.forEach(card => {
    const cardId = card.getAttribute('data-place-id') || card.getAttribute('data-id');
    const isTarget = (cardId === placeId);

    card.classList.toggle('active', isTarget);
    card.classList.toggle('selected', isTarget);
    card.setAttribute('aria-selected', isTarget.toString());

    if (isTarget) {
      targetCard = card;
      card.classList.add('card-highlight-pulse');
      setTimeout(() => card.classList.remove('card-highlight-pulse'), 1200);
    }
  });

  // 2. Smoothly Scroll Card into View
  if (targetCard && scrollList && typeof targetCard.scrollIntoView === 'function') {
    targetCard.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }

  // 3. Synchronize Leaflet Map & Marker
  const marker = markersMap[placeId];

  if (mapInstance && flyMap && typeof mapInstance.flyTo === 'function') {
    mapInstance.flyTo([place.lat, place.lng], zoom, {
      duration: 0.8,
      easeLinearity: 0.25
    });
  }

  if (marker && openPopup && !fromMarker && typeof marker.openPopup === 'function') {
    setTimeout(() => {
      if (marker && mapInstance) {
        marker.openPopup();
      }
    }, 150);
  }
}

function renderMapMarkers(category) {
  if (category !== undefined) {
    currentActiveFilter = category;
  }
  if (!markersLayerGroup || typeof TRIP_DATA === 'undefined' || !TRIP_DATA.places) return;
  
  if (typeof markersLayerGroup.clearLayers === 'function') {
    markersLayerGroup.clearLayers();
  }
  markersMap = {};
  window.markersMap = markersMap;

  const sidebarList = document.getElementById('mapPlacesList');
  const filteredPlaces = getFilteredPlaces();

  if (sidebarList) {
    if (filteredPlaces.length === 0) {
      sidebarList.innerHTML = `
        <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
          <i data-lucide="info" style="width: 28px; height: 28px; margin-bottom: 0.5rem; opacity: 0.7;"></i>
          <div>ไม่พบสถานที่ตามเงื่อนไขที่เลือก</div>
        </div>
      `;
    } else {
      sidebarList.innerHTML = filteredPlaces.map(place => {
        const foodList = (place.foodHighlights && place.foodHighlights.length > 0)
          ? place.foodHighlights
          : (place.recommendedMenu && place.recommendedMenu.length > 0 ? place.recommendedMenu : []);

        return `
          <article class="map-place-card stop-card ${place.isSuperHighlight ? 'super-highlight' : ''}" data-place-id="${place.id}" data-phase="${place.phase || ''}" data-category="${place.category}" role="button" tabindex="0" aria-label="${place.name}">
            <div class="stop-card-header">
              <div class="stop-card-title-group">
                <h3 class="stop-card-name">${place.name}</h3>
                <span class="stop-card-sub">${place.subCategory}</span>
              </div>
              <div class="stop-card-badges">
                <span class="badge ${getPhaseBadgeClass(place.phase)}">${getPhaseBadgeText(place.phase)}</span>
                <span class="badge ${getBadgeClass(place.category)}">${getCategoryName(place.category)}</span>
              </div>
            </div>

            <div class="stop-card-metrics">
              <span class="metric-pill dist">
                <i data-lucide="navigation-2" style="width: 13px; height: 13px;"></i>
                <span>${place.distanceFromOrigin} กม. จากบ้าน</span>
              </span>
              ${place.powerKw ? `
                <span class="metric-pill charger">
                  <i data-lucide="zap" style="width: 13px; height: 13px;"></i>
                  <span>⚡ ${place.powerKw} kW (${place.networkApp || 'DC Fast'})</span>
                </span>
              ` : ''}
              ${place.plugType ? `
                <span class="metric-pill plug">
                  <i data-lucide="plug-2" style="width: 13px; height: 13px;"></i>
                  <span>${place.plugType}</span>
                </span>
              ` : ''}
            </div>

            ${foodList.length > 0 ? `
              <div class="stop-food-section">
                <span class="food-label">🍽️ แนะนำ / ไฮไลท์:</span>
                <div class="food-pills-wrap">
                  ${foodList.slice(0, 3).map(food => `
                    <span class="food-pill">${food}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${place.tips ? `
              <div class="stop-card-tip">
                <i data-lucide="info" style="width: 14px; height: 14px; flex-shrink: 0; color: var(--primary);"></i>
                <span>${place.tips}</span>
              </div>
            ` : ''}

            <div class="stop-card-footer" style="margin-top: 0.25rem;">
              <a href="${place.navUrl || place.mapsUrl}" target="_blank" rel="noopener" class="btn-driver-nav btn-nav-full" aria-label="นำทางไป ${place.name}">
                <i data-lucide="navigation" style="width: 16px; height: 16px;"></i>
                <span>🚗 นำทาง (Navigate)</span>
              </a>
            </div>
          </article>
        `;
      }).join('');
    }

    sidebarList.querySelectorAll('.map-place-card, .stop-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button, .btn-driver-nav, .btn-nav-full')) return;
        const placeId = card.getAttribute('data-place-id');
        if (placeId) {
          selectPlace(placeId, { fromMarker: false, flyMap: true, openPopup: true, scrollList: false });
        }
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('a, button, .btn-driver-nav, .btn-nav-full')) return;
          e.preventDefault();
          const placeId = card.getAttribute('data-place-id');
          if (placeId) {
            selectPlace(placeId, { fromMarker: false, flyMap: true, openPopup: true, scrollList: false });
          }
        }
      });
    });
  }

  filteredPlaces.forEach(place => {
    const iconHtml = getMarkerIconHtml(place);
    const customIcon = L.divIcon ? L.divIcon({
      html: iconHtml,
      className: 'custom-leaflet-icon',
      iconSize: place.isSuperHighlight ? [48, 48] : [44, 44],
      iconAnchor: place.isSuperHighlight ? [24, 24] : [22, 22],
      popupAnchor: [0, -22]
    }) : {};

    const marker = L.marker([place.lat, place.lng], { icon: customIcon }).addTo(markersLayerGroup);
    markersMap[place.id] = marker;

    const popupContent = `
      <div class="popup-wrapper">
        <img class="popup-img" src="${place.image}" alt="${place.name}">
        <div class="popup-body">
          <div class="popup-title">${place.name}</div>
          <div class="popup-sub">${place.subCategory} • ห่างจุดเริ่มต้น ~${place.distanceFromOrigin} กม.</div>
          <p style="font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${place.description.substring(0, 120)}...</p>
          ${place.powerKw ? `<div style="font-size: 0.8rem; color: var(--primary); font-weight: 800; margin-bottom: 0.4rem;">⚡ ${place.powerKw} kW (${place.networkApp || 'DC Fast'})</div>` : (place.chargerInfo ? `<div style="font-size: 0.75rem; color: var(--primary); font-weight: 700; margin-bottom: 0.4rem;">⚡ ${place.chargerInfo.power}</div>` : '')}
          <a href="${place.navUrl || place.mapsUrl}" target="_blank" rel="noopener" class="popup-nav-btn btn-nav-full" style="min-height: 48px;">
            <span>🚗 เปิดนำทาง Google Maps</span>
          </a>
        </div>
      </div>
    `;

    if (marker && typeof marker.bindPopup === 'function') {
      marker.bindPopup(popupContent, {
        offset: [0, -10],
        maxWidth: 320,
        minWidth: 260,
        autoPan: true,
        autoPanPadding: [30, 30]
      });
    }

    if (marker && typeof marker.on === 'function') {
      marker.on('click', () => {
        selectPlace(place.id, {
          fromMarker: true,
          flyMap: false,
          openPopup: true,
          scrollList: true
        });
      });
    }
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function openPlacePopup(place) {
  if (place && place.id && markersMap[place.id]) {
    selectPlace(place.id, { fromMarker: false, flyMap: true, openPopup: true, scrollList: true });
    return;
  }
  markersLayerGroup.eachLayer(layer => {
    const latLng = layer.getLatLng();
    if (Math.abs(latLng.lat - place.lat) < 0.0001 && Math.abs(latLng.lng - place.lng) < 0.0001) {
      layer.openPopup();
    }
  });
}

function drawDirectionalRoutes() {
  const outboundCoords = [
    [13.817392, 100.414615],  // Home
    [14.38504, 99.9106289],   // Bang Pla Ma
    [14.529919, 99.910769],   // Plubplachai
    [14.7554597, 100.0947608],// Sam Chuk
    [14.841178, 99.689596],   // PTT Dan Chang (Main Outbound Charger)
    [15.0777806, 99.4981633]  // Owl Yard Campsite
  ];

  const inboundCoords = [
    [15.0777806, 99.4981633], // Owl Yard Campsite
    [15.0320, 99.4560],       // Wat Tham Khao Wong
    [15.0586269, 99.5168511], // Le Leela Cafe
    [15.0760, 99.5280],       // Giant Tree
    [15.3450, 99.6450],       // Ban Chai Khao Viewpoint
    [15.3780, 99.6300],       // Hup Pa Tat
    [15.3681817, 100.0155478],// PTT Uthai Thani Bypass (ทล.333)
    [15.3323969, 100.0724402],// Wat Tha Sung
    [15.482658, 100.1352141], // ⭐ NEXMOEV Charging Station (Phayuha Khiri)
    [15.3973033, 100.1477948],// EleX by EGAT Manorom
    [15.3493829, 100.1648069],// PTT Station Manorom (AH2)
    [15.2066066, 100.1515585],// Chainat Bird Park
    [14.9000, 100.4000],      // Sing Buri (Asian Highway AH2)
    [14.3500, 100.5500],      // Ayutthaya (Asian Highway AH2)
    [13.817392, 100.414615]   // Back Home
  ];

  if (outboundPolyline && mapInstance.hasLayer(outboundPolyline)) mapInstance.removeLayer(outboundPolyline);
  if (inboundPolyline && mapInstance.hasLayer(inboundPolyline)) mapInstance.removeLayer(inboundPolyline);

  outboundPolyline = L.polyline(outboundCoords, {
    color: '#047857',
    weight: 5,
    opacity: 0.95,
    dashArray: '10, 8',
    lineJoin: 'round'
  }).addTo(mapInstance).bindTooltip('🟢 ขาไป: นนทบุรี ➔ สุพรรณบุรี ➔ PTT ด่านช้าง (ชาร์จเต็ม) ➔ Owl Yard บ้านไร่', { sticky: true });

  inboundPolyline = L.polyline(inboundCoords, {
    color: '#b45309',
    weight: 5,
    opacity: 0.95,
    dashArray: '10, 8',
    lineJoin: 'round'
  }).addTo(mapInstance).bindTooltip('🟡 ขากลับ: บ้านไร่ ➔ หุบป่าตาด ➔ วัดท่าซุง ➔ ⭐ NEXMOEV ➔ ชัยนาท ➔ สายเอเชีย', { sticky: true });
}

function getPhaseBadgeClass(phase) {
  switch (phase) {
    case 'outbound': return 'badge-green';
    case 'campsite': return 'badge-amber';
    case 'inbound': return 'badge-blue';
    default: return 'badge-blue';
  }
}

function getPhaseBadgeText(phase) {
  switch (phase) {
    case 'outbound': return '🟢 ขาไป';
    case 'campsite': return '🏕️ รอบแคมป์';
    case 'inbound': return '🟡 ขากลับ';
    default: return '📍 การเดินทาง';
  }
}

function getMarkerIconHtml(place) {
  if (place.isSuperHighlight) {
    return `<div class="custom-map-pin pin-super-highlight" title="จุดชาร์จไฮไลท์!">⭐</div>`;
  }

  let iconName = '📍';
  let pinClass = 'pin-poi';

  switch (place.category) {
    case 'charger': iconName = '⚡'; pinClass = 'pin-charger'; break;
    case 'camp': iconName = '⛺'; pinClass = 'pin-camp'; break;
    case 'food': iconName = '🍽️'; pinClass = 'pin-food'; break;
    case 'cafe': iconName = '☕'; pinClass = 'pin-cafe'; break;
    case 'poi': iconName = '📍'; pinClass = 'pin-poi'; break;
    default: iconName = '📍'; pinClass = 'pin-poi';
  }

  return `<div class="custom-map-pin ${pinClass}">${iconName}</div>`;
}

function getBadgeClass(category) {
  switch (category) {
    case 'charger': return 'badge-green';
    case 'camp': return 'badge-amber';
    case 'food': return 'badge-red';
    case 'cafe': return 'badge-purple';
    case 'poi': return 'badge-blue';
    default: return 'badge-blue';
  }
}

function getCategoryName(category) {
  if (typeof TRIP_DATA === 'undefined' || !TRIP_DATA.categories) return 'สถานที่';
  const cat = TRIP_DATA.categories.find(c => c.id === category);
  return cat ? cat.name : 'สถานที่';
}

// --------------------------------------------------------------------------
// 5. "Charge & Chill" Hubs Matrix (Optional Container Helper)
// --------------------------------------------------------------------------
function initChargeAndChill() {
  const container = document.getElementById('chargeAndChillContainer');
  if (!container || typeof TRIP_DATA === 'undefined' || !TRIP_DATA.chargeAndChillHubs) return;

  container.innerHTML = TRIP_DATA.chargeAndChillHubs.map(hub => `
    <div class="place-card" style="border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
      <div class="place-card-body">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem;">${hub.name}</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">🚗 ระยะทางจากบ้าน: ${hub.distanceFromHome}</span>
          </div>
          <span class="badge ${hub.badgeColor}" style="font-size: 0.8rem;">${hub.badge}</span>
        </div>

        <div style="background: var(--primary-light); border-left: 3px solid var(--primary); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 700; color: var(--primary-hover); margin-bottom: 0.75rem;">
          ${hub.chargerSpecs}
        </div>

        <div style="margin-bottom: 0.75rem;">
          <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.35rem;">
            🍽️ ระหว่างรอชาร์จ มีอะไรให้กิน/ชิลบ้าง:
          </div>
          <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.3rem;">
            ${hub.whatToEatAndChill.map(item => `
              <li style="font-size: 0.825rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem;">
                <i data-lucide="check" style="width: 14px; height: 14px; color: var(--primary); flex-shrink: 0;"></i>
                <span>${item}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="background: var(--bg-card-subtle); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 0.75rem; border: 1px dashed var(--border-color);">
          💡 <strong>คำแนะนำความชิล:</strong> ${hub.chillAdvice}
        </div>

        <div class="place-card-footer">
          <a href="${hub.mapsUrl}" target="_blank" rel="noopener" class="btn-nav-full">
            <i data-lucide="navigation" style="width: 14px; height: 14px;"></i>
            <span>เปิดพิกัดนำทาง Google Maps</span>
          </a>
        </div>
      </div>
  `).join('');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

// --------------------------------------------------------------------------
// 6. EV Battery & 2-Car Comparison Simulator Engine (Milestone M3)
// --------------------------------------------------------------------------

/**
 * Pure calculation oracle function for EV camping energy balance
 */
function calculateEVEnergy({
  batteryCap,
  efficiency = 0.160,
  startSoc = 95.0,
  sleepHours = 8.0,
  acPowerKw = 1.0,
  useV2L = false,
  v2lPowerKwh = 2.0,
  driveDistanceKm = 45.0
}) {
  const cap = parseFloat(batteryCap) || 0;
  const eff = parseFloat(efficiency) > 0 ? parseFloat(efficiency) : 0.160;
  const start = Math.max(0, Math.min(100, parseFloat(startSoc) || 95.0));
  const sleep = Math.max(0, parseFloat(sleepHours) || 0);
  const ac = Math.max(0, parseFloat(acPowerKw) || 0);
  const v2l = Boolean(useV2L) ? (parseFloat(v2lPowerKwh) || 2.0) : 0.0;
  const dist = Math.max(0, parseFloat(driveDistanceKm) || 45.0);

  if (cap <= 0) {
    return {
      driveEnergyKwh: 0,
      arrivalSoc: 0,
      arrivalKwh: 0,
      sleepEnergyKwh: 0,
      morningSoc: 0,
      morningKwh: 0,
      morningRangeKm: 0,
      safetyRatio: 0,
      safetyStatus: 'danger'
    };
  }

  // 1. Driving energy from Dan Chang to Owl Yard Campsite (45 km)
  const driveEnergyKwh = dist * eff;
  const startKwh = (start / 100.0) * cap;
  const arrivalKwh = Math.max(0, startKwh - driveEnergyKwh);
  const arrivalSoc = Math.max(0, Math.min(100, (arrivalKwh / cap) * 100.0));

  // 2. Overnight Camp energy drain (AC + optional V2L)
  const acEnergyKwh = sleep * ac;
  const sleepEnergyKwh = acEnergyKwh + v2l;

  // 3. Morning Status
  const morningKwh = Math.max(0, arrivalKwh - sleepEnergyKwh);
  const morningSoc = Math.max(0, Math.min(100, (morningKwh / cap) * 100.0));

  // 4. Remaining Range & Convoy Safety Margin vs Next 65 km Charger (PTT Bypass Uthai Thani)
  const morningRangeKm = morningKwh / eff;
  const safetyRatio = morningRangeKm / 65.0;

  let safetyStatus = 'safe';
  if (safetyRatio < 1.0) {
    safetyStatus = 'danger';
  } else if (safetyRatio < 2.0) {
    safetyStatus = 'warning';
  }

  return {
    driveEnergyKwh,
    arrivalSoc,
    arrivalKwh,
    sleepEnergyKwh,
    morningSoc,
    morningKwh,
    morningRangeKm,
    safetyRatio,
    safetyStatus
  };
}

window.calculateEVEnergy = calculateEVEnergy;

function initEVSimulator() {
  const car1ModelSelect = document.getElementById('simCar1Model');
  const car2ModelSelect = document.getElementById('simCar2Model');
  const car1CapInput = document.getElementById('simCar1Cap');
  const car2CapInput = document.getElementById('simCar2Cap');
  const sleepHoursInput = document.getElementById('simSleepHours');
  const acPowerInput = document.getElementById('simAcPower');
  const v2lToggle = document.getElementById('simV2lToggle');
  const climatePills = document.querySelectorAll('#climatePresetGroup .climate-pill');
  const sleepChips = document.querySelectorAll('#sleepChipsGroup .chip-btn');

  // Default / Persistent Simulator State
  const defaultState = {
    car1Model: 'byd_atto3_ext',
    car1Cap: 60.5,
    car1Eff: 0.160,
    car1Name: 'BYD Atto 3 (Extended)',
    car2Model: 'byd_dolphin_std',
    car2Cap: 44.9,
    car2Eff: 0.140,
    car2Name: 'BYD Dolphin (Standard)',
    climateMode: 'normal',
    acPower: 1.0,
    sleepHours: 8,
    v2lEnabled: false
  };

  let simState = { ...defaultState };

  // Restore State from LocalStorage
  try {
    const saved = localStorage.getItem('ev_convoy_sim_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      simState = { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.warn('Unable to read saved simulator state from localStorage:', e);
  }

  window.SimState = simState;

  // 1. Populate Model Preset Selectors from TRIP_DATA.evPresets
  function populateModelPresets() {
    if (typeof TRIP_DATA === 'undefined' || !TRIP_DATA.evPresets) return;
    const presets = TRIP_DATA.evPresets;

    const generateOptions = (selectedId) => {
      return presets.map(preset => {
        const isSelected = (preset.id === selectedId) ? 'selected' : '';
        const capText = (preset.id === 'custom') ? '' : ` (${preset.batteryCap || preset.capacity} kWh)`;
        return `<option value="${preset.id}" ${isSelected}>${preset.name || `${preset.brand} ${preset.model}`}${capText}</option>`;
      }).join('');
    };

    if (car1ModelSelect) car1ModelSelect.innerHTML = generateOptions(simState.car1Model);
    if (car2ModelSelect) car2ModelSelect.innerHTML = generateOptions(simState.car2Model);
  }

  // 2. Save State to LocalStorage
  function persistState() {
    try {
      localStorage.setItem('ev_convoy_sim_v2', JSON.stringify(simState));
    } catch (e) {
      // localStorage may be unavailable in restricted sandbox
    }
  }

  // 3. Update Visual Battery Gauges & Elements
  function updateBatteryVisuals(carIndex, res, cap, name) {
    const prefix = (carIndex === 1) ? 'c1' : 'c2';
    const fillEl = document.getElementById(`${prefix}BatteryFill`);
    const socOverlayEl = document.getElementById(`${prefix}SocOverlay`);
    const morningSocEl = document.getElementById(`${prefix}MorningSoc`);
    const morningRangeEl = document.getElementById(`${prefix}MorningRange`);
    const safetyBadgeEl = document.getElementById(`${prefix}SafetyBadge`);
    const safetyRatioEl = document.getElementById(`${prefix}SafetyRatio`);

    const arrivalSocEl = document.getElementById(`${prefix}ArrivalSoc`);
    const arrivalKwhEl = document.getElementById(`${prefix}ArrivalKwh`);
    const sleepEnergyEl = document.getElementById(`${prefix}SleepEnergy`);
    const modelBadgeEl = document.getElementById(`${prefix}ModelBadge`);
    const capBadgeEl = document.getElementById(`${prefix}CapBadge`);
    const startValEl = document.getElementById(`${prefix}StartVal`);
    const driveValEl = document.getElementById(`${prefix}DriveVal`);
    const morningValEl = document.getElementById(`${prefix}MorningVal`);

    const roundSoc = Math.round(res.morningSoc);
    const roundArrival = Math.round(res.arrivalSoc);
    const roundRange = Math.round(res.morningRangeKm);

    // Battery Fill Animation & Color Thresholds
    if (fillEl) {
      fillEl.style.height = `${Math.max(0, Math.min(100, roundSoc))}%`;
      fillEl.classList.remove('fill-green', 'fill-amber', 'fill-red');
      if (roundSoc >= 50) {
        fillEl.classList.add('fill-green');
      } else if (roundSoc >= 25) {
        fillEl.classList.add('fill-amber');
      } else {
        fillEl.classList.add('fill-red');
      }
    }

    if (socOverlayEl) socOverlayEl.textContent = `${roundSoc}%`;
    if (morningSocEl) morningSocEl.textContent = `${roundSoc}%`;
    if (morningRangeEl) morningRangeEl.textContent = `~${roundRange} กม.`;

    if (arrivalSocEl) arrivalSocEl.textContent = `${roundArrival}%`;
    if (arrivalKwhEl) arrivalKwhEl.textContent = `(${res.arrivalKwh.toFixed(1)} kWh)`;
    if (sleepEnergyEl) {
      const sleepPct = cap > 0 ? Math.round((res.sleepEnergyKwh / cap) * 100) : 0;
      sleepEnergyEl.textContent = `${res.sleepEnergyKwh.toFixed(1)} kWh (${sleepPct}%)`;
    }

    if (modelBadgeEl) modelBadgeEl.textContent = name;
    if (capBadgeEl) capBadgeEl.textContent = `${cap.toFixed(1)} kWh`;
    if (startValEl) startValEl.textContent = `${(0.95 * cap).toFixed(1)} kWh`;
    if (driveValEl) {
      const drivePct = cap > 0 ? ((res.driveEnergyKwh / cap) * 100).toFixed(1) : 0;
      driveValEl.textContent = `-${res.driveEnergyKwh.toFixed(1)} kWh (-${drivePct}%)`;
    }
    if (morningValEl) morningValEl.textContent = `${roundSoc}% (${res.morningKwh.toFixed(1)} kWh)`;

    // Safety Margin Badge & Subtext
    if (safetyRatioEl) {
      safetyRatioEl.textContent = `${res.safetyRatio.toFixed(1)}x vs ปตท.เลี่ยงเมืองอุทัยฯ (65 กม.)`;
    }

    if (safetyBadgeEl) {
      safetyBadgeEl.classList.remove('badge-green', 'badge-amber', 'badge-red');
      if (res.safetyRatio >= 2.5) {
        safetyBadgeEl.className = 'safety-badge badge-green';
        safetyBadgeEl.textContent = `🟢 ปลอดภัยมาก (${res.safetyRatio.toFixed(1)}x)`;
      } else if (res.safetyRatio >= 1.5) {
        safetyBadgeEl.className = 'safety-badge badge-amber';
        safetyBadgeEl.textContent = `🟡 เพียงพอ (${res.safetyRatio.toFixed(1)}x)`;
      } else {
        safetyBadgeEl.className = 'safety-badge badge-red';
        safetyBadgeEl.textContent = `🔴 ควรระวัง (${res.safetyRatio.toFixed(1)}x)`;
      }
    }
  }

  // 4. Main Calculation & Re-render Routine
  function calculateAndRenderSim() {
    const car1Cap = parseFloat(simState.car1Cap) || 60.5;
    const car2Cap = parseFloat(simState.car2Cap) || 44.9;
    const sleepHours = parseFloat(simState.sleepHours) || 8;
    const acPower = parseFloat(simState.acPower) || 1.0;
    const useV2L = Boolean(simState.v2lEnabled);

    // Sync input displays
    if (document.getElementById('valCar1Cap')) document.getElementById('valCar1Cap').textContent = `${car1Cap.toFixed(1)} kWh`;
    if (document.getElementById('valCar2Cap')) document.getElementById('valCar2Cap').textContent = `${car2Cap.toFixed(1)} kWh`;
    if (document.getElementById('c1SliderLabel')) document.getElementById('c1SliderLabel').textContent = `${car1Cap.toFixed(1)} kWh`;
    if (document.getElementById('c2SliderLabel')) document.getElementById('c2SliderLabel').textContent = `${car2Cap.toFixed(1)} kWh`;
    if (document.getElementById('valSleepHours')) document.getElementById('valSleepHours').textContent = `${sleepHours} ชม.`;
    if (document.getElementById('valAcPower')) document.getElementById('valAcPower').textContent = `${acPower.toFixed(1)} kW/ชม.`;

    if (car1CapInput && Math.abs(parseFloat(car1CapInput.value) - car1Cap) > 0.05) car1CapInput.value = car1Cap;
    if (car2CapInput && Math.abs(parseFloat(car2CapInput.value) - car2Cap) > 0.05) car2CapInput.value = car2Cap;
    if (sleepHoursInput && parseInt(sleepHoursInput.value, 10) !== sleepHours) sleepHoursInput.value = sleepHours;
    if (acPowerInput && Math.abs(parseFloat(acPowerInput.value) - acPower) > 0.05) acPowerInput.value = acPower;
    if (v2lToggle) v2lToggle.checked = useV2L;

    // Calculate Car 1 & Car 2
    const res1 = calculateEVEnergy({
      batteryCap: car1Cap,
      efficiency: simState.car1Eff || 0.160,
      startSoc: 95.0,
      sleepHours: sleepHours,
      acPowerKw: acPower,
      useV2L: useV2L
    });

    const res2 = calculateEVEnergy({
      batteryCap: car2Cap,
      efficiency: simState.car2Eff || 0.140,
      startSoc: 95.0,
      sleepHours: sleepHours,
      acPowerKw: acPower,
      useV2L: false // Car 2 typically does not power shared V2L cooker
    });

    // Update visuals
    updateBatteryVisuals(1, res1, car1Cap, simState.car1Name || 'รถคันที่ 1');
    updateBatteryVisuals(2, res2, car2Cap, simState.car2Name || 'รถคันที่ 2');

    // Dynamic Convoy Intelligence Advice
    const adviceBox = document.getElementById('convoyAdviceText');
    if (adviceBox) {
      const v2lNote = useV2L ? ' + เสียบ V2L ทำอาหาร (+2.0 kWh)' : '';
      const bothSafe = (res1.safetyRatio >= 2.0 && res2.safetyRatio >= 2.0);
      const minRange = Math.min(res1.morningRangeKm, res2.morningRangeKm);

      let adviceSummary = '';
      if (bothSafe) {
        adviceSummary = `
          🟢 <strong>ประเมินความปลอดภัยขบวน: ปลอดภัยสูงมาก 100%!</strong><br>
          • <strong>รถทั้ง 2 คัน</strong> มีระยะทางคงเหลือมากกว่า <strong>${Math.round(minRange)} กม.</strong> ซึ่งเกินระยะไปยังจุดชาร์จถัดไป (ปตท.เลี่ยงเมืองอุทัยฯ 65 กม.) มากกว่า <strong>${Math.min(res1.safetyRatio, res2.safetyRatio).toFixed(1)} เท่า</strong><br>
          • <strong>ตื่นเช้าวันที่ 2:</strong> สามารถขับพาเที่ยว <strong>หุบป่าตาด</strong> (35 กม.) ➔ <strong>วัดท่าซุง</strong> (30 กม.) แล้วมุ่งหน้าไปชาร์จไฟที่ <strong>⭐ NEXMOEV Mega Station พยุหะคีรี</strong> (มี 12 ตู้ 120 kW + ห้องแอร์นวด VIP ฟรี) ได้อย่างสบายใจไร้กังวล!<br>
          • <strong>สถิติการใช้ไฟ:</strong> เปิดแอร์นอน ${sleepHours} ชม.${v2lNote} ใช้ไฟรวม <strong>${res1.sleepEnergyKwh.toFixed(1)} kWh</strong> (คันที่ 1 เหลือ ${Math.round(res1.morningSoc)}%, คันที่ 2 เหลือ ${Math.round(res2.morningSoc)}%)
        `;
      } else if (res1.safetyRatio >= 1.0 && res2.safetyRatio >= 1.0) {
        adviceSummary = `
          🟡 <strong>ประเมินความปลอดภัยขบวน: เพียงพอสำหรับเดินทาง</strong><br>
          • รถคันที่เหลือระยะน้อยที่สุดวิ่งต่อได้ <strong>~${Math.round(minRange)} กม.</strong> เพียงพอต่อการเดินทางไปยัง ปตท.เลี่ยงเมืองอุทัยฯ (65 กม.)<br>
          • <strong>คำแนะนำ:</strong> หลังเที่ยวหุบป่าตาด แนะนำแวะเติมไฟสั้นๆ 15-20 นาที ที่ <strong>PTT Station เลี่ยงเมืองอุทัยฯ (ทล.333)</strong> ก่อนเดินทางต่อไปวัดท่าซุงและ NEXMOEV
        `;
      } else {
        adviceSummary = `
          🔴 <strong>ประเมินความปลอดภัยขบวน: แบตเตอรี่ค่อนข้างจำกัด ควรระวัง</strong><br>
          • มีรถในขบวนเหลือระยะทางน้อยกว่า 65 กม. อาจไม่เพียงพอสำหรับขับไปถึง ปตท.เลี่ยงเมืองอุทัยฯ<br>
          • <strong>คำแนะนำเร่งด่วน:</strong> ให้แวะชาร์จไฟที่ <strong>PEA VOLTA การไฟฟ้าบ้านไร่ (ห่างลาน Owl Yard เพียง 5 กม.)</strong> ให้ได้ 70-80% ก่อนออกเดินทางสู่หุบป่าตาด
        `;
      }

      adviceBox.innerHTML = adviceSummary;
    }

    persistState();
  }

  // 5. Setup Controls Event Handlers

  // Preset Selection Handlers
  function handleModelChange(carIndex, presetId) {
    if (typeof TRIP_DATA === 'undefined' || !TRIP_DATA.evPresets) return;
    const preset = TRIP_DATA.evPresets.find(p => p.id === presetId);
    if (!preset) return;

    if (carIndex === 1) {
      simState.car1Model = preset.id;
      simState.car1Name = preset.name || `${preset.brand} ${preset.model}`;
      if (preset.id !== 'custom') {
        simState.car1Cap = preset.batteryCap || preset.capacity;
        simState.car1Eff = preset.consumption || preset.efficiency || 0.160;
      }
    } else {
      simState.car2Model = preset.id;
      simState.car2Name = preset.name || `${preset.brand} ${preset.model}`;
      if (preset.id !== 'custom') {
        simState.car2Cap = preset.batteryCap || preset.capacity;
        simState.car2Eff = preset.consumption || preset.efficiency || 0.140;
      }
    }

    calculateAndRenderSim();
  }

  if (car1ModelSelect) {
    car1ModelSelect.addEventListener('change', (e) => handleModelChange(1, e.target.value));
  }

  if (car2ModelSelect) {
    car2ModelSelect.addEventListener('change', (e) => handleModelChange(2, e.target.value));
  }

  // Slider Inputs Handlers
  if (car1CapInput) {
    car1CapInput.addEventListener('input', (e) => {
      simState.car1Cap = parseFloat(e.target.value);
      // If not matching preset capacity, set select to custom
      const matched = TRIP_DATA.evPresets && TRIP_DATA.evPresets.find(p => p.id !== 'custom' && Math.abs((p.batteryCap || p.capacity) - simState.car1Cap) < 0.05);
      if (matched) {
        simState.car1Model = matched.id;
        simState.car1Name = matched.name;
        simState.car1Eff = matched.consumption || matched.efficiency;
        if (car1ModelSelect) car1ModelSelect.value = matched.id;
      } else {
        simState.car1Model = 'custom';
        simState.car1Name = `กำหนดเอง (${simState.car1Cap} kWh)`;
        if (car1ModelSelect) car1ModelSelect.value = 'custom';
      }
      calculateAndRenderSim();
    });
  }

  if (car2CapInput) {
    car2CapInput.addEventListener('input', (e) => {
      simState.car2Cap = parseFloat(e.target.value);
      const matched = TRIP_DATA.evPresets && TRIP_DATA.evPresets.find(p => p.id !== 'custom' && Math.abs((p.batteryCap || p.capacity) - simState.car2Cap) < 0.05);
      if (matched) {
        simState.car2Model = matched.id;
        simState.car2Name = matched.name;
        simState.car2Eff = matched.consumption || matched.efficiency;
        if (car2ModelSelect) car2ModelSelect.value = matched.id;
      } else {
        simState.car2Model = 'custom';
        simState.car2Name = `กำหนดเอง (${simState.car2Cap} kWh)`;
        if (car2ModelSelect) car2ModelSelect.value = 'custom';
      }
      calculateAndRenderSim();
    });
  }

  // Climate Presets Pills Handlers
  climatePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const power = parseFloat(pill.getAttribute('data-power')) || 1.0;
      const mode = pill.getAttribute('data-climate') || 'normal';

      climatePills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');

      simState.climateMode = mode;
      simState.acPower = power;
      calculateAndRenderSim();
    });
  });

  if (acPowerInput) {
    acPowerInput.addEventListener('input', (e) => {
      const power = parseFloat(e.target.value);
      simState.acPower = power;

      // Sync active state of pills
      let foundMatch = false;
      climatePills.forEach(p => {
        const pillPower = parseFloat(p.getAttribute('data-power'));
        const isMatch = Math.abs(pillPower - power) < 0.05;
        p.classList.toggle('active', isMatch);
        p.setAttribute('aria-pressed', isMatch.toString());
        if (isMatch) {
          simState.climateMode = p.getAttribute('data-climate');
          foundMatch = true;
        }
      });
      if (!foundMatch) {
        simState.climateMode = 'custom';
      }

      calculateAndRenderSim();
    });
  }

  // Sleep Duration Chips Handlers
  sleepChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const hours = parseInt(chip.getAttribute('data-hours'), 10) || 8;
      sleepChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');

      simState.sleepHours = hours;
      calculateAndRenderSim();
    });
  });

  if (sleepHoursInput) {
    sleepHoursInput.addEventListener('input', (e) => {
      const hours = parseInt(e.target.value, 10);
      simState.sleepHours = hours;

      sleepChips.forEach(c => {
        const chipHours = parseInt(c.getAttribute('data-hours'), 10);
        const isMatch = (chipHours === hours);
        c.classList.toggle('active', isMatch);
        c.setAttribute('aria-pressed', isMatch.toString());
      });

      calculateAndRenderSim();
    });
  }

  // V2L Toggle Handler
  if (v2lToggle) {
    v2lToggle.addEventListener('change', (e) => {
      simState.v2lEnabled = Boolean(e.target.checked);
      calculateAndRenderSim();
    });
  }

  // Initial populate and render
  populateModelPresets();
  calculateAndRenderSim();
}

