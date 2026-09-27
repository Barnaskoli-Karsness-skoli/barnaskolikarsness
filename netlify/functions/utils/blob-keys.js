/**
 * blob-keys.js
 * Canonical Blob key names (CLAUDE.md Core Architecture: page:<slug>,
 * news:<id>, site-settings, banner, search-index). Every Function builds
 * keys through these helpers/constants instead of inlining the prefix
 * strings, so the naming convention can't drift between files.
 *
 * Nav config is deliberately absent from this list: CLAUDE.md's Header
 * Module marks the header/nav as developer-edited code, not admin-editable
 * Blob content (there's no nav editor in the Admin Portal spec), so nav
 * ships in js/site-data.js and is never fetched over the network at all —
 * see the "Nav config storage" note added to CLAUDE.md alongside this
 * Phase 5 work.
 */
const PAGE_PREFIX = "page:";
const NEWS_PREFIX = "news:";

module.exports = {
  pageKey: (slug) => `${PAGE_PREFIX}${slug}`,
  newsKey: (id) => `${NEWS_PREFIX}${id}`,
  PAGE_PREFIX,
  NEWS_PREFIX,
  SITE_SETTINGS_KEY: "site-settings",
  BANNER_KEY: "banner",
  SEARCH_INDEX_KEY: "search-index"
};
