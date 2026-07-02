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

  const { itemId, name, qty, startDate, endDate, components, addons,
          renterName, agreedTerms, phone, pickupTime,
          items: cartItems } = body; // cartItems = [{itemId, name, qty}] for multi-item cart

  const isCart = Array.isArray(cartItems) && cartItems.length > 0;
  const origin = event.headers.origin || `https://${event.headers.host}`;

  // ----- CART CHECKOUT (multiple items) -----
  if (isCart) {
    let rental = 0, depositFull = 0, hold = 0;
    const cDays = dayCount(startDate, endDate) || 1;
    for (const ci of cartItems) {
      const cq = Math.max(1, parseInt(ci.qty, 10) || 1);
      rental      += await quoteCents({ itemId: ci.itemId, qty: cq, days: cDays });
      depositFull += await depositCents({ itemId: ci.itemId, qty: cq });
    }
    hold = Math.min(depositFull, 25000); // cap at $250
    if (rental < 50) return json(400, { error: "Invalid order amount." });

    const cartLabel = cartItems.length === 1
      ? `${cartItems[0].name}${cartItems[0].qty > 1 ? ` ×${cartItems[0].qty}` : ""}`
      : `${cartItems.length}-item rental`;

    try {
      const order = await createOrder({
        intent: "AUTHORIZE",
        amountCents: rental + hold,
        description: cartLabel,
        customId: `cart|${startDate || ""}|${endDate || ""}`,
        returnUrl: `${origin}/#/paypal-return`,
        cancelUrl: `${origin}/#/cart`
      });

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("bookings").upsert({
          paypal_order: order.id,
          item_id: "cart",
          item_name: cartLabel,
          qty: cartItems.reduce((s, ci) => s + (ci.qty || 1), 0),
          start_date: startDate || null,
          end_date: endDate || null,
          days: dayCount(startDate, endDate),
          amount_cents: rental,
          hold_cents: hold,
          deposit_cents: depositFull,
          cart_items: JSON.stringify(cartItems),
          renter_name: (renterName || "").trim() || null,
          agreed_terms: !!agreedTerms,
          agreed_at: agreedTerms ? new Date().toISOString() : null,
          phone: (phone || "").trim() || null,
          pickup_time: (pickupTime || "").trim() || null,
          status: "pending"
        }, { onConflict: "paypal_order" });
      }

      const approve = (order.links || []).find(l => l.rel === "approve" || l.rel === "payer-action");
      if (!approve) return json(500, { error: "PayPal did not return an approval link." });
      return json(200, { url: approve.href, orderId: order.id });
    } catch (e) {
      return json(500, { error: e.message || "Could not start checkout." });
    }
  }

  // ----- SINGLE-ITEM CHECKOUT (existing flow) -----
  const q = Math.max(1, parseInt(qty, 10) || 1);

  // Inventory guard: don't let a date range be booked beyond available units.
  try {
    const ok = await rangeAvailable(itemId, startDate, endDate, q);
    if (!ok) return json(409, { error: "Those dates are no longer available — please pick different dates." });
  } catch (_) { /* if the check fails, fall through rather than block a sale */ }

  const days = dayCount(startDate, endDate) || 1;
  const rental = await quoteCents({ itemId, qty: q, components, addons, days }); // charged now
  const depositFull = await depositCents({ itemId, qty: q, components });  // for the record
  const hold = await holdCents({ itemId, qty: q, components });            // held on card, ≤ $250
  if (rental < 50) return json(400, { error: "Invalid order amount." });

  const total = rental + hold;
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
        renter_name: (renterName || "").trim() || null,
        agreed_terms: !!agreedTerms,
        agreed_at: agreedTerms ? new Date().toISOString() : null,
        phone: (phone || "").trim() || null,
        pickup_time: (pickupTime || "").trim() || null,
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
