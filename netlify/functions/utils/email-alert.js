/**
 * email-alert.js
 * TODO: no transactional email provider has been chosen yet (not in
 * CLAUDE.md's CONTENT GAPS list either — needs a decision). This stub logs
 * the failure so it's visible in Netlify's Function logs in the meantime;
 * replace the body with a real provider call (Resend, Postmark, SendGrid,
 * etc.) once one is picked, reading its API key from an env var.
 */
async function sendBackupFailureAlert({ type, key, error }) {
  const message = error && error.message ? error.message : String(error);
  console.error(`[ALERT] Sheets backup failed for ${type} "${key}": ${message}`);
}

module.exports = { sendBackupFailureAlert };
