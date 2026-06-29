/* Returns the published product catalog from Supabase.
 * Public endpoint — no auth. Falls back gracefully if DB is not configured. */
const { getSupabase } = require("./_supabase");

exports.handler = async () => {
  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  if (error) return json(500, { error: error.message });

  // Map DB column `description` → `desc` to match the frontend data model
  const products = (data || []).map(p => {
    const obj = { ...p };
    obj.desc = p.description || "";
    delete obj.description;
    return obj;
  });

  return json(200, products);
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj)
  };
}
