/* Server-side source of truth for prices (flat USD per item) and deposits.
 *
 * IMPORTANT: never trust an amount sent from the browser — a user could edit it.
 * We recompute every charge here from the item id(s) and quantity. If you change a
 * price/deposit in js/data.js, change it here too (keep the two maps in sync).
 * (When the catalog moves into the database, this file is replaced by a DB lookup.)
 */

// Flat rental price per item (what the customer pays online). A pack's total is
// the sum of its items. Quantity multiplies the whole thing.
const PRICES = {
  // Home-feed gear
  "master-safety-kit": 65,
  "garmin-inreach": 30,
  "osprey-aether-65": 40,
  "bearvault-bv500": 12,
  "nemo-disco-15": 25,
  "msr-hubba-tent": 30,
  "winter-traction-kit": 35,
  "water-filter": 10,
  // Pack-builder library
  "osprey-rook-65": 40,
  "naturehike-cloudup-1": 30,
  "kelty-cosmic-20": 25,
  "klymit-static-v": 15,
  "brs-3000t": 10,
  "bearvault-bv450": 15,
  "anker-10k": 12,
  "bear-spray": 12
};

const ADDONS = { batteries: 5, poncho: 3, "map-kit": 10 };

// Refundable security deposit (USD) = YOUR replacement cost for the gear, held at
// pickup. MUST match js/data.js DEPOSITS.
const DEPOSITS = {
  "master-safety-kit": 850, "garmin-inreach": 400, "osprey-aether-65": 300,
  "bearvault-bv500": 90, "nemo-disco-15": 200, "msr-hubba-tent": 450,
  "winter-traction-kit": 350, "water-filter": 50,
  "osprey-rook-65": 250, "naturehike-cloudup-1": 200, "kelty-cosmic-20": 180,
  "klymit-static-v": 90, "brs-3000t": 50, "bearvault-bv450": 80,
  "anker-10k": 40, "bear-spray": 50
};

function sumOver(map, { itemId, components = [], addons = [] }) {
  let dollars = 0;
  if (itemId === "custom") {
    (components || []).forEach((id) => { dollars += map[id] || 0; });
    (addons || []).forEach((id) => { dollars += ADDONS[id] || 0; }); // add-ons have no deposit
  } else {
    dollars = map[itemId] || 0;
  }
  return dollars;
}

/** Authoritative rental charge in cents (price × quantity). */
function quoteCents({ itemId, qty = 1, components = [], addons = [] }) {
  const q = Math.max(1, parseInt(qty, 10) || 1);
  return Math.round(sumOver(PRICES, { itemId, components, addons }) * q * 100);
}

/** Refundable deposit in cents to collect at pickup (deposit × quantity). */
function depositCents({ itemId, qty = 1, components = [] }) {
  const q = Math.max(1, parseInt(qty, 10) || 1);
  // add-ons excluded from deposit (sumOver only adds DEPOSITS for components)
  return Math.round(sumOver(DEPOSITS, { itemId, components, addons: [] }) * q * 100);
}

module.exports = { quoteCents, depositCents, PRICES, ADDONS, DEPOSITS };
