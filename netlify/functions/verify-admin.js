/* Verifies the admin passcode server-side against UBR_ADMIN_PASSCODE env var.
 * Returns 200 on match, 401 on mismatch. Passcode never lives in client code. */
const { timingSafeEqualStr } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return res(405, { error: "Method not allowed" });
  let passcode;
  try { passcode = (JSON.parse(event.body || "{}").passcode || "").trim(); }
  catch { return res(400, { error: "Invalid request" }); }

  const expected = (process.env.UBR_ADMIN_PASSCODE || "").trim();
  if (!expected || !passcode || !timingSafeEqualStr(passcode, expected)) {
    return res(401, { error: "Incorrect passcode" });
  }
  return res(200, { ok: true });
};

function res(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
