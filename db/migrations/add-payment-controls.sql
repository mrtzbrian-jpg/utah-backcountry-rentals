-- Adds columns needed for full payment control: declined-payment logging,
-- partial damage-hold captures, and partial refunds. Safe to re-run.

-- Records why a card was declined at authorization time (stolen/insufficient
-- funds/expired/etc — whatever PayPal's issuer response says), so declined
-- attempts show up in the admin dashboard instead of vanishing silently.
alter table bookings add column if not exists decline_reason text;

-- How much of the original authorization hold was actually captured for
-- damage (may be less than hold_cents if the owner charges a partial amount).
alter table bookings add column if not exists captured_hold_cents integer;

-- Cumulative partial refunds issued against the captured rental fee, and
-- when the most recent one happened. Independent of full cancellation,
-- which already refunds everything via cancel-booking.
alter table bookings add column if not exists refunded_cents integer default 0;
alter table bookings add column if not exists refunded_at timestamptz;
