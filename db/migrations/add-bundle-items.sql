-- Add bundle_items column to products table for pre-built bundle support.
-- Safe to run multiple times (IF NOT EXISTS).
alter table products
  add column if not exists bundle_items text;

-- Seed the 4 pre-built bundles (upsert so re-running is safe).
-- These match the data.js demo bundles so the live site shows the same bundles.
insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, tint, unit, weight, badge, includes, bundle_items, per_day, quantity, active, updated_at)
values
  ('solo-weekend-bundle', 0,
   'Single Person Weekend', 'Bundles',
   'Everything one solo hiker needs for 2–3 nights out',
   'Our most popular starter kit. A full-size pack, shelter, warm sleep system, water filtration, and bear canister — everything you need, nothing you don''t. Packed and ready at pickup.',
   79, 200, 'backpack', '#1b3022', 'rental', 14.1, 'Best for solo',
   '["Osprey Aether 65L backpack","MSR Hubba Hubba 2 tent","Nemo Disco 15° sleeping bag","Katadyn BeFree water filter","BearVault BV500 canister"]',
   '[{"id":"osprey-aether-65","qty":1},{"id":"msr-hubba-tent","qty":1},{"id":"nemo-disco-15","qty":1},{"id":"water-filter","qty":1},{"id":"bearvault-bv500","qty":1}]',
   false, 1, true, now()),

  ('couples-weekend-bundle', 1,
   'Couples Weekend', 'Bundles',
   'Two-person kit — share the weight, share the views',
   'Built for two. Two full-size packs, a two-person tent, two sleep systems, water filter, bear canister, and satellite communicator. You''re covered from trailhead to camp and back.',
   145, 250, 'people', '#364c3c', 'rental', 28.4, 'Best for two',
   '["2× Osprey Aether 65L backpacks","MSR Hubba Hubba 2-person tent","2× Nemo Disco 15° sleeping bags","Katadyn BeFree water filter","BearVault BV500 canister","Garmin inReach Mini 2 satellite communicator"]',
   '[{"id":"osprey-aether-65","qty":2},{"id":"msr-hubba-tent","qty":1},{"id":"nemo-disco-15","qty":2},{"id":"water-filter","qty":1},{"id":"bearvault-bv500","qty":1},{"id":"garmin-inreach","qty":1}]',
   false, 1, true, now()),

  ('budget-bundle', 2,
   'Wilding on a Budget', 'Bundles',
   'Get out there without breaking the bank',
   'You don''t need a $2,000 kit to have a killer weekend. This no-frills bundle covers the essentials — a reliable pack, shelter, sleep system, and water filter. Adventure first, gear second.',
   49, 150, 'savings', '#5d6b46', 'rental', 11.2, 'Budget pick',
   '["Osprey Aether 65L backpack","MSR Hubba Hubba tent","Nemo Disco 15° sleeping bag","Katadyn BeFree water filter"]',
   '[{"id":"osprey-aether-65","qty":1},{"id":"msr-hubba-tent","qty":1},{"id":"nemo-disco-15","qty":1},{"id":"water-filter","qty":1}]',
   false, 1, true, now()),

  ('family-weekend-bundle', 3,
   'Family Weekend', 'Bundles',
   'Enough gear for the whole crew — parents and kids',
   'Take the whole family off-grid. Built for 2 adults + 2 kids: packs for everyone, two tents, four sleeping bags, dual water filtration, bear canister, and satellite safety. The full family setup.',
   195, 250, 'family_restroom', '#2b4a57', 'rental', 45.0, 'Family pick',
   '["2× Osprey Aether 65L backpacks (adult)","2× MSR Hubba Hubba tents (sleeps 2 each)","4× Nemo Disco 15° sleeping bags","2× Katadyn BeFree water filters","BearVault BV500 canister","Garmin inReach Mini 2 satellite communicator","Kids'' gear available on request"]',
   '[{"id":"osprey-aether-65","qty":2},{"id":"msr-hubba-tent","qty":2},{"id":"nemo-disco-15","qty":4},{"id":"water-filter","qty":2},{"id":"bearvault-bv500","qty":1},{"id":"garmin-inreach","qty":1}]',
   false, 1, true, now())

on conflict (id) do update set
  name         = excluded.name,
  category     = excluded.category,
  tagline      = excluded.tagline,
  description  = excluded.description,
  price        = excluded.price,
  deposit      = excluded.deposit,
  icon         = excluded.icon,
  tint         = excluded.tint,
  badge        = excluded.badge,
  includes     = excluded.includes,
  bundle_items = excluded.bundle_items,
  weight       = excluded.weight,
  active       = true,
  updated_at   = now();
