-- Adds the 20 new Single-Person-Weekend gear items to inventory (price $0
-- placeholder — set prices/quantities in Manage Gear), and rebuilds the
-- Couples (2x) and Family (4x) bundles from that same set. Also sets the
-- three bundle auth holds: Single $450, Couples $650, Family $800.
-- ON CONFLICT DO NOTHING on inserts so it never clobbers prices you set later.
-- Safe to re-run.

-- ---- New inventory items ----
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('ozark-trail-1p-tent', 201, 'Ozark Trail 1-Person Backpacking Tent', 'Camping', '', '', 0, 0, 'cabin', 'tent-small', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('trailhead-20f-mummy-bag', 202, 'TrailHead 20°F Mummy Sleeping Bag', 'Sleeping', '', '', 0, 0, 'bedtime', 'sleeping-bag', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('switchback-foam-pad', 203, 'Switchback Ultralight Foam Sleeping Pad', 'Sleeping', '', '', 0, 0, 'king_bed', 'sleeping-pad', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('firemaple-fixed-star-1', 204, 'Fire-Maple Fixed Star 1 Stove System', 'Cooking', '', '', 0, 0, 'outdoor_grill', 'camp-stove', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('small-first-aid-kit', 205, 'Small First-Aid Kit', 'Safety Tech', '', '', 0, 0, 'health_and_safety', 'first-aid', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('lifestraw-peak-solo', 206, 'LifeStraw Peak Solo Water Filter', 'Safety Tech', '', '', 0, 0, 'water_drop', 'water-filter', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('cooking-utensil-set', 207, 'Cooking Utensil Set (Spork & Knife)', 'Cooking', '', '', 0, 0, 'restaurant', 'cookset', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('swiss-army-knife', 208, 'Swiss Army Knife', 'Safety Tech', '', '', 0, 0, 'handyman', 'generic', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('trekking-poles', 209, 'Trekking Poles', 'Hiking', '', '', 0, 0, 'hiking', 'hiking-poles', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('klymit-pillow-x', 210, 'Klymit Pillow X (Inflatable)', 'Sleeping', '', '', 0, 0, 'bedtime', 'generic', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('plate-bowl-cup-set', 211, 'Plate, Bowl & Cup Set', 'Cooking', '', '', 0, 0, 'restaurant', 'pot', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('udap-bear-canister', 212, 'UDAP No-Fed-Bear Food Container', 'Storage', '', '', 0, 0, 'lunch_dining', 'bear-canister', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('cnoc-squeeze-filter', 213, 'Squeeze Water Filter + Cnoc 2L Bladder', 'Safety Tech', '', '', 0, 0, 'water_drop', 'water-filter', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('headlamp', 214, 'Headlamp', 'Camping', '', '', 0, 0, 'flashlight_on', 'headlamp', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('multitool', 215, 'Multitool', 'Safety Tech', '', '', 0, 0, 'handyman', 'generic', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('compass', 216, 'Compass', 'Safety Tech', '', '', 0, 0, 'explore', 'map-compass', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('mini-sanitizer', 217, 'Mini Hand Sanitizer', 'Safety Tech', '', '', 0, 0, 'sanitizer', 'first-aid', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('fire-starter-lighters', 218, 'Fire-Starter Lighters + Lint', 'Cooking', '', '', 0, 0, 'local_fire_department', 'generic', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('emergency-whistle', 219, 'Emergency Whistle', 'Safety Tech', '', '', 0, 0, 'sports', 'generic', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, graphic, tint, unit, quantity, per_day, active, updated_at)
values ('emergency-bivy-blanket', 220, 'Emergency Bivy Blanket', 'Sleeping', '', '', 0, 0, 'thermostat', 'sleeping-bag', '#1b3022', 'rental', 1, false, true, now())
on conflict (id) do nothing;

-- ---- Bundle contents + holds ----
update products set
  bundle_items = '[{"id": "teton-explorer-65", "qty": 1}, {"id": "ozark-trail-1p-tent", "qty": 1}, {"id": "trailhead-20f-mummy-bag", "qty": 1}, {"id": "switchback-foam-pad", "qty": 1}, {"id": "firemaple-fixed-star-1", "qty": 1}, {"id": "small-first-aid-kit", "qty": 1}, {"id": "lifestraw-peak-solo", "qty": 1}, {"id": "cooking-utensil-set", "qty": 1}, {"id": "swiss-army-knife", "qty": 1}, {"id": "trekking-poles", "qty": 1}, {"id": "klymit-pillow-x", "qty": 1}, {"id": "plate-bowl-cup-set", "qty": 1}, {"id": "udap-bear-canister", "qty": 1}, {"id": "cnoc-squeeze-filter", "qty": 1}, {"id": "headlamp", "qty": 1}, {"id": "multitool", "qty": 1}, {"id": "compass", "qty": 1}, {"id": "mini-sanitizer", "qty": 1}, {"id": "fire-starter-lighters", "qty": 1}, {"id": "emergency-whistle", "qty": 1}, {"id": "emergency-bivy-blanket", "qty": 1}]',
  includes     = '["TETON Explorer 65L backpack", "Ozark Trail 1-Person Backpacking Tent", "TrailHead 20°F Mummy Sleeping Bag", "Switchback Ultralight Foam Sleeping Pad", "Fire-Maple Fixed Star 1 Stove System", "Small First-Aid Kit", "LifeStraw Peak Solo Water Filter", "Cooking Utensil Set (Spork & Knife)", "Swiss Army Knife", "Trekking Poles", "Klymit Pillow X (Inflatable)", "Plate, Bowl & Cup Set", "UDAP No-Fed-Bear Food Container", "Squeeze Water Filter + Cnoc 2L Bladder", "Headlamp", "Multitool", "Compass", "Mini Hand Sanitizer", "Fire-Starter Lighters + Lint", "Emergency Whistle", "Emergency Bivy Blanket"]',
  deposit      = 450,
  tagline      = 'Everything one solo hiker needs for 2–3 nights out',
  description  = 'Our complete solo kit — a full-size pack plus shelter, sleep system, cooking, water, safety and navigation gear. Packed and trail-ready at pickup.',
  updated_at   = now()
where id = 'solo-weekend-bundle';

update products set
  bundle_items = '[{"id": "teton-explorer-65", "qty": 2}, {"id": "ozark-trail-1p-tent", "qty": 2}, {"id": "trailhead-20f-mummy-bag", "qty": 2}, {"id": "switchback-foam-pad", "qty": 2}, {"id": "firemaple-fixed-star-1", "qty": 2}, {"id": "small-first-aid-kit", "qty": 2}, {"id": "lifestraw-peak-solo", "qty": 2}, {"id": "cooking-utensil-set", "qty": 2}, {"id": "swiss-army-knife", "qty": 2}, {"id": "trekking-poles", "qty": 2}, {"id": "klymit-pillow-x", "qty": 2}, {"id": "plate-bowl-cup-set", "qty": 2}, {"id": "udap-bear-canister", "qty": 2}, {"id": "cnoc-squeeze-filter", "qty": 2}, {"id": "headlamp", "qty": 2}, {"id": "multitool", "qty": 2}, {"id": "compass", "qty": 2}, {"id": "mini-sanitizer", "qty": 2}, {"id": "fire-starter-lighters", "qty": 2}, {"id": "emergency-whistle", "qty": 2}, {"id": "emergency-bivy-blanket", "qty": 2}]',
  includes     = '["2× TETON Explorer 65L backpack", "2× Ozark Trail 1-Person Backpacking Tent", "2× TrailHead 20°F Mummy Sleeping Bag", "2× Switchback Ultralight Foam Sleeping Pad", "2× Fire-Maple Fixed Star 1 Stove System", "2× Small First-Aid Kit", "2× LifeStraw Peak Solo Water Filter", "2× Cooking Utensil Set (Spork & Knife)", "2× Swiss Army Knife", "2× Trekking Poles", "2× Klymit Pillow X (Inflatable)", "2× Plate, Bowl & Cup Set", "2× UDAP No-Fed-Bear Food Container", "2× Squeeze Water Filter + Cnoc 2L Bladder", "2× Headlamp", "2× Multitool", "2× Compass", "2× Mini Hand Sanitizer", "2× Fire-Starter Lighters + Lint", "2× Emergency Whistle", "2× Emergency Bivy Blanket"]',
  deposit      = 650,
  tagline      = 'Two complete Single Person Weekend kits — gear for two',
  description  = 'You get two of our Single Person Weekend set — the exact same gear, doubled — so both of you are fully equipped for the trail.',
  updated_at   = now()
where id = 'couples-weekend-bundle';

update products set
  bundle_items = '[{"id": "teton-explorer-65", "qty": 4}, {"id": "ozark-trail-1p-tent", "qty": 4}, {"id": "trailhead-20f-mummy-bag", "qty": 4}, {"id": "switchback-foam-pad", "qty": 4}, {"id": "firemaple-fixed-star-1", "qty": 4}, {"id": "small-first-aid-kit", "qty": 4}, {"id": "lifestraw-peak-solo", "qty": 4}, {"id": "cooking-utensil-set", "qty": 4}, {"id": "swiss-army-knife", "qty": 4}, {"id": "trekking-poles", "qty": 4}, {"id": "klymit-pillow-x", "qty": 4}, {"id": "plate-bowl-cup-set", "qty": 4}, {"id": "udap-bear-canister", "qty": 4}, {"id": "cnoc-squeeze-filter", "qty": 4}, {"id": "headlamp", "qty": 4}, {"id": "multitool", "qty": 4}, {"id": "compass", "qty": 4}, {"id": "mini-sanitizer", "qty": 4}, {"id": "fire-starter-lighters", "qty": 4}, {"id": "emergency-whistle", "qty": 4}, {"id": "emergency-bivy-blanket", "qty": 4}]',
  includes     = '["4× TETON Explorer 65L backpack", "4× Ozark Trail 1-Person Backpacking Tent", "4× TrailHead 20°F Mummy Sleeping Bag", "4× Switchback Ultralight Foam Sleeping Pad", "4× Fire-Maple Fixed Star 1 Stove System", "4× Small First-Aid Kit", "4× LifeStraw Peak Solo Water Filter", "4× Cooking Utensil Set (Spork & Knife)", "4× Swiss Army Knife", "4× Trekking Poles", "4× Klymit Pillow X (Inflatable)", "4× Plate, Bowl & Cup Set", "4× UDAP No-Fed-Bear Food Container", "4× Squeeze Water Filter + Cnoc 2L Bladder", "4× Headlamp", "4× Multitool", "4× Compass", "4× Mini Hand Sanitizer", "4× Fire-Starter Lighters + Lint", "4× Emergency Whistle", "4× Emergency Bivy Blanket"]',
  deposit      = 800,
  tagline      = 'Four complete Single Person Weekend kits — gear for the whole crew',
  description  = 'Four of our Single Person Weekend sets — everything in the solo kit, ×4 — enough to outfit the whole family.',
  updated_at   = now()
where id = 'family-weekend-bundle';

