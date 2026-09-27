/**
 * save-site-settings.js
 * Admin-only write for the Site Info tab: principal name/email, office
 * email, phone numbers list, address+map, opening hours, and the Quick
 * Links list+toggle (CLAUDE.md Admin Portal / Section 5b). Overwrites the
 * whole site-settings Blob entry — the admin UI is expected to send the
 * complete settings object, not a partial patch, so a field left out here
 * is a field that gets erased; the admin form should always round-trip
 * the full object it last read.
 */
const { settingsStore } = require("./utils/stores");
const { requireEditor } = require("./utils/auth");
const { SITE_SETTINGS_KEY } = require("./utils/blob-keys");
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

  let settings;
  try {
    settings = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Request body must be a site-settings object." }) };
  }

  settings.updatedAt = new Date().toISOString();
  settings.updatedBy = auth.user.email;

  try {
    await settingsStore().setJSON(SITE_SETTINGS_KEY, settings);
  } catch (err) {
    console.error("save-site-settings: Blob write failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to save site settings." }) };
  }

  try {
    // One shared tag purges every page's cached read in a single call,
    // since site-settings is embedded in all of them (see get-page-data.js).
    await purgeCacheTags("site-settings");
  } catch (err) {
    console.error("save-site-settings: cache purge failed:", err);
  }

  return {
    statusCode: 200,
    headers: writeConsistentHeaders(),
    body: JSON.stringify({ ok: true, settings })
  };
};
