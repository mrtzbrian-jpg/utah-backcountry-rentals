/* Charges a Square card (tokenized client-side by the Web Payments SDK) for a
 * rental and, in the same request, places a separate hold for the refundable
 * damage/theft deposit.
 *
 * Square has no "authorize the total, capture part of it" primitive like
 * PayPal's orders API, so this creates two independent payments:
 *   1. an immediate-capture payment for the rental fee (charged now), and
 *   2. a delayed-capture payment for the deposit (a pure hold — completed or
 *      canceled later from the admin dashboard when the gear comes back).
 * If step 2 fails after step 1 succeeded, step 1 is refunded so the customer
 * is never charged for a reservation that didn't fully go through.
 *
 * The whole checkout now happens in one request (no PayPal-style redirect),
 * so this function also does what capture-order.js used to do: write the
 * CONFIRMED booking row and send the confirmation emails. */
const crypto = require("crypto");
const { createPayment, refundPayment } = require("./_square");
const { quoteCents, holdCents, depositCents } = require("./_pricing");
const { rangeAvailable } = require("./_inventory");
const { getSupabase, bookingUpsert } = require("./_supabase");
const { notifyBooking, notifyDeclinedPayment } = require("./_email");

// Records a failed charge attempt (row stays visible in the admin "All" filter
// with a "Declined" status instead of vanishing) and alerts the owner by email.
// Never throws — a notification failure must not mask the original decline.
async function logDecline(supabase, { paymentRef, itemId, name, qty, startDate, endDate, rentalCents, holdC, reason, email, renterName, phone }) {
  if (supabase) {
    try {
      await bookingUpsert(supabase, {
        paypal_order: paymentRef || null,
        item_id: itemId,
        item_name: name,
        qty: qty || 1,
        start_date: startDate || null,
        end_date: endDate || null,
        amount_cents: rentalCents,
        hold_cents: holdC,
        customer_email: email || null,
        renter_name: renterName || null,
        phone: phone || null,
        status: "declined",
        decline_reason: String(reason || "").slice(0, 500)
      }, paymentRef ? { onConflict: "paypal_order" } : undefined);
    } catch (_) { /* logging failure must not mask the decline */ }
  }
  try {
    await notifyDeclinedPayment({
      itemName: name,
      amountAttempted: rentalCents,
      holdAttempted: holdC,
      customerEmail: email,
      customerName: renterName,
      orderId: paymentRef,
      reason
    });
  } catch (_) { /* email failure must not mask the decline */ }
}

async function chargeAndHold({ sourceId, rentalCents, holdC, note, referenceId }) {
  const rentalPayment = await createPayment({
    sourceId, amountCents: rentalCents, autocomplete: true, note, referenceId,
    idempotencyKey: crypto.randomUUID()
  });
  if (holdC > 0) {
    try {
      const holdPayment = await createPayment({
        sourceId, amountCents: holdC, autocomplete: false,
        note: `Security deposit hold — ${note}`, referenceId,
        idempotencyKey: crypto.randomUUID()
      });
      return { rentalPayment, holdPayment };
    } catch (e) {
      try {
        await refundPayment({ paymentId: rentalPayment.id, amountCents: rentalCents, idempotencyKey: crypto.randomUUID(), reason: "Deposit hold failed" });
      } catch (_) { /* best effort — logDecline still records the failure */ }
      throw e;
    }
  }
  return { rentalPayment, holdPayment: null };
}

async function persistConfirmed(supabase, b) {
  const orderId = b.rentalPaymentId; // primary key for the booking, same role the PayPal order id used to play
  const agreedAt = b.agreedTerms ? new Date().toISOString() : null;
  if (supabase) {
    await bookingUpsert(supabase, {
      paypal_order: orderId,
      item_id: b.itemId,
      item_name: b.name,
      qty: b.qty || 1,
      start_date: b.startDate || null,
      end_date: b.endDate || null,
      days: b.days || null,
      amount_cents: b.amount,
      hold_cents: b.hold,
      deposit_cents: b.deposit,
      authorization_id: b.holdPaymentId,
      capture_id: b.rentalPaymentId,
      cart_items: b.cartItems ? JSON.stringify(b.cartItems) : null,
      customer_email: b.email,
      customer_name: b.customerName,
      renter_name: (b.renterName || "").trim() || null,
      agreed_terms: !!b.agreedTerms,
      agreed_at: agreedAt,
      phone: (b.phone || "").trim() || null,
      pickup_time: (b.pickupTime || "").trim() || null,
      status: "confirmed"
    }, { onConflict: "paypal_order" });
  }
  return {
    orderId, itemId: b.itemId, name: b.name, qty: b.qty,
    startDate: b.startDate, endDate: b.endDate, days: b.days,
    amount: b.amount, hold: b.hold, deposit: b.deposit,
    email: b.email, customerName: b.customerName, renterName: b.renterName,
    agreedTerms: !!b.agreedTerms, agreedAt,
    phone: b.phone || null, pickupTime: b.pickupTime || null, status: "confirmed"
  };
}

async function sendConfirmation(supabase, booking) {
  if (supabase && booking.itemId) {
    const { data: product } = await supabase.from("products").select("includes, weight").eq("id", booking.itemId).maybeSingle();
    if (product) {
      if (Array.isArray(product.includes) && product.includes.length) booking.includes = product.includes;
      if (product.weight) booking.weight = product.weight;
    }
  }
  try {
    await notifyBooking(booking);
    if (supabase) await supabase.from("bookings").update({ emailed: true }).eq("paypal_order", booking.orderId);
  } catch (_) { /* email failure must never block confirmation */ }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid request." }); }

  const { itemId, name, qty, startDate, endDate, components, addons,
          renterName, agreedTerms, phone, pickupTime, email, sourceId,
          items: cartItems } = body; // cartItems = [{itemId, name, qty}] for multi-item cart

  if (!sourceId) return json(400, { error: "Missing payment information." });
  const cleanEmail = (email || "").trim();
  if (!cleanEmail || !cleanEmail.includes("@")) return json(400, { error: "Enter a valid email address." });

  const isCart = Array.isArray(cartItems) && cartItems.length > 0;
  const supabase = getSupabase();

  // ----- CART CHECKOUT (multiple items) -----
  if (isCart) {
    let rental = 0, depositFull = 0;
    const cDays = dayCount(startDate, endDate) || 1;
    for (const ci of cartItems) {
      const cq = Math.max(1, parseInt(ci.qty, 10) || 1);
      rental += await quoteCents({ itemId: ci.itemId, qty: cq, days: cDays });
      depositFull += await depositCents({ itemId: ci.itemId, qty: cq });
    }
    const hold = Math.min(depositFull, 25000); // cap at $250
    if (rental < 50) return json(400, { error: "Invalid order amount." });

    const cartLabel = cartItems.length === 1
      ? `${cartItems[0].name}${cartItems[0].qty > 1 ? ` ×${cartItems[0].qty}` : ""}`
      : `${cartItems.length}-item rental`;
    const cartQty = cartItems.reduce((s, ci) => s + (ci.qty || 1), 0);

    let payments;
    try {
      payments = await chargeAndHold({ sourceId, rentalCents: rental, holdC: hold, note: cartLabel, referenceId: `cart-${Date.now()}`.slice(0, 40) });
    } catch (e) {
      const reason = e.message || "Payment was declined.";
      await logDecline(supabase, { itemId: "cart", name: cartLabel, qty: cartQty, startDate, endDate, rentalCents: rental, holdC: hold, reason, email: cleanEmail, renterName, phone });
      return json(502, { error: reason });
    }

    const booking = await persistConfirmed(supabase, {
      itemId: "cart", name: cartLabel, qty: cartQty, startDate, endDate,
      days: dayCount(startDate, endDate), amount: rental, hold, deposit: depositFull,
      cartItems, email: cleanEmail, customerName: renterName, renterName, agreedTerms, phone, pickupTime,
      rentalPaymentId: payments.rentalPayment.id, holdPaymentId: payments.holdPayment ? payments.holdPayment.id : null
    });
    await sendConfirmation(supabase, booking);
    return json(200, booking);
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

  const label = `${name || "Gear rental"}${q > 1 ? ` ×${q}` : ""}`;

  let payments;
  try {
    payments = await chargeAndHold({ sourceId, rentalCents: rental, holdC: hold, note: label, referenceId: `${itemId || "item"}-${Date.now()}`.slice(0, 40) });
  } catch (e) {
    const reason = e.message || "Payment was declined.";
    await logDecline(supabase, { itemId, name: label, qty: q, startDate, endDate, rentalCents: rental, holdC: hold, reason, email: cleanEmail, renterName, phone });
    return json(502, { error: reason });
  }

  const booking = await persistConfirmed(supabase, {
    itemId, name: label, qty: q, startDate, endDate, days: dayCount(startDate, endDate),
    amount: rental, hold, deposit: depositFull,
    email: cleanEmail, customerName: renterName, renterName, agreedTerms, phone, pickupTime,
    rentalPaymentId: payments.rentalPayment.id, holdPaymentId: payments.holdPayment ? payments.holdPayment.id : null
  });
  await sendConfirmation(supabase, booking);
  return json(200, booking);
};

function dayCount(s, e) {
  if (!s || !e) return null;
  return Math.round((new Date(e) - new Date(s)) / 86400000) + 1;
}

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
