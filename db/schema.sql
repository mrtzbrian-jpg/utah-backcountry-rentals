-- Utah Backcountry Rentals — database schema (Supabase / Postgres)
-- Run once in your Supabase project: SQL Editor → New query → paste → Run.

create table if not exists bookings (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  paypal_order    text unique,          -- ties the row to the payment (holds the Square payment id — column name is historical)
  item_id         text,
  item_name       text,
  qty             int not null default 1, -- units reserved (for inventory math)
  start_date      date,                 -- pickup date
  end_date        date,
  days            int,
  amount_cents    int,                  -- rental fee actually charged online
  deposit_cents   int default 0,        -- full replacement-value deposit (for the record)
  hold_cents      int default 0,        -- amount actually held on the card (≤ $250)
  authorization_id text,                -- deposit hold payment id (cancel to release / complete if damaged)
  customer_email  text,
  customer_name   text,                 -- name on the payment card (verify against ID)
  renter_name     text,                 -- legal name the renter entered (must match their photo ID)
  agreed_terms    boolean not null default false, -- accepted the rental agreement
  agreed_at       timestamptz,          -- when they accepted (waiver record)
  emailed         boolean not null default false, -- confirmation/owner emails sent
  status          text not null default 'confirmed' -- 'pending' until payment captured, then 'confirmed'
);

-- If the bookings table already exists, add the newer columns:
alter table bookings add column if not exists qty int not null default 1;
alter table bookings add column if not exists emailed boolean not null default false;
alter table bookings add column if not exists hold_cents int default 0;
alter table bookings add column if not exists authorization_id text;
alter table bookings add column if not exists renter_name text;
alter table bookings add column if not exists agreed_terms boolean not null default false;
alter table bookings add column if not exists agreed_at timestamptz;
alter table bookings add column if not exists phone text;
alter table bookings add column if not exists pickup_time text;
alter table bookings add column if not exists notified_ready_at timestamptz;

create index if not exists bookings_dates_idx on bookings (start_date, end_date);
create index if not exists bookings_item_idx on bookings (item_id, status);

-- Server-only access: just the SERVICE key (used by the Netlify functions) can
-- read/write. The public anon key gets no access, so customer info stays private.
alter table bookings enable row level security;
-- (No public policies on purpose. View/manage rows in the Supabase Table Editor,
--  where you can also see each booking's deposit_cents to collect at pickup.)

-- ---------------------------------------------------------------------------
-- Products catalog — published by the Manage Gear admin, read by all visitors.
-- ---------------------------------------------------------------------------
create table if not exists products (
  id            text primary key,
  sort_order    int not null default 0,
  name          text not null,
  category      text,
  tagline       text,
  description   text,
  price         numeric(10,2) not null default 0,
  deposit       numeric(10,2) not null default 0,
  icon          text,
  tint          text,
  unit          text,
  img           text,             -- base64 data URL or relative path
  badge         text,
  weight        numeric(6,2),
  quantity      int not null default 1, -- how many units you own (inventory)
  includes      jsonb,            -- string array of what's in the bundle
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- If the products table already exists, add the inventory column:
alter table products add column if not exists quantity int not null default 1;

create index if not exists products_sort_idx on products (sort_order) where active = true;

-- Allow anyone to read products (needed by visitors loading the catalog).
alter table products enable row level security;
create policy "public read products" on products for select using (active = true);
-- Writes go through the service key in the Netlify function (no insert/update policy needed).

-- ---------------------------------------------------------------------------
-- Site settings — key/value store for admin-managed config (e.g. categories).
-- Run in Supabase SQL Editor to enable category management from the admin.
-- ---------------------------------------------------------------------------
create table if not exists site_settings (
  key   text primary key,
  value text not null
);

alter table site_settings enable row level security;
create policy "public read site_settings" on site_settings for select using (true);
-- Writes go through the service key in the Netlify function.
