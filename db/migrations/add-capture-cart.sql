-- Run this in the Supabase SQL editor once.
-- Adds capture_id (needed for refunds) and cart_items (multi-item orders).

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS capture_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cart_items text;  -- JSON: [{itemId,name,qty}]
