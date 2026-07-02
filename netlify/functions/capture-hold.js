/* Captures the auth hold on a booking — used when gear is returned damaged.
 * This charges the customer's card for the held amount.
 * Admin-only. The "Release hold" button voids it instead (gear returned fine). */
const { getSupabase } = require("./_supabase");
const { checkAdmin } = require("./_auth");
const { captureAuthorization } = require("./_paypal");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid JSON" }); }
  const { orderId } = body;
  if (!orderId) return json(400, { error: "Missing orderId" });

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const { data: row } = await supabase.from("bookings").select("*").eq("paypal_order", orderId).maybeSingle();
  if (!row) return json(404, { error: "Booking not found" });
  if (!row.authorization_id) return json(400, { error: "No authorization on file for this booking" });
  if (!row.hold_cents || row.hold_cents <= 0) return json(400, { error: "No active hold to capture" });

  try {
    await captureAuthorization(row.authorization_id, row.hold_cents, true);
    await supabase.from("bookings")
      .update({ hold_cents: 0, status: "returned" })
      .eq("paypal_order", orderId);
    return json(200, { ok: true, capturedCents: row.hold_cents });
  } catch (e) {
    return json(502, { error: e.message || "Hold capture failed" });
  }
};

function json(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
