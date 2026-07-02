/* Returns all bookings for a given customer email.
 * Public endpoint — no passcode — because customers can only see their own data
 * and email is the auth factor (you only look up your own inbox). */
const { getSupabase } = require("./_supabase");

exports.handler = async (event) => {
  const email = ((event.queryStringParameters || {}).email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return json(400, { error: "Valid email required." });

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured." });

  const { data, error } = await supabase
    .from("bookings")
    .select("paypal_order,item_id,item_name,qty,days,start_date,end_date,amount_cents,hold_cents,deposit_cents,renter_name,pickup_time,status,created_at")
    .ilike("customer_email", email)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return json(500, { error: error.message });

  const bookings = (data || []).map(r => ({
    orderId:    r.paypal_order,
    itemId:     r.item_id,
    name:       r.item_name,
    qty:        r.qty,
    days:       r.days,
    startDate:  r.start_date,
    endDate:    r.end_date,
    amount:     r.amount_cents,
    hold:       r.hold_cents,
    deposit:    r.deposit_cents,
    renterName: r.renter_name,
    pickupTime: r.pickup_time,
    status:     r.status
  }));

  return json(200, { bookings });
};

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
