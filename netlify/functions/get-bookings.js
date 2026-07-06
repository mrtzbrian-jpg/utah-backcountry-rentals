/* Returns all bookings for the owner's operations dashboard.
 * Requires the admin passcode in the x-admin-pass header.
 *
 * GET /get-bookings?filter=upcoming   (today | upcoming | all)  */
const { getSupabase } = require("./_supabase");
const { checkAdmin } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  const supabase = getSupabase();
  if (!supabase) return json(200, { bookings: [] });

  const filter = (event.queryStringParameters || {}).filter || "upcoming";
  const today  = new Date().toISOString().split("T")[0];

  let q = supabase.from("bookings").select("*").neq("status", "pending").order("start_date", { ascending: true });
  if (filter === "today")    q = q.eq("start_date", today);
  else if (filter === "upcoming") q = q.gte("start_date", today);

  const { data, error } = await q.limit(200);
  if (error) return json(500, { error: error.message });

  return json(200, { bookings: (data || []).map(fromRow) });
};

function fromRow(r) {
  return {
    orderId:         r.paypal_order,
    itemId:          r.item_id,
    name:            r.item_name,
    qty:             r.qty,
    startDate:       r.start_date,
    endDate:         r.end_date,
    days:            r.days,
    amount:          r.amount_cents,
    hold:            r.hold_cents,
    deposit:         r.deposit_cents,
    email:           r.customer_email,
    customerName:    r.customer_name,
    renterName:      r.renter_name,
    agreedTerms:     r.agreed_terms,
    agreedAt:        r.agreed_at,
    phone:           r.phone,
    pickupTime:      r.pickup_time,
    status:          r.status,
    notifiedReadyAt: r.notified_ready_at,
    authorizationId: r.authorization_id,
    declineReason:   r.decline_reason,
    capturedHoldCents: r.captured_hold_cents,
    refundedCents:   r.refunded_cents,
    refundedAt:      r.refunded_at,
    createdAt:       r.created_at
  };
}

function json(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
