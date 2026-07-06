/* Returns a recorded booking by order id, so the confirmation page works
 * after a refresh. Reads from Supabase (written by create-checkout). */
const { getSupabase } = require("./_supabase");

exports.handler = async (event) => {
  const orderId = (event.queryStringParameters || {}).order;
  if (!orderId) return json(400, { error: "Missing order id." });

  const supabase = getSupabase();
  if (!supabase) return json(200, { error: "No database configured." });

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("paypal_order", orderId)
    .single();
  if (error || !data) return json(404, { error: "Order not found." });

  return json(200, {
    orderId: data.paypal_order,
    itemId: data.item_id,
    name: data.item_name,
    qty: data.qty,
    days: data.days,
    startDate: data.start_date,
    endDate: data.end_date,
    amount: data.amount_cents,
    hold: data.hold_cents,
    deposit: data.deposit_cents,
    renterName: data.renter_name,
    pickupTime: data.pickup_time,
    status: data.status
    // NOTE: customer email & phone are intentionally NOT returned here — this
    // endpoint is unauthenticated (keyed only by the order id), so it
    // exposes no contact PII. The owner sees full contact info via the
    // passcode-protected get-bookings endpoint.
  });
};

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
