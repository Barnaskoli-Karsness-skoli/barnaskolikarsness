/**
 * lib-pages.js — shared helper for the SEO scripts.
 * Purpose: lists every public html file in the repo (everything tracked by
 * git except admin.html and the reference-only "Postit files" folder) and maps
 * each to its canonical absolute URL on the primary domain.
 */
const { execSync } = require('child_process');
const path = require('path');

const ORIGIN = 'https://barnaskolikarsness.is';
const ROOT = path.resolve(__dirname, '..');

/** Returns repo-relative, forward-slash paths of all public html files. */
function listPublicHtml() {
  return execSync('git ls-files "*.html"', { cwd: ROOT, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((f) => !/^postit files\//i.test(f) && f !== 'admin.html');
}

/** Maps a repo-relative html path to its canonical URL (index pages -> folder URL). */
function canonicalFor(file) {
  if (file === 'index.html') return ORIGIN + '/';
  if (file.endsWith('/index.html')) return ORIGIN + '/' + file.slice(0, -'index.html'.length);
  return ORIGIN + '/' + file;
}

module.exports = { ORIGIN, ROOT, listPublicHtml, canonicalFor };
