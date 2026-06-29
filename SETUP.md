# Going live — setup guide (PayPal)

This turns the app from a demo into a real store that takes the **rental fee online
via PayPal** and records bookings. The **security deposit is collected in person at
pickup** (card pre-authorization on a reader or card-on-file), so there's no online
hold to configure. Plan ~30 minutes. You'll create/confirm three free accounts
(**Netlify**, **PayPal**, **Supabase**) and paste a few keys into Netlify.

> Claude wrote all the code. The steps below are the parts only **you** can do —
> they involve logging into your own accounts. Never share these keys with anyone.

---

## Step 1 — Deploy with functions enabled (GitHub → Netlify)
The payment functions need their dependencies installed, which a drag-and-drop
deploy can't do. Use a GitHub-connected deploy (it also auto-deploys every change).

1. Put this project in a GitHub repo (web upload or `git push`).
2. In **app.netlify.com → Add new site → Import an existing project → GitHub**, pick
   the repo. Build command: empty. Publish directory: `.`. Deploy.

*(See `HANDOFF.md` for the click-by-click version of this step.)*

## Step 2 — PayPal app + keys
1. Go to **developer.paypal.com → Dashboard → Apps & Credentials**. Stay on
   **Sandbox** for now (toggle at top).
2. **Create App** (type: Merchant). Open it and copy:
   - **Client ID**
   - **Secret** (click "Show")
3. Keep these for Step 4.

## Step 3 — Supabase (database)
1. Create a project at **supabase.com**.
2. **SQL Editor → New query** → paste all of [`db/schema.sql`](db/schema.sql) → **Run**.
3. **Project Settings → API** → copy the **Project URL** and the **`service_role`**
   secret key (the long one, *not* the anon key).

## Step 4 — Add keys to Netlify
Netlify → your site → **Site configuration → Environment variables**. Add (exact names):

| Variable name | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | from your PayPal app |
| `PAYPAL_SECRET` | from your PayPal app |
| `PAYPAL_ENV` | `sandbox` (change to `live` in Step 7) |
| `SUPABASE_URL` | your Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | your Supabase `service_role` key |

Then **Deploys → Trigger deploy → Deploy site**.

## Step 5 — Set your numbers + turn it on (tiny edits)
- **Deposit amounts:** edit the `DEPOSITS` map in **both** [`js/data.js`](js/data.js)
  and [`netlify/functions/_pricing.js`](netlify/functions/_pricing.js) to your real
  values, and keep them in sync. (These are the deposits you'll collect at pickup;
  the amount is shown to the customer and saved with each booking.)
- **Prices:** the rental price per day lives in `js/data.js` (display) and
  `_pricing.js` (the actual charge) — keep those in sync too.
- [`js/config.js`](js/config.js): set `BACKEND_ENABLED: true`, and change
  `ADMIN_PASSCODE` from `"trailhead"`.
- [`index.html`](index.html): change every `?v=8` to `?v=9` so browsers load the new files.
Commit → it auto-deploys.

## Step 6 — Test (PayPal sandbox)
1. PayPal gives you test buyer accounts at **developer.paypal.com → Testing Tools →
   Sandbox Accounts** (use the "personal" account's email/password to log in at checkout).
2. On your live site: book gear → accept the waiver → **Proceed to Checkout** →
   you're sent to PayPal → log in with the sandbox buyer → approve.
3. You should land back on **Gear Reserved!**, and a row should appear in
   **Supabase → Table editor → bookings** (with `deposit_cents` = the deposit to
   collect at pickup).

## Step 7 — Go live for real
1. In PayPal Developer, switch to **Live**, create a **Live** app, copy its Client ID
   + Secret.
2. In Netlify, update `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET` to the live values and set
   `PAYPAL_ENV` = `live`. Trigger a deploy. Real payments now work.
3. Make sure your PayPal business account is able to receive payments (confirm email,
   link a bank).

---

## Where things live afterward
- **Bookings + the deposit to collect at pickup:** Supabase → Table editor → `bookings`.
- **Payments & refunds:** your PayPal account dashboard.
- **Change prices/deposits:** edit both `js/data.js` and `netlify/functions/_pricing.js`.

## Honest notes
- PayPal fees are roughly **3.49% + 49¢** per transaction (check your current rate).
- **Deposits are handled in person at pickup** — along with ID check and the signed
  liability waiver. The in-app checkbox is an acknowledgement, not your legal rental
  agreement.
- Possible next additions: customer confirmation emails, an in-app admin booking list,
  greying out already-booked dates on the calendar, or (later) an automatic online
  deposit hold via PayPal vaulting. Ask and I'll build them.
