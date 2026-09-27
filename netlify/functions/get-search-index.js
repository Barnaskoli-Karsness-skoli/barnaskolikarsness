/**
 * get-search-index.js
 * Public read of the shared search-index Blob entry (CLAUDE.md Search:
 * "one shared search index... fetched lazily only when the visitor opens
 * the search box"). Same no-auth pattern as get-page-data.js. Tagged
 * `search-index` so save-page.js/save-news.js can purge exactly this
 * cached response the moment either one updates the index (see
 * utils/search-index.js) — no auth required, this is a public read path.
 */
const { settingsStore } = require("./utils/stores");
const { SEARCH_INDEX_KEY } = require("./utils/blob-keys");
const { readHeaders } = require("./utils/cache");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const index = await settingsStore().get(SEARCH_INDEX_KEY, { type: "json" });

    return {
      statusCode: 200,
      headers: readHeaders("search-index"),
      body: JSON.stringify(index || { entries: [] })
    };
  } catch (err) {
    console.error("get-search-index failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error reading search index." })
    };
  }
};
