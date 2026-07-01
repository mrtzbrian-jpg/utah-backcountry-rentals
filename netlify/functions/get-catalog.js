/* Returns the published product catalog from Supabase.
 * Public endpoint — no auth. Falls back gracefully if DB is not configured. */
const { getSupabase } = require("./_supabase");

exports.handler = async () => {
  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const [productsRes, settingsRes] = await Promise.all([
    supabase.from("products").select("*").eq("active", true).order("sort_order"),
    supabase.from("site_settings").select("value").eq("key", "categories").maybeSingle()
  ]);

  if (productsRes.error) return json(500, { error: productsRes.error.message });

  // Map DB column `description` → `desc` to match the frontend data model
  const products = (productsRes.data || []).map(p => {
    const obj = { ...p };
    obj.desc = p.description || "";
    delete obj.description;
    return obj;
  });

  let categories = null;
  try {
    if (settingsRes.data && settingsRes.data.value) {
      categories = JSON.parse(settingsRes.data.value);
    }
  } catch (_) { /* fall back to frontend defaults */ }

  return json(200, { products, categories });
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj)
  };
}
