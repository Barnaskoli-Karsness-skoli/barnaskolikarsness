/**
 * stores.js
 * Centralizes the Netlify Blobs store names so every Function opens the
 * same four stores instead of retyping string literals that could drift
 * out of sync. Uses getStore (NOT getDeployStore) per CLAUDE.md Core
 * Architecture — content must survive redeploys.
 *
 *   pages    — one entry per page, key `page:<slug>`
 *   news     — one entry per news item, key `news:<id>`
 *   settings — singleton entries: site-settings, banner, search-index
 *   images   — one entry per uploaded image, key `image:<sha256>.webp`
 */
const { getStore } = require("@netlify/blobs");

module.exports = {
  pagesStore: () => getStore("pages"),
  newsStore: () => getStore("news"),
  settingsStore: () => getStore("settings"),
  imagesStore: () => getStore("images")
};
