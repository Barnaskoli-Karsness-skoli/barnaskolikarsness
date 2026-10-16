/**
 * build-sitemap.js — regenerates sitemap.xml from the real list of html files.
 * Purpose: keep the sitemap in sync with the site. Re-run after adding pages:
 *   node scripts/build-sitemap.js
 * Excludes admin.html (unlinked) and news.html (needs ?id=, so not indexable alone).
 */
const fs = require('fs');
const path = require('path');
const { ROOT, listPublicHtml, canonicalFor } = require('./lib-pages');

const today = new Date().toISOString().slice(0, 10);
const urls = listPublicHtml()
  .filter((f) => f !== 'news.html')
  .map(canonicalFor)
  .sort((a, b) => (a === b ? 0 : a.endsWith('.is/') ? -1 : b.endsWith('.is/') ? 1 : a.localeCompare(b)));

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n') +
  '\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml written with ${urls.length} URLs`);
