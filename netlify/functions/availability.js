/* Returns availability for an item so the calendar can grey out fully-booked
 * days. `fullDays` are dates where every unit is already reserved, plus any
 * admin-blocked dates. Reads from Supabase with the server-only service key. */
const { inventoryFor } = require("./_inventory");
const { getSupabase } = require("./_supabase");

exports.handler = async (event) => {
  const itemId = (event.queryStringParameters || {}).itemId;

  // Load blocked dates from site_settings in parallel with inventory
  const supabase = getSupabase();
  const [inventoryResult, settingsResult] = await Promise.all([
    itemId ? inventoryFor(itemId).catch(() => ({ quantity: 1, bookedByDay: {} })) : Promise.resolve({ quantity: 1, bookedByDay: {} }),
    supabase ? supabase.from("site_settings").select("value").eq("key", "blocked_dates").maybeSingle().catch(() => null) : Promise.resolve(null)
  ]);

  let blockedDates = [];
  try {
    if (settingsResult && settingsResult.data && settingsResult.data.value) {
      blockedDates = JSON.parse(settingsResult.data.value);
    }
  } catch (_) {}

  const { quantity, bookedByDay } = inventoryResult;
  const fullDays = [...new Set([
    ...Object.keys(bookedByDay).filter(iso => bookedByDay[iso] >= quantity),
    ...blockedDates
  ])];

  return json(200, { quantity, fullDays, blockedDates });
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj)
  };
}
