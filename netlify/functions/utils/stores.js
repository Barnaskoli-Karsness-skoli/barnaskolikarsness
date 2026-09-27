/**
 * stores.js
 * Centralizes the Netlify Blobs store names so every Function opens the
 * same four stores instead of retyping string literals that could drift
 * out of sync. Uses getStore (NOT getDeployStore) per CLAUDE.md Core
 * Architecture — content must survive redeploys.
 *
 * Explicit siteID/token (Netlify Blobs' documented manual-configuration
 * form) instead of the zero-arg getStore(name) shorthand: on this
 * account, the automatic NETLIFY_BLOBS_CONTEXT credential injection that
 * Netlify's Functions runtime is supposed to provide per-invocation never
 * actually reaches the function — confirmed via live Function logs
 * (MissingBlobsEnvironmentError on every invocation, reproduced identically
 * on both a CLI deploy and a Git-linked build, while `netlify blobs:list`
 * with the CLI's own account credentials reaches the same stores fine).
 * NETLIFY_SITE_ID/NETLIFY_PURGE_TOKEN are already set as project env vars
 * (Functions/Runtime scope) — reused here rather than adding a third
 * token; swap NETLIFY_PURGE_TOKEN for a dedicated PAT if it turns out not
 * to carry Blobs read/write scope.
 *
 * Every store getter below takes an optional `token` override, defaulting
 * to NETLIFY_PURGE_TOKEN so every existing caller (every Function) is
 * unaffected. This exists solely for scripts/rebuild-search-index.js,
 * which runs as a standalone script outside any Function's request
 * context — same situation scripts/seed-content.js is already in, which
 * is why .env.example calls NETLIFY_PURGE_TOKEN "purge-scoped only" and
 * has seed-content.js use its own NETLIFY_AUTH_TOKEN PAT instead. Passing
 * that token in explicitly here (rather than changing the default) keeps
 * every Function's already-validated-in-production credential untouched.
 *
 *   pages    — one entry per page, key `page:<slug>`
 *   news     — one entry per news item, key `news:<id>`
 *   settings — singleton entries: site-settings, banner, search-index
 *   images   — one entry per uploaded image, key `image:<sha256>.webp`
 */
const { getStore } = require("@netlify/blobs");

function blobsConfig(name, token) {
  return { name, siteID: process.env.NETLIFY_SITE_ID, token: token || process.env.NETLIFY_PURGE_TOKEN };
}

module.exports = {
  pagesStore: (token) => getStore(blobsConfig("pages", token)),
  newsStore: (token) => getStore(blobsConfig("news", token)),
  settingsStore: (token) => getStore(blobsConfig("settings", token)),
  imagesStore: (token) => getStore(blobsConfig("images", token))
};
