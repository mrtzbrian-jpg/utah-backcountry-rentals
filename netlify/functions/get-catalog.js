/* Returns the published product catalog from Supabase.
 * Public endpoint — no auth. Falls back gracefully if DB is not configured. */
const { getSupabase } = require("./_supabase");

exports.handler = async () => {
  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const [productsRes, catRes, bizRes, blockedRes] = await Promise.all([
    supabase.from("products").select("*").eq("active", true).order("sort_order"),
    supabase.from("site_settings").select("value").eq("key", "categories").maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "business_info").maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "blocked_dates").maybeSingle()
  ]);

  if (productsRes.error) return json(500, { error: productsRes.error.message });

  // Map DB column `description` → `desc` to match the frontend data model
  const products = (productsRes.data || []).map(p => {
    const obj = { ...p };
    obj.desc = p.description || "";
    delete obj.description;
    return obj;
  });

  const parseSetting = (res) => {
    try { return res && res.data && res.data.value ? JSON.parse(res.data.value) : null; }
    catch (_) { return null; }
  };

  return json(200, {
    products,
    categories: parseSetting(catRes),
    businessInfo: parseSetting(bizRes),
    blockedDates: parseSetting(blockedRes)
  });
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj)
  };
}
