/**
 * homepage.js
 * Homepage-only behavior (CLAUDE.md Section 13 fixed sequence): the image
 * carousel and the news grid + pagination. Kept separate from site.js
 * (shared chrome) since nothing here runs on the other 21 pages.
 *
 * Carousel interaction matches the reference at /Postit files/Pic_carousel.txt
 * — auto-rotate every 5000ms, pause on hover, clickable dots, sliding
 * transform — kept exactly as-is; only the slide source changes. It wires
 * up immediately at boot using the static placeholder slides already in
 * index.html (so the carousel is interactive with no dependency on any
 * fetch), then re-renders from the real site-settings.carouselImages list
 * (Phase 7's admin carousel manager writes to this) once SiteData.load()
 * resolves — but only if that list is non-empty, so a freshly-seeded site
 * with no uploaded images yet still shows a working placeholder carousel
 * instead of an empty one.
 *
 * News grid/pagination now reads the full list from list-news.js
 * (newest-first, lightweight {id,date,title,excerpt} per item — no
 * Editor.js body), fetched once at boot, and paginates over it client-side
 * exactly as before (6 per page). js/news-data.js's mock array is no
 * longer read here; it's kept as seed content for scripts/seed-content.js.
 */
(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  // ---------------------------------------------------------------
  // Carousel
  // ---------------------------------------------------------------
  var activeCarousel = null; // { stop, start } of whatever's currently wired, so a re-render can tear it down cleanly

  function teardownCarousel(root) {
    if (!activeCarousel) return;
    activeCarousel.stop();
    root.removeEventListener("mouseenter", activeCarousel.stop);
    root.removeEventListener("mouseleave", activeCarousel.start);
    activeCarousel = null;
  }

  // Wires dots + auto-rotation to whatever slide elements currently exist
  // inside `root`'s .carousel-track — used both for the static placeholder
  // markup at boot and again after a real-data re-render.
  function setupCarouselInteraction(root) {
    teardownCarousel(root);

    var track = root.querySelector(".carousel-track");
    var dotsWrap = root.querySelector(".carousel-dots");
    dotsWrap.innerHTML = "";
    var slides = track.children;
    if (!slides.length) return;

    var index = 0;
    var timer = null;

    Array.prototype.forEach.call(slides, function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", "Fara á mynd " + (i + 1));
      dot.addEventListener("click", function () {
        goTo(i);
        restart();
      });
      dotsWrap.appendChild(dot);
    });

    function goTo(i) {
      index = i;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      Array.prototype.forEach.call(dotsWrap.children, function (dot, di) {
        dot.classList.toggle("is-active", di === index);
      });
    }
    function next() {
      goTo((index + 1) % slides.length);
    }
    function start() {
      timer = setInterval(next, 5000);
    }
    function stop() {
      clearInterval(timer);
    }
    function restart() {
      stop();
      start();
    }

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    start();

    activeCarousel = { stop: stop, start: start };
  }

  function renderCarouselSlides(root, images) {
    var track = root.querySelector(".carousel-track");
    track.innerHTML = images
      .map(function (img) {
        return (
          '<div class="carousel-slide carousel-slide-photo">' +
            '<img src="' + escapeHtml(img.url) + '" alt="' + escapeHtml(img.alt || "") + '" loading="lazy">' +
          "</div>"
        );
      })
      .join("");
  }

  function initCarousel() {
    var root = document.getElementById("home-carousel");
    if (!root) return;
    setupCarouselInteraction(root); // static placeholder slides — interactive immediately, no fetch dependency
  }

  function applyRealCarouselImages(images) {
    var root = document.getElementById("home-carousel");
    if (!root || !Array.isArray(images) || !images.length) return; // empty/missing — keep the placeholder carousel as-is
    renderCarouselSlides(root, images);
    setupCarouselInteraction(root);
  }

  // ---------------------------------------------------------------
  // News grid + pagination
  // ---------------------------------------------------------------
  var NEWS_PAGE_SIZE = 6;
  var MONTHS = ["jan","feb","mar","apr","maí","jún","júl","ágú","sep","okt","nóv","des"];

  function formatDate(iso) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.getDate() + ". " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function initNews(items) {
    var grid = document.getElementById("news-grid");
    var pagination = document.getElementById("news-pagination");
    if (!grid || !pagination) return;

    items = Array.isArray(items) ? items : [];
    var pageCount = Math.max(1, Math.ceil(items.length / NEWS_PAGE_SIZE));
    var page = 0;

    function render() {
      if (!items.length) {
        grid.innerHTML = '<p class="news-empty">Engar fréttir hafa verið birtar ennþá.</p>';
        pagination.innerHTML = "";
        return;
      }

      var start = page * NEWS_PAGE_SIZE;
      var pageItems = items.slice(start, start + NEWS_PAGE_SIZE);

      grid.innerHTML = pageItems.map(function (item) {
        var cover = item.coverImage && item.coverImage.url
          ? '<div class="news-card-cover"><img src="' + escapeHtml(item.coverImage.url) + '" alt="' + escapeHtml(item.coverImage.alt || "") + '" loading="lazy"></div>'
          : "";
        return (
          '<a class="news-card" href="/news.html?id=' + encodeURIComponent(item.id) + '">' +
            cover +
            '<span class="news-date">' + escapeHtml(formatDate(item.date)) + "</span>" +
            "<h3>" + escapeHtml(item.title) + "</h3>" +
            '<p class="news-excerpt">' + escapeHtml(item.excerpt || "") + "</p>" +
          "</a>"
        );
      }).join("");

      var buttons = [];
      for (var i = 0; i < pageCount; i++) {
        buttons.push(
          '<button type="button" class="news-page-btn' + (i === page ? " is-active" : "") + '" data-page="' + i + '" aria-label="Síða ' + (i + 1) + '"' + (i === page ? ' aria-current="true"' : "") + ">" + (i + 1) + "</button>"
        );
      }
      pagination.innerHTML = pageCount > 1 ? buttons.join("") : "";

      pagination.querySelectorAll(".news-page-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          page = parseInt(btn.getAttribute("data-page"), 10);
          render();
          grid.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }

    render();
  }

  function loadNewsList() {
    var grid = document.getElementById("news-grid");
    if (!grid) return;
    fetch("/.netlify/functions/list-news")
      .then(function (response) {
        if (!response.ok) throw new Error("list-news responded with HTTP " + response.status);
        return response.json();
      })
      .then(function (data) {
        initNews(data.items || []);
      })
      .catch(function (err) {
        console.error("homepage: failed to load news list —", err);
        initNews([]);
      });
  }

  function init() {
    initCarousel();
    loadNewsList();

    // site.js dispatches this once SiteData.load() resolves (cached or
    // freshly fetched) — registering the listener here is safe regardless
    // of timing since script execution (this call) always happens
    // synchronously before that async resolution can occur.
    window.addEventListener("sitedata:ready", function (event) {
      var settings = event.detail && event.detail.settings;
      applyRealCarouselImages(settings && settings.carouselImages);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
