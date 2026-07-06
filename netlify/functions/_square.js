/* Square REST helper (Payments API). Uses global fetch (Node 18+ on Netlify).
 * Set SQUARE_ENV to "production" for real charges; anything else uses sandbox. */
const ENV = (process.env.SQUARE_ENV || "sandbox").toLowerCase();
const BASE = ENV === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
const API_VERSION = "2024-10-17";

function headers() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new Error("Square is not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Square-Version": API_VERSION
  };
}

function firstError(data) {
  const e = (data.errors && data.errors[0]) || {};
  return e.detail || e.code || null;
}

// Create a payment from a Web Payments SDK card nonce (sourceId).
// autocomplete:true charges immediately; autocomplete:false places a hold
// that must later be completed (captured) or canceled (voided).
async function createPayment({ sourceId, amountCents, autocomplete, note, referenceId, idempotencyKey }) {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) throw new Error("Square location is not configured");
  const res = await fetch(`${BASE}/v2/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      location_id: locationId,
      amount_money: { amount: amountCents, currency: "USD" },
      autocomplete: !!autocomplete,
      note: (note || "Gear rental").slice(0, 500),
      reference_id: (referenceId || "").slice(0, 40) || undefined
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(firstError(data) || "Could not create Square payment");
  return data.payment;
}

// Capture the full amount of a delayed-capture (autocomplete:false) payment.
// Square has no partial capture — capture in full, then refund any unused
// portion (e.g. only part of a damage deposit is actually owed).
async function completePayment(paymentId) {
  const res = await fetch(`${BASE}/v2/payments/${paymentId}/complete`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(firstError(data) || "Could not complete Square payment");
  return data.payment;
}

// Cancel (void) a delayed-capture payment that hasn't been completed yet —
// releases the hold entirely.
async function cancelPayment(paymentId) {
  const res = await fetch(`${BASE}/v2/payments/${paymentId}/cancel`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(firstError(data) || "Could not cancel Square payment");
  return data.payment || { canceled: true };
}

async function getPayment(paymentId) {
  const res = await fetch(`${BASE}/v2/payments/${paymentId}`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(firstError(data) || "Payment not found");
  return data.payment;
}

// Refund a completed payment. Pass amountCents for a partial refund or the
// full captured amount for a full refund — Square always requires an amount.
async function refundPayment({ paymentId, amountCents, idempotencyKey, reason }) {
  const res = await fetch(`${BASE}/v2/refunds`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      payment_id: paymentId,
      amount_money: { amount: amountCents, currency: "USD" },
      reason: (reason || "").slice(0, 192) || undefined
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(firstError(data) || "Refund failed");
  return data.refund;
}

module.exports = { createPayment, completePayment, cancelPayment, refundPayment, getPayment, BASE, ENV };
