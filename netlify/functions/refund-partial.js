/* Issues a partial (or full) refund against the already-captured rental fee,
 * independent of cancelling the booking. Use this for goodwill credits,
 * pro-rated adjustments, etc — the booking stays "confirmed"/"returned"/etc,
 * only the refunded_cents ledger changes.
 *
 * For a full cancellation + refund + hold release, use cancel-booking instead.
 * Admin-only. Body: { orderId, amountCents }. */
const { getSupabase } = require("./_supabase");
const { checkAdmin } = require("./_auth");
const { refundCapture } = require("./_paypal");
const { notifyPartialRefund } = require("./_email");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid JSON" }); }
  const { orderId, amountCents } = body;
  if (!orderId) return json(400, { error: "Missing orderId" });
  const amount = Math.round(Number(amountCents));
  if (!Number.isFinite(amount) || amount <= 0) return json(400, { error: "Enter a valid refund amount." });

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const { data: row } = await supabase.from("bookings").select("*").eq("paypal_order", orderId).maybeSingle();
  if (!row) return json(404, { error: "Booking not found" });
  if (!row.capture_id) return json(400, { error: "No captured payment on file for this booking" });

  const alreadyRefunded = row.refunded_cents || 0;
  const remaining = (row.amount_cents || 0) - alreadyRefunded;
  if (amount > remaining) {
    return json(400, { error: `Can't refund more than the $${(remaining / 100).toFixed(2)} still available (of the original $${((row.amount_cents || 0) / 100).toFixed(2)} charge).` });
  }

  try {
    await refundCapture(row.capture_id, amount);
  } catch (e) {
    return json(502, { error: e.message || "Refund failed" });
  }

  const totalRefunded = alreadyRefunded + amount;
  await supabase.from("bookings")
    .update({ refunded_cents: totalRefunded, refunded_at: new Date().toISOString() })
    .eq("paypal_order", orderId);

  if (row.customer_email) {
    try {
      await notifyPartialRefund({
        email: row.customer_email,
        renterName: row.renter_name,
        paypal_order: row.paypal_order,
        name: row.item_name,
        refundAmount: amount,
        totalRefunded
      });
    } catch (_) { /* email failure must not fail the refund response */ }
  }

  return json(200, { ok: true, refundedCents: amount, totalRefundedCents: totalRefunded });
};

function json(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
