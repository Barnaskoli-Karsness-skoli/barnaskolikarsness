/**
 * page-url.js
 * Maps a page's Blob slug (its data-page-key, e.g.
 * "grunnskolastig-reglur-um-skolasokn") to its real on-disk URL (e.g.
 * "/grunnskolastig/reglur-um-skolasokn.html"). Every non-homepage slug
 * follows the same "<category>-<rest>" convention as its real
 * "<category>/<rest>.html" file path across all 22 category pages —
 * splitting on the FIRST hyphen only is what keeps multi-word subpage
 * names (the "reglur-um-skolasokn" part) intact.
 *
 * Shared by save-page.js (writes a fresh search-index entry on every
 * save) and scripts/rebuild-search-index.js (a one-time repair pass over
 * every existing entry) so the two can never drift apart the way an
 * inlined copy in save-page.js once did.
 */
function pageUrlFromSlug(slug) {
  if (slug === "homepage") return "/";
  const dash = slug.indexOf("-");
  return dash === -1 ? `/${slug}.html` : `/${slug.slice(0, dash)}/${slug.slice(dash + 1)}.html`;
}

module.exports = { pageUrlFromSlug };
