/* Saves the full product catalog to Supabase.
 * Requires X-Admin-Passcode header matching the UBR_ADMIN_PASSCODE env var.
 * Called from the Manage Gear admin when the owner clicks "Publish to site". */
const { getSupabase } = require("./_supabase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const auth = (event.headers["x-admin-passcode"] || "").trim();
  const expected = (process.env.UBR_ADMIN_PASSCODE || "").trim();
  if (!expected || auth !== expected) return json(401, { error: "Unauthorized" });

  let products;
  try { products = JSON.parse(event.body || "[]"); }
  catch { return json(400, { error: "Invalid JSON" }); }
  if (!Array.isArray(products)) return json(400, { error: "Expected array of products" });

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const rows = products.map((p, i) => ({
    id: p.id,
    sort_order: i,
    name: p.name || "Unnamed",
    category: p.category || "Bundles",
    tagline: p.tagline || "",
    description: p.desc || "",
    price: parseFloat(p.price) || 0,
    deposit: parseFloat(p.deposit) || 0,
    icon: p.icon || "backpack",
    tint: p.tint || "#1b3022",
    unit: p.unit || "rental",
    img: p.img || null,
    badge: p.badge || null,
    weight: parseFloat(p.weight) || null,
    quantity: Number.isFinite(parseInt(p.quantity, 10)) ? Math.max(0, parseInt(p.quantity, 10)) : 1,
    includes: p.includes || null,
    active: true,
    updated_at: new Date().toISOString()
  }));

  // Upsert the new catalog
  const { error: upsertErr } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "id" });
  if (upsertErr) return json(500, { error: upsertErr.message });

  // Delete products the admin removed (not in the new list)
  const keepIds = rows.map(r => r.id);
  if (keepIds.length > 0) {
    const { data: existing } = await supabase.from("products").select("id");
    const toDelete = (existing || []).filter(r => !keepIds.includes(r.id)).map(r => r.id);
    if (toDelete.length > 0) {
      await supabase.from("products").delete().in("id", toDelete);
    }
  }

  return json(200, { ok: true, count: rows.length });
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj)
  };
}
