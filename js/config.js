/* Runtime configuration.
 *
 * BACKEND_ENABLED stays FALSE until you've finished the steps in SETUP.md
 * (created your Square + Supabase + Netlify accounts and pasted the keys into
 * Netlify's environment variables). While it's false the site runs in DEMO mode:
 * the full experience works, but "Proceed to Checkout" just shows a sample
 * confirmation instead of taking a real payment. Flip it to true to go live.
 */
window.UBR_CONFIG = {
  BACKEND_ENABLED: true,
  FUNCTIONS_BASE: "/.netlify/functions",

  // Admin passcode is verified server-side via the verify-admin function.
  // Never store the passcode here — set UBR_ADMIN_PASSCODE in Netlify env vars.
  ADMIN_PASSCODE: "",

  // Square Web Payments SDK config. The Application ID and Location ID are
  // public identifiers (safe to ship in this file, same trust level as
  // FUNCTIONS_BASE) — the secret access token lives server-side only, in the
  // Netlify SQUARE_ACCESS_TOKEN env var. Set SQUARE_ENV to "production" to go
  // live; see SETUP.md.
  SQUARE_APP_ID: "",
  SQUARE_LOCATION_ID: "",
  SQUARE_ENV: "sandbox"
};
