/* Returns availability for an item so the calendar can grey out fully-booked
 * days. `fullDays` are dates where every unit is already reserved. Reads from
 * Supabase with the server-only service key. */
const { inventoryFor } = require("./_inventory");

exports.handler = async (event) => {
  const itemId = (event.queryStringParameters || {}).itemId;
  if (!itemId) return json(200, { quantity: 1, fullDays: [] });

  try {
    const { quantity, bookedByDay } = await inventoryFor(itemId);
    const fullDays = Object.keys(bookedByDay).filter((iso) => bookedByDay[iso] >= quantity);
    return json(200, { quantity, fullDays });
  } catch (e) {
    return json(200, { quantity: 1, fullDays: [] });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj)
  };
}
