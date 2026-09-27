/**
 * search-index.js
 * Reads/writes the single shared `search-index` Blob entry (CLAUDE.md
 * Search: "one shared search index... fetched lazily only when the visitor
 * opens the search box"). This write must be strongly consistent
 * (read-after-write) — so every write purges the `search-index` Cache-Tag
 * via Netlify's Purge API (get-search-index.js tags its response with it),
 * the same literal-purge mechanism save-page.js etc. use, rather than
 * relying on a short TTL.
 */
const { settingsStore } = require("./stores");
const { SEARCH_INDEX_KEY } = require("./blob-keys");
const { purgeCacheTags } = require("./purge-cache");

async function purgeSearchIndex() {
  try {
    await purgeCacheTags("search-index");
  } catch (err) {
    console.error("search-index: cache purge failed:", err);
  }
}

async function updateSearchIndexEntry({ id, type, title, url, excerpt }) {
  const store = settingsStore();
  const index = (await store.get(SEARCH_INDEX_KEY, { type: "json" })) || { entries: [] };

  const entries = index.entries.filter((entry) => entry.id !== id);
  entries.push({ id, type, title, url, excerpt, updatedAt: new Date().toISOString() });

  await store.setJSON(SEARCH_INDEX_KEY, { entries });
  await purgeSearchIndex();
}

async function removeSearchIndexEntry(id) {
  const store = settingsStore();
  const index = (await store.get(SEARCH_INDEX_KEY, { type: "json" })) || { entries: [] };
  const entries = index.entries.filter((entry) => entry.id !== id);
  await store.setJSON(SEARCH_INDEX_KEY, { entries });
  await purgeSearchIndex();
}

module.exports = { updateSearchIndexEntry, removeSearchIndexEntry };
