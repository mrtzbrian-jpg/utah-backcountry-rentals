# Going live — setup guide (Square)

This turns the app from a demo into a real store. At checkout, the customer's
card is charged the **rental fee immediately**, and a separate **refundable
deposit hold** (up to $250) is placed on the same card — no online-only
signup or PayPal-style redirect, the card form lives right on your site. The
hold is released or charged from the admin dashboard when the gear comes
back. Plan ~30 minutes. You'll create/confirm three free accounts
(**Netlify**, **Square**, **Supabase**) and paste a few keys into Netlify.

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

## Step 2 — Square app + keys
1. Go to **developer.squareup.com → Dashboard** and create an application
   (any name). Stay on the **Sandbox** tab for now.
2. On the app's Sandbox tab, copy:
   - **Sandbox Access Token**
   - **Application ID**
3. Click into **Locations** (still under Sandbox) and copy the **Location ID**
   of the default sandbox location.
4. Keep these for Step 4.

## Step 3 — Supabase (database)
1. Create a project at **supabase.com**.
2. **SQL Editor → New query** → paste all of [`db/schema.sql`](db/schema.sql) → **Run**.
3. **Project Settings → API** → copy the **Project URL** and the **`service_role`**
   secret key (the long one, *not* the anon key).

## Step 4 — Add keys to Netlify + config.js
Netlify → your site → **Site configuration → Environment variables**. Add (exact names):

| Variable name | Value |
|---|---|
| `SQUARE_ACCESS_TOKEN` | your Square Sandbox Access Token |
| `SQUARE_LOCATION_ID` | your Square sandbox Location ID |
| `SQUARE_ENV` | `sandbox` (change to `production` in Step 7) |
| `SUPABASE_URL` | your Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | your Supabase `service_role` key |

Then, since the Application ID and Location ID also have to be readable by
the browser (they're not secret — same trust level as any public API key),
paste them directly into [`js/config.js`](js/config.js):

```js
SQUARE_APP_ID: "sandbox-sq0idb-...",
SQUARE_LOCATION_ID: "...",
SQUARE_ENV: "sandbox",
```

Commit, then **Deploys → Trigger deploy → Deploy site**.

## Step 5 — Set your numbers + turn it on (tiny edits)
- **Deposit amounts:** edit the `DEPOSITS` map in **both** [`js/data.js`](js/data.js)
  and [`netlify/functions/_pricing.js`](netlify/functions/_pricing.js) to your real
  values, and keep them in sync. (This is the online hold amount, capped at $250,
  shown to the customer at checkout and released/charged at return.)
- **Prices:** the rental price per day lives in `js/data.js` (display) and
  `_pricing.js` (the actual charge) — keep those in sync too.
- [`js/config.js`](js/config.js): set `BACKEND_ENABLED: true`. Admin passcode is set via `UBR_ADMIN_PASSCODE` in Netlify env vars — never in code.
- [`index.html`](index.html): change every `?v=49` to `?v=50` so browsers load the new files.
Commit → it auto-deploys.

## Step 6 — Test (Square sandbox)
1. Square's published sandbox test cards are listed at
   **developer.squareup.com → Documentation → Testing → Test values** — use
   the standard test Visa number for a successful charge, and the documented
   decline test card to check the failure path.
2. On your live site: book gear → accept the waiver → enter name/phone/email →
   **Pay** with a sandbox test card → you should land on **Gear Reserved!**.
3. A row should appear in **Supabase → Table editor → bookings** with
   `status = confirmed`, `capture_id` set (the rental payment), and
   `authorization_id` set if there's a deposit hold.
4. In the admin dashboard, try **Release hold** (cancels the hold) and
   **Capture hold** with a partial amount (captures the hold, then refunds
   the unused portion) against a sandbox booking.

## Step 7 — Go live for real
1. In the Square Developer Dashboard, flip the same application to
   **Production** and copy the **Production Access Token**, **Application ID**,
   and production **Location ID**.
2. In Netlify, update `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` to the
   production values and set `SQUARE_ENV` = `production`. Update
   `SQUARE_APP_ID`/`SQUARE_LOCATION_ID`/`SQUARE_ENV` in `js/config.js` to match.
   Trigger a deploy. Real payments now work.
3. Make sure your Square account is fully verified and able to receive payouts.

---

## Where things live afterward
- **Bookings + hold status:** Supabase → Table editor → `bookings`.
- **Payments & refunds:** your Square Dashboard → Payments.
- **Change prices/deposits:** edit both `js/data.js` and `netlify/functions/_pricing.js`.

## Honest notes
- Square's standard rate is roughly **2.9% + 30¢** per online transaction (check
  your current rate).
- The deposit hold is a delayed-capture Square payment, not a true PayPal-style
  split authorization — Square auto-cancels an uncaptured hold after several
  days if it's never released or captured, so release/capture holds promptly
  when gear comes back.
- Possible next additions: SMS pickup reminders, an automatic no-show hold
  capture, or saved cards for repeat customers via Square's Customers API.
  Ask and I'll build them.
