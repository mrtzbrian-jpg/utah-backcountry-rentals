-- Adds the "graphic" column: a key into the client-side GEAR_ICONS vector
-- library (js/gear-icons.js), used for the small icon shown in Build Your
-- Pack drag tiles. Safe to re-run.
alter table products
  add column if not exists graphic text default 'generic';
