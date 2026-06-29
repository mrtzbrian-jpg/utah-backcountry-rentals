/* PayPal REST helper (Orders API v2). Uses global fetch (Node 18+ on Netlify).
 * Set PAYPAL_ENV to "live" for production; anything else uses sandbox. */
const ENV = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
const BASE = ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function accessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!id || !secret) throw new Error("PayPal is not configured");
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "PayPal auth failed");
  return data.access_token;
}

async function createOrder({ amountCents, brand, description, customId, returnUrl, cancelUrl }) {
  const token = await accessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "USD", value: (amountCents / 100).toFixed(2) },
        description: (description || "Gear rental").slice(0, 127),
        custom_id: (customId || "").slice(0, 127)
      }],
      application_context: {
        brand_name: brand || "Utah Backcountry Rentals",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl
      }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.details && data.details[0] && data.details[0].description) || data.message || "Could not create PayPal order");
  return data;
}

async function captureOrder(orderId) {
  const token = await accessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.details && data.details[0] && data.details[0].description) || data.message || "Capture failed");
  return data;
}

async function getOrder(orderId) {
  const token = await accessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Order not found");
  return data;
}

module.exports = { accessToken, createOrder, captureOrder, getOrder, BASE, ENV };
