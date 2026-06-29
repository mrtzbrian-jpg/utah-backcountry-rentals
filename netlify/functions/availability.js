/* Returns the date ranges that are already booked for an item, so the calendar
 * can grey them out. Reads from Supabase with the server-only service key. */
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  const itemId = (event.queryStringParameters || {}).itemId;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supaUrl || !supaKey) return json(200, { ranges: [] });

  try {
    const supabase = createClient(supaUrl, supaKey);
    let q = supabase
      .from("bookings")
      .select("item_id,start_date,end_date")
      .eq("status", "confirmed");
    if (itemId) q = q.eq("item_id", itemId);

    const { data, error } = await q;
    if (error) return json(200, { ranges: [] });
    const ranges = (data || [])
      .filter((r) => r.start_date && r.end_date)
      .map((r) => ({ start: r.start_date, end: r.end_date }));
    return json(200, { ranges });
  } catch (e) {
    return json(200, { ranges: [] });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj)
  };
}
