/* Creates a PayPal order for the rental fee and returns the approval URL.
 * The browser redirects the customer to PayPal; after they approve they come
 * back to /#/paypal-return and we capture the order. The security deposit is
 * collected in person at pickup, so it is NOT charged here. */
const { createOrder } = require("./_paypal");
const { quoteCents, depositCents } = require("./_pricing");
const { rangeAvailable } = require("./_inventory");

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

  const amount = await quoteCents({ itemId, qty: q, components, addons }); // rental fee, charged now
  const deposit = await depositCents({ itemId, qty: q, components });      // recorded; collected at pickup
  if (amount < 50) return json(400, { error: "Invalid order amount." });

  const origin = event.headers.origin || `https://${event.headers.host}`;
  // Compact metadata we read back at capture time (custom_id max 127 chars).
  const customId = [itemId || "", q, startDate || "", endDate || "", deposit].join("|");

  try {
    const order = await createOrder({
      amountCents: amount,
      description: `${name || "Gear rental"}${q > 1 ? ` ×${q}` : ""}`,
      customId,
      returnUrl: `${origin}/#/paypal-return`,
      cancelUrl: `${origin}/#/gear/${itemId || ""}`
    });
    const approve = (order.links || []).find((l) => l.rel === "approve" || l.rel === "payer-action");
    if (!approve) return json(500, { error: "PayPal did not return an approval link." });
    return json(200, { url: approve.href, orderId: order.id });
  } catch (e) {
    return json(500, { error: e.message || "Could not start checkout." });
  }
};

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
