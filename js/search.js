/**
 * search.js
 * Search box UI (CLAUDE.md Sections 8/9): a header trigger (rendered by
 * js/site.js's renderHeader — this file only listens for clicks on it via
 * delegation, since the header can re-render independently of this
 * module's own init, once from cached chrome and again once the real
 * fetch resolves) that opens a glass-panel overlay. The search index is
 * fetched from get-search-index.js only on first open — never on page
 * load — then cached in sessionStorage so reopening the box or navigating
 * to another page within the same tab session never refetches it, the
 * same "fetched once per session" rule CLAUDE.md gives nav/settings/
 * banner (see js/site.js's own sessionStorage cache).
 *
 * The overlay markup lives in its own static #search-overlay mount
 * (present on every page) rather than inside renderHeader()'s output, so
 * an in-progress search isn't wiped out if the header happens to
 * re-render while the box is open.
 */
(function () {
  "use strict";

  var CACHE_KEY = "bk-search-index-v1";
  var RESULT_LIMIT = 20;

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function getCachedEntries() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setCachedEntries(entries) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch (e) {
      /* sessionStorage unavailable (private mode etc.) — safe to skip, just refetches next open */
    }
  }

  function init() {
    var overlay = document.getElementById("search-overlay");
    if (!overlay) return;

    overlay.innerHTML =
      '<div class="search-panel" role="dialog" aria-modal="true" aria-label="Leit">' +
        '<div class="search-panel-head">' +
          '<input type="search" class="search-input" placeholder="Leita á vefnum..." aria-label="Leitarorð">' +
          '<button type="button" class="search-close-btn" aria-label="Loka leit">&times;</button>' +
        "</div>" +
        '<div class="search-results" id="search-results"></div>' +
      "</div>";

    var input = overlay.querySelector(".search-input");
    var resultsEl = overlay.querySelector("#search-results");
    var closeBtn = overlay.querySelector(".search-close-btn");
    var entries = null; // null = not loaded yet this page life

    function renderStatus(text) {
      resultsEl.innerHTML = '<p class="search-status">' + escapeHtml(text) + "</p>";
    }

    function renderResults(list) {
      if (!list.length) {
        renderStatus(input.value.trim() ? "Engar niðurstöður fundust." : "Byrjaðu að skrifa til að leita.");
        return;
      }
      resultsEl.innerHTML = list.slice(0, RESULT_LIMIT).map(function (entry) {
        return (
          '<a class="search-result" href="' + escapeHtml(entry.url) + '">' +
            '<span class="search-result-title">' + escapeHtml(entry.title) + "</span>" +
            (entry.excerpt ? '<span class="search-result-excerpt">' + escapeHtml(entry.excerpt) + "</span>" : "") +
          "</a>"
        );
      }).join("");
    }

    function runFilter() {
      if (!entries) return; // still loading — the load callback re-runs this once ready
      var query = input.value.trim().toLowerCase();
      if (!query) {
        renderResults([]);
        return;
      }
      renderResults(entries.filter(function (entry) {
        return (
          (entry.title && entry.title.toLowerCase().indexOf(query) !== -1) ||
          (entry.excerpt && entry.excerpt.toLowerCase().indexOf(query) !== -1)
        );
      }));
    }

    function ensureIndexLoaded() {
      if (entries) return; // already loaded this page life (in-memory or sessionStorage)

      var cached = getCachedEntries();
      if (cached) {
        entries = cached;
        runFilter();
        return;
      }

      renderStatus("Leita...");
      fetch("/.netlify/functions/get-search-index")
        .then(function (response) {
          if (!response.ok) throw new Error("get-search-index responded with HTTP " + response.status);
          return response.json();
        })
        .then(function (data) {
          entries = (data && data.entries) || [];
          setCachedEntries(entries);
          runFilter();
        })
        .catch(function (err) {
          console.error("search: failed to load search index —", err);
          entries = [];
          renderStatus("Ekki tókst að sækja leitarniðurstöður.");
        });
    }

    function openSearch() {
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
      ensureIndexLoaded();
      input.focus();
    }

    function closeSearch() {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
      // The cached index (sessionStorage + the in-memory `entries` var) is
      // deliberately left alone on close — only a new tab/session clears
      // it, the same rule as the banner's shrink state and site.js's
      // chrome cache.
    }

    // Delegated: the trigger button lives inside js/site.js's renderHeader()
    // output, which can be (re)created after this init() already ran (once
    // from cached chrome, again once the real fetch resolves) — binding
    // directly to the button here could miss it or double-bind.
    document.addEventListener("click", function (e) {
      if (e.target.closest(".search-trigger-btn")) {
        e.preventDefault();
        openSearch();
      }
    });

    closeBtn.addEventListener("click", closeSearch);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeSearch();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) closeSearch();
    });
    input.addEventListener("input", runFilter);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
