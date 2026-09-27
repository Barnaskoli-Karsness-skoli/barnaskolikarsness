/**
 * auth.js
 * Server-side Identity check for every admin-only save Function
 * (save-page, save-news, save-site-settings, save-banner, upload-image —
 * all five call through this one shared util, never reimplementing the
 * check). This has been the real check since it was written in Phase 5 —
 * nothing here changed for Phase 8, which just made the client (admin.js)
 * actually send a real Identity JWT for it to verify, via
 * admin/vendor/netlify-identity's widget.
 *
 * Netlify's classic Functions runtime verifies the caller's Identity JWT
 * itself and exposes the decoded result as context.clientContext.user
 * whenever the client sends it as an `Authorization: Bearer <jwt>` header
 * — this function never parses or verifies the JWT by hand, it only reads
 * that already-verified result and re-checks the @kopskolar.is domain,
 * per CLAUDE.md: "checked both in Identity settings AND server-side in
 * the Function" — never rely on the Identity dashboard restriction alone.
 * No user (missing/invalid token) → 401. Wrong domain → 403.
 */
const ALLOWED_DOMAIN = "@kopskolar.is";

function requireEditor(context) {
  const user = context && context.clientContext && context.clientContext.user;

  if (!user) {
    return {
      authorized: false,
      statusCode: 401,
      reason: "No authenticated Identity user on this request."
    };
  }

  const email = String(user.email || "").toLowerCase();
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return {
      authorized: false,
      statusCode: 403,
      reason: "This account's email domain is not permitted to edit this site."
    };
  }

  return { authorized: true, user };
}

module.exports = { requireEditor, ALLOWED_DOMAIN };
