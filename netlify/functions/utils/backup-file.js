/**
 * backup-file.js
 * Builds the plain-text content backup (CLAUDE.md Core Architecture,
 * "Backup"): a single CSV with one row per page and one per news item —
 * which page/news it is, its plain-text body, its links, and its
 * last-updated date. No Blob keys, no author, no images, no raw
 * Editor.js JSON. Text extraction reuses utils/content-to-text.js, the
 * same shared utility the search snippets use.
 *
 * Always built fresh from the current Blob contents, so the same function
 * serves both the GitHub commit (utils/github-backup.js) and the admin's
 * on-demand download (download-backup.js) — the two files can never drift
 * in format.
 *
 * CSV, UTF-8 with a BOM, so Excel opens Icelandic characters correctly
 * without an import wizard.
 */
const { pagesStore, newsStore } = require("./stores");
const { PAGE_PREFIX, NEWS_PREFIX } = require("./blob-keys");
const { contentToPlainText, contentToLinks } = require("./content-to-text");

const HEADER = ["Tegund", "Síða / frétt", "Auðkenni", "Texti", "Tenglar", "Síðast uppfært"];

function csvCell(value) {
  const s = String(value == null ? "" : value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function readAll(store, prefix) {
  const { blobs } = await store.list({ prefix });
  const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  // A null here means a listed entry could not be read — throw so the
  // caller alerts, rather than silently writing a backup with rows missing.
  items.forEach((item, i) => {
    if (!item) throw new Error(`Could not read "${blobs[i].key}" while building the backup.`);
  });
  return items;
}

async function buildBackupCsv() {
  const [pages, news] = await Promise.all([
    readAll(pagesStore(), PAGE_PREFIX),
    readAll(newsStore(), NEWS_PREFIX)
  ]);

  pages.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  news.sort((a, b) => new Date(b.date) - new Date(a.date));

  const rows = [HEADER];
  for (const p of pages) {
    rows.push(["Síða", p.title || p.slug, p.slug, contentToPlainText(p.content), contentToLinks(p.content).join("\n"), p.updatedAt || ""]);
  }
  for (const n of news) {
    rows.push(["Frétt", n.title, n.id, contentToPlainText(n.content), contentToLinks(n.content).join("\n"), n.updatedAt || n.date || ""]);
  }

  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
  return { csv, pageCount: pages.length, newsCount: news.length };
}

module.exports = { buildBackupCsv };
