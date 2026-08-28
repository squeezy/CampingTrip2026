// ==========================================================================
// EV Camping Trip - Application Logic & Interactivity (Clean 3-Tab Architecture)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
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
// 2. Tab Navigation (Desktop & Mobile)
// --------------------------------------------------------------------------
function initNavigation() {
  const desktopButtons = document.querySelectorAll('.nav-desktop .nav-btn');
  const mobileButtons = document.querySelectorAll('.mobile-nav-bar .mobile-nav-item');
  const tabPanes = document.querySelectorAll('.tab-content');

  function switchTab(targetTabId) {
    tabPanes.forEach(pane => {
      if (pane.id === targetTabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    desktopButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    mobileButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (targetTabId === 'tab-map' && window.mapInstance) {
      setTimeout(() => {
        window.mapInstance.invalidateSize();
      }, 200);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  desktopButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  mobileButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  document.querySelectorAll('[data-goto-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-goto-tab'));
    });
  });
}

// --------------------------------------------------------------------------
// 3. Interactive Leaflet Map with Directional Colored Routes
// --------------------------------------------------------------------------
let mapInstance = null;
let mapTileLayer = null;
let markersLayerGroup = null;
let outboundPolyline = null;
let inboundPolyline = null;
let currentActiveFilter = 'all';

function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  mapInstance = L.map('map', {
    center: [14.75, 99.95],
    zoom: 9,
    zoomControl: true
  });
  window.mapInstance = mapInstance;

  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  updateMapTiles(theme);

  markersLayerGroup = L.layerGroup().addTo(mapInstance);

  renderMapFilters();
  renderMapMarkers('all');
  drawDirectionalRoutes();

  // Ensure map tiles render sharply
  setTimeout(() => {
    mapInstance.invalidateSize();
  }, 300);
}

function updateMapTiles(theme) {
  if (mapTileLayer) {
    mapInstance.removeLayer(mapTileLayer);
  }

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  mapTileLayer = L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  }).addTo(mapInstance);
}

function renderMapFilters() {
  const filterContainer = document.getElementById('mapFilterGroup');
  if (!filterContainer) return;

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
      renderMapMarkers(currentActiveFilter);
    });
  });
}

function renderMapMarkers(category) {
  if (!markersLayerGroup) return;
  markersLayerGroup.clearLayers();

  const sidebarList = document.getElementById('mapPlacesList');
  const filteredPlaces = category === 'all' 
    ? TRIP_DATA.places 
    : TRIP_DATA.places.filter(p => p.category === category);

  if (sidebarList) {
    sidebarList.innerHTML = filteredPlaces.map(place => `
      <div class="map-place-card ${place.isSuperHighlight ? 'super-highlight' : ''}" data-place-id="${place.id}">
        <div class="map-place-card-header">
          <span class="map-place-name">${place.name}</span>
          <span class="badge ${getBadgeClass(place.category)}">${getCategoryName(place.category)}</span>
        </div>
        <div class="map-place-sub">${place.subCategory} • ห่างจุดเริ่มต้น ~${place.distanceFromOrigin} กม.</div>
      </div>
    `).join('');

    sidebarList.querySelectorAll('.map-place-card').forEach(card => {
      card.addEventListener('click', () => {
        const placeId = card.getAttribute('data-place-id');
        const place = TRIP_DATA.places.find(p => p.id === placeId);
        if (place) {
          mapInstance.flyTo([place.lat, place.lng], 14, { duration: 1 });
          openPlacePopup(place);
        }
      });
    });
  }

  filteredPlaces.forEach(place => {
    const iconHtml = getMarkerIconHtml(place);
    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-leaflet-icon',
      iconSize: place.isSuperHighlight ? [44, 44] : [36, 36],
      iconAnchor: place.isSuperHighlight ? [22, 22] : [18, 18],
      popupAnchor: [0, -20]
    });

    const marker = L.marker([place.lat, place.lng], { icon: customIcon }).addTo(markersLayerGroup);

    const popupContent = `
      <div class="popup-wrapper">
        <img class="popup-img" src="${place.image}" alt="${place.name}">
        <div class="popup-body">
          <div class="popup-title">${place.name}</div>
          <div class="popup-sub">${place.subCategory}</div>
          <p style="font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${place.description.substring(0, 110)}...</p>
          ${place.chargerInfo ? `<div style="font-size: 0.75rem; color: #10b981; font-weight: 700; margin-bottom: 0.4rem;">⚡ ${place.chargerInfo.power}</div>` : ''}
          <a href="${place.mapsUrl}" target="_blank" rel="noopener" class="popup-nav-btn">
            <span>🧭 เปิดนำทาง Google Maps</span>
          </a>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
  });
}

function openPlacePopup(place) {
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

  if (outboundPolyline) mapInstance.removeLayer(outboundPolyline);
  if (inboundPolyline) mapInstance.removeLayer(inboundPolyline);

  outboundPolyline = L.polyline(outboundCoords, {
    color: '#10b981',
    weight: 5,
    opacity: 0.9,
    dashArray: '10, 8',
    lineJoin: 'round'
  }).addTo(mapInstance).bindTooltip('🟢 ขาไป: นนทบุรี ➔ สุพรรณบุรี ➔ PTT ด่านช้าง (ชาร์จเต็ม) ➔ Owl Yard บ้านไร่', { sticky: true });

  inboundPolyline = L.polyline(inboundCoords, {
    color: '#f59e0b',
    weight: 5,
    opacity: 0.9,
    dashArray: '10, 8',
    lineJoin: 'round'
  }).addTo(mapInstance).bindTooltip('🟡 ขากลับ: บ้านไร่ ➔ หุบป่าตาด ➔ วัดท่าซุง ➔ ⭐ NEXMOEV ➔ ชัยนาท ➔ สายเอเชีย', { sticky: true });
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
  const cat = TRIP_DATA.categories.find(c => c.id === category);
  return cat ? cat.name : 'สถานที่';
}

// --------------------------------------------------------------------------
// 4. "Charge & Chill" Hubs Matrix (แวะกิน-แวะชิล พร้อมชาร์จไฟ)
// --------------------------------------------------------------------------
function initChargeAndChill() {
  const container = document.getElementById('chargeAndChillContainer');
  if (!container) return;

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

        <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 700; color: #10b981; margin-bottom: 0.75rem;">
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
    </div>
  `).join('');

  lucide.createIcons();
}

// --------------------------------------------------------------------------
// 5. EV Battery & 2-Car Comparison Simulator
// --------------------------------------------------------------------------
function initEVSimulator() {
  const car1CapInput = document.getElementById('simCar1Cap');
  const car2CapInput = document.getElementById('simCar2Cap');
  const sleepHoursInput = document.getElementById('simSleepHours');
  const acPowerInput = document.getElementById('simAcPower');

  function calculateAndRenderSim() {
    const car1Cap = parseFloat(car1CapInput ? car1CapInput.value : 60);
    const car2Cap = parseFloat(car2CapInput ? car2CapInput.value : 50);
    const sleepHours = parseFloat(sleepHoursInput.value);
    const acPower = parseFloat(acPowerInput.value);

    if (document.getElementById('valCar1Cap')) document.getElementById('valCar1Cap').textContent = `${car1Cap} kWh`;
    if (document.getElementById('valCar2Cap')) document.getElementById('valCar2Cap').textContent = `${car2Cap} kWh`;
    document.getElementById('valSleepHours').textContent = `${sleepHours} ชม.`;
    document.getElementById('valAcPower').textContent = `${acPower} kW/ชม.`;

    const sleepEnergyUsed = sleepHours * acPower;
    const car1SleepPercent = (sleepEnergyUsed / car1Cap) * 100;
    const car2SleepPercent = (sleepEnergyUsed / car2Cap) * 100;

    const danChangToOwlYardKwh = 7.2;
    const car1ArrivalSoc = Math.max(0, 95 - (danChangToOwlYardKwh / car1Cap) * 100);
    const car2ArrivalSoc = Math.max(0, 95 - (danChangToOwlYardKwh / car2Cap) * 100);

    const car1MorningSoc = Math.max(0, car1ArrivalSoc - car1SleepPercent);
    const car2MorningSoc = Math.max(0, car2ArrivalSoc - car2SleepPercent);

    const car1MorningRange = ((car1MorningSoc / 100) * car1Cap / 16) * 100;
    const car2MorningRange = ((car2MorningSoc / 100) * car2Cap / 16) * 100;

    if (document.getElementById('c1ArrivalSoc')) document.getElementById('c1ArrivalSoc').textContent = `${Math.round(car1ArrivalSoc)}%`;
    if (document.getElementById('c1SleepEnergy')) document.getElementById('c1SleepEnergy').textContent = `${sleepEnergyUsed.toFixed(1)} kWh (${Math.round(car1SleepPercent)}%)`;
    if (document.getElementById('c1MorningSoc')) document.getElementById('c1MorningSoc').textContent = `${Math.round(car1MorningSoc)}%`;
    if (document.getElementById('c1MorningRange')) document.getElementById('c1MorningRange').textContent = `~${Math.round(car1MorningRange)} กม.`;

    if (document.getElementById('c2ArrivalSoc')) document.getElementById('c2ArrivalSoc').textContent = `${Math.round(car2ArrivalSoc)}%`;
    if (document.getElementById('c2SleepEnergy')) document.getElementById('c2SleepEnergy').textContent = `${sleepEnergyUsed.toFixed(1)} kWh (${Math.round(car2SleepPercent)}%)`;
    if (document.getElementById('c2MorningSoc')) document.getElementById('c2MorningSoc').textContent = `${Math.round(car2MorningSoc)}%`;
    if (document.getElementById('c2MorningRange')) document.getElementById('c2MorningRange').textContent = `~${Math.round(car2MorningRange)} กม.`;

    const adviceBox = document.getElementById('convoyAdviceText');
    if (adviceBox) {
      adviceBox.innerHTML = `
        ⚡ <strong>กลยุทธ์ชาร์จไฟสำหรับขบวน 2 คัน (ออก 9 โมงเช้า):</strong><br>
        1. <strong>ขาไป:</strong> ขับชิลๆ 175 กม. ไปแวะกินมื้อเที่ยงที่ <strong>PTT ด่านช้าง</strong> ชาร์จไฟ 30 นาทีให้ได้ 85-95% ทั้ง 2 คัน<br>
        2. <strong>ตอนนอน:</strong> เปิดแอร์นอน ${sleepHours} ชม. ใช้ไฟ ${sleepEnergyUsed.toFixed(1)} kWh ตื่นเช้ามา <strong>คันที่ 1 (${car1Cap} kWh)</strong> จะเหลือแบต <strong>~${Math.round(car1MorningSoc)}%</strong> และ <strong>คันที่ 2 (${car2Cap} kWh)</strong> จะเหลือแบต <strong>~${Math.round(car2MorningSoc)}%</strong><br>
        3. <strong>ขากลับ:</strong> วิ่งเที่ยวหุบป่าตาด ➔ วัดท่าซุง ➔ ไปชาร์จไฮไลท์ที่ <strong>NEXMOEV พยุหะคีรี</strong> (มี 12 หัว ชาร์จพร้อมกันได้ทันที + นั่งนวด VIP ฟรี) จากนั้นยิงยาวเข้าสายเอเชียกลับบ้านได้อย่างสบายใจ 100%!
      `;
    }
  }

  [car1CapInput, car2CapInput, sleepHoursInput, acPowerInput].forEach(slider => {
    if (slider) {
      slider.addEventListener('input', calculateAndRenderSim);
    }
  });

  calculateAndRenderSim();
}
