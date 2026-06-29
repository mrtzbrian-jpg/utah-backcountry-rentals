/* Creates a PayPal order for the rental fee and returns the approval URL.
 * The browser redirects the customer to PayPal; after they approve they come
 * back to /#/paypal-return and we capture the order. The security deposit is
 * collected in person at pickup, so it is NOT charged here. */
const { createOrder } = require("./_paypal");
const { quoteCents, depositCents } = require("./_pricing");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid request." }); }

  const { itemId, name, days, startDate, endDate, components, addons } = body;
  const amount = quoteCents({ itemId, days, components, addons }); // rental fee, charged now
  const deposit = depositCents({ itemId, components });            // recorded; collected at pickup
  if (amount < 50) return json(400, { error: "Invalid order amount." });

  const origin = event.headers.origin || `https://${event.headers.host}`;
  const dayLabel = `${days} day${Number(days) > 1 ? "s" : ""}`;
  // Compact metadata we read back at capture time (custom_id max 127 chars).
  const customId = [itemId || "", days || "", startDate || "", endDate || "", deposit].join("|");

  try {
    const order = await createOrder({
      amountCents: amount,
      description: `${name || "Gear rental"} — ${dayLabel}`,
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
