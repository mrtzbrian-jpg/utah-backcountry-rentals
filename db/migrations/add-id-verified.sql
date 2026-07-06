-- Timestamped record that the owner checked the renter's photo ID at pickup,
-- without storing any copy of the ID itself (name-match verification only).
alter table bookings add column if not exists id_verified_at timestamptz;
