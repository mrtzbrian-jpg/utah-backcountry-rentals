-- Adds TETON Explorer 65L as a real rentable product and points the
-- Single Person Weekend + Couples Weekend bundles at it instead of the
-- Osprey Aether 65L (Budget + Family bundles keep the Osprey, unchanged).
-- Safe to re-run (upsert).

insert into products (id, sort_order, name, category, tagline, description, price, deposit, icon, tint, unit, weight, img, includes, per_day, quantity, active, updated_at)
values (
  'teton-explorer-65', 20,
  'TETON Explorer 65L', 'Backpacks',
  'Adjustable, unisex 65L pack built for multi-day trips',
  'A rugged 65-liter backpacking pack with a fully adjustable torso for a universal men''s/women''s fit. Multiple exterior pockets and compression straps keep gear organized and secure on the trail.',
  40, 80, 'hiking', '#4a4a4a', 'rental', 4.8,
  'images/teton-explorer-65.jpg',
  '["TETON Explorer 65L backpack","Adjustable, unisex fit","Multiple exterior pockets"]',
  false, 1, true, now()
)
on conflict (id) do update set
  name        = excluded.name,
  category    = excluded.category,
  tagline     = excluded.tagline,
  description = excluded.description,
  price       = excluded.price,
  deposit     = excluded.deposit,
  icon        = excluded.icon,
  tint        = excluded.tint,
  img         = excluded.img,
  includes    = excluded.includes,
  weight      = excluded.weight,
  active      = true,
  updated_at  = now();

update products set
  includes     = '["TETON Explorer 65L backpack","MSR Hubba Hubba 2 tent","Nemo Disco 15° sleeping bag","Katadyn BeFree water filter","BearVault BV500 canister"]',
  bundle_items = '[{"id":"teton-explorer-65","qty":1},{"id":"msr-hubba-tent","qty":1},{"id":"nemo-disco-15","qty":1},{"id":"water-filter","qty":1},{"id":"bearvault-bv500","qty":1}]',
  updated_at   = now()
where id = 'solo-weekend-bundle';

update products set
  includes     = '["2× TETON Explorer 65L backpacks","MSR Hubba Hubba 2-person tent","2× Nemo Disco 15° sleeping bags","Katadyn BeFree water filter","BearVault BV500 canister","Garmin inReach Mini 2 satellite communicator"]',
  bundle_items = '[{"id":"teton-explorer-65","qty":2},{"id":"msr-hubba-tent","qty":1},{"id":"nemo-disco-15","qty":2},{"id":"water-filter","qty":1},{"id":"bearvault-bv500","qty":1},{"id":"garmin-inreach","qty":1}]',
  updated_at   = now()
where id = 'couples-weekend-bundle';
