/* Server-side source of truth for prices (USD per day).
 *
 * IMPORTANT: never trust an amount sent from the browser — a user could edit it.
 * We recompute every charge here from the item id + number of days. If you change
 * a price in js/data.js, change it here too (keep the two in sync).
 */
const PER_DAY = {
  // Home-feed gear
  "master-safety-kit": 22,
  "garmin-inreach": 12,
  "osprey-aether-65": 14,
  "bearvault-bv500": 5,
  "nemo-disco-15": 15,
  "msr-hubba-tent": 10,
  "winter-traction-kit": 14,
  "water-filter": 6,
  // Pack-builder library
  "osprey-rook-65": 8,
  "naturehike-cloudup-1": 10,
  "kelty-cosmic-20": 8,
  "klymit-static-v": 5,
  "brs-3000t": 3,
  "bearvault-bv450": 5,
  "anker-10k": 4,
  "bear-spray": 4
};

const ADDONS = { batteries: 5, poncho: 3, "map-kit": 10 };

// Refundable security-deposit (USD) by item id. MUST match js/data.js DEPOSITS.
const DEPOSITS = {
  "master-safety-kit": 850, "garmin-inreach": 400, "osprey-aether-65": 300,
  "bearvault-bv500": 90, "nemo-disco-15": 200, "msr-hubba-tent": 450,
  "winter-traction-kit": 350, "water-filter": 50,
  "osprey-rook-65": 250, "naturehike-cloudup-1": 200, "kelty-cosmic-20": 180,
  "klymit-static-v": 90, "brs-3000t": 50, "bearvault-bv450": 80,
  "anker-10k": 40, "bear-spray": 50
};

/** Refundable deposit (cents) we'll authorize ~48h before pickup. */
function depositCents({ itemId, components = [] }) {
  let dollars = 0;
  if (itemId === "custom") {
    (components || []).forEach((id) => { dollars += DEPOSITS[id] || 0; });
  } else {
    dollars = DEPOSITS[itemId] || 0;
  }
  return Math.round(dollars * 100);
}

/** Returns the authoritative charge in cents for a booking request. */
function quoteCents({ itemId, days, components = [], addons = [] }) {
  const d = Math.max(1, parseInt(days, 10) || 1);
  let perDay = 0;
  if (itemId === "custom") {
    (components || []).forEach((id) => { perDay += PER_DAY[id] || 0; });
    (addons || []).forEach((id) => { perDay += ADDONS[id] || 0; });
  } else {
    perDay = PER_DAY[itemId] || 0;
  }
  return Math.round(perDay * d * 100);
}

module.exports = { quoteCents, depositCents, PER_DAY, ADDONS, DEPOSITS };
