-- Run this in Supabase SQL editor.

-- Per-day pricing flag on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS per_day boolean DEFAULT false;

-- Waitlist for fully-booked dates
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text NOT NULL,
  email text NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz
);
CREATE INDEX IF NOT EXISTS waitlist_item_idx ON waitlist(item_id);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert waitlist"  ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Service read waitlist"   ON waitlist FOR SELECT USING (true);
CREATE POLICY "Service update waitlist" ON waitlist FOR UPDATE USING (true);

-- Image storage: go to Supabase → Storage → New bucket
-- Name: "gear-photos", toggle PUBLIC on, then click Create.
-- No SQL needed for that step.

