/**
 * delete-news.js
 * Admin-only delete for a single news entry (news:<id>). Same auth-first
 * pattern as save-news.js: deletes the Blob, purges the same three
 * Cache-Tags a save would (its own detail page, the homepage's embedded
 * newest-6, and the full news-list feed — a delete changes all three the
 * same way an edit does), and removes the entry from the shared
 * search-index Blob via utils/search-index.js's removeSearchIndexEntry
 * (already existed, unused until this Function called it). No Sheets
 * backup step — that utility only records saved content, not deletions.
 */
const { newsStore } = require("./utils/stores");
const { requireEditor } = require("./utils/auth");
const { newsKey } = require("./utils/blob-keys");
const { writeConsistentHeaders } = require("./utils/cache");
const { removeSearchIndexEntry } = require("./utils/search-index");
const { purgeCacheTags } = require("./utils/purge-cache");

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

  const { id } = payload;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: "'id' is required." }) };
  }

  const key = newsKey(id);

  try {
    await newsStore().delete(key);
  } catch (err) {
    console.error("delete-news: Blob delete failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to delete news entry." }) };
  }

  try {
    await purgeCacheTags([`news-${id}`, "page-homepage", "news-list"]);
  } catch (err) {
    // Not fatal — the delete itself already succeeded; a visitor's cached
    // copy just won't reflect it until the cache naturally expires.
    console.error("delete-news: cache purge failed:", err);
  }

  try {
    await removeSearchIndexEntry(key);
  } catch (err) {
    console.error("delete-news: search-index removal failed:", err);
  }

  return {
    statusCode: 200,
    headers: writeConsistentHeaders(),
    body: JSON.stringify({ ok: true })
  };
};
