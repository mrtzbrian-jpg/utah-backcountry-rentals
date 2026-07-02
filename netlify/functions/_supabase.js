/* Shared Supabase client (server-side, service key). Returns null if the
 * database isn't configured yet, so callers can degrade gracefully. */
const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Columns added by later migrations. If the live DB hasn't been migrated yet,
// including these would make PostgREST reject the whole write. bookingUpsert
// retries once without them so a booking is never lost over a missing column.
const OPTIONAL_BOOKING_COLS = ["capture_id", "cart_items"];

async function bookingUpsert(supabase, row, opts) {
  let res = await supabase.from("bookings").upsert(row, opts);
  if (res && res.error) {
    const msg = (res.error.message || "").toLowerCase();
    const missing = OPTIONAL_BOOKING_COLS.some(c => msg.includes(c));
    if (missing || msg.includes("column")) {
      const trimmed = { ...row };
      OPTIONAL_BOOKING_COLS.forEach(c => delete trimmed[c]);
      res = await supabase.from("bookings").upsert(trimmed, opts);
    }
  }
  return res;
}

module.exports = { getSupabase, bookingUpsert };
