-- Utah Backcountry Rentals — database schema (Supabase / Postgres)
-- Run once in your Supabase project: SQL Editor → New query → paste → Run.

create table if not exists bookings (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  paypal_order    text unique,          -- ties the row to the PayPal payment
  item_id         text,
  item_name       text,
  start_date      date,                 -- pickup date
  end_date        date,
  days            int,
  amount_cents    int,                  -- rental fee actually paid online
  deposit_cents   int default 0,        -- refundable deposit to COLLECT AT PICKUP
  customer_email  text,
  customer_name   text,
  status          text not null default 'confirmed'
);

create index if not exists bookings_dates_idx on bookings (start_date, end_date);

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
  includes      jsonb,            -- string array of what's in the bundle
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

create index if not exists products_sort_idx on products (sort_order) where active = true;

-- Allow anyone to read products (needed by visitors loading the catalog).
alter table products enable row level security;
create policy "public read products" on products for select using (active = true);
-- Writes go through the service key in the Netlify function (no insert/update policy needed).
