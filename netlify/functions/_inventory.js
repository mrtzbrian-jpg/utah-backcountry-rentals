/* Inventory helpers shared by availability.js (calendar greying) and
 * create-checkout.js (overbooking guard). A rental "occupies" every day from
 * pickup through return inclusive. An item with quantity N can be booked N times
 * on the same day; the N+1th booking for an overlapping day is rejected. */
const { getSupabase } = require("./_supabase");

// Inclusive list of ISO days from start..end (end defaults to start).
function eachDay(start, end) {
  const days = [];
  if (!start) return days;
  const d = new Date(start + "T00:00:00Z");
  const last = new Date((end || start) + "T00:00:00Z");
  let guard = 0;
  while (d <= last && guard++ < 400) {
    days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

// Returns { quantity, bookedByDay: { iso: unitsBooked } } for one item.
async function inventoryFor(itemId) {
  const supabase = getSupabase();
  if (!supabase || !itemId) return { quantity: 1, bookedByDay: {} };

  const { data: prod } = await supabase
    .from("products").select("quantity").eq("id", itemId).single();
  const quantity = prod && prod.quantity != null ? Math.max(0, Number(prod.quantity)) : 1;

  const { data: rows } = await supabase
    .from("bookings")
    .select("start_date,end_date,qty")
    .eq("item_id", itemId)
    .eq("status", "confirmed");

  const bookedByDay = {};
  (rows || []).forEach((r) => {
    if (!r.start_date) return;
    eachDay(r.start_date, r.end_date || r.start_date).forEach((iso) => {
      bookedByDay[iso] = (bookedByDay[iso] || 0) + (Number(r.qty) || 1);
    });
  });
  return { quantity, bookedByDay };
}

// True if `qty` units of itemId are free across the whole [start,end] range.
async function rangeAvailable(itemId, start, end, qty) {
  if (!start || itemId === "custom") return true; // custom packs aren't tracked per-unit
  const { quantity, bookedByDay } = await inventoryFor(itemId);
  const need = Math.max(1, parseInt(qty, 10) || 1);
  return eachDay(start, end || start).every((iso) => (bookedByDay[iso] || 0) + need <= quantity);
}

module.exports = { inventoryFor, rangeAvailable, eachDay };
