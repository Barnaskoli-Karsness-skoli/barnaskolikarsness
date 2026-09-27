/**
 * upload-image.js
 * Admin-only image upload. Expects an already client-compressed WebP
 * (CLAUDE.md Images: canvas-resized to ~1920px max width, 300–500KB
 * target, 1MB hard ceiling) as base64 in the request body. Writes it under
 * a unique content-addressed key — same bytes always hash to the same
 * key, so a re-upload of identical content never creates a duplicate, and
 * any change in content naturally gets a new key — which is what lets
 * get-image.js serve it back with a far-future immutable Cache-Control
 * safely.
 *
 * Deliberately does NOT accept or store alt text: CLAUDE.md is explicit
 * that required alt text is "stored as regular content (not Blob
 * metadata, which is capped at 2KB)" — it belongs in the image-row
 * block's data inside the page's Editor.js JSON, written by save-page.js
 * when the page itself saves, not here.
 */
const crypto = require("crypto");
const { imagesStore } = require("./utils/stores");
const { requireEditor } = require("./utils/auth");

const MAX_BYTES = 1024 * 1024; // 1MB hard ceiling, per CLAUDE.md Images

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const auth = requireEditor(context);
  if (!auth.authorized) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.reason }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }

  const { base64 } = payload;
  if (!base64) {
    return { statusCode: 400, body: JSON.stringify({ error: "'base64' image data is required." }) };
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_BYTES) {
    return { statusCode: 413, body: JSON.stringify({ error: "Image exceeds the 1MB hard ceiling." }) };
  }

  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const key = `image:${hash}.webp`;

  try {
    await imagesStore().set(key, buffer, {
      metadata: {
        uploadedBy: auth.user.email,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("upload-image: Blob write failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to store image." }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    body: JSON.stringify({
      ok: true,
      key,
      url: `/.netlify/functions/get-image?key=${encodeURIComponent(key)}`
    })
  };
};
