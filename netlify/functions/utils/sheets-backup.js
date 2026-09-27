/**
 * sheets-backup.js
 * Writes a timestamped plain-text backup of saved content to the school's
 * Google Sheet via an Apps Script doPost endpoint (CLAUDE.md Core
 * Architecture — disaster-recovery backup, text only, not images). Both
 * the Apps Script URL and the shared-secret token come from environment
 * variables (see .env.example), never hardcoded.
 */
async function writeSheetsBackup({ type, key, plainText }) {
  const url = process.env.SHEETS_BACKUP_URL;
  const token = process.env.SHEETS_BACKUP_TOKEN;

  if (!url || !token) {
    throw new Error("SHEETS_BACKUP_URL or SHEETS_BACKUP_TOKEN is not configured.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      type,
      key,
      plainText,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Sheets backup responded with HTTP ${response.status}`);
  }
}

module.exports = { writeSheetsBackup };
