-- ============================================================
-- Take a Hike Rentals — Seed / Update Products Catalog
-- Run in: Supabase Dashboard → SQL Editor → New Query → paste → Run
-- Safe to run multiple times — upserts won't create duplicates.
-- ============================================================

-- Step 1: Deactivate old product IDs that no longer exist in the catalog
--         (they'll stay in the DB for booking history but won't show in admin)
UPDATE products SET active = false
WHERE id IN (
  'teton-explorer-65', 'osprey-aether-65', 'msr-hubba-tent',
  'nemo-disco-15', 'bearvault-bv500', 'water-filter',
  'master-safety-kit', 'osprey-rook-65', 'naturehike-cloudup-1',
  'kelty-cosmic-20', 'klymit-static-v', 'brs-3000t',
  'bearvault-bv450', 'anker-10k', 'bear-spray'
);

-- Step 2: Upsert all current products with correct prices and deposit holds
INSERT INTO products
  (id, sort_order, name, category, tagline, description,
   price, deposit, icon, tint, unit, weight, quantity, badge, includes, active)
VALUES

  -- ── BUNDLES ──────────────────────────────────────────────────────────────

  ('solo-weekend-bundle', 10,
   'Solo Adventurer Bundle', 'Bundles',
   'Full backpacking setup for one — $260+ in gear, one flat weekend rate',
   'Everything a solo hiker needs, sourced from Walmart and Amazon to keep costs low. Pack, tent, warm sleep system, water filter, stove, cookpot, and full trail safety kit — clean and ready at pickup.',
   79.00, 250.00, 'backpack', '#1b3022', 'weekend', 13.8, 3, 'Best for solo',
   '["Budget 50L Hiking Pack (Walmart)","Ozark Trail 2-Person Backpacking Tent ($80 Walmart)","30°F Mummy Sleeping Bag (Walmart)","Foam Sleeping Pad (Walmart)","Sawyer Squeeze Water Filter + 2 squeeze pouches","200-Lumen Headlamp + batteries","BRS-3000T Stove + isobutane fuel + lighter","Titanium Cookpot 750ml + lid + camp spork","Trail Safety Kit: first aid, space blanket, knife, whistle, trowel, LNT waste bags"]',
   true),

  ('couples-weekend-bundle', 20,
   'Couples Weekend Bundle', 'Bundles',
   'Two-person kit — share the views, not the credit card bill',
   'Built for two from budget-friendly Walmart and Amazon gear. Two packs, a 2-person tent, two sleep systems, water filter, stove, cookpot, and trail safety kit.',
   145.00, 350.00, 'people', '#364c3c', 'weekend', 26.6, 2, 'Best for two',
   '["2× Budget 50L Hiking Packs","Ozark Trail 2-Person Backpacking Tent","2× 30°F Mummy Sleeping Bags","2× Foam Sleeping Pads","Sawyer Squeeze Water Filter + 2 squeeze pouches","2× 200-Lumen Headlamps","BRS-3000T Stove + isobutane fuel + lighter","Titanium Cookpot 750ml + lid + 2× camp sporks","Trail Safety Kit: first aid, space blanket, knife, whistle, trowel, LNT waste bags"]',
   true),

  ('family-weekend-bundle', 30,
   'Family Weekend Bundle', 'Bundles',
   '4 matching packs, one big tent, shared gear — smart not heavy',
   'Four matching 50L packs (one per person), plus the 10-person Ozark Trail cabin tent with 3 rooms and full standing height. Sleep systems for all four, one shared water filter, one stove, and two cookpots. No doubling up on gear the family shares.',
   199.00, 550.00, 'family_restroom', '#2b4a57', 'weekend', 62.0, 1, 'Family pick',
   '["4× Budget 50L Hiking Packs — one per person, all matching","10-Person Ozark Trail Cabin Tent — 3 rooms, full standing height","4× 30°F Mummy Sleeping Bags","4× Foam Sleeping Pads","Sawyer Squeeze Water Filter — one filter handles the whole family","4× 200-Lumen Headlamps","BRS-3000T Stove + isobutane fuel + lighter","2× Titanium Cookpots — boil water and cook simultaneously","Trail Safety Kit: first aid, space blanket, knife, whistle, trowel, LNT waste bags"]',
   true),

  -- ── INDIVIDUAL GEAR ──────────────────────────────────────────────────────

  ('budget-pack-50l', 40,
   'Budget Hiking Pack 50L', 'Backpacks',
   'Spacious 50L pack with padded hipbelt and rain cover',
   'A capable 50-liter hiking pack sourced from Walmart. Adjustable torso, padded hip belt, compression straps, and included rain cover.',
   15.00, 55.00, 'backpack', '#4a4a4a', 'weekend', 3.2, 5, null, null, true),

  ('kid-daypack', 45,
   'Kid''s Daypack 20L', 'Backpacks',
   'Right-sized 20L pack for kids aged 6–12',
   'A comfortable 20-liter daypack sized for kids, from Walmart. Padded back panel, adjustable shoulder straps, and dual water bottle pockets.',
   8.00, 22.00, 'school', '#364c3c', 'weekend', 0.8, 4, null, null, true),

  ('ozark-trail-tent', 50,
   'Ozark Trail 2-Person Backpacking Tent', 'Shelter',
   'Lightweight freestanding tent — $80 from Walmart',
   'The Ozark Trail 2-person backpacking tent from Walmart. Freestanding, full-coverage rainfly, vestibule for gear storage. Sets up in minutes, packs down small.',
   20.00, 90.00, 'cabin', '#3c6168', 'weekend', 4.9, 5, null, null, true),

  ('cabin-tent-10p', 55,
   '10-Person Family Cabin Tent', 'Shelter',
   'Stand-up room for the whole crew — 3 rooms, fits 4 air mattresses',
   'Ozark Trail 10-person 3-room cabin tent. Full standing height, divides into 3 separate rooms or opens as one big space. Front awning, gear loft, and E-port for power cords. Built for drive-in campsite comfort — pairs perfectly with the Family Bundle.',
   25.00, 150.00, 'holiday_village', '#2b4a57', 'weekend', 28.0, 1, null,
   '["Ozark Trail 10-person cabin tent","3 removable room dividers","Front awning porch","Stakes, guylines, and carry bag"]',
   true),

  ('ozark-sleeping-bag', 60,
   'Ozark Trail 30°F Mummy Bag', 'Sleep',
   'Cold-weather mummy bag rated to 30°F — handles Utah''s cool nights',
   'Ozark Trail 30°F cold-weather mummy sleeping bag from Walmart. Polyester fill, full-length draft zipper, insulated hood — warm enough for spring/fall nights at elevation.',
   8.00, 40.00, 'bedtime', '#2b4a57', 'day', 3.2, 8, null, null, true),

  ('foam-sleep-pad', 70,
   'Foam Sleeping Pad', 'Sleep',
   'Closed-cell foam pad — lightweight, zero-maintenance insulation',
   'Ozark Trail closed-cell foam sleeping pad from Walmart. Indestructible, zero-maintenance. Rolls up and straps to the outside of your pack in seconds.',
   3.00, 18.00, 'king_bed', '#5d6b46', 'day', 1.1, 8, null, null, true),

  ('sawyer-squeeze', 80,
   'Sawyer Squeeze Water Filter', 'Water',
   'Filters 100,000 gallons — removes 99.99% of bacteria & protozoa',
   'The Sawyer Squeeze is the go-to budget backpacking filter, available at Walmart. Squeeze clean water from any stream or lake in seconds. Comes with 2× 32oz squeeze pouches.',
   5.00, 38.00, 'water_drop', '#3c6168', 'day', 0.5, 5, null, null, true),

  ('brs-stove-kit', 90,
   'BRS-3000T Stove + Fuel', 'Cooking',
   'Ultralight titanium stove — boils water in 3 min, weighs less than a AA battery',
   'The BRS-3000T ultralight titanium canister stove (Amazon ~$16), paired with a 100g isobutane fuel canister and lighter. Folds to the size of a matchbox.',
   8.00, 25.00, 'outdoor_grill', '#ab3500', 'day', 0.2, 5, null, null, true),

  ('titanium-cookpot', 100,
   'Titanium Cookpot + Utensils', 'Cooking',
   'Lightweight titanium pot with lid and camp spork — ready to eat',
   'Budget titanium 750ml cookpot from Amazon. Lightweight, folding handles, vented lid that doubles as a strainer, and a camp spork.',
   5.00, 22.00, 'soup_kitchen', '#5d6b46', 'day', 0.4, 5, null, null, true),

  ('headlamp-200l', 110,
   '200-Lumen Headlamp', 'Extras',
   'Hands-free bright headlamp with red night-vision mode',
   'Ozark Trail 200-lumen LED headlamp from Walmart. Multiple brightness modes plus red night-vision mode. Ships with batteries installed.',
   3.00, 12.00, 'flashlight_on', '#ab3500', 'day', 0.3, 10, null, null, true),

  ('trekking-poles', 120,
   'Collapsible Trekking Poles', 'Extras',
   'Lightweight aluminum poles — save your knees on descents',
   'Budget-friendly collapsible aluminum trekking poles from Walmart (~$20/pair). Adjustable height 95–135cm, EVA foam grips, quick-lock. Collapses to 15 inches for pack storage.',
   6.00, 25.00, 'hiking', '#4a4a4a', 'day', 1.1, 4, null, null, true),

  ('trail-essentials', 130,
   'Trail Safety & Essentials Kit', 'Safety',
   'First aid, emergency shelter, knife, fire starter, LNT — the 10 Essentials covered',
   'Covers every REI safety category your pack can''t go without: 100-piece first aid kit, emergency space blanket, folding knife, safety whistle, trowel, Leave No Trace waste bags, and duct tape for gear repair.',
   5.00, 45.00, 'health_and_safety', '#ba1a1a', 'day', 1.2, 5, null, null, true),

  ('garmin-inreach', 140,
   'Garmin inReach Mini 2', 'Safety',
   'Two-way satellite messaging + SOS — works where your phone doesn''t',
   'Stay connected anywhere on Earth with global satellite messaging and interactive SOS. Essential for remote Utah backcountry. Pre-activated plan included for the duration of your rental.',
   30.00, 100.00, 'satellite_alt', '#ab3500', 'weekend', 0.2, 2, null, null, true),

  ('bear-canister', 150,
   'BearVault BV500 Bear Canister', 'Safety',
   'Hard-sided bear canister — required in some Utah backcountry areas',
   'The BearVault BV500 holds up to 7 days of food and is certified bear-resistant. Clear sides, tool-free coin-slot lid. Required in select Utah wilderness areas — check park regulations.',
   5.00, 85.00, 'lunch_dining', '#5d6b46', 'day', 2.5, 3, null, null, true),

  ('winter-traction-kit', 160,
   'Winter Traction Kit', 'Extras',
   'Microspikes + trekking poles for icy winter trails',
   'Everything you need when the trail turns to snow and ice. Kahtoola microspikes strap over any boot in seconds, paired with adjustable trekking poles.',
   35.00, 100.00, 'ac_unit', '#2b4a57', 'weekend', 3.8, 2, null, null, true)

ON CONFLICT (id) DO UPDATE SET
  sort_order  = EXCLUDED.sort_order,
  name        = EXCLUDED.name,
  category    = EXCLUDED.category,
  tagline     = EXCLUDED.tagline,
  description = EXCLUDED.description,
  price       = EXCLUDED.price,
  deposit     = EXCLUDED.deposit,
  icon        = EXCLUDED.icon,
  tint        = EXCLUDED.tint,
  unit        = EXCLUDED.unit,
  weight      = EXCLUDED.weight,
  badge       = EXCLUDED.badge,
  includes    = EXCLUDED.includes,
  active      = EXCLUDED.active,
  updated_at  = now();

-- Verify: should return 18 active rows
SELECT id, name, price, deposit, quantity, active
FROM products
WHERE active = true
ORDER BY sort_order;
