/* Runtime configuration.
 *
 * BACKEND_ENABLED stays FALSE until you've finished the steps in SETUP.md
 * (created your PayPal + Supabase + Netlify accounts and pasted the keys into
 * Netlify's environment variables). While it's false the site runs in DEMO mode:
 * the full experience works, but "Proceed to Checkout" just shows a sample
 * confirmation instead of taking a real payment. Flip it to true to go live.
 */
window.UBR_CONFIG = {
  BACKEND_ENABLED: true,
  FUNCTIONS_BASE: "/.netlify/functions",

  // Passcode for the owner's "Manage Gear" admin (open it at /#/admin).
  // ⚠️ In demo mode this is a soft lock only — change it from the default.
  // Real protection comes from the server ADMIN_TOKEN once Supabase is connected.
  ADMIN_PASSCODE: "trailhead"
};
