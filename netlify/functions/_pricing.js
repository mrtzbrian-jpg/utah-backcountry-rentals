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
  "budget-pack-50l": 15, "ozark-trail-tent": 20, "ozark-sleeping-bag": 8,
  "foam-sleep-pad": 3, "sawyer-squeeze": 5, "headlamp-200l": 3,
  "brs-stove-kit": 8, "titanium-cookpot": 5, "trekking-poles": 6,
  "garmin-inreach": 30, "bear-canister": 5
};

// Pack-builder library: refundable deposit (USD) per component item.
const PACK_DEPOSITS = {
  "budget-pack-50l": 55, "ozark-trail-tent": 90, "ozark-sleeping-bag": 40,
  "foam-sleep-pad": 18, "sawyer-squeeze": 38, "headlamp-200l": 12,
  "brs-stove-kit": 25, "titanium-cookpot": 22, "trekking-poles": 25,
  "garmin-inreach": 100, "bear-canister": 85
};

const ADDONS = { batteries: 5, poncho: 3, "map-kit": 10 }; // add-ons carry no deposit

// Last-resort fallback used only if the database is unreachable.
const FALLBACK_PRICES = {
  "solo-weekend-bundle": 79, "couples-weekend-bundle": 145, "family-weekend-bundle": 195,
  "budget-pack-50l": 15, "kid-daypack": 8, "ozark-trail-tent": 20,
  "ozark-sleeping-bag": 8, "foam-sleep-pad": 3, "sawyer-squeeze": 5,
  "brs-stove-kit": 8, "titanium-cookpot": 5, "headlamp-200l": 3,
  "trekking-poles": 6, "garmin-inreach": 30, "bear-canister": 5,
  "winter-traction-kit": 35
};
const FALLBACK_DEPOSITS = {
  "solo-weekend-bundle": 250, "couples-weekend-bundle": 350, "family-weekend-bundle": 500,
  "budget-pack-50l": 55, "kid-daypack": 22, "ozark-trail-tent": 90,
  "ozark-sleeping-bag": 40, "foam-sleep-pad": 18, "sawyer-squeeze": 38,
  "brs-stove-kit": 25, "titanium-cookpot": 22, "headlamp-200l": 12,
  "trekking-poles": 25, "garmin-inreach": 100, "bear-canister": 85,
  "winter-traction-kit": 100
};

// Read a published product's price/deposit/quantity/per_day straight from the DB.
async function productRow(itemId) {
  const supabase = getSupabase();
  if (!supabase || !itemId) return null;
  const { data, error } = await supabase
    .from("products")
    .select("price,deposit,quantity,per_day")
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

/** Authoritative rental charge in cents (price × quantity, × days when per_day is set). */
async function quoteCents({ itemId, qty = 1, components = [], addons = [], days = 1 }) {
  const q = Math.max(1, parseInt(qty, 10) || 1);
  const d = Math.max(1, parseInt(days, 10) || 1);
  let dollars = 0;
  if (itemId === "custom") {
    dollars = await sumComponents("price", components, PACK_PRICES);
    (addons || []).forEach((id) => { dollars += ADDONS[id] || 0; });
  } else {
    const row = await productRow(itemId);
    dollars = row ? Number(row.price) || 0 : (FALLBACK_PRICES[itemId] || 0);
    if (row && row.per_day) dollars *= d;
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

// Safety ceiling on any single authorization hold. The real hold is the
// item/bundle's own deposit (set by the owner in admin); this just caps a
// runaway custom-pack total. Set well above the largest bundle hold ($800).
const MAX_HOLD_CENTS = 150000; // $1,500

/** The card-hold amount in cents = the deposit, capped at the safety ceiling. */
async function holdCents(args) {
  const dep = await depositCents(args);
  return Math.min(dep, MAX_HOLD_CENTS);
}

module.exports = { quoteCents, depositCents, holdCents, productRow, PACK_PRICES, ADDONS, MAX_HOLD_CENTS };
