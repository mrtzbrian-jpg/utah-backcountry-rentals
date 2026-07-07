/* Catalog + static data for Take a Hike Rentals
 * Gear sourced from Walmart & Amazon — budget-friendly, real adventure.
 */
window.DATA = (function () {
  const categories = ["Bundles", "Backpacks", "Shelter", "Sleep", "Water", "Cooking", "Safety", "Extras"];

  const gear = [
    /* ---- PRE-BUILT BUNDLES ---- */
    {
      id: "solo-weekend-bundle",
      name: "Solo Adventurer Bundle",
      category: "Bundles",
      tagline: "Full backpacking setup for one — $260+ in gear, one flat weekend rate",
      desc: "Everything a solo hiker needs, sourced from Walmart and Amazon to keep costs low. Pack, tent, warm sleep system, water filter, stove, and cookpot — clean and ready at pickup.",
      price: 79,
      unit: "weekend",
      weight: 13.8,
      icon: "backpack",
      tint: "#1b3022",
      badge: "Best for solo",
      deposit: 250,
      bundleItems: [
        { id: "budget-pack-50l",      qty: 1 },
        { id: "ozark-trail-tent",     qty: 1 },
        { id: "ozark-sleeping-bag",   qty: 1 },
        { id: "foam-sleep-pad",       qty: 1 },
        { id: "sawyer-squeeze",       qty: 1 },
        { id: "headlamp-200l",        qty: 1 },
        { id: "brs-stove-kit",        qty: 1 },
        { id: "titanium-cookpot",     qty: 1 }
      ],
      includes: [
        "Budget 50L Hiking Pack (Walmart)",
        "Ozark Trail 2-Person Backpacking Tent ($80 Walmart)",
        "30°F Mummy Sleeping Bag (Walmart)",
        "Foam Sleeping Pad (Walmart)",
        "Sawyer Squeeze Water Filter (Walmart ~$35)",
        "200-Lumen Headlamp + batteries (Walmart)",
        "BRS-3000T Ultralight Stove + isobutane fuel (Amazon)",
        "Titanium Cookpot 750ml + lid (Amazon)"
      ]
    },
    {
      id: "couples-weekend-bundle",
      name: "Couples Weekend Bundle",
      category: "Bundles",
      tagline: "Two-person kit — share the views, not the credit card bill",
      desc: "Built for two from budget-friendly Walmart and Amazon gear. Two packs, a 2-person tent, two sleep systems, water filter, stove, and cookpot. Everything from trailhead to camp and back.",
      price: 145,
      unit: "weekend",
      weight: 26.6,
      icon: "people",
      tint: "#364c3c",
      badge: "Best for two",
      deposit: 350,
      bundleItems: [
        { id: "budget-pack-50l",      qty: 2 },
        { id: "ozark-trail-tent",     qty: 1 },
        { id: "ozark-sleeping-bag",   qty: 2 },
        { id: "foam-sleep-pad",       qty: 2 },
        { id: "sawyer-squeeze",       qty: 1 },
        { id: "headlamp-200l",        qty: 2 },
        { id: "brs-stove-kit",        qty: 1 },
        { id: "titanium-cookpot",     qty: 1 }
      ],
      includes: [
        "2× Budget 50L Hiking Packs",
        "Ozark Trail 2-Person Backpacking Tent",
        "2× 30°F Mummy Sleeping Bags",
        "2× Foam Sleeping Pads",
        "Sawyer Squeeze Water Filter",
        "2× 200-Lumen Headlamps",
        "BRS-3000T Ultralight Stove + isobutane fuel",
        "Titanium Cookpot 750ml"
      ]
    },
    {
      id: "family-weekend-bundle",
      name: "Family Weekend Bundle",
      category: "Bundles",
      tagline: "The whole family outdoors — gear for 4, budget for real life",
      desc: "Take the whole family off-grid without the sticker shock. Two adult packs, two kid daypacks, two tents, four sleeping bags, four pads, water filter, stove, and cookpot — all sourced budget-smart from Walmart and Amazon.",
      price: 195,
      unit: "weekend",
      weight: 44.2,
      icon: "family_restroom",
      tint: "#2b4a57",
      badge: "Family pick",
      deposit: 500,
      bundleItems: [
        { id: "budget-pack-50l",      qty: 2 },
        { id: "kid-daypack",          qty: 2 },
        { id: "ozark-trail-tent",     qty: 2 },
        { id: "ozark-sleeping-bag",   qty: 4 },
        { id: "foam-sleep-pad",       qty: 4 },
        { id: "sawyer-squeeze",       qty: 1 },
        { id: "headlamp-200l",        qty: 3 },
        { id: "brs-stove-kit",        qty: 1 },
        { id: "titanium-cookpot",     qty: 1 }
      ],
      includes: [
        "2× Budget 50L Adult Hiking Packs",
        "2× Kid Daypacks 20L",
        "2× Ozark Trail 2-Person Tents",
        "4× 30°F Mummy Sleeping Bags",
        "4× Foam Sleeping Pads",
        "Sawyer Squeeze Water Filter",
        "3× 200-Lumen Headlamps",
        "BRS-3000T Ultralight Stove + isobutane fuel",
        "Titanium Cookpot 750ml"
      ]
    },

    /* ---- INDIVIDUAL GEAR ---- */
    {
      id: "budget-pack-50l",
      name: "Budget Hiking Pack 50L",
      category: "Backpacks",
      tagline: "Spacious 50L pack with padded hipbelt and rain cover",
      desc: "A capable 50-liter hiking pack sourced from Walmart. Adjustable torso, padded hip belt, compression straps, and included rain cover. Comfortably carries a full weekend's gear.",
      price: 15,
      unit: "weekend",
      perDay: 6,
      weight: 3.2,
      icon: "backpack",
      tint: "#4a4a4a",
      includes: ["50L hiking pack", "Padded hip belt", "Included rain cover"]
    },
    {
      id: "kid-daypack",
      name: "Kid's Daypack 20L",
      category: "Backpacks",
      tagline: "Right-sized 20L pack for kids aged 6–12",
      desc: "A comfortable 20-liter daypack sized for kids, from Walmart. Padded back panel, adjustable shoulder straps, and dual water bottle pockets. Let the little ones carry their own snacks.",
      price: 8,
      unit: "weekend",
      perDay: 3,
      weight: 0.8,
      icon: "school",
      tint: "#364c3c",
      includes: ["20L kid's daypack", "Side water bottle pockets", "Adjustable straps"]
    },
    {
      id: "ozark-trail-tent",
      name: "Ozark Trail 2-Person Backpacking Tent",
      category: "Shelter",
      tagline: "Lightweight freestanding tent — $80 from Walmart",
      desc: "The Ozark Trail 2-person backpacking tent from Walmart. Freestanding, full-coverage rainfly, vestibule for gear storage. Sets up in minutes, packs down small enough for any 50L pack.",
      price: 20,
      unit: "weekend",
      perDay: 8,
      weight: 4.9,
      icon: "cabin",
      tint: "#3c6168",
      includes: ["Ozark Trail 2-person tent", "Full rainfly", "Stakes and guylines"]
    },
    {
      id: "ozark-sleeping-bag",
      name: "Ozark Trail 30°F Mummy Bag",
      category: "Sleep",
      tagline: "Cold-weather mummy bag rated to 30°F — handles Utah's cool nights",
      desc: "Ozark Trail's 30°F cold-weather mummy sleeping bag from Walmart. Polyester fill, full-length draft zipper, insulated hood — warm enough for spring/fall nights at elevation throughout Utah.",
      price: 8,
      unit: "day",
      perDay: 8,
      weight: 3.2,
      icon: "bedtime",
      tint: "#2b4a57",
      includes: ["30°F mummy sleeping bag", "Compression stuff sack"]
    },
    {
      id: "foam-sleep-pad",
      name: "Foam Sleeping Pad",
      category: "Sleep",
      tagline: "Closed-cell foam pad — lightweight, zero-maintenance insulation",
      desc: "Ozark Trail closed-cell foam sleeping pad from Walmart. Indestructible, zero-maintenance, and just warm enough. Rolls up and straps to the outside of your pack in seconds.",
      price: 3,
      unit: "day",
      perDay: 3,
      weight: 1.1,
      icon: "king_bed",
      tint: "#5d6b46",
      includes: ["Foam sleeping pad", "Bungee strap"]
    },
    {
      id: "sawyer-squeeze",
      name: "Sawyer Squeeze Water Filter",
      category: "Water",
      tagline: "Filters 100,000 gallons — removes 99.99% of bacteria & protozoa",
      desc: "The Sawyer Squeeze is the go-to budget backpacking filter — available at Walmart. Squeeze clean water from any stream or lake in seconds. No batteries, no tablets, no waiting.",
      price: 5,
      unit: "day",
      perDay: 5,
      weight: 0.5,
      icon: "water_drop",
      tint: "#3c6168",
      includes: ["Sawyer Squeeze filter", "2× 32oz squeeze pouches", "Drinking straw adapter"]
    },
    {
      id: "brs-stove-kit",
      name: "BRS-3000T Stove + Fuel",
      category: "Cooking",
      tagline: "Ultralight titanium stove — boils water in 3 min, weighs less than a AA battery",
      desc: "The BRS-3000T ultralight titanium canister stove (Amazon, ~$16), paired with a 100g isobutane/propane fuel canister. Folds to the size of a matchbox. Perfect for one or two people.",
      price: 8,
      unit: "day",
      perDay: 8,
      weight: 0.2,
      icon: "outdoor_grill",
      tint: "#ab3500",
      includes: ["BRS-3000T titanium canister stove", "100g isobutane fuel canister", "Protective case"]
    },
    {
      id: "titanium-cookpot",
      name: "Titanium Cookpot 750ml",
      category: "Cooking",
      tagline: "Lightweight titanium pot with lid — boils 2 freeze-dried meals at once",
      desc: "Budget titanium 750ml cookpot from Amazon. Lightweight, folding handles, vented lid that doubles as a strainer. Fits perfectly over the BRS-3000T stove.",
      price: 5,
      unit: "day",
      perDay: 5,
      weight: 0.3,
      icon: "soup_kitchen",
      tint: "#5d6b46",
      includes: ["Titanium 750ml pot", "Vented lid / strainer", "Folding handles"]
    },
    {
      id: "headlamp-200l",
      name: "200-Lumen Headlamp",
      category: "Extras",
      tagline: "Hands-free bright headlamp with red night-vision mode",
      desc: "Ozark Trail 200-lumen LED headlamp from Walmart. Multiple brightness modes plus a red night-vision mode that won't kill your night eyes. Ships with batteries installed.",
      price: 3,
      unit: "day",
      perDay: 3,
      weight: 0.3,
      icon: "flashlight_on",
      tint: "#ab3500",
      includes: ["200-lumen headlamp", "AAA batteries included", "Adjustable elastic strap"]
    },
    {
      id: "trekking-poles",
      name: "Collapsible Trekking Poles",
      category: "Extras",
      tagline: "Lightweight aluminum poles — save your knees on descents",
      desc: "Budget-friendly collapsible aluminum trekking poles from Walmart (~$20/pair). Adjustable height 95–135cm, cork-style EVA grips, quick-lock sections. Collapses to 15 inches for pack storage.",
      price: 6,
      unit: "day",
      perDay: 6,
      weight: 1.1,
      icon: "hiking",
      tint: "#4a4a4a",
      includes: ["Pair of collapsible trekking poles", "Wrist straps", "Tip protectors"]
    },
    {
      id: "garmin-inreach",
      name: "Garmin inReach Mini 2",
      category: "Safety",
      tagline: "Two-way satellite messaging + SOS — works where your phone doesn't",
      desc: "Stay connected anywhere on Earth with global satellite messaging and interactive SOS. Essential for remote Utah backcountry far beyond cell service. Pre-activated plan included for the duration of your rental.",
      price: 30,
      unit: "weekend",
      perDay: 12,
      weight: 0.2,
      icon: "satellite_alt",
      tint: "#ab3500",
      includes: ["Garmin inReach Mini 2", "USB-C charge cable", "Carabiner clip", "Pre-activated satellite plan"]
    },
    {
      id: "bear-canister",
      name: "BearVault BV500 Bear Canister",
      category: "Safety",
      tagline: "Hard-sided bear canister — required in some Utah backcountry areas",
      desc: "The BearVault BV500 holds up to 7 days of food and is certified bear-resistant. Clear sides let you find food without digging. Tool-free coin-slot lid. Required in select Utah wilderness areas — check park regulations before your trip.",
      price: 5,
      unit: "day",
      perDay: 5,
      weight: 2.5,
      icon: "lunch_dining",
      tint: "#5d6b46",
      includes: ["BearVault BV500 canister", "Holds 7 days of food", "Tool-free lid"]
    },
    {
      id: "winter-traction-kit",
      name: "Winter Traction Kit",
      category: "Extras",
      tagline: "Microspikes + trekking poles for icy winter trails",
      desc: "Everything you need when the trail turns to snow and ice. Kahtoola microspikes strap over any boot in seconds. Paired with adjustable trekking poles for balance on slick terrain.",
      price: 35,
      unit: "weekend",
      perDay: 14,
      weight: 3.8,
      icon: "ac_unit",
      tint: "#2b4a57",
      includes: ["Kahtoola microspikes", "Adjustable trekking poles", "Carry bag"]
    }
  ];

  // Pack builder library — items available in the custom bundle builder.
  const packLibrary = [
    { id: "budget-pack-50l", name: "Budget Hiking Pack 50L", cat: "Backpacks", weight: 3.2, perDay: 6, icon: "backpack", tint: "#4a4a4a",
      spec: "50L · padded hip belt · rain cover · adjustable torso",
      tips: ["Pack heavy items high and close to your back", "Use compression straps to snug the load for shorter day hikes"] },
    { id: "ozark-trail-tent", name: "Ozark Trail 2-Person Tent", cat: "Shelter", weight: 4.9, perDay: 8, icon: "cabin", tint: "#3c6168",
      spec: "2-person · 3-season · full rainfly · freestanding",
      tips: ["Stake out the footprint corners first", "Leave vents slightly open to cut condensation overnight"] },
    { id: "ozark-sleeping-bag", name: "30°F Mummy Sleeping Bag", cat: "Sleep", weight: 3.2, perDay: 8, icon: "bedtime", tint: "#2b4a57",
      spec: "30°F rating · insulated hood · full-length draft zipper" },
    { id: "foam-sleep-pad", name: "Foam Sleeping Pad", cat: "Sleep", weight: 1.1, perDay: 3, icon: "king_bed", tint: "#5d6b46",
      spec: "Closed-cell foam · R-value 2.0 · rolls to 4\" diameter" },
    { id: "sawyer-squeeze", name: "Sawyer Squeeze Filter", cat: "Water", weight: 0.5, perDay: 5, icon: "water_drop", tint: "#3c6168",
      spec: "0.1 micron hollow fiber · 100,000-gallon rated · no chemicals",
      tips: ["Backflush after each trip to restore full flow rate", "Never let it freeze — store it inside your sleeping bag on cold nights"] },
    { id: "headlamp-200l", name: "200-Lumen Headlamp", cat: "Extras", weight: 0.3, perDay: 3, icon: "flashlight_on", tint: "#ab3500",
      spec: "200 lumens max · red night-vision mode · batteries included" },
    { id: "brs-stove-kit", name: "BRS-3000T Stove + Fuel", cat: "Cooking", weight: 0.2, perDay: 8, icon: "outdoor_grill", tint: "#ab3500",
      spec: "Titanium · 25g stove · boils 1L in ~3 min · 100g canister included",
      tips: ["Shield from wind — even a light breeze triples boil time", "Simmer by slightly lifting the pot off the burner"] },
    { id: "titanium-cookpot", name: "Titanium Cookpot 750ml", cat: "Cooking", weight: 0.3, perDay: 5, icon: "soup_kitchen", tint: "#5d6b46",
      spec: "750ml · titanium · folding handles · vented lid / strainer" },
    { id: "trekking-poles", name: "Collapsible Trekking Poles", cat: "Extras", weight: 1.1, perDay: 6, icon: "hiking", tint: "#4a4a4a",
      spec: "Aluminum · adjustable 95–135cm · EVA foam grips",
      tips: ["Shorten poles going uphill, lengthen going downhill", "Poles reduce knee strain by ~25% on descents"] },
    { id: "garmin-inreach", name: "Garmin inReach Mini 2", cat: "Safety", weight: 0.2, perDay: 12, icon: "satellite_alt", tint: "#ab3500",
      spec: "Two-way satellite messaging · interactive SOS · live tracking",
      tips: ["Charge to 100% the night before your trip", "Keep a clear view of sky — works poorly under dense tree cover", "Clip to shoulder strap, not buried in your pack"] },
    { id: "bear-canister", name: "BearVault BV500", cat: "Safety", weight: 2.5, perDay: 5, icon: "lunch_dining", tint: "#5d6b46",
      spec: "Bear-resistant certified · 700 cu in · holds 7 days of food",
      tips: ["Store 200ft from camp in all directions", "Keep ALL scented items inside — sunscreen, lip balm, trash counts too"] }
  ];

  const packCats = ["All Items", "Backpacks", "Shelter", "Sleep", "Water", "Cooking", "Safety", "Extras"];

  // Preset starting points users can load into the builder, then customize.
  const kits = [
    { id: "lead", name: "The Solo Kit", icon: "backpack", tint: "#1b3022",
      blurb: "One-person setup: pack, shelter, sleep system, water, and cooking.",
      items: ["budget-pack-50l", "ozark-trail-tent", "ozark-sleeping-bag", "foam-sleep-pad", "sawyer-squeeze", "headlamp-200l", "brs-stove-kit", "titanium-cookpot"] },
    { id: "follow", name: "The Couples Kit", icon: "people", tint: "#364c3c",
      blurb: "Two-person setup: packs, shared tent, sleep systems, water, and cooking.",
      items: ["budget-pack-50l", "ozark-trail-tent", "ozark-sleeping-bag", "foam-sleep-pad", "sawyer-squeeze", "headlamp-200l", "brs-stove-kit", "garmin-inreach"] }
  ];

  const addons = [
    { id: "batteries", name: "Extra Batteries (AA/AAA 4-pack)", price: 5 },
    { id: "poncho", name: "Disposable Rain Poncho", price: 3 },
    { id: "map-kit", name: "Trail Map / Compass Kit", price: 10 }
  ];

  const steps = [
    { icon: "calendar_month", title: "Pick your dates", text: "Choose your gear and the days you'll be on the trail. Pay only for the days you rent." },
    { icon: "inventory_2", title: "Get your gear", text: "Pick up at our Saratoga Springs depot, get hotel / Airbnb delivery, or arrange SLC airport pickup — whatever works best for your trip." },
    { icon: "forest", title: "Hit the backcountry", text: "Go explore. When you're back, just drop the gear off. We handle the cleaning." }
  ];

  // Flat rental price (USD) per item. ⚠️ Keep netlify/functions/_pricing.js FALLBACK_PRICES in sync.
  const PRICES = {
    "solo-weekend-bundle":    79,
    "couples-weekend-bundle": 145,
    "family-weekend-bundle":  195,
    "budget-pack-50l":        15,
    "kid-daypack":            8,
    "ozark-trail-tent":       20,
    "ozark-sleeping-bag":     8,
    "foam-sleep-pad":         3,
    "sawyer-squeeze":         5,
    "brs-stove-kit":          8,
    "titanium-cookpot":       5,
    "headlamp-200l":          3,
    "trekking-poles":         6,
    "garmin-inreach":         30,
    "bear-canister":          5,
    "winter-traction-kit":    35
  };

  // Auth hold amount (USD) per item = replacement cost. Released on return.
  // ⚠️ Keep netlify/functions/_pricing.js FALLBACK_DEPOSITS in sync.
  const DEPOSITS = {
    "solo-weekend-bundle":    250,
    "couples-weekend-bundle": 350,
    "family-weekend-bundle":  500,
    "budget-pack-50l":        55,
    "kid-daypack":            22,
    "ozark-trail-tent":       90,
    "ozark-sleeping-bag":     40,
    "foam-sleep-pad":         18,
    "sawyer-squeeze":         38,
    "brs-stove-kit":          25,
    "titanium-cookpot":       22,
    "headlamp-200l":          12,
    "trekking-poles":         25,
    "garmin-inreach":         100,
    "bear-canister":          85,
    "winter-traction-kit":    100
  };

  gear.forEach(g => { g.price = PRICES[g.id] != null ? PRICES[g.id] : g.price; g.deposit = DEPOSITS[g.id] || 0; });
  packLibrary.forEach(x => { x.price = PRICES[x.id] || 0; x.deposit = DEPOSITS[x.id] || 0; });

  return { categories, gear, packLibrary, packCats, kits, addons, PRICES, DEPOSITS, steps, depot: "Saratoga Springs, UT" };
})();

// Every custom bundle is built on this base backpack (always included). The
// builder resolves it from the live catalog first, then falls back to this object.
window.BASE_PACK_ID = "budget-pack-50l";
window.BASE_PACK = {
  id: "budget-pack-50l",
  name: "Budget Hiking Pack 50L",
  category: "Backpacks",
  tagline: "Spacious 50L pack with padded hipbelt — the foundation of every custom kit",
  desc: "A capable 50-liter hiking pack sourced from Walmart. Adjustable torso, padded hip belt, compression straps, and rain cover. Comfortably carries a full weekend's load.",
  price: 15,
  deposit: 55,
  weight: 3.2,
  icon: "backpack",
  tint: "#4a4a4a"
};
