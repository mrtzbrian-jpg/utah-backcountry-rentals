/* Updates a booking's status and optionally notifies the customer that their
 * gear is ready for pickup (email + SMS).
 *
 * POST /update-booking
 * Headers: x-admin-pass: <passcode>
 * Body: { orderId, status, notifyCustomer }
 *
 * Status flow: confirmed → prepped → ready → picked_up → returned */
const { getSupabase } = require("./_supabase");
const { notifyReady, notifyReturn } = require("./_email");
const { checkAdmin }   = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Bad request." }); }

  const { orderId, status, notifyCustomer } = body;
  if (!orderId) return json(400, { error: "Missing orderId." });

  const supabase = getSupabase();
  if (!supabase) return json(500, { error: "No database configured." });

  const { data: row } = await supabase.from("bookings").select("*").eq("paypal_order", orderId).single();
  if (!row) return json(404, { error: "Booking not found." });

  const patch = {};
  if (status) patch.status = status;

  let notifyResult = null;
  if (notifyCustomer) {
    patch.notified_ready_at = new Date().toISOString();

    const ref = "UBR-" + String(orderId).slice(-6).toUpperCase();
    const b = {
      orderId,
      name:       row.item_name,
      startDate:  row.start_date,
      endDate:    row.end_date,
      renterName: row.renter_name,
      email:      row.customer_email,
      phone:      row.phone,
      pickupTime: row.pickup_time,
      amount:     row.amount_cents,
      hold:       row.hold_cents
    };

    const emailR = b.email
      ? await notifyReady(b, ref).catch(e => ({ error: e.message }))
      : { skipped: true };

    notifyResult = { email: emailR };
  }

  // Auto-email customer when owner marks gear returned (first time only).
  if (status === "returned" && row.status !== "returned" && row.customer_email) {
    notifyReturn({
      orderId,
      paypal_order: orderId,
      name:       row.item_name,
      startDate:  row.start_date,
      endDate:    row.end_date,
      renterName: row.renter_name,
      email:      row.customer_email,
      amount:     row.amount_cents,
      hold:       row.hold_cents
    }).catch(() => {});
  }

  const { error } = await supabase.from("bookings").update(patch).eq("paypal_order", orderId);
  if (error) return json(500, { error: error.message });

  return json(200, { ok: true, notify: notifyResult });
};

function json(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
