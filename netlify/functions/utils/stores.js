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
 *   pages    — one entry per page, key `page:<slug>`
 *   news     — one entry per news item, key `news:<id>`
 *   settings — singleton entries: site-settings, banner, search-index
 *   images   — one entry per uploaded image, key `image:<sha256>.webp`
 */
const { getStore } = require("@netlify/blobs");

function blobsConfig(name) {
  return { name, siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_PURGE_TOKEN };
}

module.exports = {
  pagesStore: () => getStore(blobsConfig("pages")),
  newsStore: () => getStore(blobsConfig("news")),
  settingsStore: () => getStore(blobsConfig("settings")),
  imagesStore: () => getStore(blobsConfig("images"))
};
