/**
 * add-meta-tags.js — adds canonical, Open Graph and Twitter tags to every public page.
 * Purpose: SEO + link previews. Values are derived from each page's own <title>
 * and <meta name="description">. Idempotent: the generated block is wrapped in
 * marker comments and replaced on re-run, never duplicated. admin.html is skipped.
 *   node scripts/add-meta-tags.js
 */
const fs = require('fs');
const path = require('path');
const { ORIGIN, ROOT, listPublicHtml, canonicalFor } = require('./lib-pages');

const START = '<!-- seo-meta:start -->';
const END = '<!-- seo-meta:end -->';
const IMAGE = ORIGIN + '/img/og-default.png';
const ALT = 'Barnaskóli Kársness';

let changed = 0;
for (const file of listPublicHtml()) {
  const full = path.join(ROOT, file);
  const eol = fs.readFileSync(full, 'utf8').includes('\r\n') ? '\r\n' : '\n';
  let html = fs.readFileSync(full, 'utf8');
  const original = html;

  // Drop any previously generated block so re-runs don't duplicate.
  const a = html.indexOf(START), b = html.indexOf(END);
  if (a !== -1 && b > a) {
    const lineStart = html.lastIndexOf(String.fromCharCode(10), a) + 1;
    let end = b + END.length;
    if (html[end] === String.fromCharCode(13)) end++;
    if (html[end] === String.fromCharCode(10)) end++;
    html = html.slice(0, lineStart) + html.slice(end);
  }

  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"\s*\/?>/) || [])[1];
  if (!title || desc === undefined) { console.warn(`SKIP ${file}: missing title/description`); continue; }

  // news.html is a shell; per-article tags would need server-side rendering.
  const url = file === 'news.html' ? ORIGIN + '/news.html' : canonicalFor(file);
  const block = [
    START,
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Barnaskóli Kársness">',
    '<meta property="og:locale" content="is_IS">',
    `<meta property="og:title" content="${title.trim()}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${IMAGE}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${ALT}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title.trim()}">`,
    `<meta name="twitter:description" content="${desc}">`,
    `<meta name="twitter:image" content="${IMAGE}">`,
    END,
  ].join(eol);

  const out = html.replace(/(<meta name="description" content="[^"]*"\s*\/?>)(\r?\n)/, `$1$2${block}$2`);
  if (out === html) { console.warn(`SKIP ${file}: description tag not found for insertion`); continue; }
  if (out !== original) { fs.writeFileSync(full, out); changed++; }
}
console.log(`add-meta-tags: ${changed} files updated`);
