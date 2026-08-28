# Milestone 2 Technical Analysis & Specification: Stop Cards Data & 1-Tap Navigation

**Author**: M2 Explorer 2 (Stop Cards Data & 1-Tap Navigation)  
**Date**: 2026-08-28  
**Scope**: Unified 20-Place Data Enrichment, Driver Stop Card HTML/CSS Architecture, 1-Tap Google Maps Navigation Intent

---

## 1. Executive Summary

Milestone 2 requires upgrading the trip and route view from static information boxes into a responsive, driver-ergonomic journey feed synchronized with the interactive Leaflet map. This document provides:
1. **Complete Data Enrichment Specification for all 20 Places**: Adding `phase` ('outbound' | 'campsite' | 'inbound'), `powerKw`, `plugType`, `networkApp`, `foodHighlights`, and standard Google Maps direct intent `navUrl` (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`).
2. **Redesigned Driver Stop Card HTML/CSS Template**: Featuring prominent typography, high-contrast badges, charging speed pills (⚡ 120/160 kW), food highlight chips, and a high-visibility >=48px 1-tap navigation CTA button.
3. **Integration & Rendering Contract**: Clear interface definition for `app.js` renderer and `style.css` design system.

---

## 2. Master Places Data Model (`TRIP_DATA.places`)

### 2.1 TypeScript Interface Contract

```typescript
export interface PlaceItem {
  id: string;                          // Unique identifier (e.g. 'charger_nexmoev')
  name: string;                        // Prominent display name
  category: 'camp' | 'charger' | 'food' | 'cafe' | 'poi';
  subCategory: string;                 // Descriptive sub-title
  phase: 'outbound' | 'campsite' | 'inbound'; // 3-phase journey leg
  lat: number;                         // Latitude coordinate
  lng: number;                         // Longitude coordinate
  distanceFromOrigin: number;          // Distance in km from starting point (Bangkok/Nonthaburi)
  powerKw?: number;                    // Peak DC fast charging capacity (kW)
  plugType?: string;                   // Connector specification (e.g. 'CCS2 12 หัว', 'CCS2 2 หัว')
  networkApp?: string;                 // Primary mobile app (e.g. 'NEXMOEV', 'EV Station PluZ', 'EleXA')
  foodHighlights?: string[];           // Signature dishes / amenities
  navUrl: string;                      // Direct navigation intent URL
  mapsUrl?: string;                    // Short web map link (fallback/share)
  image?: string;                      // Card banner photo URL
  description: string;                 // Detailed description text
  tips?: string;                       // Crucial driver guidance
  openingHours?: string;               // Operating hours
  phone?: string;                      // Contact phone number
  highlight?: boolean;                 // Featured landmark flag
  isSuperHighlight?: boolean;          // Super-station highlight flag (NEXMOEV)
}
```

---

### 2.2 Complete 20-Place Dataset Specification

| # | ID | Name | Category | Phase | Dist (km) | Power (kW) | Network / Plug | Food Highlights / Amenities | Direct navUrl |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `home` | บ้าน (จุดเริ่มต้น / ปลายทาง) | `poi` | `outbound` | 0 | - | - | `["เตรียมเสบียงจากบ้าน", "เครื่องดื่มแก้วแรก"]` | `https://www.google.com/maps/dir/?api=1&destination=13.817392,100.414615` |
| 2 | `poi_samchuk` | ตลาดสามชุก 100 ปี (Sam Chuk Old Town) | `poi` | `outbound` | 120 | - | - | `["ลูกชิ้นยักษ์สามชุก", "เป็ดพะโล้ร้อยปี", "ทองม้วนสด", "กาแฟโบราณ"]` | `https://www.google.com/maps/dir/?api=1&destination=14.7554597,100.0947608` |
| 3 | `charger_danchang` | PTT Station ด่านช้าง (EV Station PluZ) | `charger` | `outbound` | 175 | 120 | EV Station PluZ<br>CCS2 2 หัว + Type 2 | `["Cafe Amazon", "7-Eleven ใหญ่", "ร้านอาหารตามสั่ง", "ตลาดสดด่านช้าง (1 กม.)"]` | `https://www.google.com/maps/dir/?api=1&destination=14.841178,99.689596` |
| 4 | `owlyard` | Owl Yard Campsite at Ban Rai | `camp` | `campsite` | 220 | - | ปลั๊กไฟแคมป์ / V2L | `["ทำอาหารแคมป์ปิ้ง / หมูกระทะ", "เสียบปลั๊ก V2L กาน้ำร้อน", "บาร์บีคิวรอบกองไฟ"]` | `https://www.google.com/maps/dir/?api=1&destination=15.0777806,99.4981633` |
| 5 | `charger_banrai_pea` | PEA VOLTA การไฟฟ้าบ้านไร่ (บ้านบึง) | `charger` | `campsite` | 223 | 50 | PEA VOLTA<br>CCS2 + CHAdeMO | `["7-Eleven บ้านไร่", "ร้านอาหารใกล้ตัวอำเภอ", "ตลาดสดเทศบาลบ้านไร่"]` | `https://www.google.com/maps/dir/?api=1&destination=15.0682,99.5321` |
| 6 | `rest_koomrimkhao` | สวนอาหาร คุ้มริมเขา | `food` | `campsite` | 221 | - | - | `["ต้มยำปลาคัง", "ปลาแรดทอดน้ำปลา", "กวางผัดเผ็ด", "ยำผักกูดกรอบ"]` | `https://www.google.com/maps/dir/?api=1&destination=15.0912924,99.508729` |
| 7 | `rest_baansuan` | ร้านอาหารบ้านสวน บ้านไร่ | `food` | `campsite` | 222 | - | - | `["ปลาแรดสามรส", "ทอดมันปลากรายแท้", "แกงป่าปลาคัง"]` | `https://www.google.com/maps/dir/?api=1&destination=15.0843113,99.5260428` |
| 8 | `rest_chaika` | ครัวชายคาตามสั่งก๋วยเตี๋ยว | `food` | `campsite` | 220 | - | - | `["กะเพราเนื้อตุ๋น/หมูกรอบ", "ก๋วยเตี๋ยวต้มยำโบราณ", "อาหารจานด่วนใกล้ลาน"]` | `https://www.google.com/maps/dir/?api=1&destination=15.0714252,99.4936949` |
| 9 | `rest_heiauan` | ราดหน้าเฮียอ้วน @ Banrai | `food` | `campsite` | 222 | - | - | `["ราดหน้าหมูหมักยอดผัก", "ผัดซีอิ๊วทะเล", "หมี่กรอบราดหน้า"]` | `https://www.google.com/maps/dir/?api=1&destination=15.0765284,99.5254919` |
| 10 | `rest_padthai` | ร้านผัดไทยมรดกโลก (ป้าสมนึก) | `food` | `campsite` | 222 | - | - | `["ผัดไทยกุ้งสดห่อไข่", "ผัดไทยกากหมูเตาถ่าน", "ซอสมะขามโบราณ"]` | `https://www.google.com/maps/dir/?api=1&destination=15.0850897,99.5249024` |
| 11 | `cafe_leleela` | Le Leela Cafe (เลอ ลีลา คาเฟ่) | `cafe` | `campsite` | 223 | - | - | `["Signature Dirty Coffee", "Matcha Latte มะพร้าวสด", "ชีสเค้กหน้าไหม้"]` | `https://www.google.com/maps/dir/?api=1&destination=15.0586269,99.5168511` |
| 12 | `poi_giant_tree` | ต้นไม้ยักษ์บ้านสะนำ (Giant Tree Ban Rai) | `poi` | `campsite` | 222 | - | - | `["ตลาดชุมชนบ้านสะนำ", "น้ำสมุนไพรพื้นบ้าน", "ผลไม้สวนบ้านไร่"]` | `https://www.google.com/maps/dir/?api=1&destination=15.076,99.528` |
| 13 | `poi_wat_tham_khao_wong` | วัดถ้ำเขาวง บ้านไร่ | `poi` | `campsite` | 225 | - | - | `["เรือนไทย 4 ชั้นไม้สัก", "จุดชมวิวผาหินปูน", "ร้านน้ำดื่มสมุนไพร"]` | `https://www.google.com/maps/dir/?api=1&destination=15.032,99.456` |
| 14 | `poi_huppatat` | หุบป่าตาด (Hup Pa Tat - Jurassic Valley) | `poi` | `inbound` | 265 | - | - | `["กาแฟชุมชนหุบป่าตาด", "ไอศกรีมกะทิสด", "ของที่ระลึกกิ้งกือมังกร"]` | `https://www.google.com/maps/dir/?api=1&destination=15.378,99.63` |
| 15 | `charger_ptt_uthai_bypass` | PTT Station เลี่ยงเมืองอุทัยธานี (ทล.333) | `charger` | `inbound` | 290 | 120 | EV Station PluZ<br>CCS2 2 หัว + Type 2 | `["Cafe Amazon", "7-Eleven", "ข้าวมันไก่/ข้าวแกง", "ขนมปังสังขยาไพพรรณ (ใกล้เคียง)"]` | `https://www.google.com/maps/dir/?api=1&destination=15.3681817,100.0155478` |
| 16 | `poi_watthasung` | วัดจันทาราม (วัดท่าซุง) | `poi` | `inbound` | 310 | - | - | `["วิหารแก้ว 100 เมตร", "ปราสาททองคำ", "ร้านอาหารแพริมน้ำสะแกกรัง"]` | `https://www.google.com/maps/dir/?api=1&destination=15.3323969,100.0724402` |
| 17 | `charger_nexmoev` | ⭐ NEXMOEV Charging Station (พยุหะคีรี) | `charger` | `inbound` | 325 | 120 | NEXMOEV<br>CCS2 12 หัว | `["ห้องรับรอง VIP แอร์เย็น", "เก้าอี้นวดไฟฟ้าฟรี", "กาแฟสด & ขนม 24 ชม.", "ห้องน้ำติดแอร์ 5 ดาว"]` | `https://www.google.com/maps/dir/?api=1&destination=15.482658,100.1352141` |
| 18 | `charger_elex_egat_manorom` | EleX by EGAT Charging Station (มโนรมย์) | `charger` | `inbound` | 320 | 120 | EleXA<br>CCS2 2 หัว | `["กาแฟพันธุ์ไทย (ปั๊ม PT)", "Max Mart สะดวกซื้อ", "จุดพักรถมโนรมย์"]` | `https://www.google.com/maps/dir/?api=1&destination=15.3973033,100.1477948` |
| 19 | `charger_ptt_manorom_ah2` | PTT Station มโนรมย์ (สายเอเชีย ทล.32) | `charger` | `inbound` | 330 | 120 | EV Station PluZ<br>CCS2 2 หัว + Type 2 | `["Cafe Amazon", "7-Eleven ขนาดใหญ่", "ศูนย์อาหารสายเอเชีย", "ของฝากเมืองชัยนาท"]` | `https://www.google.com/maps/dir/?api=1&destination=15.3493829,100.1648069` |
| 20 | `poi_chainat_bird` | สวนนกชัยนาท (Chainat Bird Park) | `poi` | `inbound` | 345 | - | - | `["ศูนย์อาหารสวนนก", "ปลาแม่น้ำเจ้าพระยา", "ส้มโอขาวแตงกวาชัยนาท"]` | `https://www.google.com/maps/dir/?api=1&destination=15.2066066,100.1515585` |

---

### 2.3 Ready-to-Embed JavaScript Object Dictionary for `data.js`

```javascript
  places: [
    {
      id: "home",
      name: "บ้าน (จุดเริ่มต้น / ปลายทาง)",
      category: "poi",
      subCategory: "จุดเริ่มต้น (นนทบุรี)",
      phase: "outbound",
      lat: 13.817392,
      lng: 100.414615,
      distanceFromOrigin: 0,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=13.817392,100.414615",
      mapsUrl: "https://maps.app.goo.gl/CruR6eFEcTNf8FS29",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80",
      description: "จุดเริ่มต้นทริป (โซนนนทบุรี / พระราม 5 / นครอินทร์) นัดพบและออกเดินทางพร้อมกัน 2 คัน เวลา 09:00 น.",
      tips: "ชาร์จแบตที่บ้านให้เต็ม 100% ก่อนออกเดินทาง 9 โมงเช้า",
      foodHighlights: ["เตรียมเสบียงจากบ้าน", "เครื่องดื่มแก้วแรก"],
      highlight: true
    },
    {
      id: "poi_samchuk",
      name: "ตลาดสามชุก 100 ปี (Sam Chuk Old Town)",
      category: "poi",
      subCategory: "ตลาดเก่าแก่ริมน้ำสุพรรณบุรี",
      phase: "outbound",
      lat: 14.7554597,
      lng: 100.0947608,
      distanceFromOrigin: 120,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=14.7554597,100.0947608",
      mapsUrl: "https://maps.app.goo.gl/Tx9V12d6zaevFG8w7",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      description: "ตลาดห้องแถวไม้โบราณริมแม่น้ำท่าจีน แหล่งรวมของกินโบราณ บะหมี่ลูกชิ้นยักษ์ และขนมไข่โบราณ",
      openingHours: "08:30 - 16:30 น. ทุกวัน",
      foodHighlights: ["ลูกชิ้นยักษ์สามชุก", "เป็ดพะโล้ร้อยปี", "ทองม้วนสด", "กาแฟโบราณ"],
      tips: "จุดแวะพักครึ่งทางวันที่ 1 เหมาะเดินเล่นซื้อเสบียงไปแคมป์",
      highlight: true
    },
    {
      id: "charger_danchang",
      name: "PTT Station ด่านช้าง (EV Station PluZ)",
      category: "charger",
      subCategory: "DC Fast Charge 120 kW (จุดชาร์จหลักขาไป)",
      phase: "outbound",
      lat: 14.841178,
      lng: 99.689596,
      distanceFromOrigin: 175,
      powerKw: 120,
      plugType: "CCS2 2 หัว + Type 2",
      networkApp: "EV Station PluZ",
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=14.841178,99.689596",
      mapsUrl: "https://maps.app.goo.gl/dk8prDCVKgpJKhkz5",
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80",
      description: "★ จุดชาร์จสำคัญที่สุดก่อนเข้าบ้านไร่! อยู่ อ.ด่านช้าง ห่างจาก Owl Yard เพียง 45 กม.",
      chargerInfo: {
        network: "EV Station PluZ (OR / PTT)",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "2 x CCS2, 1 x Type 2",
        appNeeded: "EV Station PluZ"
      },
      foodHighlights: ["Cafe Amazon", "7-Eleven ใหญ่", "ร้านอาหารตามสั่ง", "ตลาดสดด่านช้าง (1 กม.)"],
      tips: "แนะนำให้ทั้ง 2 คัน Top-up ชาร์จให้ได้ 85-95% ที่นี่",
      highlight: true
    },
    {
      id: "owlyard",
      name: "Owl Yard Campsite at Ban Rai",
      category: "camp",
      subCategory: "ลานกางเต็นท์ & EV Car Camping",
      phase: "campsite",
      lat: 15.0777806,
      lng: 99.4981633,
      distanceFromOrigin: 220,
      plugType: "ปลั๊กไฟแคมป์ / V2L",
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.0777806,99.4981633",
      mapsUrl: "https://maps.app.goo.gl/KMuWuBpnYHSfwWik6",
      image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80",
      description: "จุดหมายหลักของทริป ลานกางเต็นท์บรรยากาศร่มรื่น วิวภูเขาล้อมรอบ เหมาะสำหรับ Car Camping นอนเปิดแอร์ในรถ EV ทั้ง 2 คัน",
      openingHours: "เช็คอิน 14:00 น. / เช็คเอาท์ 12:00 น.",
      facilities: ["มีห้องน้ำสะอาด", "มีจุดต่อปลั๊กไฟ (สอบถามลาน)", "เหมาะกับ Car Camping", "สัญญาณมือถือดี"],
      foodHighlights: ["ทำอาหารแคมป์ปิ้ง / หมูกระทะ", "เสียบปลั๊ก V2L กาน้ำร้อน", "บาร์บีคิวรอบกองไฟ"],
      tips: "เตรียมปลั๊กพ่วงยาว, ม่านบังแดดรอบคัน และตั้ง Camp Mode เปิดแอร์ 24-25°C",
      highlight: true
    },
    {
      id: "charger_banrai_pea",
      name: "PEA VOLTA การไฟฟ้าบ้านไร่ (บ้านบึง)",
      category: "charger",
      subCategory: "DC Fast Charge 25-50 kW (ใกล้ลาน 5 กม.)",
      phase: "campsite",
      lat: 15.0682,
      lng: 99.5321,
      distanceFromOrigin: 223,
      powerKw: 50,
      plugType: "1 x CCS2, 1 x CHAdeMO, 1 x AC Type 2",
      networkApp: "PEA VOLTA",
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.0682,99.5321",
      mapsUrl: "https://maps.google.com/?q=15.0682,99.5321",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      description: "สถานีชาร์จใกล้ Owl Yard ที่สุด อยู่ห่างจากลานเพียง 5 กม. ในตัว อ.บ้านไร่",
      chargerInfo: {
        network: "PEA VOLTA",
        power: "DC Fast Charge 25-50 kW",
        guns: "1 x CCS2, 1 x CHAdeMO, 1 x AC Type 2",
        appNeeded: "PEA VOLTA"
      },
      foodHighlights: ["7-Eleven บ้านไร่", "ร้านอาหารใกล้ตัวอำเภอ", "ตลาดสดเทศบาลบ้านไร่"],
      tips: "จุดชาร์จสำรองใกล้ที่พัก",
      highlight: true
    },
    {
      id: "rest_koomrimkhao",
      name: "สวนอาหาร คุ้มริมเขา",
      category: "food",
      subCategory: "อาหารไทย-พื้นบ้าน / ริมเขาบ้านไร่",
      phase: "campsite",
      lat: 15.0912924,
      lng: 99.508729,
      distanceFromOrigin: 221,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.0912924,99.508729",
      mapsUrl: "https://maps.app.goo.gl/5dV6T4wSg7JU8PU3A",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
      description: "ร้านอาหารบรรยากาศดีริมเขาใน อ.บ้านไร่ เสิร์ฟอาหารไทยและอาหารป่ารสจัดจ้าน เหมาะสำหรับมื้อเย็นหลังเช็คอิน",
      openingHours: "10:00 - 21:00 น. ทุกวัน",
      phone: "081-973-1245",
      foodHighlights: ["ต้มยำปลาคัง", "ปลาแรดทอดน้ำปลา", "กวางผัดเผ็ด", "ยำผักกูดกรอบ"],
      tips: "ห่างจาก Owl Yard เพียง 3 กม. แนะนำมาช่วง 17:30 น. ชมวิวพระอาทิตย์ตก",
      highlight: true
    },
    {
      id: "rest_baansuan",
      name: "ร้านอาหารบ้านสวน บ้านไร่",
      category: "food",
      subCategory: "อาหารไทย-พื้นบ้าน / ในสวนร่มรื่น",
      phase: "campsite",
      lat: 15.0843113,
      lng: 99.5260428,
      distanceFromOrigin: 222,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.0843113,99.5260428",
      mapsUrl: "https://maps.app.goo.gl/AkUJVbbwE2JYBjZa8",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      description: "ร้านอาหารสไตล์บ้านสวน ร่มรื่นใต้ร่มไม้ใหญ่ รสชาติอร่อยกลมกล่อม ราคาย่อมเยา",
      openingHours: "09:30 - 20:30 น.",
      phone: "056-596-123",
      foodHighlights: ["ปลาแรดสามรส", "ทอดมันปลากรายแท้", "แกงป่าปลาคัง"],
      tips: "บรรยากาศร่มรื่นเหมาะสำหรับกลุ่มเพื่อนและครอบครัว",
      highlight: false
    },
    {
      id: "rest_chaika",
      name: "ครัวชายคาตามสั่งก๋วยเตี๋ยว",
      category: "food",
      subCategory: "อาหารจานเดียว & ก๋วยเตี๋ยว",
      phase: "campsite",
      lat: 15.0714252,
      lng: 99.4936949,
      distanceFromOrigin: 220,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.0714252,99.4936949",
      mapsUrl: "https://maps.app.goo.gl/xnfBzDmjwKQwZ2o99",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
      description: "ร้านอาหารตามสั่งและก๋วยเตี๋ยวรสเด็ด อยู่ใกล้กับลาน Owl Yard มาก (เพียง 1.5 กม.)",
      openingHours: "08:00 - 17:00 น.",
      foodHighlights: ["กะเพราเนื้อตุ๋น/หมูกรอบ", "ก๋วยเตี๋ยวต้มยำโบราณ", "อาหารจานด่วนใกล้ลาน"],
      tips: "อาหารจานด่วนใกล้ลานกางเต็นท์",
      highlight: false
    },
    {
      id: "rest_heiauan",
      name: "ราดหน้าเฮียอ้วน @ Banrai",
      category: "food",
      subCategory: "ราดหน้ายอดผัก & อาหารจานด่วน",
      phase: "campsite",
      lat: 15.0765284,
      lng: 99.5254919,
      distanceFromOrigin: 222,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.0765284,99.5254919",
      mapsUrl: "https://maps.app.goo.gl/v1p4ZgszpGqFr7TJ8",
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      description: "ร้านราดหน้าระดับตำนานของ อ.บ้านไร่ น้ำราดหน้าเหนียวนุ่มหอมกลิ่นคั่วกระทะ หมูนุ่มยอดผักกรอบ",
      openingHours: "10:00 - 20:00 น.",
      phone: "089-856-7890",
      foodHighlights: ["ราดหน้าหมูหมักยอดผัก", "ผัดซีอิ๊วทะเล", "หมี่กรอบราดหน้า"],
      tips: "หมี่กรอบราดหน้ารวมมิตรเด็ดมาก",
      highlight: false
    },
    {
      id: "rest_padthai",
      name: "ร้านผัดไทยมรดกโลก (ป้าสมนึก)",
      category: "food",
      subCategory: "ผัดไทยโบราณ / ของดีบ้านไร่",
      phase: "campsite",
      lat: 15.0850897,
      lng: 99.5249024,
      distanceFromOrigin: 222,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.0850897,99.5249024",
      mapsUrl: "https://maps.app.goo.gl/1BPNgoTGfNZ5XdUu8",
      image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80",
      description: "ร้านผัดไทยชื่อดังของบ้านไร่ ผัดด้วยเตาถ่านเส้นเหนียวนุ่ม ซอสมะขามเปียกเข้มข้น รสชาติกลมกล่อม",
      openingHours: "09:00 - 16:00 น. (หมดแล้วปิด)",
      phone: "087-198-4567",
      foodHighlights: ["ผัดไทยกุ้งสดห่อไข่", "ผัดไทยกากหมูเตาถ่าน", "ซอสมะขามโบราณ"],
      tips: "เหมาะเป็นมื้อกลางวัน วันที่ 2 รสชาติอร่อยสมชื่อ",
      highlight: true
    },
    {
      id: "cafe_leleela",
      name: "Le Leela Cafe (เลอ ลีลา คาเฟ่)",
      category: "cafe",
      subCategory: "คาเฟ่สวย / วิวภูเขาบ้านไร่",
      phase: "campsite",
      lat: 15.0586269,
      lng: 99.5168511,
      distanceFromOrigin: 223,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.0586269,99.5168511",
      mapsUrl: "https://maps.app.goo.gl/bpwhckzCbzgeBXw99",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
      description: "คาเฟ่ดีไซน์สวยโมเดิร์นท่ามกลางสวนและวิวขุนเขาบ้านไร่ มีมุมถ่ายรูปสวย กาแฟ Specialty และเค้กโฮมเมด",
      openingHours: "08:30 - 17:30 น. ทุกวัน",
      phone: "086-369-9541",
      foodHighlights: ["Signature Dirty Coffee", "Matcha Latte มะพร้าวสด", "ชีสเค้กหน้าไหม้"],
      tips: "แวะเช้าวันที่ 2 จิบกาแฟรับลมเย็นๆ ถ่ายรูปสวยมาก",
      highlight: true
    },
    {
      id: "poi_giant_tree",
      name: "ต้นไม้ยักษ์บ้านสะนำ (Giant Tree Ban Rai)",
      category: "poi",
      subCategory: "Unseen Thailand ธรรมชาติ 300-400 ปี",
      phase: "campsite",
      lat: 15.0760,
      lng: 99.5280,
      distanceFromOrigin: 222,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.076,99.528",
      mapsUrl: "https://maps.google.com/?q=ต้นไม้ยักษ์บ้านไร่+อุทัยธานี",
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
      description: "ต้นผึ้งยักษ์โบราณอายุกว่า 300-400 ปี ขนาดใหญ่ประมาณ 40 คนโอบ กลางป่าหมากเขียวขจี ร่มรื่น",
      openingHours: "เปิดทุกวัน 06:00 - 18:00 น.",
      foodHighlights: ["ตลาดชุมชนบ้านสะนำ", "น้ำสมุนไพรพื้นบ้าน", "ผลไม้สวนบ้านไร่"],
      tips: "มีตลาดชุมชนขายผัก ผลไม้ สินค้าพื้นเมือง ห่างจากลาน Owl Yard เพียง 4 กม.",
      highlight: true
    },
    {
      id: "poi_wat_tham_khao_wong",
      name: "วัดถ้ำเขาวง บ้านไร่",
      category: "poi",
      subCategory: "เรือนไทย 4 ชั้นริมผาหินปูน",
      phase: "campsite",
      lat: 15.0320,
      lng: 99.4560,
      distanceFromOrigin: 225,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.032,99.456",
      mapsUrl: "https://maps.google.com/?q=วัดถ้ำเขาวง+อุทัยธานี",
      image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80",
      description: "วัดสวยอันซีนที่มีอาคารเรือนไทย 4 ชั้นสร้างจากไม้สักริมหน้าผาหินปูนสูงใหญ่ มีสระน้ำด้านหน้า สงบร่มเย็น",
      openingHours: "08:00 - 16:30 น. ทุกวัน",
      foodHighlights: ["เรือนไทย 4 ชั้นไม้สัก", "จุดชมวิวผาหินปูน", "ร้านน้ำดื่มสมุนไพร"],
      tips: "อยู่ใกล้ลาน Owl Yard มาก (ขับ 10-15 นาที)",
      highlight: true
    },
    {
      id: "poi_huppatat",
      name: "หุบป่าตาด (Hup Pa Tat - The Jurassic Valley)",
      category: "poi",
      subCategory: "ป่าดึกดำบรรพ์ยุคไดโนเสาร์ Unseen Thailand",
      phase: "inbound",
      lat: 15.3780,
      lng: 99.6300,
      distanceFromOrigin: 265,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.378,99.63",
      mapsUrl: "https://maps.google.com/?q=หุบป่าตาด+อุทัยธานี",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
      description: "ไฮไลท์ระดับประเทศ เดินลอดถ้ำมืดเข้าสู่หุบเขาที่ซ่อนป่าต้นตาดโบราณยุคจูราสสิก แหล่งอาศัยของกิ้งกือมังกรสีชมพู",
      openingHours: "08:30 - 16:00 น. ทุกวัน",
      foodHighlights: ["กาแฟชุมชนหุบป่าตาด", "ไอศกรีมกะทิสด", "ของที่ระลึกกิ้งกือมังกร"],
      tips: "มีไฟฉายให้ยืมเดินผ่านถ้ำ แนะนำใส่รองเท้าที่เดินสบาย",
      highlight: true
    },
    {
      id: "charger_ptt_uthai_bypass",
      name: "PTT Station เลี่ยงเมืองอุทัยธานี (ทล.333)",
      category: "charger",
      subCategory: "เส้นทางหลักขากลับ • DC Fast 120 kW",
      phase: "inbound",
      lat: 15.3681817,
      lng: 100.0155478,
      distanceFromOrigin: 290,
      powerKw: 120,
      plugType: "CCS2 2 หัว + Type 2",
      networkApp: "EV Station PluZ",
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.3681817,100.0155478",
      mapsUrl: "https://maps.app.goo.gl/NkZZXbkN86qaTw718",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      description: "ปั๊ม ปตท. บนถนนเลี่ยงเมืองอุทัยธานี (ทล.333) มีตู้ชาร์จ EV Station PluZ พร้อม Cafe Amazon และร้านสะดวกซื้อ",
      chargerInfo: {
        network: "EV Station PluZ (OR / PTT)",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "2 x CCS2, 1 x Type 2",
        appNeeded: "EV Station PluZ"
      },
      foodHighlights: ["Cafe Amazon", "7-Eleven", "ข้าวมันไก่/ข้าวแกง", "ขนมปังสังขยาไพพรรณ (ใกล้เคียง)"],
      tips: "จุดแวะชาร์จช่วงออกจากหุบป่าตาด-หนองฉาง",
      highlight: true
    },
    {
      id: "poi_watthasung",
      name: "วัดจันทาราม (วัดท่าซุง)",
      category: "poi",
      subCategory: "วิหารแก้ว 100 เมตร & ปราสาททองคำ",
      phase: "inbound",
      lat: 15.3323969,
      lng: 100.0724402,
      distanceFromOrigin: 310,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.3323969,100.0724402",
      mapsUrl: "https://maps.app.goo.gl/Ew2aHyNbefCe1pGr6",
      image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=600&q=80",
      description: "วัดที่มีชื่อเสียงที่สุดของอุทัยธานี มีวิหารแก้ว 100 เมตรประดับกระจกโมเสกสะท้อนแสงระยิบระยับ และปราสาททองคำ",
      openingHours: "วิหารแก้วเปิด 2 รอบ: เช้า 09:00 - 11:45 น. / บ่าย 14:00 - 16:00 น.",
      foodHighlights: ["วิหารแก้ว 100 เมตร", "ปราสาททองคำ", "ร้านอาหารแพริมน้ำสะแกกรัง"],
      tips: "วิหารแก้วปิดพักเที่ยง (11:45 - 14:00 น.) วางแผนให้ทันรอบบ่าย 14:00 น.",
      highlight: true
    },
    {
      id: "charger_nexmoev",
      name: "⭐ NEXMOEV Charging Station (พยุหะคีรี)",
      category: "charger",
      subCategory: "👑 ไฮไลท์ต้องลอง! Mega EV Hub 120 kW (12 หัวชาร์จ)",
      phase: "inbound",
      lat: 15.482658,
      lng: 100.1352141,
      distanceFromOrigin: 325,
      powerKw: 120,
      plugType: "12 x หัวชาร์จ DC Fast CCS2",
      networkApp: "NEXMOEV",
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.482658,100.1352141",
      mapsUrl: "https://maps.app.goo.gl/kmZSP3vFMaV8g2ZN7",
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80",
      description: "👑 [ไฮไลท์พิเศษที่ต้องไปลอง!] อภิมหาสถานีชาร์จ EV ริมถนนสายเอเชีย มีหัวชาร์จ DC Fast 120 kW มากถึง 12 ช่อง ชาร์จพร้อมกันได้ 2 คันสบายๆ พร้อมห้องรับรอง VIP ติดแอร์, เก้าอี้นวดไฟฟ้า, ห้องน้ำติดแอร์ระดับพรีเมียม",
      chargerInfo: {
        network: "NEXMOEV Station",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "12 x หัวชาร์จ DC Fast CCS2",
        appNeeded: "แอป NEXMOEV หรือสแกน QR หน้าตู้"
      },
      foodHighlights: ["ห้องรับรอง VIP แอร์เย็น", "เก้าอี้นวดไฟฟ้าฟรี", "กาแฟสด & ขนม 24 ชม.", "ห้องน้ำติดแอร์ 5 ดาว"],
      tips: "แวะชาร์จขากลับ นั่งนวดพักผ่อนในห้องแอร์ฟรี ก่อนขับยาวกลับกรุงเทพฯ",
      highlight: true,
      isSuperHighlight: true
    },
    {
      id: "charger_elex_egat_manorom",
      name: "EleX by EGAT Charging Station (มโนรมย์ / PT)",
      category: "charger",
      subCategory: "เส้นทางหลักขากลับ • DC Fast Charge",
      phase: "inbound",
      lat: 15.3973033,
      lng: 100.1477948,
      distanceFromOrigin: 320,
      powerKw: 120,
      plugType: "2 x CCS2",
      networkApp: "EleXA",
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.3973033,100.1477948",
      mapsUrl: "https://maps.app.goo.gl/LPKBN4CeGK25nWEw6",
      image: "https://images.unsplash.com/photo-1558441719-8b839c4c4786?auto=format&fit=crop&w=600&q=80",
      description: "สถานีชาร์จความเร็วสูง EleX by EGAT ของการไฟฟ้าฝ่ายผลิตฯ จ่ายไฟแรง เสถียรสูง",
      chargerInfo: {
        network: "EleX by EGAT",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "2 x CCS2",
        appNeeded: "EleXA App"
      },
      foodHighlights: ["กาแฟพันธุ์ไทย (ปั๊ม PT)", "Max Mart สะดวกซื้อ", "จุดพักรถมโนรมย์"],
      tips: "จุดชาร์จคุณภาพสูงบนเส้นทางมโนรมย์",
      highlight: true
    },
    {
      id: "charger_ptt_manorom_ah2",
      name: "PTT Station มโนรมย์ (สายเอเชีย ทล.32 / ชัยนาท)",
      category: "charger",
      subCategory: "เส้นทางหลักขากลับ • DC Fast 120 kW",
      phase: "inbound",
      lat: 15.3493829,
      lng: 100.1648069,
      distanceFromOrigin: 330,
      powerKw: 120,
      plugType: "CCS2 2 หัว + Type 2",
      networkApp: "EV Station PluZ",
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.3493829,100.1648069",
      mapsUrl: "https://maps.app.goo.gl/RndqJNNxnSVdU6aR6",
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80",
      description: "ปั๊ม ปตท. มโนรมย์ ริมถนนสายเอเชีย (AH2) จุดพักรถขนาดใหญ่ฝั่งขาล่องเข้ากรุงเทพฯ",
      chargerInfo: {
        network: "EV Station PluZ (OR / PTT)",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "2 x CCS2, 1 x Type 2",
        appNeeded: "EV Station PluZ"
      },
      foodHighlights: ["Cafe Amazon", "7-Eleven ขนาดใหญ่", "ศูนย์อาหารสายเอเชีย", "ของฝากเมืองชัยนาท"],
      tips: "จุดพักรถและชาร์จแบตเตอรี่บนถนนสายเอเชีย",
      highlight: true
    },
    {
      id: "poi_chainat_bird",
      name: "สวนนกชัยนาท (Chainat Bird Park)",
      category: "poi",
      subCategory: "กรงนกใหญ่ที่สุดในเอเชีย",
      phase: "inbound",
      lat: 15.2066066,
      lng: 100.1515585,
      distanceFromOrigin: 345,
      navUrl: "https://www.google.com/maps/dir/?api=1&destination=15.2066066,100.1515585",
      mapsUrl: "https://maps.app.goo.gl/6nk41rB5wdTi19tA8",
      image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=600&q=80",
      description: "แหล่งท่องเที่ยวแลนด์มาร์คของชัยนาท มีกรงนกขนาดมหึมา และอุโมงค์พันธุ์ปลาน้ำจืดลุ่มน้ำเจ้าพระยา",
      openingHours: "08:00 - 17:00 น. ทุกวัน",
      foodHighlights: ["ศูนย์อาหารสวนนก", "ปลาแม่น้ำเจ้าพระยา", "ส้มโอขาวแตงกวาชัยนาท"],
      tips: "จุดแวะพักเที่ยวในขากลับก่อนขึ้นถนนสายเอเชีย",
      highlight: true
    }
  ]
```

---

## 3. Redesigned Driver Stop Card Architecture

### 3.1 UX & Ergonomics Principles
1. **Scannability in Daylight (< 3 seconds)**:
   - Visual hierarchy: Place name (large 1.05rem bold) ➔ Distance & Charging Speed Badges ➔ Signature Food Chips ➔ 1-Tap CTA.
   - Distinct color-coded category badges (`badge-green`, `badge-amber`, `badge-red`, `badge-purple`, `badge-blue`) and phase badges (`badge-green`, `badge-amber`, `badge-blue`).
2. **Driver 1-Tap Navigation**:
   - High-visibility full-width CTA button (`.btn-driver-nav`) with minimum **48px** vertical height.
   - Directly calls Google Maps native turn-by-turn intent via `navUrl` with explicit destination coordinates.
3. **Card-Marker Bidirectional Affordance**:
   - Entire card surface is touch-friendly; clicking the card body selects the item and centers the map.
   - The CTA button has `stopPropagation` or distinct link behavior so tapping navigation does not disrupt map interaction.

---

### 3.2 Stop Card HTML Template

```html
<article class="stop-card ${place.isSuperHighlight ? 'super-highlight' : ''}" data-place-id="${place.id}" data-phase="${place.phase}" data-category="${place.category}">
  <div class="stop-card-header">
    <div class="stop-card-title-group">
      <h3 class="stop-card-name">${place.name}</h3>
      <span class="stop-card-sub">${place.subCategory}</span>
    </div>
    <div class="stop-card-badges">
      <span class="badge ${getPhaseBadgeClass(place.phase)}">${getPhaseBadgeText(place.phase)}</span>
      <span class="badge ${getCategoryBadgeClass(place.category)}">${getCategoryName(place.category)}</span>
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

  ${place.foodHighlights && place.foodHighlights.length > 0 ? `
    <div class="stop-food-section">
      <span class="food-label">🍽️ แนะนำ:</span>
      <div class="food-pills-wrap">
        ${place.foodHighlights.slice(0, 3).map(food => `
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

  <div class="stop-card-footer">
    <a href="${place.navUrl}" target="_blank" rel="noopener" class="btn-driver-nav" aria-label="นำทางไป ${place.name}">
      <i data-lucide="navigation" style="width: 16px; height: 16px;"></i>
      <span>🚗 นำทาง (Navigate)</span>
    </a>
  </div>
</article>
```

---

### 3.3 CSS Stylesheet Rules (To be placed in `style.css`)

```css
/* ==========================================================================
   Driver Stop Card Styles (Milestone 2 Specification)
   ========================================================================== */

.stop-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.2s ease,
              box-shadow 0.2s ease,
              background-color 0.2s ease;
}

.stop-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stop-card.active,
.stop-card.selected {
  border-color: var(--primary);
  background: var(--bg-card);
  box-shadow: 0 0 0 2px var(--primary), var(--shadow-md);
  transform: translateY(-2px);
}

.stop-card.super-highlight {
  border-color: var(--accent-purple);
  background: linear-gradient(135deg, rgba(126, 34, 206, 0.05) 0%, rgba(4, 120, 87, 0.05) 100%), var(--bg-card);
}

[data-theme="dark"] .stop-card.super-highlight {
  background: linear-gradient(135deg, rgba(192, 132, 252, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%), var(--bg-card);
}

/* Header & Title Group */
.stop-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.stop-card-title-group {
  flex: 1;
  min-width: 0;
}

.stop-card-name {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.35;
  margin-bottom: 0.2rem;
}

.stop-card-sub {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.3;
}

.stop-card-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
}

/* Metric Pills Row */
.stop-card-metrics {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.metric-pill.charger {
  background: var(--primary-light);
  color: var(--primary-hover);
  border-color: rgba(4, 120, 87, 0.3);
  font-weight: 800;
}

[data-theme="dark"] .metric-pill.charger {
  background: rgba(52, 211, 153, 0.16);
  color: #6ee7b7;
  border-color: rgba(52, 211, 153, 0.35);
}

.metric-pill.plug {
  background: var(--bg-card-subtle);
  color: var(--text-secondary);
  border-color: var(--border-color);
  font-size: 0.775rem;
}

/* Food & Chill Highlights */
.stop-food-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: var(--bg-card-subtle);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border-color);
}

.food-label {
  font-size: 0.775rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.food-pills-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.food-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.775rem;
  font-weight: 600;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  line-height: 1.25;
}

/* Stop Card Tips */
.stop-card-tip {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
  padding: 0.5rem 0.75rem;
  background: rgba(4, 120, 87, 0.06);
  border-left: 3px solid var(--primary);
  border-radius: var(--radius-sm);
}

[data-theme="dark"] .stop-card-tip {
  background: rgba(52, 211, 153, 0.08);
}

/* 1-Tap Navigation Button (>=48px Touch Cylinder) */
.btn-driver-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 48px;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  border: 1px solid transparent;
  box-shadow: 0 2px 8px var(--primary-glow);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-driver-nav:hover {
  background: var(--primary-hover);
  box-shadow: 0 4px 14px var(--primary-glow);
  transform: translateY(-1px);
  color: #ffffff;
}

.btn-driver-nav:active {
  transform: scale(0.97);
  box-shadow: 0 1px 4px var(--primary-glow);
}
```

---

## 4. Helper Functions for Card Rendering in `app.js`

```javascript
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

function getCategoryBadgeClass(category) {
  switch (category) {
    case 'charger': return 'badge-green';
    case 'camp': return 'badge-amber';
    case 'food': return 'badge-red';
    case 'cafe': return 'badge-purple';
    case 'poi': return 'badge-blue';
    default: return 'badge-blue';
  }
}
```

---

## 5. Verification & Acceptance Criteria

1. **Syntax Integrity**:
   - `node --check data.js` executes without error.
   - `node --check app.js` executes without error.
2. **Data Coverage**:
   - Exactly 20 places defined in `TRIP_DATA.places`.
   - 100% of places contain valid `phase` ('outbound' | 'campsite' | 'inbound') and valid `navUrl`.
   - All chargers contain `powerKw`, `plugType`, and `networkApp`.
   - All food and POI entries contain `foodHighlights`.
3. **Ergonomic Compliance**:
   - All `.btn-driver-nav` elements have `min-height: 48px`.
   - All badges and text meet WCAG AA daylight contrast ratios (>=4.5:1).
