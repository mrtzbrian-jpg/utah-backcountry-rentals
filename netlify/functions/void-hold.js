/* Releases (voids) the PayPal authorization hold on a returned booking.
 * Admin-only. Called when the owner taps "Release hold" after gear is returned.
 * Body: { orderId }  — the internal booking id (bigint from Supabase) */
const { voidAuthorization } = require("./_paypal");
const { getSupabase } = require("./_supabase");
const { checkAdmin } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid JSON" }); }

  const { orderId } = body;
  if (!orderId) return json(400, { error: "orderId required" });

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const { data: row, error: fetchErr } = await supabase
    .from("bookings")
    .select("authorization_id, hold_cents, status")
    .eq("id", orderId)
    .single();

  if (fetchErr || !row) return json(404, { error: "Booking not found" });
  if (!row.authorization_id) return json(400, { error: "No authorization hold on record for this booking" });
  if (!row.hold_cents) return json(400, { error: "Hold amount is $0 — nothing to release" });

  try {
    await voidAuthorization(row.authorization_id);
  } catch (e) {
    // PayPal returns 422 if the auth is already voided/expired — treat that as success
    if (!e.message?.includes("already") && !e.message?.includes("expired") && !e.message?.includes("AUTHORIZATION")) {
      return json(502, { error: e.message || "PayPal void failed" });
    }
  }

  await supabase.from("bookings").update({ hold_cents: 0 }).eq("id", orderId);

  return json(200, { ok: true });
};

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
