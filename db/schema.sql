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
