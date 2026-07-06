/* Cancels a booking: voids the auth hold (if any) + refunds the rental fee.
 * Sends cancellation emails to customer and owner.
 * Admin-only endpoint. */
const { getSupabase } = require("./_supabase");
const { checkAdmin } = require("./_auth");
const { cancelPayment, refundPayment } = require("./_square");
const { notifyCancellation, notifyWaitlistEntry } = require("./_email");
const crypto = require("crypto");

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
  if (row.status === "cancelled") return json(400, { error: "Already cancelled" });

  const result = { voided: false, refunded: false };

  // 1) Cancel the deposit hold (releases customer's card)
  if (row.authorization_id && row.hold_cents > 0) {
    try {
      await cancelPayment(row.authorization_id);
      result.voided = true;
    } catch (e) {
      // Already canceled or expired — not a blocking error
      if (!String(e.message).toLowerCase().includes("cancel")) {
        console.error("Cancel error (non-fatal):", e.message);
      }
    }
  }

  // 2) Refund the captured rental fee
  if (row.capture_id && row.amount_cents > 0) {
    try {
      await refundPayment({ paymentId: row.capture_id, amountCents: row.amount_cents, idempotencyKey: crypto.randomUUID() });
      result.refunded = true;
    } catch (e) {
      return json(502, { error: "Refund failed: " + e.message });
    }
  }

  // 3) Update status
  await supabase.from("bookings")
    .update({ status: "cancelled", hold_cents: 0 })
    .eq("paypal_order", orderId);

  // 4) Notify customer + owner
  if (row.customer_email) {
    try {
      await notifyCancellation({
        email: row.customer_email,
        customerName: row.customer_name,
        paypal_order: row.paypal_order,
        name: row.item_name,
        qty: row.qty,
        startDate: row.start_date,
        endDate: row.end_date,
        amount: row.amount_cents,
        hold: 0
      });
    } catch (_) { /* email failure is non-fatal */ }
  }

  // Notify anyone on the waitlist for this item+dates that a spot just opened.
  if (row.item_id && row.item_id !== "cart") {
    try {
      const { data: waiters } = await supabase.from("waitlist")
        .select("*").eq("item_id", row.item_id).is("notified_at", null);
      for (const w of (waiters || [])) {
        const overlap = !row.start_date || !w.start_date || !row.end_date || !w.end_date ||
          (w.start_date <= row.end_date && w.end_date >= row.start_date);
        if (!overlap) continue;
        try {
          await notifyWaitlistEntry({ email: w.email, itemName: row.item_name, startDate: row.start_date, endDate: row.end_date });
          await supabase.from("waitlist").update({ notified_at: new Date().toISOString() }).eq("id", w.id);
        } catch (_) {}
      }
    } catch (_) {}
  }

  return json(200, { ok: true, ...result });
};

function json(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
