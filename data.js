// Travel & EV Data for Owl Yard Campsite & Uthai Thani Road Trip - Flexible & Chill Edition
const TRIP_DATA = {
  tripInfo: {
    title: "ทริปแคมป์ปิ้งบ้านไร่ & อุทัยธานี (Chill & Flexible EV Guide)",
    subtitle: "ออก 9 โมงเช้า • ชาร์จชิลๆ ระหว่างกินข้าว • เติมไฟเต็มก่อนนอนในรถ • ขากลับไหลออกสายเอเชีย",
    totalDistanceApprox: 545, // km loop
    departureTime: "09:00 น. (ออกจากบ้าน นนทบุรี)",
    origin: {
      name: "บ้าน (นนทบุรี / วงเวียนพระราม 5)",
      lat: 13.817392,
      lng: 100.414615,
      mapsUrl: "https://maps.app.goo.gl/CruR6eFEcTNf8FS29"
    },
    destination: {
      name: "Owl Yard Campsite at Ban Rai",
      lat: 15.0777806,
      lng: 99.4981633,
      mapsUrl: "https://maps.app.goo.gl/KMuWuBpnYHSfwWik6",
      desc: "ลานกางเต็นท์ท่ามกลางขุนเขาและธรรมชาติบ้านไร่ เหมาะสำหรับกางเต็นท์และ Car Camping นอนเปิดแอร์ในรถ EV"
    },
    highlightCharger: {
      name: "NEXMOEV Charging Station (พยุหะคีรี)",
      lat: 15.482658,
      lng: 100.1352141,
      mapsUrl: "https://maps.app.goo.gl/kmZSP3vFMaV8g2ZN7"
    }
  },

  // Directional Route Summary for Visual Flow
  routeDirectionOverview: {
    title: "ภาพรวมทิศทาง & วงรอบการเดินทาง (Loop Route Direction)",
    outbound: {
      name: "ขาไป (ทิศตะวันตกเฉียงเหนือ ➔ หุบเขาบ้านไร่)",
      color: "#10b981",
      path: "นนทบุรี (ทล.340) ➔ สุพรรณบุรี (สามชุก) ➔ ด่านช้าง (ทล.333) ➔ บ้านไร่ (Owl Yard)",
      totalDist: "~220 กม.",
      keyChargingStrategy: "★ แวะชาร์จไฟให้ได้มากที่สุดที่ 'PTT ด่านช้าง' (85-95%) เพื่อนำไปเปิดแอร์นอนทั้งคืนที่ Owl Yard"
    },
    inbound: {
      name: "ขากลับ (ทิศตะวันออกเฉียงเหนือ ➔ ออกถนนสายเอเชีย ➔ ล่องใต้)",
      color: "#f59e0b",
      path: "บ้านไร่ ➔ หุบป่าตาด ➔ ทล.333 เลี่ยงเมืองอุทัยฯ ➔ วัดท่าซุง ➔ ⭐ NEXMOEV ➔ ชัยนาท ➔ ถนนสายเอเชีย (AH2 / ทล.32) ➔ กรุงเทพฯ/นนทบุรี",
      totalDist: "~325 กม.",
      keyChargingStrategy: "★ ลองชาร์จที่ 'NEXMOEV พยุหะคีรี' (มี 12 หัว + ห้องแอร์นวดฟรี) จากนั้นถนนสายเอเชียมีที่ชาร์จตลอดสายทุก 15-20 กม."
    }
  },

  // "Charge & Chill" Hubs (แวะชาร์จ + กินข้าว/ดื่มกาแฟ/พักผ่อนในจุดเดียวกัน)
  chargeAndChillHubs: [
    {
      id: "hub-danchang",
      name: "1. PTT Station ด่านช้าง (EV Station PluZ)",
      badge: "★ จุดชาร์จสำคัญที่สุดขาไป (เติมให้เต็มก่อนเข้าแคมป์)",
      badgeColor: "badge-green",
      distanceFromHome: "175 กม. (ขับประมาณ 2 ชม. - 2 ชม. 20 นาที จากบ้าน)",
      lat: 14.841178,
      lng: 99.689596,
      mapsUrl: "https://maps.app.goo.gl/dk8prDCVKgpJKhkz5",
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80",
      chargerSpecs: "⚡ DC Fast Charge 120 kW (2 หัวชาร์จ CCS2) + AC Type 2 (แอป EV Station PluZ)",
      whatToEatAndChill: [
        "☕ Cafe Amazon (สั่งกาแฟ/ชา นั่งจิบตากแอร์ระหว่างรอชาร์จ)",
        "🏪 7-Eleven ขนาดใหญ่ (ซื้อเสบียง ขนม น้ำแข็ง ข้าวกล่อง เครื่องดื่ม)",
        "🍜 ร้านอาหารตามสั่ง/ก๋วยเตี๋ยวในปั๊มและฝั่งตรงข้าม",
        "🥩 ตลาดสดด่านช้าง (ห่าง 1 กม. แวะซื้อเนื้อหมูกระทะ ผักสด อาหารเย็นไปทำที่แคมป์ได้)"
      ],
      chillAdvice: "ถ้าออกจากบ้าน 9 โมงเช้า จะถึงที่นี่ประมาณ 11:30 - 12:00 น. พอดีเวลาอาหารเที่ยง! แวะกินข้าว+ซื้อของเข้าแคมป์ 30-40 นาที รถจะได้ไฟ 90-95% พร้อมนอนในรถสบายทั้งคืน"
    },
    {
      id: "hub-suphan-samchuk",
      name: "2. โซนสุพรรณบุรี - ตลาดสามชุก 100 ปี & ปั๊มบางจาก",
      badge: "จุดแวะชิลกินมื้อสาย/เที่ยงขาไป (เลือกแวะได้)",
      badgeColor: "badge-blue",
      distanceFromHome: "120 กม. (ขับประมาณ 1 ชม. 30 นาที)",
      lat: 14.7554597,
      lng: 100.0947608,
      mapsUrl: "https://maps.app.goo.gl/Tx9V12d6zaevFG8w7",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      chargerSpecs: "⚡ ปตท.สามชุก / บางจาก พลับพลาไชย (อู่ทอง) / บางจาก บางปลาม้า (DC Fast 50-120 kW)",
      whatToEatAndChill: [
        "🏮 ตลาดสามชุก 100 ปี: บะหมี่ลูกชิ้นยักษ์, เป็ดพะโล้ร้อยปี, ขนมไข่โบราณ, กาแฟโบราณห้องแถวไม้",
        "☕ กาแฟ Inthanin / Amazon ตามปั๊มบางจากและ ปตท.",
        "🛍️ ช้อปปิ้งของกินโบราณและของฝากเมืองสุพรรณ"
      ],
      chillAdvice: "หากอยากแวะเดินเล่นตลาดโบราณชิลๆ ให้แวะสามชุกกินมื้อสายก่อน แล้วค่อยไป Top-up แบตเต็มที่ด่านช้าง หรือถ้าอยากแวะปั๊มบางจากพลับพลาไชยก็เสียบชาร์จแล้วนั่งจิบ Inthanin ได้"
    },
    {
      id: "hub-banrai-local",
      name: "3. โซน อ.บ้านไร่ (ใกล้ลาน Owl Yard 3-5 กม.)",
      badge: "ร้านอาหาร & คาเฟ่ & จุดชาร์จสำรองหน้าลานแคมป์",
      badgeColor: "badge-amber",
      distanceFromHome: "220 กม.",
      lat: 15.0777806,
      lng: 99.4981633,
      mapsUrl: "https://maps.app.goo.gl/KMuWuBpnYHSfwWik6",
      image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80",
      chargerSpecs: "⚡ PEA VOLTA การไฟฟ้าบ้านไร่ (ต.บ้านบึง) DC 25-50 kW & 22FRETS (ห่างลาน 5 กม.)",
      whatToEatAndChill: [
        "🍽️ สวนอาหาร คุ้มริมเขา (ต้มยำปลาคัง, ปลาแรดทอดน้ำปลา, อาหารป่า บรรยากาศริมเขาช่วงเย็น)",
        "🍽️ ร้านอาหารบ้านสวน (อาหารไทยพื้นบ้าน ร่มรื่นในสวน)",
        "🍲 ร้านผัดไทยมรดกโลก (ป้าสมนึก) (ผัดไทยเตาถ่านชื่อดัง มื้อกลางวัน)",
        "☕ Le Leela Cafe (Dirty Coffee, Matcha, เค้กโฮมเมด วิวภูเขาบ้านไร่)",
        "🍜 ครัวชายคาตามสั่ง & ราดหน้าเฮียอ้วน"
      ],
      chillAdvice: "เช็คอิน Owl Yard ตอนบ่ายแก่ๆ พอแดดร่มลมตก 17:30 น. ขับรถ 5 นาทีไปกินมื้อเย็นที่คุ้มริมเขา/บ้านสวน แล้วกลับมานอนเปิดแอร์ในรถชิลๆ ตื่นเช้าค่อยไปจิบกาแฟที่ เลอ ลีลา คาเฟ่"
    },
    {
      id: "hub-uthai-bypass",
      name: "4. PTT Station เลี่ยงเมืองอุทัยธานี (ทล.333)",
      badge: "จุดพักขากลับช่วงแรก (หลังเที่ยวหุบป่าตาด)",
      badgeColor: "badge-blue",
      distanceFromHome: "290 กม. (จากบ้านไร่มา 65 กม.)",
      lat: 15.3681817,
      lng: 100.0155478,
      mapsUrl: "https://maps.app.goo.gl/NkZZXbkN86qaTw718",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      chargerSpecs: "⚡ EV Station PluZ (DC Fast Charge 120 kW) (แอป EV Station PluZ)",
      whatToEatAndChill: [
        "☕ Cafe Amazon สาขาใหญ่",
        "🏪 7-Eleven & ร้านของฝากเมืองอุทัยธานี",
        "🍽️ ร้านข้าวมันไก่ / ข้าวแกง และขับเข้าเมือง 5 นาทีไปซื้อ 'ขนมปังสังขยาไพพรรณ'"
      ],
      chillAdvice: "หลังเดินเที่ยวหุบป่าตาดเสร็จ ขับออกมา 35 กม. จะถึงปั๊มนี้ แวะเข้าห้องน้ำ ดื่มน้ำเย็นๆ หรือเสียบชาร์จสัก 15-20 นาที ก่อนเข้าไปไหว้พระวัดท่าซุง"
    },
    {
      id: "hub-nexmoev",
      name: "5. ⭐ NEXMOEV Mega Station (พยุหะคีรี / นครสวรรค์)",
      badge: "👑 ไฮไลท์พิเศษขากลับที่ต้องลอง! (12 หัวชาร์จ + นวดแอร์ VIP)",
      badgeColor: "badge-purple",
      distanceFromHome: "325 กม. (จากวัดท่าซุงมา 25 กม.)",
      lat: 15.482658,
      lng: 100.1352141,
      mapsUrl: "https://maps.app.goo.gl/kmZSP3vFMaV8g2ZN7",
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80",
      chargerSpecs: "⚡ DC Fast Charge 120 kW จำนวน 12 ตู้ชาร์จพร้อมกัน (แอป NEXMOEV / สแกน QR)",
      whatToEatAndChill: [
        "🛋️ ห้องรับรอง VIP ติดแอร์เย็นฉ่ำ มีโซฟาและที่นั่งทำงาน",
        "💆 เก้าอี้นวดไฟฟ้าเพื่อสุขภาพ (นั่งนวดฟรีระหว่างรอชาร์จไฟ)",
        "🚻 ห้องน้ำติดแอร์สะอาดระดับโรงแรม 5 ดาว",
        "☕ มุมเครื่องดื่ม กาแฟสด ขนม และเบเกอรี่บริการ 24 ชม."
      ],
      chillAdvice: "★ จุดไฮไลท์ที่แนะนำให้มาพักผ่อน! เสียบชาร์จทั้ง 2 คันพร้อมกันได้เลยไม่มีคิว แล้วเข้าไปนั่งนวดไฟฟ้าในห้องแอร์ กินกาแฟชิลๆ 30 นาที ชาร์จแบตให้เต็ม 90-100% แล้วยิงยาวกลับบ้านได้อย่างสบายตัวที่สุด"
    },
    {
      id: "hub-asian-highway",
      name: "6. เครือข่ายปั๊มถนนสายเอเชีย (AH2 / ทล.32: มโนรมย์ ➔ ชัยนาท ➔ สิงห์บุรี ➔ อยุธยา)",
      badge: "ขากลับเข้ากรุงเทพฯ มีที่ชาร์จ & ของกินตลอดทุก 15-20 กม.",
      badgeColor: "badge-green",
      distanceFromHome: "ตลอดระยะทาง 185 กม. ขากลับ",
      lat: 15.3493829,
      lng: 100.1648069,
      mapsUrl: "https://maps.app.goo.gl/RndqJNNxnSVdU6aR6",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      chargerSpecs: "⚡ ปตท.มโนรมย์, EleX by EGAT มโนรมย์, ปตท.สิงห์บุรี, บางจากสิงห์บุรี, ปตท.อยุธยา (DC 120-360 kW มากกว่า 100+ ตู้)",
      whatToEatAndChill: [
        "🦜 สวนนกชัยนาท (แวะเดินชมธรรมชาติ)",
        "🐟 ร้านอาหารปลาแม่น้ำสิงห์บุรี / ตลาดปลาแม่น้ำริมสายเอเชีย",
        "🌯 ร้านโรตีสายไหมและก๋วยเตี๋ยวเรืออยุธยา",
        "🍔 ศูนย์อาหารขนาดใหญ่และฟาสต์ฟู้ดทุกแบรนด์"
      ],
      chillAdvice: "เส้นนี้ขับชิลที่สุดในประเทศสำหรับรถ EV เพราะมีตู้ DC Fast Charger ทุก 15-20 กม. หิวตรงไหน แบตเหลือเท่าไหร่ อยากแวะปั๊มไหนก็แวะได้ทันทีตามใจชอบ"
    }
  ],

  categories: [
    { id: "all", name: "ทั้งหมด", icon: "sparkles", color: "#6366f1" },
    { id: "charger", name: "จุดชาร์จ EV", icon: "zap", color: "#10b981" },
    { id: "camp", name: "ลานแคมป์ปิ้ง", icon: "tent", color: "#f59e0b" },
    { id: "food", name: "ร้านอาหาร", icon: "utensils", color: "#ef4444" },
    { id: "cafe", name: "คาเฟ่", icon: "coffee", color: "#8b5cf6" },
    { id: "poi", name: "จุดแวะเที่ยว / Unseen", icon: "map-pin", color: "#3b82f6" }
  ],

  // Master Places Directory
  places: [
    {
      id: "home",
      name: "บ้าน (จุดเริ่มต้น / ปลายทาง)",
      category: "poi",
      subCategory: "จุดเริ่มต้น (นนทบุรี)",
      lat: 13.817392,
      lng: 100.414615,
      mapsUrl: "https://maps.app.goo.gl/CruR6eFEcTNf8FS29",
      distanceFromOrigin: 0,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80",
      description: "จุดเริ่มต้นทริป (โซนนนทบุรี / พระราม 5 / นครอินทร์) นัดพบและออกเดินทางพร้อมกัน 2 คัน เวลา 09:00 น.",
      tips: "ชาร์จแบตที่บ้านให้เต็ม 100% ก่อนออกเดินทาง 9 โมงเช้า",
      highlight: true
    },
    {
      id: "owlyard",
      name: "Owl Yard Campsite at Ban Rai",
      category: "camp",
      subCategory: "ลานกางเต็นท์ & EV Car Camping",
      lat: 15.0777806,
      lng: 99.4981633,
      mapsUrl: "https://maps.app.goo.gl/KMuWuBpnYHSfwWik6",
      distanceFromOrigin: 220,
      image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80",
      description: "จุดหมายหลักของทริป ลานกางเต็นท์บรรยากาศร่มรื่น วิวภูเขาล้อมรอบ เหมาะสำหรับ Car Camping นอนเปิดแอร์ในรถ EV ทั้ง 2 คัน",
      openingHours: "เช็คอิน 14:00 น. / เช็คเอาท์ 12:00 น.",
      facilities: ["มีห้องน้ำสะอาด", "มีจุดต่อปลั๊กไฟ (สอบถามลาน)", "เหมาะกับ Car Camping", "สัญญาณมือถือดี"],
      tips: "เตรียมปลั๊กพ่วงยาว, ม่านบังแดดรอบคัน และตั้ง Camp Mode เปิดแอร์ 24-25°C",
      highlight: true
    },
    {
      id: "charger_nexmoev",
      name: "⭐ NEXMOEV Charging Station (พยุหะคีรี)",
      category: "charger",
      subCategory: "👑 ไฮไลท์ต้องลอง! Mega EV Hub 120 kW (12 หัวชาร์จ)",
      lat: 15.482658,
      lng: 100.1352141,
      mapsUrl: "https://maps.app.goo.gl/kmZSP3vFMaV8g2ZN7",
      distanceFromOrigin: 325,
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80",
      description: "👑 [ไฮไลท์พิเศษที่ต้องไปลอง!] อภิมหาสถานีชาร์จ EV ริมถนนสายเอเชีย มีหัวชาร์จ DC Fast 120 kW มากถึง 12 ช่อง ชาร์จพร้อมกันได้ 2 คันสบายๆ พร้อมห้องรับรอง VIP ติดแอร์, เก้าอี้นวดไฟฟ้า, ห้องน้ำติดแอร์ระดับพรีเมียม",
      chargerInfo: {
        network: "NEXMOEV Station",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "12 x หัวชาร์จ DC Fast CCS2",
        appNeeded: "แอป NEXMOEV หรือสแกน QR หน้าตู้"
      },
      tips: "แวะชาร์จขากลับ นั่งนวดพักผ่อนในห้องแอร์ฟรี ก่อนขับยาวกลับกรุงเทพฯ",
      highlight: true,
      isSuperHighlight: true
    },
    {
      id: "charger_danchang",
      name: "PTT Station ด่านช้าง (EV Station PluZ)",
      category: "charger",
      subCategory: "DC Fast Charge 120 kW (จุดชาร์จหลักขาไป)",
      lat: 14.841178,
      lng: 99.689596,
      mapsUrl: "https://maps.app.goo.gl/dk8prDCVKgpJKhkz5",
      distanceFromOrigin: 175,
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80",
      description: "★ จุดชาร์จสำคัญที่สุดก่อนเข้าบ้านไร่! อยู่ อ.ด่านช้าง ห่างจาก Owl Yard เพียง 45 กม.",
      chargerInfo: {
        network: "EV Station PluZ (OR / PTT)",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "2 x CCS2, 1 x Type 2",
        appNeeded: "EV Station PluZ"
      },
      tips: "แนะนำให้ทั้ง 2 คัน Top-up ชาร์จให้ได้ 85-95% ที่นี่",
      highlight: true
    },
    {
      id: "charger_ptt_uthai_bypass",
      name: "PTT Station เลี่ยงเมืองอุทัยธานี (ทล.333)",
      category: "charger",
      subCategory: "เส้นทางหลักขากลับ • DC Fast 120 kW",
      lat: 15.3681817,
      lng: 100.0155478,
      mapsUrl: "https://maps.app.goo.gl/NkZZXbkN86qaTw718",
      distanceFromOrigin: 290,
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      description: "ปั๊ม ปตท. บนถนนเลี่ยงเมืองอุทัยธานี (ทล.333) มีตู้ชาร์จ EV Station PluZ พร้อม Cafe Amazon และร้านสะดวกซื้อ",
      chargerInfo: {
        network: "EV Station PluZ (OR / PTT)",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "2 x CCS2, 1 x Type 2",
        appNeeded: "EV Station PluZ"
      },
      tips: "จุดแวะชาร์จช่วงออกจากหุบป่าตาด-หนองฉาง",
      highlight: true
    },
    {
      id: "charger_elex_egat_manorom",
      name: "EleX by EGAT Charging Station (มโนรมย์ / PT)",
      category: "charger",
      subCategory: "เส้นทางหลักขากลับ • DC Fast Charge",
      lat: 15.3973033,
      lng: 100.1477948,
      mapsUrl: "https://maps.app.goo.gl/LPKBN4CeGK25nWEw6",
      distanceFromOrigin: 320,
      image: "https://images.unsplash.com/photo-1558441719-8b839c4c4786?auto=format&fit=crop&w=600&q=80",
      description: "สถานีชาร์จความเร็วสูง EleX by EGAT ของการไฟฟ้าฝ่ายผลิตฯ จ่ายไฟแรง เสถียรสูง",
      chargerInfo: {
        network: "EleX by EGAT",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "2 x CCS2",
        appNeeded: "EleXA App"
      },
      tips: "จุดชาร์จคุณภาพสูงบนเส้นทางมโนรมย์",
      highlight: true
    },
    {
      id: "charger_ptt_manorom_ah2",
      name: "PTT Station มโนรมย์ (สายเอเชีย ทล.32 / ชัยนาท)",
      category: "charger",
      subCategory: "เส้นทางหลักขากลับ • DC Fast 120 kW",
      lat: 15.3493829,
      lng: 100.1648069,
      mapsUrl: "https://maps.app.goo.gl/RndqJNNxnSVdU6aR6",
      distanceFromOrigin: 330,
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80",
      description: "ปั๊ม ปตท. มโนรมย์ ริมถนนสายเอเชีย (AH2) จุดพักรถขนาดใหญ่ฝั่งขาล่องเข้ากรุงเทพฯ",
      chargerInfo: {
        network: "EV Station PluZ (OR / PTT)",
        power: "DC Fast Charge 120 kW (CCS2)",
        guns: "2 x CCS2, 1 x Type 2",
        appNeeded: "EV Station PluZ"
      },
      tips: "จุดพักรถและชาร์จแบตเตอรี่บนถนนสายเอเชีย",
      highlight: true
    },
    {
      id: "charger_banrai_pea",
      name: "PEA VOLTA การไฟฟ้าบ้านไร่ (บ้านบึง)",
      category: "charger",
      subCategory: "DC Fast Charge 25-50 kW (ใกล้ลาน 5 กม.)",
      lat: 15.0682,
      lng: 99.5321,
      mapsUrl: "https://maps.google.com/?q=15.0682,99.5321",
      distanceFromOrigin: 223,
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      description: "สถานีชาร์จใกล้ Owl Yard ที่สุด อยู่ห่างจากลานเพียง 5 กม. ในตัว อ.บ้านไร่",
      chargerInfo: {
        network: "PEA VOLTA",
        power: "DC Fast Charge 25-50 kW",
        guns: "1 x CCS2, 1 x CHAdeMO, 1 x AC Type 2",
        appNeeded: "PEA VOLTA"
      },
      tips: "จุดชาร์จสำรองใกล้ที่พัก",
      highlight: true
    },
    {
      id: "rest_koomrimkhao",
      name: "สวนอาหาร คุ้มริมเขา",
      category: "food",
      subCategory: "อาหารไทย-พื้นบ้าน / ริมเขาบ้านไร่",
      lat: 15.0912924,
      lng: 99.508729,
      mapsUrl: "https://maps.app.goo.gl/5dV6T4wSg7JU8PU3A",
      distanceFromOrigin: 221,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
      description: "ร้านอาหารบรรยากาศดีริมเขาใน อ.บ้านไร่ เสิร์ฟอาหารไทยและอาหารป่ารสจัดจ้าน เหมาะสำหรับมื้อเย็นหลังเช็คอิน",
      openingHours: "10:00 - 21:00 น. ทุกวัน",
      phone: "081-973-1245",
      recommendedMenu: ["ต้มยำปลาคัง", "ปลาแรดทอดน้ำปลา", "กวางผัดเผ็ด", "ยำผักกูดกรอบ"],
      tips: "ห่างจาก Owl Yard เพียง 3 กม. แนะนำมาช่วง 17:30 น. ชมวิวพระอาทิตย์ตก",
      highlight: true
    },
    {
      id: "rest_baansuan",
      name: "ร้านอาหารบ้านสวน บ้านไร่",
      category: "food",
      subCategory: "อาหารไทย-พื้นบ้าน / ในสวนร่มรื่น",
      lat: 15.0843113,
      lng: 99.5260428,
      mapsUrl: "https://maps.app.goo.gl/AkUJVbbwE2JYBjZa8",
      distanceFromOrigin: 222,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      description: "ร้านอาหารสไตล์บ้านสวน ร่มรื่นใต้ร่มไม้ใหญ่ รสชาติอร่อยกลมกล่อม ราคาย่อมเยา",
      openingHours: "09:30 - 20:30 น.",
      phone: "056-596-123",
      recommendedMenu: ["ปลาแรดสามรส", "ทอดมันปลากรายแท้", "แกงป่าปลาคัง"],
      tips: "บรรยากาศร่มรื่นเหมาะสำหรับกลุ่มเพื่อนและครอบครัว",
      highlight: false
    },
    {
      id: "rest_chaika",
      name: "ครัวชายคาตามสั่งก๋วยเตี๋ยว",
      category: "food",
      subCategory: "อาหารจานเดียว & ก๋วยเตี๋ยว",
      lat: 15.0714252,
      lng: 99.4936949,
      mapsUrl: "https://maps.app.goo.gl/xnfBzDmjwKQwZ2o99",
      distanceFromOrigin: 220,
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
      description: "ร้านอาหารตามสั่งและก๋วยเตี๋ยวรสเด็ด อยู่ใกล้กับลาน Owl Yard มาก (เพียง 1.5 กม.)",
      openingHours: "08:00 - 17:00 น.",
      recommendedMenu: ["กะเพราเนื้อตุ๋น/หมูกรอบ", "ก๋วยเตี๋ยวต้มยำโบราณ"],
      tips: "อาหารจานด่วนใกล้ลานกางเต็นท์",
      highlight: false
    },
    {
      id: "rest_heiauan",
      name: "ราดหน้าเฮียอ้วน @ Banrai",
      category: "food",
      subCategory: "ราดหน้ายอดผัก & อาหารจานด่วน",
      lat: 15.0765284,
      lng: 99.5254919,
      mapsUrl: "https://maps.app.goo.gl/v1p4ZgszpGqFr7TJ8",
      distanceFromOrigin: 222,
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      description: "ร้านราดหน้าระดับตำนานของ อ.บ้านไร่ น้ำราดหน้าเหนียวนุ่มหอมกลิ่นคั่วกระทะ หมูนุ่มยอดผักกรอบ",
      openingHours: "10:00 - 20:00 น.",
      phone: "089-856-7890",
      recommendedMenu: ["ราดหน้าหมูหมักยอดผัก", "ผัดซีอิ๊วทะเล", "หมี่กรอบราดหน้า"],
      tips: "หมี่กรอบราดหน้ารวมมิตรเด็ดมาก",
      highlight: false
    },
    {
      id: "rest_padthai",
      name: "ร้านผัดไทยมรดกโลก (ป้าสมนึก)",
      category: "food",
      subCategory: "ผัดไทยโบราณ / ของดีบ้านไร่",
      lat: 15.0850897,
      lng: 99.5249024,
      mapsUrl: "https://maps.app.goo.gl/1BPNgoTGfNZ5XdUu8",
      distanceFromOrigin: 222,
      image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80",
      description: "ร้านผัดไทยชื่อดังของบ้านไร่ ผัดด้วยเตาถ่านเส้นเหนียวนุ่ม ซอสมะขามเปียกเข้มข้น รสชาติกลมกล่อม",
      openingHours: "09:00 - 16:00 น. (หมดแล้วปิด)",
      phone: "087-198-4567",
      recommendedMenu: ["ผัดไทยกุ้งสดห่อไข่", "ผัดไทยกากหมูโบราณ"],
      tips: "เหมาะเป็นมื้อกลางวัน วันที่ 2 รสชาติอร่อยสมชื่อ",
      highlight: true
    },
    {
      id: "cafe_leleela",
      name: "Le Leela Cafe (เลอ ลีลา คาเฟ่)",
      category: "cafe",
      subCategory: "คาเฟ่สวย / วิวภูเขาบ้านไร่",
      lat: 15.0586269,
      lng: 99.5168511,
      mapsUrl: "https://maps.app.goo.gl/bpwhckzCbzgeBXw99",
      distanceFromOrigin: 223,
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
      description: "คาเฟ่ดีไซน์สวยโมเดิร์นท่ามกลางสวนและวิวขุนเขาบ้านไร่ มีมุมถ่ายรูปสวย กาแฟ Specialty และเค้กโฮมเมด",
      openingHours: "08:30 - 17:30 น. ทุกวัน",
      phone: "086-369-9541",
      recommendedMenu: ["Signature Dirty Coffee", "Matcha Latte มะพร้าวสด", "ชีสเค้กหน้าไหม้"],
      tips: "แวะเช้าวันที่ 2 จิบกาแฟรับลมเย็นๆ ถ่ายรูปสวยมาก",
      highlight: true
    },
    {
      id: "poi_samchuk",
      name: "ตลาดสามชุก 100 ปี (Sam Chuk Old Town)",
      category: "poi",
      subCategory: "ตลาดเก่าแก่ริมน้ำสุพรรณบุรี",
      lat: 14.7554597,
      lng: 100.0947608,
      mapsUrl: "https://maps.app.goo.gl/Tx9V12d6zaevFG8w7",
      distanceFromOrigin: 120,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      description: "ตลาดห้องแถวไม้โบราณริมแม่น้ำท่าจีน แหล่งรวมของกินโบราณ บะหมี่ลูกชิ้นยักษ์ และขนมไข่โบราณ",
      openingHours: "08:30 - 16:30 น. ทุกวัน",
      recommendedMenu: ["ลูกชิ้นยักษ์สามชุก", "เป็ดพะโล้ร้อยปี", "ทองม้วนสด"],
      tips: "จุดแวะพักครึ่งทางวันที่ 1 เหมาะเดินเล่นซื้อเสบียงไปแคมป์",
      highlight: true
    },
    {
      id: "poi_giant_tree",
      name: "ต้นไม้ยักษ์บ้านสะนำ (Giant Tree Ban Rai)",
      category: "poi",
      subCategory: "Unseen Thailand ธรรมชาติ 300-400 ปี",
      lat: 15.0760,
      lng: 99.5280,
      mapsUrl: "https://maps.google.com/?q=ต้นไม้ยักษ์บ้านไร่+อุทัยธานี",
      distanceFromOrigin: 222,
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
      description: "ต้นผึ้งยักษ์โบราณอายุกว่า 300-400 ปี ขนาดใหญ่ประมาณ 40 คนโอบ กลางป่าหมากเขียวขจี ร่มรื่น",
      openingHours: "เปิดทุกวัน 06:00 - 18:00 น.",
      tips: "มีตลาดชุมชนขายผัก ผลไม้ สินค้าพื้นเมือง ห่างจากลาน Owl Yard เพียง 4 กม.",
      highlight: true
    },
    {
      id: "poi_wat_tham_khao_wong",
      name: "วัดถ้ำเขาวง บ้านไร่",
      category: "poi",
      subCategory: "เรือนไทย 4 ชั้นริมผาหินปูน",
      lat: 15.0320,
      lng: 99.4560,
      mapsUrl: "https://maps.google.com/?q=วัดถ้ำเขาวง+อุทัยธานี",
      distanceFromOrigin: 225,
      image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80",
      description: "วัดสวยอันซีนที่มีอาคารเรือนไทย 4 ชั้นสร้างจากไม้สักริมหน้าผาหินปูนสูงใหญ่ มีสระน้ำด้านหน้า สงบร่มเย็น",
      openingHours: "08:00 - 16:30 น. ทุกวัน",
      tips: "อยู่ใกล้ลาน Owl Yard มาก (ขับ 10-15 นาที)",
      highlight: true
    },
    {
      id: "poi_huppatat",
      name: "หุบป่าตาด (Hup Pa Tat - The Jurassic Valley)",
      category: "poi",
      subCategory: "ป่าดึกดำบรรพ์ยุคไดโนเสาร์ Unseen Thailand",
      lat: 15.3780,
      lng: 99.6300,
      mapsUrl: "https://maps.google.com/?q=หุบป่าตาด+อุทัยธานี",
      distanceFromOrigin: 265,
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
      description: "ไฮไลท์ระดับประเทศ เดินลอดถ้ำมืดเข้าสู่หุบเขาที่ซ่อนป่าต้นตาดโบราณยุคจูราสสิก แหล่งอาศัยของกิ้งกือมังกรสีชมพู",
      openingHours: "08:30 - 16:00 น. ทุกวัน",
      tips: "มีไฟฉายให้ยืมเดินผ่านถ้ำ แนะนำใส่รองเท้าที่เดินสบาย",
      highlight: true
    },
    {
      id: "poi_watthasung",
      name: "วัดจันทาราม (วัดท่าซุง)",
      category: "poi",
      subCategory: "วิหารแก้ว 100 เมตร & ปราสาททองคำ",
      lat: 15.3323969,
      lng: 100.0724402,
      mapsUrl: "https://maps.app.goo.gl/Ew2aHyNbefCe1pGr6",
      distanceFromOrigin: 310,
      image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=600&q=80",
      description: "วัดที่มีชื่อเสียงที่สุดของอุทัยธานี มีวิหารแก้ว 100 เมตรประดับกระจกโมเสกสะท้อนแสงระยิบระยับ และปราสาททองคำ",
      openingHours: "วิหารแก้วเปิด 2 รอบ: เช้า 09:00 - 11:45 น. / บ่าย 14:00 - 16:00 น.",
      tips: "วิหารแก้วปิดพักเที่ยง (11:45 - 14:00 น.) วางแผนให้ทันรอบบ่าย 14:00 น.",
      highlight: true
    },
    {
      id: "poi_chainat_bird",
      name: "สวนนกชัยนาท (Chainat Bird Park)",
      category: "poi",
      subCategory: "กรงนกใหญ่ที่สุดในเอเชีย",
      lat: 15.2066066,
      lng: 100.1515585,
      mapsUrl: "https://maps.app.goo.gl/6nk41rB5wdTi19tA8",
      distanceFromOrigin: 345,
      image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=600&q=80",
      description: "แหล่งท่องเที่ยวแลนด์มาร์คของชัยนาท มีกรงนกขนาดมหึมา และอุโมงค์พันธุ์ปลาน้ำจืดลุ่มน้ำเจ้าพระยา",
      openingHours: "08:00 - 17:00 น. ทุกวัน",
      tips: "จุดแวะพักเที่ยวในขากลับก่อนขึ้นถนนสายเอเชีย",
      highlight: true
    }
  ],

  // EV Car Camping Parameters & Tips
  evCampingGuide: {
    title: "คู่มือเทคนิคการนอนในรถ EV (EV Car Camping Guide)",
    powerRule: {
      hourlyConsumption: "0.8 - 1.2 kW/ชม. (เปิดแอร์ 24-25°C ภายนอก 22-26°C)",
      eightHoursUsage: "6.4 - 9.6 kWh (~10% - 16% ขึ้นกับขนาดแบตเตอรี่)",
      tenHoursUsage: "8.0 - 12.0 kWh (~12% - 20% ขึ้นกับขนาดแบตเตอรี่)",
      danChangMargin: "จาก PTT ด่านช้าง ขับ 45 กม. ใช้ไฟ ~6-8 kWh หากชาร์จมา 90% จะถึงลานที่ ~78-82% นอนทั้งคืน 8 ชม. จะเหลือ ~63-68% ปลอดภัย 100%"
    },
    carBrandsCampMode: [
      {
        brand: "Tesla (Model Y / 3)",
        modeName: "Camp Mode",
        steps: "แตะไอคอนแอร์ -> เลือก 'Camp' ระบบจะคงอุณหภูมิ, ปิดไฟหน้า DRL อัตโนมัติ, จอจะแสดงภาพแคมป์ไฟและหรี่แสงลง"
      },
      {
        brand: "BYD (Atto 3 / Dolphin / Seal / Sealion 6)",
        modeName: "Keep AC On / ปล่อยแอร์ทำงาน",
        steps: "สตาร์ทรถไว้ตามปกติ -> เข้า Settings ปิด Daytime Running Light (DRL) -> ล็อกประตูจากด้านใน -> แตะแถบควบคุมแอร์ หรือตั้งเวลาแอร์"
      },
      {
        brand: "MG (MG4 / ZS EV / EP / Maxus 7,9)",
        modeName: "Ready Mode / Sleep AC",
        steps: "เหยียบเบรกให้อยู่สถานะ Ready -> เข้าเมนูไฟหน้าเลือก Off -> ปิดเสียงสังเคราะห์คนเดินเท้า -> ล็อกรถจากสวิตช์ประตูด้านใน"
      },
      {
        brand: "GWM (ORA Good Cat / 07 / Haval)",
        modeName: "Pet Mode / Camp Mode",
        steps: "เปิดโหมดสัตว์เลี้ยง (Pet Mode) หรือเปิดระบบแอร์คงที่ -> ปิดไฟหน้าอัตโนมัติ -> หรี่แสงหน้าจอกลางให้น้อยที่สุด"
      },
      {
        brand: "Changan (Deepal S07 / L07)",
        modeName: "Nap Mode / Camp Mode",
        steps: "เลือก Scene Mode -> Camp Mode เบาะจะปรับเอน แอร์ทำงานต่อเนื่อง ปิดไฟรอบคันอัตโนมัติ"
      },
      {
        brand: "Aion / Neta / อื่นๆ",
        modeName: "Keep Climate / Rest Mode",
        steps: "ตั้งค่าระบบปรับอากาศคงที่ 24-25°C ปิดไฟหน้ารถ ล็อกประตูจากภายใน"
      }
    ],
    proTips: [
      {
        title: "ม่านบังแดดรอบคัน (Custom Sunshades)",
        desc: "จำเป็นอย่างยิ่งสำหรับการ Car Camping ช่วยรักษาความเย็นภายในห้องโดยสาร และให้ความเป็นส่วนตัว 100%"
      },
      {
        title: "ฟูกเป่าลมสำหรับรถยนต์ (Air Mattress / Foam Mat)",
        desc: "พับเบาะหลังแถว 2 ให้เรียบ วางฟูกเป่าลมความหนา 5-10 ซม. พร้อมหมอนผ้าห่ม นอนสบายไม่ต่างจากห้องนอน"
      },
      {
        title: "ระบบ V2L (Vehicle to Load)",
        desc: "หากรถรองรับ V2L สามารถเสียบปลั๊กจ่ายไฟ 220V ให้กับกาน้ำร้อน, โคมไฟแคมป์, พัดลม หรือหม้อต้มชาบูได้ที่ลาน Owl Yard"
      },
      {
        title: "ตั้งอุณหภูมิแอร์ที่ 24-25°C พัดลมเบอร์ 1-2",
        desc: "ที่บ้านไร่ช่วงกลางคืนอากาศเย็นสบาย การตั้งแอร์ 24-25°C จะทำให้คอมเพรสเซอร์แอร์ตัดบ่อย ประหยัดพลังงานเหลือเพียง 0.8 kW/ชม."
      }
    ],
    emergencyContacts: [
      { name: "NEXMOEV Station Call Center", phone: "086-311-4422" },
      { name: "EV Station PluZ Call Center", phone: "1365" },
      { name: "PEA VOLTA Call Center", phone: "1129" },
      { name: "EleX by EGAT Call Center", phone: "02-436-1111" },
      { name: "สายด่วนตำรวจทางหลวง", phone: "1193" },
      { name: "สายด่วนกู้ภัย / อุบัติเหตุ", phone: "1669" }
    ]
  }
};
