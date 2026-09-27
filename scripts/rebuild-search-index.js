/**
 * rebuild-search-index.js
 * One-time repair script: rebuilds every page/news entry's search-index
 * record directly from the current page:<slug>/news:<id> Blobs, using the
 * exact same field-building logic (utils/page-url.js's pageUrlFromSlug,
 * utils/content-to-text.js's contentToExcerpt) that save-page.js/
 * save-news.js use on a normal save.
 *
 * Why this exists: the search-index Blob is a stored value, only ever
 * refreshed when a page/news item is actually saved — it does not
 * recompute itself on read. A page saved while save-page.js's url-building
 * had a bug (storing "/<slug>" instead of the real "/<category>/<rest>.html"
 * path) keeps that broken url forever unless the page is saved again.
 * scripts/seed-content.js's initial bulk load never touches the search
 * index at all (see its own header comment), so it can't have fixed this
 * either. This script re-derives every entry in one pass instead of
 * requiring an editor to manually re-open and re-save all 22 pages.
 *
 * Requires netlify/functions/utils/stores.js directly (not a separate
 * store-access copy, unlike scripts/seed-content.js) so this can never
 * drift from what a real save actually does. This runs as a standalone
 * script outside any Function's request context though — the same
 * situation seed-content.js is in — so it can't rely on NETLIFY_PURGE_TOKEN
 * the way stores.js's other callers (all real Functions) do: .env.example
 * calls that token "purge-scoped only" and has seed-content.js use its own
 * NETLIFY_AUTH_TOKEN PAT for exactly this reason. stores.js's pagesStore()/
 * newsStore() (read path here) and utils/search-index.js's
 * updateSearchIndexEntry() (write path, via its own internal
 * settingsStore() call) all take the same optional token override for
 * this one case; every other caller (every save-*.js/get-*.js Function)
 * still gets the default NETLIFY_PURGE_TOKEN, untouched.
 *
 * Run once, manually, whenever the search-index needs re-deriving (e.g.
 * right after a fix to the url/excerpt-building logic):
 *   NETLIFY_SITE_ID=<id> NETLIFY_AUTH_TOKEN=<token> node scripts/rebuild-search-index.js
 */
const { pagesStore, newsStore } = require("../netlify/functions/utils/stores");
const { contentToExcerpt } = require("../netlify/functions/utils/content-to-text");
const { updateSearchIndexEntry } = require("../netlify/functions/utils/search-index");
const { pageUrlFromSlug } = require("../netlify/functions/utils/page-url");

const BLOBS_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

async function rebuildPages() {
  const store = pagesStore(BLOBS_TOKEN);
  const { blobs } = await store.list({ prefix: "page:" });

  for (const entry of blobs) {
    const record = await store.get(entry.key, { type: "json" });
    if (!record) continue;

    const url = pageUrlFromSlug(record.slug);
    await updateSearchIndexEntry({
      id: entry.key,
      type: "page",
      title: record.title || record.slug,
      url,
      excerpt: contentToExcerpt(record.content),
      token: BLOBS_TOKEN
    });
    console.log(`Rebuilt ${entry.key} -> ${url}`);
  }
}

async function rebuildNews() {
  const store = newsStore(BLOBS_TOKEN);
  const { blobs } = await store.list({ prefix: "news:" });

  for (const entry of blobs) {
    const record = await store.get(entry.key, { type: "json" });
    if (!record) continue;

    const url = `/news.html?id=${encodeURIComponent(record.id)}`;
    await updateSearchIndexEntry({
      id: entry.key,
      type: "news",
      title: record.title,
      url,
      excerpt: contentToExcerpt(record.content),
      token: BLOBS_TOKEN
    });
    console.log(`Rebuilt ${entry.key} -> ${url}`);
  }
}

async function main() {
  await rebuildPages();
  await rebuildNews();
  console.log("Done. Every page/news search-index entry now reflects the current url-building logic.");
}

main().catch((err) => {
  console.error("rebuild-search-index failed:", err);
  process.exitCode = 1;
});
