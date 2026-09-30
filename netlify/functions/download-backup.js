/**
 * download-backup.js
 * Admin-only. Builds the same content backup file the GitHub commit uses
 * (utils/backup-file.js) fresh from current Blob content and returns it as
 * a file download — a plain way for an editor to keep a local copy without
 * touching GitHub. Always no-store: never from the last commit, never cached.
 */
const { requireEditor } = require("./utils/auth");
const { buildBackupCsv } = require("./utils/backup-file");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const auth = requireEditor(context);
  if (!auth.authorized) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.reason }) };
  }

  try {
    const { csv } = await buildBackupCsv();
    const date = new Date().toISOString().slice(0, 10);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="afrit-${date}.csv"`,
        "Cache-Control": "no-store"
      },
      body: csv
    };
  } catch (err) {
    console.error("download-backup: failed to build backup:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to build the backup." }) };
  }
};
