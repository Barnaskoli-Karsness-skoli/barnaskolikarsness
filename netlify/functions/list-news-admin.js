/**
 * list-news-admin.js
 * Admin-only variant of list-news.js: the same lightweight per-item list,
 * but also includes updatedAt/updatedBy so the admin's "Allar fréttir"
 * browse list can show who last edited each entry and when.
 *
 * Kept as its own Function rather than adding these fields to the public
 * list-news.js: that response is CDN-cached with a public Cache-Control
 * header (see utils/cache.js's readHeaders), and conditionally varying its
 * body by auth state would risk the CDN caching an authenticated response
 * — with an editor's email in it — and serving that same cached copy back
 * to a later anonymous visitor. This Function is always no-store instead,
 * since it's only ever read by an already-logged-in admin session.
 */
const { newsStore } = require("./utils/stores");
const { requireEditor } = require("./utils/auth");
const { writeConsistentHeaders } = require("./utils/cache");
const { contentToExcerpt } = require("./utils/content-to-text");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const auth = requireEditor(context);
  if (!auth.authorized) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.reason }) };
  }

  // Same benign-empty-list-on-failure behavior as list-news.js — see that
  // file's comment for the reasoning.
  let list = [];
  try {
    const store = newsStore();
    const { blobs } = await store.list({ prefix: "news:" });
    const items = await Promise.all(
      blobs.map((entry) =>
        store.get(entry.key, { type: "json" }).catch((err) => {
          console.error(`list-news-admin: failed reading "${entry.key}":`, err);
          return null;
        })
      )
    );

    list = items
      .filter(Boolean)
      .map((item) => ({
        id: item.id,
        date: item.date,
        title: item.title,
        excerpt: contentToExcerpt(item.content, 100),
        coverImage: item.coverImage || null,
        updatedAt: item.updatedAt || null,
        updatedBy: item.updatedBy || null
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error("list-news-admin: failed listing news store, returning empty list:", err);
  }

  return {
    statusCode: 200,
    headers: writeConsistentHeaders(),
    body: JSON.stringify({ items: list })
  };
};
