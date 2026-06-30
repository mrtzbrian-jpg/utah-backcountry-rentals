# Handoff — finish taking Take a Hike Rentals live (PayPal)

You (a browser-controlling assistant) are helping the owner finish launching their
hiking-gear **rental** web app. It's built and already live in **demo mode**. What
remains is wiring **PayPal** (rental payment) + **Supabase** (database) and switching
to a proper deploy. The **security deposit is collected in person at pickup**, so
there is no online deposit/hold to set up. Do the phases **in order**.

- **Live demo site:** https://superb-smakager-c8c3c6.netlify.app
- **Project files:** `/Users/WGU/Desktop/Btc/utah-backcountry-rentals` (also zipped on the Desktop)
- **Detailed reference (read it):** `SETUP.md` in that folder

## Ground rules (important)
- The **owner must personally type** all passwords, create the accounts, accept terms,
  and approve going to **live** payments. Do **not** enter those for them.
- **Secret keys** (PayPal Secret, Supabase service key) are sensitive — have the
  **owner paste** those values. You handle navigation, the SQL, and the deploy clicks.
- Confirm with the owner before anything irreversible (publishing, deleting a site,
  switching PayPal to **live**).

---

## Phase 1 — Switch to a GitHub-connected deploy  *(required for payments)*
The current site was drag-and-dropped, which does **not** install the payment
functions' dependencies. A GitHub-connected deploy fixes that and auto-deploys future changes.

1. Owner signs in/up at **github.com**.
2. Create a **new empty repository** (no README), e.g. `utah-backcountry-rentals`.
3. Get the files in: on the repo page choose **“uploading an existing file”**, then have
   the owner drag the **contents of the `utah-backcountry-rentals` folder** in and **Commit**.
   *(Or the owner can ask “Claude Code” to `git push` it.)*
4. In **app.netlify.com → Add new site → Import an existing project → GitHub** →
   authorize → pick the repo. Build command: empty. Publish directory: `.` → Deploy.
   *(You can instead link the repo to the EXISTING site to keep the same URL:
   Site configuration → Build & deploy → Link repository.)*

## Phase 2 — PayPal app + keys  (start in Sandbox)
1. Owner signs in at **developer.paypal.com**. Keep the top toggle on **Sandbox**.
2. **Apps & Credentials → Create App** (Merchant). Open it and copy the **Client ID**
   and **Secret**. *(owner pastes the Secret)*

## Phase 3 — Supabase (database)
1. Owner creates a project at **supabase.com**.
2. **SQL Editor → New query** → paste all of `db/schema.sql` → **Run**.
3. **Project Settings → API** → copy the **Project URL** and the **`service_role`**
   secret key (long one, *not* anon). *(owner pastes the service key)*

## Phase 4 — Add the keys to Netlify
Netlify → your site → **Site configuration → Environment variables**. Add (exact names):

| Name | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | from the PayPal app |
| `PAYPAL_SECRET` | from the PayPal app |
| `PAYPAL_ENV` | `sandbox` |
| `SUPABASE_URL` | the Project URL |
| `SUPABASE_SERVICE_KEY` | the `service_role` key |

Then **Deploys → Trigger deploy**.

## Phase 5 — Set numbers + turn it on  *(tiny code edits, do on github.com)*
- **Deposit amounts:** update the `DEPOSITS` map in **both** `js/data.js` **and**
  `netlify/functions/_pricing.js` (keep them identical). These are the deposits the
  owner collects at pickup.
- **`js/config.js`:** set `BACKEND_ENABLED: true`; set UBR_ADMIN_PASSCODE in Netlify env vars.
- **`index.html`:** change every `?v=8` to `?v=9`.
Commit → auto-deploys.

## Phase 6 — Test in Sandbox
PayPal → **developer.paypal.com → Testing Tools → Sandbox Accounts** gives a test
**buyer** login. On the live site: book gear → accept waiver → **Proceed to Checkout**
→ log in at PayPal with the sandbox buyer → approve. Verify you return to **Gear
Reserved!** and a row appears in **Supabase → bookings** (with `deposit_cents`).

## Phase 7 — Go live for real
1. In PayPal Developer switch to **Live**, create a **Live** app, copy its Client ID + Secret.
2. In Netlify set `PAYPAL_CLIENT_ID` + `PAYPAL_SECRET` to the live values and
   `PAYPAL_ENV` = `live` → Trigger deploy. Real payments now work.
3. Confirm the owner's PayPal **business** account can receive funds (verified email + bank).

---

## Not your job — needs CODE (tell the owner to ask “Claude Code”)
- Publishing the **“Manage Gear”** admin edits to all customers (move the catalog into a
  Supabase `products` table). Today the admin saves to the owner's own browser.
- Optional: customer confirmation emails; grey out booked dates; an automatic online
  deposit hold via PayPal vaulting.

## Already done (for reference)
Front-end (all screens, booking, pack builder + kits, Manage-Gear admin) and the PayPal
backend (create order → approve → capture, booking saved to Supabase) are written and in
the repo. This handoff is purely accounts + keys + deploy.
