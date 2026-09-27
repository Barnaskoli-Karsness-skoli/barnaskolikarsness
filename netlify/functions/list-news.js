/**
 * list-news.js
 * Public, no auth (news is public content) — returns a lightweight list of
 * every news:<id> entry, newest-first: [{ id, date, title, excerpt,
 * coverImage }]. Deliberately excludes the full Editor.js body — this is
 * for lists and pagination (the public homepage's news grid, the admin
 * News tab's browse/edit view), not detail rendering. get-news-item.js is
 * what serves a single item's full content for news.html/the admin editor.
 * coverImage ({url, alt} or null) is the one exception passed through
 * as-is — it's already small, and the homepage's news cards need it
 * without a second fetch per item.
 *
 * The excerpt is ~100 characters (CLAUDE.md Homepage spec: "~100-character
 * auto-generated excerpt"), generated server-side from the first
 * paragraph/header text so every consumer of this endpoint gets a
 * ready-to-render excerpt without also having to fetch and walk each
 * item's full content.
 */
const { newsStore } = require("./utils/stores");
const { readHeaders } = require("./utils/cache");
const { contentToExcerpt } = require("./utils/content-to-text");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // An unseeded news store (nothing saved yet) or a single unreadable item
  // is a benign, expected state (CLAUDE.md accepts empty content until the
  // secretary starts adding entries) — always answer 200 with whatever
  // items could be read, rather than 500ing the whole list over it.
  let list = [];
  try {
    const store = newsStore();
    const { blobs } = await store.list({ prefix: "news:" });
    const items = await Promise.all(
      blobs.map((entry) =>
        store.get(entry.key, { type: "json" }).catch((err) => {
          console.error(`list-news: failed reading "${entry.key}":`, err);
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
        coverImage: item.coverImage || null
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error("list-news: failed listing news store, returning empty list:", err);
  }

  return {
    statusCode: 200,
    headers: readHeaders("news-list"),
    body: JSON.stringify({ items: list })
  };
};
