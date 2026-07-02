/* Uploads a base64 data-URL image to Supabase Storage (gear-photos bucket).
 * Returns the public CDN URL so the admin can store it on the product record.
 *
 * Prereq: create a PUBLIC bucket named "gear-photos" in Supabase Storage. */
const { getSupabase } = require("./_supabase");
const { checkAdmin } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid JSON" }); }

  const { dataUrl, name } = body;
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return json(400, { error: "Expected a data:image/ URL" });

  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return json(400, { error: "Malformed data URL" });
  const mimeType = match[1];
  const ext = mimeType === "image/png" ? "png" : "jpg";
  const buffer = Buffer.from(match[2], "base64");

  const supabase = getSupabase();
  if (!supabase) return json(503, { error: "Database not configured" });

  const safeName = (name || "photo").replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 40);
  const fileName = `gear-${Date.now()}-${safeName}.${ext}`;

  const { data, error } = await supabase.storage
    .from("gear-photos")
    .upload(fileName, buffer, { contentType: mimeType, upsert: false });

  if (error) return json(500, { error: error.message });

  const { data: urlData } = supabase.storage.from("gear-photos").getPublicUrl(data.path);

  return json(200, { url: urlData.publicUrl, path: data.path });
};

function json(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}
