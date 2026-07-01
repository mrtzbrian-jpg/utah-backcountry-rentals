/* Saves admin-blocked dates to site_settings. Admin-only.
 * Body: { dates: ["2026-07-04", "2026-12-25", ...] } */
const { getSupabase } = require("./_supabase");
const { checkAdmin } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid JSON" }); }

  const dates = Array.isArray(body.dates) ? body.dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  await supabase.from("site_settings").upsert(
    { key: "blocked_dates", value: JSON.stringify(dates) },
    { onConflict: "key" }
  );

  return json(200, { ok: true, count: dates.length });
};

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
