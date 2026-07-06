# Handoff — finish taking Take a Hike Rentals live (Square)

You (a browser-controlling assistant) are helping the owner finish launching their
hiking-gear **rental** web app. It's built and already live in **demo mode**. What
remains is wiring **Square** (rental payment + an online refundable deposit hold) +
**Supabase** (database) and switching to a proper deploy. Do the phases **in order**.

- **Live demo site:** https://superb-smakager-c8c3c6.netlify.app
- **Project files:** `/Users/WGU/Desktop/Btc/utah-backcountry-rentals` (also zipped on the Desktop)
- **Detailed reference (read it):** `SETUP.md` in that folder

## Ground rules (important)
- The **owner must personally type** all passwords, create the accounts, accept terms,
  and approve going to **live** payments. Do **not** enter those for them.
- **Secret keys** (Square Access Token, Supabase service key) are sensitive — have the
  **owner paste** those values. You handle navigation, the SQL, and the deploy clicks.
- Confirm with the owner before anything irreversible (publishing, deleting a site,
  switching Square to **production**).

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

## Phase 2 — Square app + keys  (start in Sandbox)
1. Owner signs in at **developer.squareup.com → Dashboard** and creates an application.
   Stay on the **Sandbox** tab.
2. Copy the **Sandbox Access Token** *(owner pastes this)* and **Application ID**.
3. Open **Locations** (Sandbox tab) and copy the default sandbox **Location ID**.

## Phase 3 — Supabase (database)
1. Owner creates a project at **supabase.com**.
2. **SQL Editor → New query** → paste all of `db/schema.sql` → **Run**.
3. **Project Settings → API** → copy the **Project URL** and the **`service_role`**
   secret key (long one, *not* anon). *(owner pastes the service key)*

## Phase 4 — Add the keys to Netlify + config.js
Netlify → your site → **Site configuration → Environment variables**. Add (exact names):

| Name | Value |
|---|---|
| `SQUARE_ACCESS_TOKEN` | the Sandbox Access Token |
| `SQUARE_LOCATION_ID` | the sandbox Location ID |
| `SQUARE_ENV` | `sandbox` |
| `SUPABASE_URL` | the Project URL |
| `SUPABASE_SERVICE_KEY` | the `service_role` key |

The Application ID and Location ID also need to be readable by the browser (they're
public, not secret), so paste them into `js/config.js`: `SQUARE_APP_ID`,
`SQUARE_LOCATION_ID`, `SQUARE_ENV: "sandbox"`.

Then **Deploys → Trigger deploy**.

## Phase 5 — Set numbers + turn it on  *(tiny code edits, do on github.com)*
- **Deposit amounts:** update the `DEPOSITS` map in **both** `js/data.js` **and**
  `netlify/functions/_pricing.js` (keep them identical). This is the online hold
  amount (capped at $250) placed on the customer's card at checkout.
- **`js/config.js`:** set `BACKEND_ENABLED: true`; set UBR_ADMIN_PASSCODE in Netlify env vars.
- **`index.html`:** change every `?v=49` to `?v=50`.
Commit → auto-deploys.

## Phase 6 — Test in Sandbox
Square's sandbox test card numbers are listed at **developer.squareup.com →
Documentation → Testing → Test values**. On the live site: book gear → accept waiver
→ enter name/phone/email → **Pay** with a sandbox test card. Verify you land on
**Gear Reserved!** and a row appears in **Supabase → bookings** with `status = confirmed`.

## Phase 7 — Go live for real
1. In the Square Developer Dashboard flip the app to **Production**, copy its
   Access Token, Application ID, and production Location ID.
2. In Netlify set `SQUARE_ACCESS_TOKEN` + `SQUARE_LOCATION_ID` to the production
   values and `SQUARE_ENV` = `production` → Trigger deploy. Update the same three
   values in `js/config.js`. Real payments now work.
3. Confirm the owner's Square account is fully verified and able to receive payouts.

---

## Not your job — needs CODE (tell the owner to ask “Claude Code”)
- Publishing the **“Manage Gear”** admin edits to all customers (move the catalog into a
  Supabase `products` table). Today the admin saves to the owner's own browser.
- Optional: SMS pickup reminders, automatic no-show hold capture, saved cards for
  repeat customers.

## Already done (for reference)
Front-end (all screens, booking, pack builder + kits, Manage-Gear admin) and the Square
backend (on-page card form → charge rental + place deposit hold, booking saved to
Supabase) are written and in the repo. This handoff is purely accounts + keys + deploy.
