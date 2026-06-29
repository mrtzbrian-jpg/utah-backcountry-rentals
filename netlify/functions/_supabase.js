/* Shared Supabase client (server-side, service key). Returns null if the
 * database isn't configured yet, so callers can degrade gracefully. */
const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

module.exports = { getSupabase };
