/* Netlify scheduled function — runs daily at 8 AM UTC.
 * Sends return-day reminder emails to customers whose gear is due back today.
 * Configure in netlify.toml with: schedule = "0 8 * * *"
 *
 * Also runs on-demand via POST (admin-triggered) for testing:
 *   curl -X POST /.netlify/functions/send-reminders -H "x-admin-passcode: ..." */
const { getSupabase } = require("./_supabase");
const { notifyReturnReminder } = require("./_email");
const { checkAdmin } = require("./_auth");

exports.handler = async (event) => {
  // Allow manual trigger from admin (POST with passcode) or scheduled run
  if (event.httpMethod === "POST" && !checkAdmin(event)) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const supabase = getSupabase();
  if (!supabase) return { statusCode: 503, body: "Database not configured" };

  const today = new Date().toISOString().slice(0, 10);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("end_date", today)
    .not("status", "in", '("returned","cancelled")')
    .not("customer_email", "is", null);

  if (error) return { statusCode: 500, body: error.message };

  const results = [];
  for (const b of bookings || []) {
    try {
      const r = await notifyReturnReminder({ ...b, email: b.customer_email, renterName: b.renter_name });
      results.push({ id: b.id, ...r });
    } catch (e) {
      results.push({ id: b.id, error: e.message });
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sent: results.length, results })
  };
};
