/* Server-side source of truth for prices (flat USD per item) and deposits.
 *
 * IMPORTANT: never trust an amount sent from the browser — a user could edit it.
 * We recompute every charge here.
 *
 * Catalog items (everything the owner manages in the "Manage Gear" admin) are
 * priced from the Supabase `products` table — the same data the storefront
 * shows — so prices always stay in sync with what the owner published.
 *
 * The pack-builder library is fixed gear that isn't in the products table, so
 * those prices live here. ADDONS likewise.
 */
const { getSupabase } = require("./_supabase");

// Pack-builder library: flat rental price (USD) per component item.
const PACK_PRICES = {
  "osprey-rook-65": 40, "naturehike-cloudup-1": 30, "kelty-cosmic-20": 25,
  "klymit-static-v": 15, "brs-3000t": 10, "garmin-inreach": 30,
  "bearvault-bv450": 15, "anker-10k": 12, "bear-spray": 12
};

// Pack-builder library: refundable deposit (USD) per component item.
const PACK_DEPOSITS = {
  "osprey-rook-65": 80, "naturehike-cloudup-1": 60, "kelty-cosmic-20": 50,
  "klymit-static-v": 30, "brs-3000t": 20, "garmin-inreach": 100,
  "bearvault-bv450": 25, "anker-10k": 15, "bear-spray": 15
};

const ADDONS = { batteries: 5, poncho: 3, "map-kit": 10 }; // add-ons carry no deposit

// Last-resort fallback for the original built-in catalog ids, used only if the
// database is unreachable. The live catalog normally comes from Supabase.
const FALLBACK_PRICES = {
  "master-safety-kit": 65, "garmin-inreach": 30, "osprey-aether-65": 40,
  "bearvault-bv500": 12, "nemo-disco-15": 25, "msr-hubba-tent": 30,
  "winter-traction-kit": 35, "water-filter": 10
};
const FALLBACK_DEPOSITS = {
  "master-safety-kit": 250, "garmin-inreach": 100, "osprey-aether-65": 80,
  "bearvault-bv500": 30, "nemo-disco-15": 60, "msr-hubba-tent": 120,
  "winter-traction-kit": 100, "water-filter": 20
};

// Read a published product's price/deposit/quantity straight from the DB.
async function productRow(itemId) {
  const supabase = getSupabase();
  if (!supabase || !itemId) return null;
  const { data, error } = await supabase
    .from("products")
    .select("price,deposit,quantity")
    .eq("id", itemId)
    .single();
  if (error || !data) return null;
  return data;
}

// Sum a field ("price" or "deposit") over custom-bundle component ids, reading
// each component's value from the products table (catalog is the source of truth).
async function sumComponents(field, components, packFallback) {
  const counts = {};
  (components || []).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
  let dollars = 0;
  for (const id of Object.keys(counts)) {
    const row = await productRow(id);
    const val = row ? Number(row[field]) || 0 : (packFallback[id] || 0);
    dollars += val * counts[id];
  }
  return dollars;
}

/** Authoritative rental charge in cents (price × quantity). */
async function quoteCents({ itemId, qty = 1, components = [], addons = [] }) {
  const q = Math.max(1, parseInt(qty, 10) || 1);
  let dollars = 0;
  if (itemId === "custom") {
    dollars = await sumComponents("price", components, PACK_PRICES);
    (addons || []).forEach((id) => { dollars += ADDONS[id] || 0; });
  } else {
    const row = await productRow(itemId);
    dollars = row ? Number(row.price) || 0 : (FALLBACK_PRICES[itemId] || 0);
  }
  return Math.round(dollars * q * 100);
}

/** Refundable deposit in cents (deposit × quantity). */
async function depositCents({ itemId, qty = 1, components = [] }) {
  const q = Math.max(1, parseInt(qty, 10) || 1);
  let dollars = 0;
  if (itemId === "custom") {
    dollars = await sumComponents("deposit", components, PACK_DEPOSITS);
  } else {
    const row = await productRow(itemId);
    dollars = row ? Number(row.deposit) || 0 : (FALLBACK_DEPOSITS[itemId] || 0);
  }
  return Math.round(dollars * q * 100);
}

// Maximum authorization hold we ever place on a card (business rule: $250).
const MAX_HOLD_CENTS = 25000;

/** The card-hold amount in cents = the deposit, capped at $250 total. */
async function holdCents(args) {
  const dep = await depositCents(args);
  return Math.min(dep, MAX_HOLD_CENTS);
}

module.exports = { quoteCents, depositCents, holdCents, productRow, PACK_PRICES, ADDONS, MAX_HOLD_CENTS };
