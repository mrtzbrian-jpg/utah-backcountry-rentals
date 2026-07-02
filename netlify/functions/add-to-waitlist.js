/* Adds a customer to the waitlist for an item on certain dates.
 * Public endpoint — takes email, itemId, startDate, endDate.
 * When that booking opens (via cancel-booking), the waitlist entry gets notified. */
const { getSupabase } = require("./_supabase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid JSON" }); }

  const { email, itemId, startDate, endDate } = body;
  if (!email || !email.includes("@")) return json(400, { error: "Valid email required" });
  if (!itemId) return json(400, { error: "itemId required" });

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  // Prevent duplicate entries for the same email + item + dates.
  const { data: existing } = await supabase.from("waitlist")
    .select("id").eq("item_id", itemId).ilike("email", email)
    .eq("start_date", startDate || null).eq("end_date", endDate || null)
    .is("notified_at", null).maybeSingle();

  if (existing) return json(200, { ok: true, duplicate: true });

  const { error } = await supabase.from("waitlist").insert({
    item_id: itemId,
    email: email.toLowerCase().trim(),
    start_date: startDate || null,
    end_date: endDate || null
  });

  if (error) return json(500, { error: error.message });
  return json(200, { ok: true });
};

function json(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
