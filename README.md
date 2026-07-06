# Take a Hike Rentals

A mobile-first web app for a small hiking & backcountry gear rental business in
Saratoga Springs, UT. Built from the "High Desert Modern" Stitch design system —
Deep Forest Green + Trail-Marker Orange, Montserrat/Inter type, rounded shapes,
and hand-drawn outdoorsy mountain art (no external image dependencies).

## Run it

The front-end is plain static files — no build step. Serve the folder with any
static server:

```bash
cd utah-backcountry-rentals
python3 -m http.server 4178
# open http://localhost:4178
```

## Going live (real payments)

The app ships in **demo mode** (`js/config.js` → `BACKEND_ENABLED: false`): the full
experience works but checkout shows a sample confirmation instead of charging a card.

To take real payments, deploy to **Netlify** and connect **Square** (the rental fee
+ a refundable online deposit hold) and **Supabase** (Postgres). The card form lives
directly on the site (Square Web Payments SDK) — no redirect to a payment provider.
The serverless backend already lives in `netlify/functions/`. Follow
**[SETUP.md](SETUP.md)** for the click-by-click steps, then flip `BACKEND_ENABLED`
to `true`.

Backend pieces:

| File | Purpose |
|------|---------|
| `netlify/functions/create-checkout.js` | Charges the rental fee + places the deposit hold (server-priced), writes booking to Supabase |
| `netlify/functions/get-booking.js` | Looks up a booking by order id (confirmation refresh) |
| `netlify/functions/availability.js` | Returns booked date ranges for an item |
| `netlify/functions/_square.js` | Square Payments REST helper (create / complete / cancel / refund) |
| `netlify/functions/_pricing.js` | Server-side price + deposit source of truth |
| `db/schema.sql` | Supabase `bookings` table |
| `netlify.toml` / `package.json` | Netlify config + function dependencies |

## What's inside

| File | Purpose |
|------|---------|
| `index.html` | Shell: Tailwind (CDN) config, fonts, app/modal/toast roots |
| `css/styles.css` | Animations, glass cards, calendar range styles, mountain helpers |
| `js/data.js` | Gear catalog, pack-builder library, add-ons, categories |
| `js/icons.js` | Reusable inline SVG art (hero scene, mountain bands, trail line, topo map) |
| `js/views.js` | Every screen rendered as an HTML template + shared chrome |
| `js/app.js` | State, formatters, hash router, event delegation, localStorage |

## Features

- **Home feed** — hero, category filter pills, gear cards with favorites
- **Book Dates** — interactive range calendar, live day-count + price total
- **Safety waiver** — modal that gates checkout until acknowledged
- **Booking confirmation** — order summary + topo-map pickup location
- **My Bookings** — Upcoming / Past tabs, "Rent Again" (seeded demo data)
- **Build Your Pack** — "Start with a kit" (The Lead Pack / The Follow Pack) to
  preload a set, then a full gear library with steppers, specs, pro-tips, live
  weight + price, and add-ons; hands the custom pack off to the date picker
- **Real gear catalog** — Osprey Rook 65, Naturehike Cloud Up 1, Kelty Cosmic 20°,
  Klymit Static V, BRS-3000T stove, Garmin inReach Mini 2, BearVault BV450, Anker
  10k power bank, Frontiersman bear spray (edit weights/prices in `js/data.js`)

## Adding gear photos

Each item shows an icon tile until you add a photo. Drop image files into
`images/` using the exact names listed in [`images/README.md`](images/README.md)
(`.jpg`, `.png`, or `.webp` all work) and they appear automatically — no code
changes. Live Amazon image links are intentionally not used: they break often and
run into Amazon's terms of use, so use your own product shots or licensed images.
- **How it Works** + **Profile** with live stats

Bookings and favorites persist in `localStorage` (keys prefixed `ubr:`).
Clear them by running `localStorage.clear()` in the console.
