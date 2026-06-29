/* Catalog + static data for Utah Backcountry Rentals */
window.DATA = (function () {
  // Categories shown as pills on the home feed
  const categories = ["Bundles", "Safety Tech", "Backpacks", "Camping", "Winter Gear"];

  // Each gear item. `icon` is a Material Symbol; `tint` drives the tile accent.
  const gear = [
    {
      id: "master-safety-kit",
      name: "The Master Safety Kit",
      category: "Bundles",
      tagline: "Includes Osprey 65L, BearVault & active satellite data",
      desc: "Our flagship bundle for 3–5 day backcountry treks. Everything a first-timer needs to stay safe, fed, and connected — packed and trail-ready.",
      price: 65,
      unit: "weekend",
      perDay: 22,
      weight: 9.8,
      icon: "backpack",
      tint: "#1b3022",
      badge: "Most booked",
      includes: ["Osprey Aether 65L pack", "BearVault BV500 canister", "Garmin inReach satellite", "First-aid + water filter"]
    },
    {
      id: "garmin-inreach",
      name: "Garmin inReach Mini 2",
      category: "Safety Tech",
      tagline: "Stay connected anywhere with global satellite messaging",
      desc: "Two-way satellite messaging and interactive SOS that works far beyond cell coverage. Pairs with your phone for trip tracking.",
      price: 30,
      unit: "weekend",
      perDay: 12,
      weight: 0.2,
      icon: "satellite_alt",
      tint: "#ab3500",
      includes: ["inReach Mini 2 device", "USB-C charge cable", "Carabiner mount", "Pre-activated satellite plan"]
    },
    {
      id: "osprey-aether-65",
      name: "Osprey Aether 65L",
      category: "Backpacks",
      tagline: "Adjustable multi-day pack with anti-gravity suspension",
      desc: "A do-it-all 65-liter pack with a custom-moldable hipbelt and integrated rain cover. Carries heavy loads in comfort.",
      price: 40,
      unit: "weekend",
      perDay: 14,
      weight: 4.6,
      icon: "hiking",
      tint: "#364c3c",
      includes: ["Osprey Aether 65L", "Integrated rain cover", "Sleeping bag compartment"]
    },
    {
      id: "bearvault-bv500",
      name: "BearVault BV500",
      category: "Camping",
      tagline: "Bear-proof food canister — 7 days of food",
      desc: "Required in much of Utah's high country. Transparent, tool-free, and certified bear-resistant.",
      price: 5,
      unit: "day",
      perDay: 5,
      weight: 2.5,
      icon: "lunch_dining",
      tint: "#5d6b46"
    },
    {
      id: "nemo-disco-15",
      name: "Nemo Disco 15°",
      category: "Camping",
      tagline: "Spoon-shaped down bag rated to 15°F",
      desc: "Roomy down sleeping bag with thermo gills to vent heat. Stuffs small, sleeps warm.",
      price: 15,
      unit: "day",
      perDay: 15,
      weight: 2.8,
      icon: "bedtime",
      tint: "#2b4a57"
    },
    {
      id: "msr-hubba-tent",
      name: "MSR Hubba Hubba 2",
      category: "Camping",
      tagline: "Freestanding 2-person ultralight tent",
      desc: "Livable two-person, three-season tent that sets up in minutes and packs down tiny.",
      price: 25,
      unit: "weekend",
      perDay: 10,
      weight: 3.1,
      icon: "cabin",
      tint: "#3c6168"
    },
    {
      id: "winter-traction-kit",
      name: "Winter Traction Kit",
      category: "Winter Gear",
      tagline: "MSR snowshoes + trekking poles + microspikes",
      desc: "Everything you need to keep moving when the trail turns to snow and ice.",
      price: 35,
      unit: "weekend",
      perDay: 14,
      weight: 6.4,
      icon: "ac_unit",
      tint: "#2b4a57",
      includes: ["MSR Evo snowshoes", "Adjustable trekking poles", "Kahtoola microspikes"]
    },
    {
      id: "water-filter",
      name: "Katadyn BeFree Filter",
      category: "Safety Tech",
      tagline: "1L collapsible water filter, 1000L lifespan",
      desc: "Fast-flowing hollow-fiber filter for clean water straight from the stream.",
      price: 6,
      unit: "day",
      perDay: 6,
      weight: 0.6,
      icon: "water_drop",
      tint: "#3c6168"
    }
  ];

  // Gear library used by the Pack Builder. `img` points at a local product photo
  // (images/<id>.jpg) and falls back to the icon tile if the file isn't present.
  const packLibrary = [
    { id: "osprey-rook-65", name: "Osprey Rook 65", cat: "Backpacks", weight: 3.2, perDay: 8, icon: "backpack", tint: "#364c3c",
      img: "images/osprey-rook-65.jpg", spec: "65L · adjustable suspension for a universal fit",
      tips: ["Loosen all straps before fitting", "Pack heavy items high and close to your back"] },
    { id: "naturehike-cloudup-1", name: "Naturehike Cloud Up 1", cat: "Shelter", weight: 2.6, perDay: 10, icon: "cabin", tint: "#3c6168",
      img: "images/naturehike-cloudup-1.jpg", spec: "1-person · lightweight aluminum poles" },
    { id: "kelty-cosmic-20", name: "Kelty Cosmic 20°", cat: "Sleep", weight: 2.9, perDay: 8, icon: "bedtime", tint: "#2b4a57",
      img: "images/kelty-cosmic-20.jpg", spec: "Synthetic · 20°F rating · machine washable" },
    { id: "klymit-static-v", name: "Klymit Static V Base", cat: "Sleep", weight: 1.4, perDay: 5, icon: "king_bed", tint: "#5d6b46",
      img: "images/klymit-static-v.jpg", spec: "Rugged, puncture-resistant sleeping pad" },
    { id: "brs-3000t", name: "BRS-3000T Stove", cat: "Cooking", weight: 0.1, perDay: 3, icon: "outdoor_grill", tint: "#ab3500",
      img: "images/brs-3000t.jpg", spec: "Titanium · ultralight (25g), packs tiny" },
    { id: "garmin-inreach", name: "Garmin inReach Mini 2", cat: "Safety", weight: 0.2, perDay: 12, icon: "satellite_alt", tint: "#ab3500",
      img: "images/garmin-inreach.jpg", spec: "Two-way satellite messaging + live tracking",
      tips: ["Charge to 100%", "Don't hide it in a pocket", "Keep a clear view of the sky"] },
    { id: "bearvault-bv450", name: "BearVault BV450", cat: "Safety", weight: 2.1, perDay: 5, icon: "lunch_dining", tint: "#5d6b46",
      img: "images/bearvault-bv450.jpg", spec: "Hard-sided, bear-resistant food canister",
      tips: ["Store 100ft from your tent", "Never keep it inside the tent"] },
    { id: "anker-10k", name: "Anker 10,000mAh", cat: "Power", weight: 0.4, perDay: 4, icon: "battery_charging_full", tint: "#1b3022",
      img: "images/anker-10k.jpg", spec: "Compact power bank · 1–3 full phone charges" },
    { id: "bear-spray", name: "Frontiersman Bear Spray", cat: "Safety", weight: 0.5, perDay: 4, icon: "health_and_safety", tint: "#ba1a1a",
      img: "images/bear-spray.jpg", spec: "EPA-approved · 40-foot range",
      tips: ["Carry on your hip belt, not inside the pack", "Check wind direction before using"] }
  ];

  const packCats = ["All Items", "Backpacks", "Shelter", "Sleep", "Cooking", "Safety", "Power"];

  // Pre-built starting points the user can load into the builder, then customize.
  const kits = [
    { id: "lead", name: "The Lead Pack", icon: "backpack", tint: "#1b3022",
      blurb: "Carries the shared safety tech, food storage & power for the whole group.",
      items: ["osprey-rook-65", "naturehike-cloudup-1", "kelty-cosmic-20", "klymit-static-v", "brs-3000t", "garmin-inreach", "bearvault-bv450", "anker-10k", "bear-spray"] },
    { id: "follow", name: "The Follow Pack", icon: "hiking", tint: "#364c3c",
      blurb: "A lighter second-person kit — shelter & sleep, none of the bulky shared hardware.",
      items: ["osprey-rook-65", "naturehike-cloudup-1", "kelty-cosmic-20", "klymit-static-v", "brs-3000t"] }
  ];

  const addons = [
    { id: "batteries", name: "Extra Batteries", price: 5 },
    { id: "poncho", name: "Disposable Rain Poncho", price: 3 },
    { id: "map-kit", name: "Trail Map / Compass Kit", price: 10 }
  ];

  const steps = [
    { icon: "calendar_month", title: "Pick your dates", text: "Choose your gear and the days you'll be on the trail. Pay only for the days you rent." },
    { icon: "inventory_2", title: "Grab your pack", text: "Pick up trail-ready, sanitized gear at our Saratoga Springs depot — or build your own custom pack." },
    { icon: "forest", title: "Hit the backcountry", text: "Go explore. When you're back, just drop the gear off. We handle the cleaning." }
  ];

  // Flat rental price (USD) per item — what the customer pays. A pack's total is
  // the sum of its items × quantity. ⚠️ PLACEHOLDERS: edit in the Manage Gear admin
  // (per item) and keep netlify/functions/_pricing.js PRICES in sync.
  const PRICES = {
    "master-safety-kit": 65, "garmin-inreach": 30, "osprey-aether-65": 40,
    "bearvault-bv500": 12, "nemo-disco-15": 25, "msr-hubba-tent": 30,
    "winter-traction-kit": 35, "water-filter": 10,
    "osprey-rook-65": 40, "naturehike-cloudup-1": 30, "kelty-cosmic-20": 25,
    "klymit-static-v": 15, "brs-3000t": 10, "bearvault-bv450": 15,
    "anker-10k": 12, "bear-spray": 12
  };

  // Refundable security deposit (USD) per item = YOUR replacement cost, held at
  // pickup. ⚠️ PLACEHOLDERS: edit in the admin; mirror in _pricing.js DEPOSITS.
  const DEPOSITS = {
    "master-safety-kit": 250, "garmin-inreach": 100, "osprey-aether-65": 80,
    "bearvault-bv500": 30, "nemo-disco-15": 60, "msr-hubba-tent": 120,
    "winter-traction-kit": 100, "water-filter": 20,
    "osprey-rook-65": 80, "naturehike-cloudup-1": 60, "kelty-cosmic-20": 50,
    "klymit-static-v": 30, "brs-3000t": 20, "bearvault-bv450": 25,
    "anker-10k": 15, "bear-spray": 15
  };
  gear.forEach(g => { g.price = PRICES[g.id] != null ? PRICES[g.id] : g.price; g.deposit = DEPOSITS[g.id] || 0; });
  packLibrary.forEach(x => { x.price = PRICES[x.id] || 0; x.deposit = DEPOSITS[x.id] || 0; });

  return { categories, gear, packLibrary, packCats, kits, addons, PRICES, DEPOSITS, steps, depot: "Saratoga Springs, UT" };
})();
