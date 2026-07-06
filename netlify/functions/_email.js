/* Transactional email via Resend (https://resend.com). Sends the customer a
 * reservation confirmation and the owner a "prepare this gear" notification.
 *
 * Configure with Netlify env vars:
 *   RESEND_API_KEY  — your Resend API key
 *   FROM_EMAIL      — verified sender, e.g. "Take a Hike Rentals <hello@yourdomain.com>"
 *   OWNER_EMAIL     — where owner notifications go (your inbox)
 *
 * If these aren't set, sends are skipped silently so checkout never breaks. */
const RESEND_URL = "https://api.resend.com/emails";
const DEPOT = "Saratoga Springs, UT";

function money(cents) { return "$" + Math.round((cents || 0) / 100).toLocaleString("en-US"); }

// Escape customer-supplied values before placing them in email HTML.
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

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
        <div style="color:#FCF9F8;font-size:20px;font-weight:800;letter-spacing:-0.01em;">⛰ Take a Hike Rentals</div>
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 6px;font-size:22px;color:#061B0E;">${title}</h1>
        <div style="height:4px;width:48px;background:${accent || "#AB3500"};border-radius:2px;margin-bottom:18px;"></div>
        ${bodyRows}
      </div>
      <div style="padding:16px 24px;background:#f6f3f2;color:#5C5346;font-size:12px;border-top:1px solid #c3c8c1;">
        Take a Hike Rentals · ${DEPOT}
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
      You're all set${b.customerName ? ", " + esc(b.customerName) : ""}! Your gear is reserved. Here are the details:
    </p>
    ${detailsTable(b, ref)}
    ${b.hold ? `<p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">
      Only the rental fee was charged. A refundable <strong>${money(b.hold)}</strong> hold (max $250) is placed on your
      card for damage or theft, and released when you return the gear in good condition.</p>` : ""}
    <div style="margin:14px 0 0;padding:12px 14px;background:#f6f3f2;border-left:3px solid #AB3500;border-radius:4px;">
      <p style="font-size:13px;color:#061B0E;line-height:1.5;margin:0;font-weight:600;">Bring to pickup:</p>
      <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:4px 0 0;">A valid government photo ID${b.renterName ? ` matching <strong>${esc(b.renterName)}</strong>` : ""}. Your payment card must be in the same name.</p>
    </div>
    <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">
      Pick up at <strong>${DEPOT}</strong>. We'll have everything cleaned and trail-ready. See you out there!</p>`;
  return shell("Reservation confirmed", body, "#AB3500");
}

function gearChecklist(b) {
  const lines = [];
  // Individual includes items (e.g. tent, sleeping bag, poles...)
  if (Array.isArray(b.includes) && b.includes.length) {
    b.includes.forEach(item => lines.push(esc(item)));
  }
  // Fallback: just show the item name × qty when no includes list exists
  if (!lines.length) {
    const label = esc(b.name || "Gear");
    const qty = b.qty && b.qty > 1 ? ` ×${b.qty}` : "";
    lines.push(label + qty);
  }
  const bullets = lines.map(l => `<li style="font-size:13px;color:#1b1c1c;line-height:1.8;">${l}</li>`).join("");
  const weightNote = b.weight ? `<p style="font-size:12px;color:#5C5346;margin:6px 0 0;">Total pack weight: ~${b.weight} lbs</p>` : "";
  return `<div style="margin:14px 0 0;padding:12px 14px;background:#e8f0e9;border-left:3px solid #1b3022;border-radius:4px;">
    <p style="font-size:13px;color:#061B0E;line-height:1.5;margin:0 0 4px;font-weight:700;">Gear checklist — pull these items:</p>
    <ul style="margin:0;padding-left:18px;">${bullets}</ul>
    ${weightNote}
  </div>`;
}

function ownerHtml(b, ref) {
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      A new rental was just booked and paid. Get this gear ready for pickup:
    </p>
    ${detailsTable(b, ref)}
    ${gearChecklist(b)}
    <table style="width:100%;border-collapse:collapse;margin:14px 0 4px;">
      ${row("Renter (verify ID)", esc(b.renterName || "—"))}
      ${row("Name on card", esc(b.customerName || "—"))}
      ${row("Email", esc(b.email || "—"))}
      ${row("Phone", esc(b.phone || "—"))}
      ${row("Pickup window", esc(b.pickupTime || "—"))}
      ${row("Agreed to terms", b.agreedTerms ? "Yes" + (b.agreedAt ? " · " + new Date(b.agreedAt).toLocaleString("en-US") : "") : "—")}
    </table>
    <div style="margin:12px 0 0;padding:12px 14px;background:#f6f3f2;border-left:3px solid #061B0E;border-radius:4px;">
      <p style="font-size:13px;color:#061B0E;line-height:1.5;margin:0;font-weight:600;">At pickup, verify:</p>
      <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:4px 0 0;">Government photo ID matches <strong>${esc(b.renterName || "the renter")}</strong>, and the ID name matches the card name above.</p>
    </div>
    <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">
      A <strong>${money(b.hold)}</strong> refundable hold is on the customer's card. Release it from the admin
      dashboard when the gear is returned undamaged, or capture it there if there's damage/theft.</p>`;
  return shell("New rental to prepare", body, "#061B0E");
}

function readyHtml(b, ref) {
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      Great news${b.renterName ? ", " + esc(b.renterName) : ""}! Your gear is packed, inspected, and ready to go.
    </p>
    ${detailsTable(b, ref)}
    ${b.pickupTime ? `<table style="width:100%;border-collapse:collapse;margin:4px 0;">${row("Pickup window", "<strong>" + esc(b.pickupTime) + "</strong>")}</table>` : ""}
    <div style="margin:14px 0 0;padding:12px 14px;background:#f6f3f2;border-left:3px solid #AB3500;border-radius:4px;">
      <p style="font-size:13px;color:#061B0E;line-height:1.5;margin:0;font-weight:600;">See you soon — bring to pickup:</p>
      <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:4px 0 0;">
        A valid government photo ID${b.renterName ? " matching <strong>" + esc(b.renterName) + "</strong>" : ""} and the card used to book.
        Pick up at <strong>${DEPOT}</strong>.
      </p>
    </div>`;
  return shell("Your gear is ready for pickup!", body, "#1b3022");
}

async function notifyReady(b, ref) {
  if (!b.email) return { skipped: true };
  return sendEmail({
    to: b.email,
    subject: `Your gear is ready for pickup! (${ref})`,
    html: readyHtml(b, ref)
  });
}

// Sends both emails. Never throws — returns a per-recipient result summary.
async function notifyBooking(b) {
  const ref = "UBR-" + String(b.orderId || "").slice(-6).toUpperCase();
  const out = {};
  try { out.customer = b.email ? await sendEmail({ to: b.email, subject: `Your Take a Hike Rentals reservation is confirmed (${ref})`, html: customerHtml(b, ref) }) : { skipped: true }; }
  catch (e) { out.customer = { error: e.message }; }
  const owner = process.env.OWNER_EMAIL;
  try { out.owner = owner ? await sendEmail({ to: owner, subject: `🎒 New rental to prepare: ${b.name || "Gear"} (${ref})`, html: ownerHtml(b, ref) }) : { skipped: true }; }
  catch (e) { out.owner = { error: e.message }; }
  return out;
}

function returnReminderHtml(b, ref) {
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      Hi${b.renterName ? " " + esc(b.renterName) : ""}! Just a friendly reminder that your gear rental ends <strong>today</strong>.
    </p>
    ${detailsTable(b, ref)}
    <div style="margin:14px 0 0;padding:12px 14px;background:#f6f3f2;border-left:3px solid #AB3500;border-radius:4px;">
      <p style="font-size:13px;color:#061B0E;line-height:1.5;margin:0;font-weight:600;">Return checklist:</p>
      <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:4px 0 0;">
        Please return all gear to <strong>${DEPOT}</strong> clean and dry today. Once we confirm the gear is in good condition, the authorization hold on your card will be released.
      </p>
    </div>`;
  return shell("Your gear is due back today", body, "#AB3500");
}

async function notifyReturnReminder(b) {
  if (!b.email) return { skipped: true };
  const ref = "UBR-" + String(b.paypal_order || b.orderId || "").slice(-6).toUpperCase();
  return sendEmail({
    to: b.email,
    subject: `Gear return reminder — due today (${ref})`,
    html: returnReminderHtml(b, ref)
  });
}

function cancellationHtml(b, ref) {
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      Hi${b.customerName ? ", " + esc(b.customerName) : ""}! Your booking has been cancelled and a full refund is on its way.
    </p>
    ${detailsTable(b, ref)}
    <div style="margin:14px 0 0;padding:12px 14px;background:#f6f3f2;border-left:3px solid #5C5346;border-radius:4px;">
      <p style="font-size:13px;color:#061B0E;line-height:1.5;margin:0;font-weight:600;">Refund timeline:</p>
      <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:4px 0 0;">Your rental fee will be refunded to your original payment method within 3–5 business days. Any authorization hold on your card has been released immediately.</p>
    </div>
    <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">
      Questions? Reply to this email or contact us directly. We hope to see you on the trail soon!</p>`;
  return shell("Booking cancelled — refund issued", body, "#5C5346");
}

async function notifyCancellation(b) {
  if (!b.email) return { skipped: true };
  const ref = "UBR-" + String(b.paypal_order || b.orderId || "").slice(-6).toUpperCase();
  const out = {};
  try {
    out.customer = await sendEmail({
      to: b.email,
      subject: `Your Take a Hike Rentals booking was cancelled (${ref})`,
      html: cancellationHtml(b, ref)
    });
  } catch (e) { out.customer = { error: e.message }; }
  const owner = process.env.OWNER_EMAIL;
  try {
    out.owner = owner ? await sendEmail({
      to: owner,
      subject: `❌ Booking cancelled: ${b.name || "Gear"} (${ref})`,
      html: shell("Booking cancelled", `<p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">A booking was cancelled and refunded.</p>${detailsTable(b, ref)}<table style="width:100%;border-collapse:collapse;margin:4px 0;">${row("Customer", esc(b.customerName || "—"))}${row("Email", esc(b.email || "—"))}</table>`, "#5C5346")
    }) : { skipped: true };
  } catch (e) { out.owner = { error: e.message }; }
  return out;
}

function returnConfirmHtml(b, ref) {
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      Hi${b.renterName ? ", " + esc(b.renterName) : ""}! Your gear has been checked in and everything looks great. Thank you for taking care of the equipment!
    </p>
    ${detailsTable(b, ref)}
    <div style="margin:14px 0 0;padding:12px 14px;background:#e8f0e9;border-left:3px solid #1b3022;border-radius:4px;">
      <p style="font-size:13px;color:#061B0E;line-height:1.5;margin:0;font-weight:600;">Authorization hold released:</p>
      <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:4px 0 0;">The refundable hold on your card has been released. Depending on your bank, it may take 1–5 business days to fully clear.</p>
    </div>
    <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">We hope you had an amazing adventure! Book again soon — your next trail is waiting.</p>`;
  return shell("Gear returned — you're all set!", body, "#1b3022");
}

async function notifyReturn(b) {
  if (!b.email) return { skipped: true };
  const ref = "UBR-" + String(b.paypal_order || b.orderId || "").slice(-6).toUpperCase();
  return sendEmail({
    to: b.email,
    subject: `Gear returned — you're all set! (${ref})`,
    html: returnConfirmHtml(b, ref)
  });
}

function waitlistNotifyHtml(itemName, startDate, endDate) {
  const range = (() => {
    const s = fmtDate(startDate), e = fmtDate(endDate);
    if (!s) return "the dates you requested";
    return (e && e !== s) ? `${s} → ${e}` : s;
  })();
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      Great news! <strong>${esc(itemName || "Gear")}</strong> is now available for <strong>${range}</strong> — a booking just opened up.
    </p>
    <div style="margin:14px 0 0;padding:12px 14px;background:#e8f0e9;border-left:3px solid #1b3022;border-radius:4px;">
      <p style="font-size:13px;color:#061B0E;line-height:1.5;margin:0;font-weight:600;">Book before it's gone:</p>
      <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:4px 0 0;">Visit takeahikerentals.com and select those dates — availability is first-come, first-served.</p>
    </div>
    <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">We'll only send one notification per waitlist entry. Reply to this email with any questions.</p>`;
  return shell("Dates now available!", body, "#1b3022");
}

async function notifyWaitlistEntry({ email, itemName, startDate, endDate }) {
  if (!email) return { skipped: true };
  return sendEmail({
    to: email,
    subject: `${itemName || "Gear"} just opened up for your dates!`,
    html: waitlistNotifyHtml(itemName, startDate, endDate)
  });
}

// Sent to the owner only, when a card fails at the authorization step (stolen,
// insufficient funds, expired, etc). The booking never confirms — this is the
// only record of the attempt outside the admin dashboard's "Declined" filter.
async function notifyDeclinedPayment(d) {
  const owner = process.env.OWNER_EMAIL;
  if (!owner) return { skipped: true };
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      A checkout attempt was <strong style="color:#ba1a1a;">declined by the customer's card</strong> and did not go through. No charge was made and no booking was created.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 4px;">
      ${row("Item", esc(d.itemName || "—"))}
      ${row("Attempted charge", money(d.amountAttempted))}
      ${d.holdAttempted ? row("Attempted hold", money(d.holdAttempted)) : ""}
      ${row("Customer", esc(d.customerName || d.customerEmail || "Unknown — card was declined before checkout completed"))}
      ${row("Order ID", esc(d.orderId || "—"))}
    </table>
    <div style="margin:14px 0 0;padding:12px 14px;background:#ffdad6;border-left:3px solid #ba1a1a;border-radius:4px;">
      <p style="font-size:13px;color:#93000a;line-height:1.5;margin:0;font-weight:600;">Decline reason:</p>
      <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:4px 0 0;">${esc(d.reason || "Not specified")}</p>
    </div>
    <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">This attempt is logged in your admin dashboard under Orders → All, with a "Declined" status, in case the same customer calls to ask what happened.</p>`;
  try {
    return await sendEmail({ to: owner, subject: `⚠️ Payment declined: ${d.itemName || "Gear rental"}`, html: shell("Payment declined", body, "#ba1a1a") });
  } catch (e) { return { error: e.message }; }
}

// Sent to the customer confirming a partial refund (damage waiver reduction,
// goodwill credit, etc) that isn't a full cancellation.
async function notifyPartialRefund(b) {
  if (!b.email) return { skipped: true };
  const ref = "UBR-" + String(b.paypal_order || b.orderId || "").slice(-6).toUpperCase();
  const body = `
    <p style="font-size:15px;color:#1b1c1c;line-height:1.5;margin:0 0 14px;">
      Hi${b.renterName ? ", " + esc(b.renterName) : ""} — we've issued a partial refund to your original payment method for booking <strong>${ref}</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 4px;">
      ${row("Gear", esc(b.name || "Gear rental"))}
      ${row("Refund amount", money(b.refundAmount))}
      ${row("Total refunded so far", money(b.totalRefunded))}
    </table>
    <p style="font-size:13px;color:#5C5346;line-height:1.5;margin:14px 0 0;">Refunds typically take 3–5 business days to appear on your statement, depending on your bank. Reply to this email with any questions.</p>`;
  try {
    return await sendEmail({ to: b.email, subject: `Partial refund issued — ${ref}`, html: shell("Partial refund issued", body, "#5C5346") });
  } catch (e) { return { error: e.message }; }
}

module.exports = { sendEmail, notifyBooking, notifyReady, notifyReturnReminder, notifyCancellation, notifyReturn, notifyWaitlistEntry, notifyDeclinedPayment, notifyPartialRefund };
