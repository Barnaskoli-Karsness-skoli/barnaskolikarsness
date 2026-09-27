/**
 * save-news.js
 * Admin-only write for a single news entry (news:<id>). Same auth-first,
 * cache-purge, search-index, and Sheets-backup pattern as save-page.js —
 * see that file for the reasoning behind each step.
 */
const { newsStore } = require("./utils/stores");
const { requireEditor } = require("./utils/auth");
const { newsKey } = require("./utils/blob-keys");
const { writeConsistentHeaders } = require("./utils/cache");
const { contentToPlainText, contentToExcerpt } = require("./utils/content-to-text");
const { updateSearchIndexEntry } = require("./utils/search-index");
const { writeSheetsBackup } = require("./utils/sheets-backup");
const { sendBackupFailureAlert } = require("./utils/email-alert");
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

  const { id, title, date, content, coverImage } = payload;
  if (!id || !title || !date || !content) {
    return { statusCode: 400, body: JSON.stringify({ error: "'id', 'title', 'date' and 'content' are all required." }) };
  }

  // coverImage is optional (unset means no cover), but if present it must
  // be a real {url, alt} pair — required alt text is enforced client-side
  // (admin/js/admin.js) same as every other image in this project, but
  // it's re-checked here too rather than trusted blindly from the client.
  if (coverImage != null) {
    if (typeof coverImage.url !== "string" || !coverImage.url || typeof coverImage.alt !== "string" || !coverImage.alt.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "coverImage must include both a non-empty 'url' and 'alt'." }) };
    }
  }

  const key = newsKey(id);
  const record = {
    id,
    title,
    date,
    content,
    coverImage: coverImage || null,
    updatedAt: new Date().toISOString(),
    updatedBy: auth.user.email
  };

  try {
    await newsStore().setJSON(key, record);
  } catch (err) {
    console.error("save-news: Blob write failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to save news entry." }) };
  }

  try {
    // Three cached responses embed this item: its own get-news-item.js
    // read (news-<id>), the homepage's combined read, whose 6-newest slice
    // can include it (page-homepage), and list-news.js's full list
    // (news-list) — adding/editing an item always changes that list.
    await purgeCacheTags([`news-${id}`, "page-homepage", "news-list"]);
  } catch (err) {
    console.error("save-news: cache purge failed:", err);
  }

  try {
    await updateSearchIndexEntry({
      id: key,
      type: "news",
      title,
      url: `/news.html?id=${encodeURIComponent(id)}`,
      excerpt: contentToExcerpt(content)
    });
  } catch (err) {
    console.error("save-news: search-index update failed:", err);
  }

  try {
    await writeSheetsBackup({ type: "news", key, plainText: contentToPlainText(content) });
  } catch (err) {
    await sendBackupFailureAlert({ type: "news", key, error: err });
  }

  return {
    statusCode: 200,
    headers: writeConsistentHeaders(),
    body: JSON.stringify({ ok: true, news: record })
  };
};
