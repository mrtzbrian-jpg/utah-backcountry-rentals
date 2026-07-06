/* Captures some or all of the auth hold on a booking — used when gear comes
 * back damaged. Pass amountCents to charge less than the full hold (e.g. the
 * item still works but needs a part replaced); omit it to charge the whole
 * thing. Either way we always pass final_capture=true, which tells PayPal to
 * release whatever's left of the authorization automatically — so a partial
 * capture also takes care of returning the remainder to the customer.
 * Admin-only. The "Release hold" button voids the whole thing instead
 * (gear returned fine, nothing charged). */
const { getSupabase } = require("./_supabase");
const { checkAdmin } = require("./_auth");
const { captureAuthorization } = require("./_paypal");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid JSON" }); }
  const { orderId, amountCents } = body;
  if (!orderId) return json(400, { error: "Missing orderId" });

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const { data: row } = await supabase.from("bookings").select("*").eq("paypal_order", orderId).maybeSingle();
  if (!row) return json(404, { error: "Booking not found" });
  if (!row.authorization_id) return json(400, { error: "No authorization on file for this booking" });
  if (!row.hold_cents || row.hold_cents <= 0) return json(400, { error: "No active hold to capture" });

  // Default to the full hold; otherwise the owner's chosen damage-charge amount.
  const charge = Number.isFinite(amountCents) && amountCents > 0 ? Math.round(amountCents) : row.hold_cents;
  if (charge > row.hold_cents) return json(400, { error: `Can't charge more than the $${(row.hold_cents / 100).toFixed(2)} hold on file.` });

  try {
    await captureAuthorization(row.authorization_id, charge, true);
    await supabase.from("bookings")
      .update({ hold_cents: 0, captured_hold_cents: charge, status: "returned" })
      .eq("paypal_order", orderId);
    return json(200, { ok: true, capturedCents: charge, originalHoldCents: row.hold_cents });
  } catch (e) {
    return json(502, { error: e.message || "Hold capture failed" });
  }
};

function json(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
