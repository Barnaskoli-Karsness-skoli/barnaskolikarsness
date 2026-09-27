/**
 * get-image.js
 * Serves a single uploaded image back by its content-addressed key
 * (written by upload-image.js), with a far-future immutable
 * Cache-Control — safe because the key itself changes whenever the
 * image's content does, so a cached copy under a given key can never
 * go stale. Public, no auth — images are meant to appear on public pages.
 */
const { imagesStore } = require("./utils/stores");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const key = ((event.queryStringParameters && event.queryStringParameters.key) || "").trim();
  if (!key || !key.startsWith("image:")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid 'key' query parameter." }) };
  }

  try {
    const buffer = await imagesStore().get(key, { type: "arrayBuffer" });
    if (!buffer) {
      return { statusCode: 404, body: JSON.stringify({ error: "Image not found." }) };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable"
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error("get-image failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error reading image." }) };
  }
};
