/**
 * save-page.js
 * Admin-only write for a single page's Editor.js content (page:<slug>).
 * Auth (Identity JWT + @kopskolar.is domain) is checked before anything
 * else touches a Blob. On success: writes the Blob, purges this page's
 * `page-<slug>` Cache-Tag via Netlify's Purge API (see utils/purge-cache.js)
 * so the CDN's cached read is invalidated immediately, regenerates this
 * page's search-index entry, and writes a plain-text backup to the
 * school's Google Sheet. A purge or backup failure is logged but does not
 * fail the save itself, since the page content already wrote successfully.
 */
const { pagesStore } = require("./utils/stores");
const { requireEditor } = require("./utils/auth");
const { pageKey } = require("./utils/blob-keys");
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

  const { slug, content, title } = payload;
  if (!slug || !content) {
    return { statusCode: 400, body: JSON.stringify({ error: "Both 'slug' and 'content' are required." }) };
  }

  const key = pageKey(slug);
  const record = {
    slug,
    title: title || slug,
    content,
    updatedAt: new Date().toISOString(),
    updatedBy: auth.user.email
  };

  try {
    await pagesStore().setJSON(key, record);
  } catch (err) {
    console.error("save-page: Blob write failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to save page content." }) };
  }

  try {
    await purgeCacheTags(`page-${slug}`);
  } catch (err) {
    // Not fatal — the page content itself already saved successfully; a
    // visitor's cached copy just won't reflect the edit until it expires.
    console.error("save-page: cache purge failed:", err);
  }

  try {
    await updateSearchIndexEntry({
      id: key,
      type: "page",
      title: record.title,
      url: slug === "homepage" ? "/" : `/${slug}`,
      excerpt: contentToExcerpt(content)
    });
  } catch (err) {
    // Not fatal — the page content itself already saved successfully.
    console.error("save-page: search-index update failed:", err);
  }

  try {
    await writeSheetsBackup({ type: "page", key, plainText: contentToPlainText(content) });
  } catch (err) {
    await sendBackupFailureAlert({ type: "page", key, error: err });
  }

  return {
    statusCode: 200,
    headers: writeConsistentHeaders(),
    body: JSON.stringify({ ok: true, page: record })
  };
};
