/* Finalizes an approved AUTHORIZE-intent order:
 *   1. authorize the order  → places the hold on the card (rental + deposit),
 *   2. capture the rental    → charges the customer, leaving the deposit held,
 *   3. record the booking in Supabase + email the customer and the owner.
 *
 * The remaining held amount (the deposit, ≤ $250) stays authorized so the owner
 * can release it on safe return (void) or capture it if gear is damaged/stolen.
 * Idempotent: a page refresh re-reads the confirmed row instead of charging again. */
const { authorizeOrder, captureAuthorization, getOrder } = require("./_paypal");
const { getSupabase, bookingUpsert } = require("./_supabase");
const { quoteCents, holdCents } = require("./_pricing");
const { notifyBooking } = require("./_email");

exports.handler = async (event) => {
  const orderId = (event.queryStringParameters || {}).orderId ||
    (() => { try { return JSON.parse(event.body || "{}").orderId; } catch { return null; } })();
  if (!orderId) return json(400, { error: "Missing order id." });

  const supabase = getSupabase();

  // Existing booking row (written as 'pending' by create-checkout).
  let row = null;
  if (supabase) {
    const { data } = await supabase.from("bookings").select("*").eq("paypal_order", orderId).maybeSingle();
    row = data || null;
    if (row && row.status === "confirmed") return json(200, fromRow(row)); // already done
  }

  // Read the order to learn its current state + the payer's details.
  let order;
  try { order = await getOrder(orderId); } catch (e) { return json(502, { error: e.message }); }
  const meta = parseCustom(order);
  const rentalCents = row ? row.amount_cents : await quoteCents({ itemId: meta.itemId, qty: meta.qty });
  const holdC = row ? (row.hold_cents || 0) : await holdCents({ itemId: meta.itemId, qty: meta.qty });

  // 1) Authorize (place the hold) — unless the order is already authorized.
  let authId = findAuthId(order);
  if (!authId) {
    try {
      const authed = await authorizeOrder(orderId);
      authId = findAuthId(authed);
      order = authed;
    } catch (e) { return json(502, { error: e.message || "Could not authorize payment." }); }
  }
  if (!authId) return json(502, { error: "No authorization returned by PayPal." });

  // 2) Capture the rental fee, leaving the deposit held (final_capture only if no hold).
  let captureId = null;
  if (rentalCents >= 50) {
    try {
      const captured = await captureAuthorization(authId, rentalCents, holdC <= 0);
      captureId = captured ? captured.id : null;
    }
    catch (e) { return json(502, { error: e.message || "Could not capture the rental fee." }); }
  }

  const payer = order.payer || {};
  const nm = payer.name || {};
  const booking = {
    orderId,
    itemId: meta.itemId,
    name: row ? row.item_name : meta.name,
    qty: row ? row.qty : meta.qty,
    startDate: row ? row.start_date : meta.startDate,
    endDate: row ? row.end_date : meta.endDate,
    days: row ? row.days : dayCount(meta.startDate, meta.endDate),
    amount: rentalCents,
    hold: holdC,
    deposit: row ? (row.deposit_cents || 0) : holdC,
    email: payer.email_address || null,
    customerName: [nm.given_name, nm.surname].filter(Boolean).join(" ") || null,
    renterName: row ? (row.renter_name || null) : null,
    agreedTerms: row ? !!row.agreed_terms : false,
    agreedAt: row ? (row.agreed_at || null) : null,
    phone: row ? (row.phone || null) : null,
    pickupTime: row ? (row.pickup_time || null) : null
  };

  // 3) Persist + notify (once).
  if (supabase) {
    await bookingUpsert(supabase, {
      paypal_order: orderId,
      item_id: booking.itemId,
      item_name: booking.name,
      qty: booking.qty || 1,
      start_date: booking.startDate || null,
      end_date: booking.endDate || null,
      days: booking.days || null,
      amount_cents: booking.amount,
      hold_cents: booking.hold,
      deposit_cents: booking.deposit,
      authorization_id: authId,
      capture_id: captureId || null,
      cart_items: booking.cartItems ? JSON.stringify(booking.cartItems) : null,
      customer_email: booking.email,
      customer_name: booking.customerName,
      renter_name: booking.renterName,
      agreed_terms: booking.agreedTerms,
      agreed_at: booking.agreedAt,
      phone: booking.phone || null,
      pickup_time: booking.pickupTime || null,
      status: "confirmed"
    }, { onConflict: "paypal_order" });
  }


  // Fetch the item's includes list so the owner email can show a gear checklist.
  if (supabase && booking.itemId) {
    const { data: product } = await supabase.from("products").select("includes, weight").eq("id", booking.itemId).maybeSingle();
    if (product) {
      if (Array.isArray(product.includes) && product.includes.length) booking.includes = product.includes;
      if (product.weight) booking.weight = product.weight;
    }
  }

  if (!(row && row.emailed)) {
    try {
      await notifyBooking(booking);
      if (supabase) await supabase.from("bookings").update({ emailed: true }).eq("paypal_order", orderId);
    } catch (_) { /* email failure must never block confirmation */ }
  }

  return json(200, booking);
};

function findAuthId(order) {
  const pu = ((order || {}).purchase_units || [])[0] || {};
  const auth = (((pu.payments || {}).authorizations) || [])[0] || {};
  return auth.id || null;
}

function parseCustom(order) {
  const pu = ((order || {}).purchase_units || [])[0] || {};
  const parts = String(pu.custom_id || "").split("|"); // itemId|qty|start|end
  return {
    itemId: parts[0] || "",
    name: String(pu.description || "Gear rental"),
    qty: parts[1] ? parseInt(parts[1], 10) : 1,
    startDate: parts[2] || "",
    endDate: parts[3] || ""
  };
}

function fromRow(r) {
  return {
    orderId: r.paypal_order, itemId: r.item_id, name: r.item_name, qty: r.qty,
    startDate: r.start_date, endDate: r.end_date, days: r.days,
    amount: r.amount_cents, hold: r.hold_cents, deposit: r.deposit_cents,
    email: r.customer_email, customerName: r.customer_name, renterName: r.renter_name,
    phone: r.phone, pickupTime: r.pickup_time
  };
}

function dayCount(s, e) {
  if (!s || !e) return null;
  return Math.round((new Date(e) - new Date(s)) / 86400000) + 1;
}

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
