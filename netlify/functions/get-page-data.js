/**
 * get-page-data.js
 * Combined public read: returns a page's content, site-settings, and the
 * banner state in a single response (CLAUDE.md "one combined read per page
 * load"). No auth required — this is the public-facing read path.
 *
 * Nav config is deliberately NOT part of this response — see the note in
 * utils/blob-keys.js: nav ships in js/site-data.js as code, so it costs
 * zero network round trips instead of one.
 *
 * Query params:
 *   slug (required) — matches the `page:<slug>` Blob key. Pass "homepage"
 *                      for the homepage's own content.
 *
 * For slug=homepage, the response also includes the 6 newest news entries,
 * so the homepage's fixed news-grid section rides along on this same
 * combined read instead of a second round trip.
 */
const { pagesStore, settingsStore, newsStore } = require("./utils/stores");
const { pageKey, SITE_SETTINGS_KEY, BANNER_KEY } = require("./utils/blob-keys");
const { readHeaders } = require("./utils/cache");

const NEWEST_NEWS_COUNT = 6;

// A failed/missing read of ONE piece (e.g. an unseeded page:<slug>) must not
// take down the other two pieces of this combined response — page content,
// site-settings and banner are logically independent, so each read gets its
// own fallback to null instead of one shared try/catch failing the whole
// request. A truly nonexistent key already resolves to null (not a thrown
// error) per @netlify/blobs, but this also absorbs any transient read error
// on that one store.
async function safeGet(store, key) {
  try {
    return await store.get(key, { type: "json" });
  } catch (err) {
    console.error(`get-page-data: failed reading blob key "${key}":`, err);
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const slug = ((event.queryStringParameters && event.queryStringParameters.slug) || "").trim();
  if (!slug) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required 'slug' query parameter." })
    };
  }

  try {
    const pages = pagesStore();
    const settings = settingsStore();

    const [pageContent, siteSettings, banner] = await Promise.all([
      safeGet(pages, pageKey(slug)),
      safeGet(settings, SITE_SETTINGS_KEY),
      safeGet(settings, BANNER_KEY)
    ]);

    const responseBody = {
      slug,
      page: pageContent || null,
      settings: siteSettings || null,
      banner: banner || null
    };

    if (slug === "homepage") {
      responseBody.news = [];
      try {
        const news = newsStore();
        const { blobs } = await news.list({ prefix: "news:" });
        const newsItems = await Promise.all(blobs.map((entry) => safeGet(news, entry.key)));

        responseBody.news = newsItems
          .filter(Boolean)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, NEWEST_NEWS_COUNT);
      } catch (err) {
        // An unseeded/unreachable news store shouldn't fail the homepage's
        // page+settings+banner read — just ship it with no news items.
        console.error("get-page-data: failed reading homepage news list:", err);
      }
    }

    // Tagged with page-<slug> AND site-settings/banner: this response embeds
    // all three, so a save to settings or the banner can purge every page's
    // cached read via one shared tag instead of enumerating every slug.
    return {
      statusCode: 200,
      headers: readHeaders([`page-${slug}`, "site-settings", "banner"]),
      body: JSON.stringify(responseBody)
    };
  } catch (err) {
    // Last-resort net for anything truly unexpected — every routine
    // missing-key/read-error case above already degrades to null/[] instead
    // of reaching here.
    console.error("get-page-data failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error reading page data." })
    };
  }
};
