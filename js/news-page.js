/**
 * news-page.js
 * news.html-only behavior: reads ?id= from the URL, fetches that single
 * news item from get-news-item.js (Phase 5), and renders it through the
 * shared render-content.js renderer. 404s gracefully (a real "not found"
 * message, not a broken/empty page) if the id is missing or the item
 * doesn't exist. Kept separate from site.js (shared chrome) — nothing
 * here runs on the other 22 pages.
 */
(function () {
  "use strict";

  var MONTHS = ["jan","feb","mar","apr","maí","jún","júl","ágú","sep","okt","nóv","des"];

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function formatDate(iso) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.getDate() + ". " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function getIdFromUrl() {
    return new URLSearchParams(window.location.search).get("id");
  }

  function renderNotFound() {
    var hero = document.getElementById("news-hero");
    var body = document.getElementById("news-content");
    var cover = document.getElementById("news-cover");
    if (hero) {
      hero.innerHTML =
        '<div class="page-eyebrow"><span class="status-dot"></span>Fréttir</div><h1>Fréttin fannst ekki</h1>';
    }
    if (body) {
      body.innerHTML =
        "<p>Því miður fannst fréttin sem óskað var eftir ekki. Tengillinn gæti verið rangur eða fréttin hefur verið fjarlægð.</p>" +
        '<p><a href="/index.html">Til baka á forsíðu</a></p>';
    }
    if (cover) cover.hidden = true;
  }

  function renderNews(item) {
    var hero = document.getElementById("news-hero");
    var body = document.getElementById("news-content");
    var cover = document.getElementById("news-cover");
    var coverImg = document.getElementById("news-cover-img");
    if (!hero || !body) return;

    document.title = item.title + " | Barnaskóli Kársness";

    hero.innerHTML =
      '<div class="page-eyebrow"><span class="status-dot"></span>Fréttir · ' + escapeHtml(formatDate(item.date)) + "</div>" +
      "<h1>" + escapeHtml(item.title) + "</h1>";

    if (cover && coverImg) {
      if (item.coverImage && item.coverImage.url) {
        coverImg.src = item.coverImage.url;
        coverImg.alt = item.coverImage.alt || "";
        cover.hidden = false;
      } else {
        cover.hidden = true;
        coverImg.src = "";
        coverImg.alt = "";
      }
    }

    var rendered = window.RenderContent && window.RenderContent.renderContentInto(body, item.content);
    if (!rendered) {
      body.innerHTML = "<p>Þessi frétt hefur ekki efni ennþá.</p>";
    }
  }

  function init() {
    var id = getIdFromUrl();
    if (!id) {
      renderNotFound();
      return;
    }

    fetch("/.netlify/functions/get-news-item?id=" + encodeURIComponent(id))
      .then(function (response) {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("get-news-item responded with HTTP " + response.status);
        return response.json();
      })
      .then(function (data) {
        if (data && data.news) {
          renderNews(data.news);
        } else {
          renderNotFound();
        }
      })
      .catch(function (err) {
        console.error("news-page: failed to load news item —", err);
        renderNotFound();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
