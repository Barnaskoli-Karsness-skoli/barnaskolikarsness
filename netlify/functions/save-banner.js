/**
 * save-banner.js
 * Admin-only write for the emergency banner (CLAUDE.md "News & Banner" —
 * `active` flag, `bannerText`, optional `imageURL`, `LastUpdated`). The
 * visitor-side shrink-to-pill state is purely client-side sessionStorage
 * and never touches this Function — this only controls whether the banner
 * exists at all and what it says.
 */
const { settingsStore } = require("./utils/stores");
const { requireEditor } = require("./utils/auth");
const { BANNER_KEY } = require("./utils/blob-keys");
const { writeConsistentHeaders } = require("./utils/cache");
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

  const banner = {
    active: Boolean(payload.active),
    bannerText: payload.bannerText || "",
    imageURL: payload.imageURL || null,
    LastUpdated: new Date().toISOString(),
    updatedBy: auth.user.email
  };

  try {
    await settingsStore().setJSON(BANNER_KEY, banner);
  } catch (err) {
    console.error("save-banner: Blob write failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to save banner state." }) };
  }

  try {
    await purgeCacheTags("banner");
  } catch (err) {
    console.error("save-banner: cache purge failed:", err);
  }

  return {
    statusCode: 200,
    headers: writeConsistentHeaders(),
    body: JSON.stringify({ ok: true, banner })
  };
};
