/* Outbound SMS via Twilio.
 *
 * Configure with Netlify env vars:
 *   TWILIO_ACCOUNT_SID   — from twilio.com dashboard
 *   TWILIO_AUTH_TOKEN    — from twilio.com dashboard
 *   TWILIO_FROM_NUMBER   — your purchased Twilio number (+1XXXXXXXXXX)
 *
 * If any var is missing, sends are skipped silently so nothing breaks. */
async function sendSms({ to, body }) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from || !to) return { skipped: true };

  const cleaned = String(to).replace(/\D/g, "");
  const e164 = (cleaned.length === 11 && cleaned[0] === "1") ? "+" + cleaned : "+1" + cleaned;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64")
    },
    body: new URLSearchParams({ From: from, To: e164, Body: body }).toString()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Twilio SMS failed");
  return { sid: data.sid };
}

module.exports = { sendSms };
