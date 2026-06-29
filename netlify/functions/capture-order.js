/* Captures an approved PayPal order (the rental fee), records the booking in
 * Supabase, and returns the order details for the confirmation screen. Safe to
 * call more than once: if the order was already captured we just read it back. */
const { captureOrder, getOrder } = require("./_paypal");
const { getSupabase } = require("./_supabase");
const { notifyBooking } = require("./_email");

exports.handler = async (event) => {
  const orderId = (event.queryStringParameters || {}).orderId ||
    (() => { try { return JSON.parse(event.body || "{}").orderId; } catch { return null; } })();
  if (!orderId) return json(400, { error: "Missing order id." });

  let order;
  let freshCapture = true;
  try {
    order = await captureOrder(orderId);
  } catch (e) {
    // Already captured (e.g. a page refresh) — fall back to reading the order.
    freshCapture = false;
    try { order = await getOrder(orderId); } catch (_) { return json(502, { error: e.message }); }
  }

  const booking = normalize(order);
  if (!booking) return json(502, { error: "Could not read order details." });

  const supabase = getSupabase();
  let alreadyRecorded = false;
  if (supabase) {
    // Was this order already in the table? (Determines whether to send emails.)
    const { data: existing } = await supabase
      .from("bookings").select("paypal_order,emailed").eq("paypal_order", booking.orderId).maybeSingle();
    alreadyRecorded = !!(existing && existing.emailed);

    const { error } = await supabase.from("bookings").upsert({
      paypal_order: booking.orderId,
      item_id: booking.itemId,
      item_name: booking.name,
      qty: booking.qty || 1,
      start_date: booking.startDate || null,
      end_date: booking.endDate || null,
      days: booking.days || null,
      amount_cents: booking.amount,
      deposit_cents: booking.deposit,
      customer_email: booking.email,
      customer_name: booking.customerName,
      status: "confirmed"
    }, { onConflict: "paypal_order" });
    if (error) return json(500, { error: "DB write failed: " + error.message });
  }

  // Send confirmation + owner emails once, on the first successful capture.
  if (freshCapture && !alreadyRecorded) {
    try {
      await notifyBooking(booking);
      if (supabase) await supabase.from("bookings").update({ emailed: true }).eq("paypal_order", booking.orderId);
    } catch (_) { /* email failures must never block the confirmation */ }
  }

  return json(200, booking);
};

function normalize(order) {
  if (!order) return null;
  const pu = (order.purchase_units || [])[0] || {};
  const cap = ((pu.payments || {}).captures || [])[0] || {};
  const parts = String(pu.custom_id || "").split("|"); // itemId|qty|start|end|depositCents
  const amountVal = (cap.amount && cap.amount.value) || (pu.amount && pu.amount.value) || "0";
  const payer = order.payer || {};
  const nm = payer.name || {};
  const start = parts[2] || "", end = parts[3] || "";
  return {
    orderId: order.id,
    itemId: parts[0] || "",
    name: String(pu.description || "Gear rental"),
    qty: parts[1] ? parseInt(parts[1], 10) : 1,
    days: dayCount(start, end),
    startDate: start,
    endDate: end,
    deposit: parts[4] ? parseInt(parts[4], 10) : 0,
    amount: Math.round(parseFloat(amountVal) * 100),
    email: payer.email_address || null,
    customerName: [nm.given_name, nm.surname].filter(Boolean).join(" ") || null
  };
}

function dayCount(s, e) {
  if (!s || !e) return null;
  return Math.round((new Date(e) - new Date(s)) / 86400000) + 1;
}

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
