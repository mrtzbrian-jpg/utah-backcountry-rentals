/* Starts a PayPal checkout for a rental.
 *
 * We use intent=AUTHORIZE so we can do two things from one approval:
 *   1. capture the rental fee now (the customer is charged), and
 *   2. hold the refundable damage/theft deposit (up to $250) on their card.
 *
 * The amount sent to PayPal is rental + hold. We also write a PENDING booking
 * row to Supabase keyed by the PayPal order id, so capture-order can read the
 * exact amounts back (this is what makes custom-bundle pricing reliable). */
const { createOrder } = require("./_paypal");
const { quoteCents, holdCents, depositCents } = require("./_pricing");
const { rangeAvailable } = require("./_inventory");
const { getSupabase } = require("./_supabase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid request." }); }

  const { itemId, name, qty, startDate, endDate, components, addons } = body;
  const q = Math.max(1, parseInt(qty, 10) || 1);

  // Inventory guard: don't let a date range be booked beyond available units.
  try {
    const ok = await rangeAvailable(itemId, startDate, endDate, q);
    if (!ok) return json(409, { error: "Those dates are no longer available — please pick different dates." });
  } catch (_) { /* if the check fails, fall through rather than block a sale */ }

  const rental = await quoteCents({ itemId, qty: q, components, addons }); // charged now
  const depositFull = await depositCents({ itemId, qty: q, components });  // for the record
  const hold = await holdCents({ itemId, qty: q, components });            // held on card, ≤ $250
  if (rental < 50) return json(400, { error: "Invalid order amount." });

  const total = rental + hold;
  const origin = event.headers.origin || `https://${event.headers.host}`;
  const customId = [itemId || "", q, startDate || "", endDate || ""].join("|").slice(0, 127);

  try {
    const order = await createOrder({
      intent: "AUTHORIZE",
      amountCents: total,
      description: `${name || "Gear rental"}${q > 1 ? ` ×${q}` : ""}`,
      customId,
      returnUrl: `${origin}/#/paypal-return`,
      cancelUrl: `${origin}/#/gear/${itemId || ""}`
    });

    // Record the intended booking so capture-order can read the exact amounts.
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("bookings").upsert({
        paypal_order: order.id,
        item_id: itemId,
        item_name: name || "Gear rental",
        qty: q,
        start_date: startDate || null,
        end_date: endDate || null,
        days: dayCount(startDate, endDate),
        amount_cents: rental,
        hold_cents: hold,
        deposit_cents: depositFull,
        status: "pending"
      }, { onConflict: "paypal_order" });
    }

    const approve = (order.links || []).find((l) => l.rel === "approve" || l.rel === "payer-action");
    if (!approve) return json(500, { error: "PayPal did not return an approval link." });
    return json(200, { url: approve.href, orderId: order.id });
  } catch (e) {
    return json(500, { error: e.message || "Could not start checkout." });
  }
};

function dayCount(s, e) {
  if (!s || !e) return null;
  return Math.round((new Date(e) - new Date(s)) / 86400000) + 1;
}

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
