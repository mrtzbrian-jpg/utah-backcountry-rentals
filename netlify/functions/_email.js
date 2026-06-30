/* Transactional email via Resend (https://resend.com). Sends the customer a
 * reservation confirmation and the owner a "prepare this gear" notification.
 *
 * Configure with Netlify env vars:
 *   RESEND_API_KEY  — your Resend API key
 *   FROM_EMAIL      — verified sender, e.g. "Utah Backcountry <hello@yourdomain.com>"
 *   OWNER_EMAIL     — where owner notifications go (your inbox)
 *
 * If these aren't set, sends are skipped silently so checkout never breaks. */
const RESEND_URL = "https://api.resend.com/emails";
const DEPOT = "Saratoga Springs, UT";

function money(cents) { return "$" + Math.round((cents || 0) / 100).toLocaleString("en-US"); }

function fmtDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function rangeLabel(b) {
  const s = fmtDate(b.startDate), e = fmtDate(b.endDate);
  if (!s) return "Flexible dates";
  return e && e !== s ? `${s} → ${e}` : s;
}

async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  if (!key || !from || !to) return { skipped: true };
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Resend send failed");
  return data;
}

function shell(title, bodyRows, accent) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#F0EDED;padding:24px;">
    <div style="max-width:520px;margin:0 auto;background:#FCF9F8;border:1px solid #c3c8c1;border-radius:12px;overflow:hidden;">
      <div style="background:#061B0E;padding:20px 24px;">
        <div style="color:#FCF9F8;font-size:20px;font-weight:800;letter-spacing:-0.01em;">⛰ Utah Backcountry</div>
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 6px;font-size:22px;color:#061B0E;">${title}</h1>
        <div style="height:4px;width:48px;background:${accent || "#AB3500"};border-radius:2px;margin-bottom:18px;"></div>
        ${bodyRows}
      </div>
      <div style="padding:16px 24px;background:#f6f3f2;color:#5C5346;font-size:12px;border-top:1px solid #c3c8c1;">
        Utah Backcountry Rentals · ${DEPOT}
      </div>
    </div>
  </div>`;
}

function row(label, value) {
  return `<tr>
    <td style="padding:8px 0;color:#5C5346;font-size:14px;">${label}</td>
    <td style="padding:8px 0;color:#061B0E;font-size:14px;font-weight:600;text-align:right;">${value}</td>
  </tr>`;
}

function detailsTable(b, ref) {
  return `<table style="width:100%;border-collapse:collapse;margin:8px 0 4px;">
    ${row("Confirmation", ref)}
    ${row("Gear", b.name || "Gear rental")}
    ${b.qty && b.qty > 1 ? row("Quantity", "×" + b.qty) : ""}
    ${row("Dates", rangeLabel(b))}
    ${row("Pickup", DEPOT)}
    ${row("Charged now (rental)", money(b.amount))}
    ${b.hold ? row("Refundable hold on card", money(b.hold)) : ""}
  </table>`;
}

function customerHtml(b, ref) {
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      You're all set${b.customerName ? ", " + b.customerName : ""}! Your gear is reserved. Here are the details:
    </p>
    ${detailsTable(b, ref)}
    ${b.hold ? `<p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">
      Only the rental fee was charged. A refundable <strong>${money(b.hold)}</strong> hold (max $250) is placed on your
      card for damage or theft, and released when you return the gear in good condition.</p>` : ""}
    <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">
      Pick up at <strong>${DEPOT}</strong>. We'll have everything cleaned and trail-ready. See you out there!</p>`;
  return shell("Reservation confirmed", body, "#AB3500");
}

function ownerHtml(b, ref) {
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      A new rental was just booked and paid. Get this gear ready for pickup:
    </p>
    ${detailsTable(b, ref)}
    <table style="width:100%;border-collapse:collapse;margin:4px 0;">
      ${row("Customer", b.customerName || "—")}
      ${row("Email", b.email || "—")}
    </table>
    <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">
      A <strong>${money(b.hold)}</strong> refundable hold is on the customer's card. Release it (void the authorization)
      when the gear is returned undamaged, or capture it from the PayPal dashboard if there's damage/theft.</p>`;
  return shell("New rental to prepare", body, "#061B0E");
}

// Sends both emails. Never throws — returns a per-recipient result summary.
async function notifyBooking(b) {
  const ref = "UBR-" + String(b.orderId || "").slice(-6).toUpperCase();
  const out = {};
  try { out.customer = b.email ? await sendEmail({ to: b.email, subject: `Your Utah Backcountry reservation is confirmed (${ref})`, html: customerHtml(b, ref) }) : { skipped: true }; }
  catch (e) { out.customer = { error: e.message }; }
  const owner = process.env.OWNER_EMAIL;
  try { out.owner = owner ? await sendEmail({ to: owner, subject: `🎒 New rental to prepare: ${b.name || "Gear"} (${ref})`, html: ownerHtml(b, ref) }) : { skipped: true }; }
  catch (e) { out.owner = { error: e.message }; }
  return out;
}

module.exports = { sendEmail, notifyBooking };
