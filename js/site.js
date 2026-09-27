/**
 * site.js
 * Renders the emergency banner, shared header, quick-contact bar, mobile
 * nav, page content, and footer into the placeholder elements every page
 * includes (#site-banner, #quick-contact, #site-header,
 * #main-content .page-content, #site-footer).
 * One render path per page-load == one place to change the chrome for all
 * 22 pages. Reads data from SiteData.load() (see site-data.js), which now
 * fetches get-page-data.js for real (Phase 6). After rendering, dispatches
 * a "sitedata:ready" CustomEvent carrying the full fetched payload so
 * page-specific scripts (e.g. homepage.js) can react to it without a
 * second fetch. The sessionStorage cache (see init() below) covers only
 * the shared chrome — nav/settings/banner, CLAUDE.md's "cache settings in
 * sessionStorage once per session" rule — and is used purely as an
 * instant-paint optimization while a fresh get-page-data.js fetch always
 * still runs. Page content is never read from that cache: each page is
 * its own Blob entry, always fetched fresh, so an edit shows up on the
 * very next load instead of being masked by a stale same-session cache.
 */
(function () {
  "use strict";

  // Bump this whenever the shape of SiteData changes (e.g. adding real
  // hrefs to nav categories, or quickLinks) so stale sessionStorage entries
  // from a previous version are ignored instead of served as-is.
  var CACHE_KEY = "bk-site-data-v2";

  function getCachedData() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setCachedData(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      /* sessionStorage unavailable (private mode etc.) — safe to skip */
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  // Small inline contact icons (phone/mail) — same wrapper attrs as
  // js/icons.js / js/resource-icons.js (viewBox 0 0 24 24, currentColor
  // stroke, 1.5 stroke-width, round caps/joins) so these read as part of
  // the same icon system rather than a one-off addition. Used only inline
  // in front of phone numbers/email addresses in the quick-contact bar and
  // the footer — not a new icon set/module, just two constants local to
  // this file's own render functions.
  var ICON_PHONE =
    '<svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M6.5 4.5h3l1.6 3.8-2.1 1.6a10.8 10.8 0 0 0 5.1 5.1l1.6-2.1 3.8 1.6v3a1.5 1.5 0 0 1-1.6 1.5C9.9 18.6 5.4 14.1 5 8.6A1.5 1.5 0 0 1 6.5 4.5Z"/>' +
    "</svg>";
  var ICON_MAIL =
    '<svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4.5 7l7.5 6 7.5-6"/>' +
    "</svg>";

  function renderQuickContact(settings) {
    var mount = document.getElementById("quick-contact");
    if (!mount) return;

    var items = [];
    settings.phoneNumbers.forEach(function (p) {
      items.push(
        '<a class="quick-contact-item" href="tel:' + escapeHtml(p.tel) + '">' +
          ICON_PHONE + "<strong>" + escapeHtml(p.label) + ":</strong> " + escapeHtml(p.number) +
        "</a>"
      );
    });
    items.push(
      '<a class="quick-contact-item" href="mailto:' + escapeHtml(settings.officeEmail) + '">' +
        ICON_MAIL + escapeHtml(settings.officeEmail) +
      "</a>"
    );
    items.push(
      '<a class="quick-contact-item" href="' + escapeHtml(settings.address.mapUrl) + '" target="_blank" rel="noopener">' +
        escapeHtml(settings.address.text) +
      "</a>"
    );

    mount.innerHTML =
      '<div class="quick-contact-inner">' + items.join("") + "</div>";
  }

  function renderDesktopNav(nav) {
    // Every top-level label is now a real landing page link (category pages
    // exist for Leikskólastig/Grunnskólastig/Frístund/Foreldraráð, same as
    // Forsíða for the homepage). The dropdown is revealed by :hover / CSS
    // :focus-within only — no click handler needed on desktop.
    return nav.map(function (item) {
      var hasChildren = item.children && item.children.length;
      var dropdown = "";
      if (hasChildren) {
        dropdown =
          '<div class="nav-dropdown" role="menu">' +
          item.children.map(function (child) {
            var extra = child.external ? ' target="_blank" rel="noopener"' : "";
            return '<a role="menuitem" href="' + escapeHtml(child.href) + '"' + extra + ">" + escapeHtml(child.label) + "</a>";
          }).join("") +
          "</div>";
      }
      return (
        '<div class="nav-item" data-nav-key="' + item.key + '">' +
          '<a class="nav-toplink" href="' + escapeHtml(item.href) + '"' +
            (hasChildren ? ' aria-haspopup="true"' : "") +
          ">" + escapeHtml(item.label) +
          (hasChildren ? ' <span class="nav-caret" aria-hidden="true">▾</span>' : "") +
          "</a>" +
          dropdown +
        "</div>"
      );
    }).join("");
  }

  function renderMobileNav(nav) {
    // The label is always a real link to the category's landing page; a
    // separate caret button expands/collapses the subpage list, so tapping
    // the label navigates and tapping the caret does not.
    return nav.map(function (item) {
      var hasChildren = item.children && item.children.length;
      if (!hasChildren) {
        return (
          '<div class="mobile-nav-group">' +
            '<a class="mobile-nav-link" href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + "</a>" +
          "</div>"
        );
      }
      return (
        '<div class="mobile-nav-group" data-nav-key="' + item.key + '">' +
          '<div class="mobile-nav-group-row">' +
            '<a class="mobile-nav-link" href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + "</a>" +
            '<button type="button" class="mobile-nav-caret-btn" aria-expanded="false" aria-label="Sýna undirsíður fyrir ' + escapeHtml(item.label) + '">' +
              '<span class="nav-caret" aria-hidden="true">▾</span>' +
            "</button>" +
          "</div>" +
          '<div class="mobile-nav-sublist">' +
            item.children.map(function (child) {
              var extra = child.external ? ' target="_blank" rel="noopener"' : "";
              return '<a href="' + escapeHtml(child.href) + '"' + extra + ">" + escapeHtml(child.label) + "</a>";
            }).join("") +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  // Emergency banner (CLAUDE.md Section 8). Shrink state persists across
  // page navigation within the same tab via sessionStorage — but the key
  // is scoped to this specific banner's LastUpdated, not a fixed name, so
  // saving a NEW banner (a new LastUpdated) always starts full-size again
  // even if the visitor already shrank a previous alert earlier in the
  // same session. Falling back to bannerText when LastUpdated is missing
  // keeps this safe against older/partially-seeded banner Blobs.
  function bannerShrinkKey(banner) {
    return "bk-banner-shrunk:" + (banner.LastUpdated || banner.bannerText || "");
  }

  function renderBanner(banner) {
    var mount = document.getElementById("site-banner");
    if (!mount) return;

    if (!banner || !banner.active || !banner.bannerText) {
      mount.innerHTML = "";
      mount.classList.remove("is-visible", "is-shrunk");
      return;
    }

    var shrinkKey = bannerShrinkKey(banner);
    var isShrunk = false;
    try {
      isShrunk = sessionStorage.getItem(shrinkKey) === "1";
    } catch (e) {
      isShrunk = false;
    }

    mount.innerHTML =
      '<div class="site-banner-full">' +
        '<div class="site-banner-inner">' +
          (banner.imageURL ? '<img class="site-banner-image" src="' + escapeHtml(banner.imageURL) + '" alt="">' : "") +
          '<p class="site-banner-text">' + escapeHtml(banner.bannerText) + "</p>" +
          '<button type="button" class="site-banner-shrink-btn" aria-label="Minnka tilkynningu">' +
            '<span aria-hidden="true">&ndash;</span>' +
          "</button>" +
        "</div>" +
      "</div>" +
      '<button type="button" class="site-banner-pill" aria-label="Sýna tilkynningu í fullri stærð">' +
        '<span class="site-banner-pill-dot" aria-hidden="true"></span>' +
        '<span class="site-banner-pill-text">' + escapeHtml(banner.bannerText) + "</span>" +
      "</button>";

    mount.classList.add("is-visible");
    mount.classList.toggle("is-shrunk", isShrunk);

    function setShrunk(shrunk) {
      mount.classList.toggle("is-shrunk", shrunk);
      try {
        if (shrunk) sessionStorage.setItem(shrinkKey, "1");
        else sessionStorage.removeItem(shrinkKey);
      } catch (e) {
        /* sessionStorage unavailable (private mode etc.) — safe to skip */
      }
    }

    mount.querySelector(".site-banner-shrink-btn").addEventListener("click", function () {
      setShrunk(true);
    });
    // Not a full dismiss — clicking the shrunk pill brings the full banner
    // back rather than clearing it for the rest of the session.
    mount.querySelector(".site-banner-pill").addEventListener("click", function () {
      setShrunk(false);
    });
  }

  function renderBadges(settings, cssClass) {
    return settings.externalBadges.map(function (b) {
      return '<a class="badge-link ' + cssClass + '" href="' + escapeHtml(b.href) + '" target="_blank" rel="noopener">' + escapeHtml(b.label) + "</a>";
    }).join("");
  }

  function renderHeader(data) {
    var mount = document.getElementById("site-header");
    if (!mount) return;

    var settings = data.settings;

    mount.innerHTML =
      '<div class="site-header-inner">' +
        '<a class="brand" href="/index.html" aria-label="' + escapeHtml(settings.schoolName) + ' — Forsíða">' +
          '<span class="brand-logo-slot" aria-hidden="true"></span>' +
          '<span class="brand-text"><strong>' + escapeHtml(settings.schoolName) + "</strong><small>Kópavogur</small></span>" +
        "</a>" +
        '<nav class="main-nav" aria-label="Aðalvalmynd">' + renderDesktopNav(data.nav) + "</nav>" +
        '<div class="header-badges">' + renderBadges(settings, "badge-desktop") + "</div>" +
        '<button type="button" class="search-trigger-btn" aria-label="Leita á vefnum" aria-haspopup="dialog">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<circle cx="10.3" cy="10.3" r="6.3"/><path d="M15.1 15.1 20 20"/>' +
          "</svg>" +
        "</button>" +
        '<button type="button" class="hamburger-toggle" aria-label="Opna valmynd" aria-expanded="false" aria-controls="mobile-nav">' +
          "<span></span>" +
        "</button>" +
      "</div>" +
      '<div class="mobile-nav" id="mobile-nav">' +
        '<div class="mobile-nav-panel">' +
          '<div class="mobile-nav-head">' +
            '<strong>' + escapeHtml(settings.schoolName) + "</strong>" +
            '<button type="button" class="mobile-nav-close" aria-label="Loka valmynd">×</button>' +
          "</div>" +
          renderMobileNav(data.nav) +
          '<div class="mobile-nav-badges">' + renderBadges(settings, "badge-mobile") + "</div>" +
        "</div>" +
      "</div>";

    wireHeaderInteractions(mount);
  }

  function wireHeaderInteractions(mount) {
    // Desktop dropdowns are pure CSS: revealed on :hover and on
    // :focus-within (keyboard tab), no click handler needed since the label
    // itself is a real link to the category's landing page.

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeMobileNav();
      }
    });

    // Hamburger + mobile panel
    var hamburger = mount.querySelector(".hamburger-toggle");
    var mobileNav = mount.querySelector("#mobile-nav");
    var closeBtn = mount.querySelector(".mobile-nav-close");

    function openMobileNav() {
      mobileNav.classList.add("is-open");
      hamburger.classList.add("is-active");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeMobileNav() {
      mobileNav.classList.remove("is-open");
      hamburger.classList.remove("is-active");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    hamburger.addEventListener("click", function () {
      if (mobileNav.classList.contains("is-open")) closeMobileNav();
      else openMobileNav();
    });
    closeBtn.addEventListener("click", closeMobileNav);
    mobileNav.addEventListener("click", function (e) {
      if (e.target === mobileNav) closeMobileNav();
    });

    // Mobile accordion groups — the caret button toggles the sublist only;
    // the label next to it is a plain link and navigates as normal.
    mobileNav.querySelectorAll(".mobile-nav-caret-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.closest(".mobile-nav-group");
        var isOpen = group.classList.contains("is-open");
        mobileNav.querySelectorAll(".mobile-nav-group").forEach(function (g) {
          g.classList.remove("is-open");
          var b = g.querySelector(".mobile-nav-caret-btn");
          if (b) b.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          group.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    // Close mobile nav automatically once viewport grows past the breakpoint
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMobileNav();
    });
  }

  function renderQuickLinks(data) {
    // Every page ships the #quick-links mount point (empty by default).
    // It only fills when site-wide quickLinks.enabled is true, or the mount
    // is explicitly force-shown (the homepage marks its mount this way, per
    // CLAUDE.md Section 5b) — so turning it on elsewhere is a settings
    // change, not a template edit.
    var mount = document.getElementById("quick-links");
    if (!mount) return;

    var quickLinks = data.settings.quickLinks;
    if (!quickLinks || !quickLinks.items || !quickLinks.items.length) return;

    var forceShow = mount.hasAttribute("data-force-show");
    if (!forceShow && !quickLinks.enabled) return;

    var icons = window.QuickLinkIcons;
    mount.innerHTML =
      '<div class="quick-links-row">' +
      quickLinks.items.map(function (item) {
        var svg = icons ? icons.get(item.icon) : "";
        return (
          '<a class="quick-link-item" href="' + escapeHtml(item.url) + '">' +
            '<span class="quick-link-icon" aria-hidden="true">' + svg + "</span>" +
            '<span class="quick-link-label">' + escapeHtml(item.label) + "</span>" +
          "</a>"
        );
      }).join("") +
      "</div>";
  }

  function renderBackButton() {
    var mount = document.getElementById("back-nav");
    if (!mount) return;
    mount.innerHTML =
      '<a href="/index.html" class="back-button" id="back-button-link">' +
        '<span aria-hidden="true">←</span> Til baka' +
      "</a>";
    document.getElementById("back-button-link").addEventListener("click", function (e) {
      if (window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
  }

  function renderFooter(data) {
    var mount = document.getElementById("site-footer");
    if (!mount) return;
    var s = data.settings;

    var phoneLines = s.phoneNumbers.map(function (p) {
      return '<a class="footer-contact-link" href="tel:' + escapeHtml(p.tel) + '">' + ICON_PHONE + escapeHtml(p.label) + ": " + escapeHtml(p.number) + "</a>";
    }).join("");

    var hoursLines = s.officeHours.map(function (h) {
      return "<p>" + escapeHtml(h.days) + ": " + escapeHtml(h.hours) + "</p>";
    }).join("");

    // Optional — Site Info's principalEmail field can be blank/cleared, so
    // this renders nothing (no stray <br> or empty mailto: link) unless a
    // real, non-whitespace value is actually set.
    var principalEmailLine = s.principalEmail && s.principalEmail.trim()
      ? '<br><a class="footer-contact-link" href="mailto:' + escapeHtml(s.principalEmail) + '">' + ICON_MAIL + escapeHtml(s.principalEmail) + "</a>"
      : "";

    mount.innerHTML =
      '<div class="site-footer-inner">' +
        '<div class="footer-col">' +
          '<div class="footer-brand"><span class="brand-logo-slot" aria-hidden="true" style="width:36px;height:36px;font-size:14px"></span><strong>' + escapeHtml(s.schoolName) + "</strong></div>" +
          "<p>" + escapeHtml(s.address.text) + "</p>" +
          '<a href="' + escapeHtml(s.address.mapUrl) + '" target="_blank" rel="noopener">Skoða á korti</a>' +
        "</div>" +
        '<div class="footer-col">' +
          "<h3>Hafa samband</h3>" +
          phoneLines +
          '<a class="footer-contact-link" href="mailto:' + escapeHtml(s.officeEmail) + '">' + ICON_MAIL + escapeHtml(s.officeEmail) + "</a>" +
        "</div>" +
        '<div class="footer-col">' +
          "<h3>Opnunartími</h3>" +
          hoursLines +
          "<p style=\"margin-top:12px\">Skólastjóri: " + escapeHtml(s.principalName) + principalEmailLine + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="footer-bottom">' +
        "<span>&copy; " + new Date().getFullYear() + " " + escapeHtml(s.schoolName) + "</span>" +
        '<a href="#" onclick="return false" tabindex="-1" aria-hidden="true"></a>' +
      "</div>";
  }

  function renderPageContent(data) {
    // Leaves the hand-authored placeholder markup in .page-content alone
    // whenever there's no real content yet (page not seeded) — see
    // js/render-content.js's renderContentInto for the "not seeded" contract.
    var container = document.querySelector("#main-content .page-content");
    if (!container || !window.RenderContent) return;
    if (data.page && data.page.content) {
      window.RenderContent.renderContentInto(container, data.page.content);
    }
  }

  function init() {
    var cached = getCachedData();
    var renderChrome = function (data) {
      renderBanner(data.banner);
      renderQuickContact(data.settings);
      renderHeader(data);
      renderBackButton();
      renderQuickLinks(data);
      renderFooter(data);
    };

    // Cache covers only the shared chrome (nav/settings/banner) — CLAUDE.md's
    // "fetched once per session, reused across every page" rule. Page
    // content is deliberately EXCLUDED and NEVER rendered from this cache:
    // each page is its own Blob entry fetched fresh via get-page-data.js, so
    // a cache hit here is keyed to whatever slug was last fetched in this
    // tab — reusing it for .page-content would show a stale (or, worse, a
    // completely different page's) body after navigating or after an edit.
    // Rendering it now is a same-session instant-paint optimization only;
    // the real fetch below always runs regardless, and its result is what
    // actually renders the page content and gets cached for next time.
    if (cached) {
      renderChrome(cached);
    }

    window.SiteData.load().then(function (data) {
      setCachedData(data);
      renderChrome(data);
      renderPageContent(data);
      // Lets page-specific scripts (e.g. homepage.js's news grid) react to
      // the same fetched data without re-fetching or re-reading sessionStorage
      // themselves.
      window.dispatchEvent(new CustomEvent("sitedata:ready", { detail: data }));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
