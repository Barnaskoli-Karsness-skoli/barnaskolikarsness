/**
 * cache.js
 * Shared Cache-Control / Cache-Tag header helpers.
 *
 * Public reads carry a Cache-Tag (or several, comma-separated) naming
 * everything embedded in that response. Netlify's CDN purges by Cache-Tag
 * (see utils/purge-cache.js) whenever a save Function's Blob write
 * succeeds — a literal purge of just the affected cached entries, not a
 * short-TTL approximation. The generous max-age/stale-while-revalidate
 * window below is safe specifically because the purge, not time, is what
 * keeps a saved edit from staying visible as stale.
 */
function readHeaders(tags) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600"
  };
  var tagList = (Array.isArray(tags) ? tags : [tags]).filter(Boolean);
  if (tagList.length) headers["Cache-Tag"] = tagList.join(",");
  return headers;
}

function writeConsistentHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
}

module.exports = { readHeaders, writeConsistentHeaders };
