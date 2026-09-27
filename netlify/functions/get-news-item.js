/**
 * get-news-item.js
 * Public read of a single news entry (news:<id> Blob entry) — same pattern
 * as get-page-data.js (no auth, Cache-Tag'd for purging), but for the
 * `news.html?id=<id>` detail page (CLAUDE.md "News & Banner": "a single
 * reusable news.html?id=<id> detail page — not a modal, needs to be
 * shareable/linkable").
 *
 * Query params:
 *   id (required) — matches the `news:<id>` Blob key.
 */
const { newsStore } = require("./utils/stores");
const { newsKey } = require("./utils/blob-keys");
const { readHeaders } = require("./utils/cache");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const id = ((event.queryStringParameters && event.queryStringParameters.id) || "").trim();
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required 'id' query parameter." })
    };
  }

  try {
    const item = await newsStore().get(newsKey(id), { type: "json" });
    if (!item) {
      return { statusCode: 404, body: JSON.stringify({ error: "News item not found." }) };
    }

    return {
      statusCode: 200,
      headers: readHeaders(`news-${id}`),
      body: JSON.stringify({ news: item })
    };
  } catch (err) {
    console.error("get-news-item failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error reading news item." })
    };
  }
};
