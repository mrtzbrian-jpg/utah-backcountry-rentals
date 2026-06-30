/* Shared owner-auth check. Constant-time comparison so the passcode can't be
 * guessed by measuring response timing. Accepts the passcode from either the
 * x-admin-pass or x-admin-passcode header (both used historically).
 *
 * Returns true only when UBR_ADMIN_PASSCODE is set AND matches exactly. */
const crypto = require("crypto");

function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  // Length leak is unavoidable, but compare on a fixed-size hash to avoid it.
  const ah = crypto.createHash("sha256").update(ab).digest();
  const bh = crypto.createHash("sha256").update(bb).digest();
  return crypto.timingSafeEqual(ah, bh);
}

function checkAdmin(event) {
  const expected = (process.env.UBR_ADMIN_PASSCODE || "").trim();
  if (!expected) return false;
  const h = event.headers || {};
  const got = String(h["x-admin-pass"] || h["x-admin-passcode"] || "").trim();
  if (!got) return false;
  return timingSafeEqualStr(got, expected);
}

module.exports = { checkAdmin, timingSafeEqualStr };
