/* Customer-initiated cancellation — no admin passcode required.
 * Auth token: the PayPal orderId itself (a UUID-like secret the customer gets
 * on the confirmation page). Only allowed when status is "confirmed" or "prepped". */
const { getSupabase } = require("./_supabase");
const { voidAuthorization, refundCapture } = require("./_paypal");
const { notifyCancellation } = require("./_email");

const CANCELLABLE = new Set(["confirmed", "prepped"]);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid JSON" }); }
  const { orderId } = body;
  if (!orderId) return json(400, { error: "Missing orderId" });

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const { data: row } = await supabase.from("bookings").select("*").eq("paypal_order", orderId).maybeSingle();
  if (!row) return json(404, { error: "Booking not found" });
  if (row.status === "cancelled") return json(400, { error: "Already cancelled" });
  if (!CANCELLABLE.has(row.status)) {
    return json(400, { error: `Cannot cancel a booking that is already "${row.status}". Please contact us directly.` });
  }

  const result = { voided: false, refunded: false };

  if (row.authorization_id && row.hold_cents > 0) {
    try { await voidAuthorization(row.authorization_id); result.voided = true; }
    catch (_) {}
  }

  if (row.capture_id && row.amount_cents > 0) {
    try { await refundCapture(row.capture_id, row.amount_cents); result.refunded = true; }
    catch (e) { return json(502, { error: "Refund failed: " + e.message }); }
  }

  await supabase.from("bookings").update({ status: "cancelled", hold_cents: 0 }).eq("paypal_order", orderId);

  if (row.customer_email) {
    try {
      await notifyCancellation({
        email: row.customer_email, customerName: row.customer_name,
        paypal_order: row.paypal_order, name: row.item_name, qty: row.qty,
        startDate: row.start_date, endDate: row.end_date, amount: row.amount_cents, hold: 0
      });
    } catch (_) {}
  }

  return json(200, { ok: true, ...result });
};

function json(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
