/**
 * purge-cache.js
 * Calls Netlify's Purge API to invalidate cached responses carrying a
 * specific Cache-Tag, right after a Blob write succeeds. This is the
 * literal purge CLAUDE.md's caching rule calls for — it replaces the
 * earlier short-TTL approximation (see utils/cache.js), which is now only
 * a fallback safety net for the (rare) case a purge call itself fails.
 *
 * Requires:
 *   NETLIFY_PURGE_TOKEN — a site-scoped Netlify personal access token
 *                          (see .env.example)
 *   NETLIFY_SITE_ID     — falls back to process.env.SITE_ID, which Netlify
 *                          injects automatically at runtime, if unset
 */
const PURGE_URL = "https://api.netlify.com/api/v1/purge";

async function purgeCacheTags(tags) {
  const token = process.env.NETLIFY_PURGE_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  if (!token || !siteId) {
    throw new Error("NETLIFY_PURGE_TOKEN or NETLIFY_SITE_ID is not configured.");
  }

  const cacheTags = (Array.isArray(tags) ? tags : [tags]).filter(Boolean);
  if (!cacheTags.length) return;

  const response = await fetch(PURGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ site_id: siteId, cache_tags: cacheTags })
  });

  if (!response.ok) {
    throw new Error(`Netlify purge API responded with HTTP ${response.status}`);
  }
}

module.exports = { purgeCacheTags };
