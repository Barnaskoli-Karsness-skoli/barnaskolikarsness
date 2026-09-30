/**
 * site-data.js
 * Placeholder nav config + site-settings, shaped exactly like the combined
 * read the Phase 5 Netlify Function will return (see CLAUDE.md "Performance
 * optimizations" — one combined read per page load). Phase 6 swaps
 * SiteData.load() for a real fetch; every consumer (site.js, admin, footer)
 * reads through SiteData so that swap touches one place only.
 */

// Netlify Identity invite/confirmation/recovery/email-change emails always
// link to the site root (SiteURL) — there's no per-link way to point them
// at /admin instead — but the actual Identity widget only loads on
// admin.html. Without this, a new editor clicking "accept invite" (or
// resetting a password) lands on the public homepage with the token
// stranded in the URL hash and nothing happens. This file is the first
// shared <script> tag on every one of the 23 public pages (loaded before
// site.js, render-content.js, etc.), so it's the earliest point available
// to catch that hash and bounce straight to admin.html — with the token
// still attached — before any of the rest of the page's own JS/rendering
// runs. Deliberately does NOT load the Identity widget itself here; that
// stays admin-only (CLAUDE.md: "Editor.js/Identity never ship to the
// public 30 pages"), this is just the redirect.
//
// admin.html also loads this same file (js/site-data.js is shared, not
// public-only), so the pathname check below is required, not optional —
// without it, arriving at admin.html#confirmation_token=... (whether via
// this very redirect, or a link that already pointed straight at it)
// would immediately try to redirect to itself again.
(function () {
  "use strict";
  var hash = window.location.hash;
  var onAdminPage = /(^|\/)admin\.html$/.test(window.location.pathname);
  if (!onAdminPage && hash && /^#(confirmation_token|invite_token|recovery_token|email_change_token)=/.test(hash)) {
    // The admin page is admin.html at the project root (no admin/index.html
    // exists, and netlify.toml has no redirect rules) — "/admin/" would 404.
    window.location.replace("/admin.html" + hash);
  }
})();

(function (global) {
  "use strict";

  var NAV = [
    {
      key: "forsida",
      label: "Forsíða",
      href: "/index.html",
      children: [
        { label: "Unicef verkefni", href: "https://unicef.is", external: true },
        { label: "Barnaheill", href: "https://barnaheill.is", external: true }
      ]
    },
    {
      key: "leikskolastig",
      label: "Leikskólastig",
      href: "/leikskolastig/index.html",
      children: [
        { label: "Skóladagatal", href: "/leikskolastig/skoladagatal.html" },
        { label: "Leyfistilkynning", href: "/leikskolastig/leyfistilkynning.html" },
        { label: "Reglur", href: "/leikskolastig/reglur.html" },
        { label: "Vala app", href: "/leikskolastig/vala-app.html" },
        { label: "Matseðill", href: "/leikskolastig/matsedill.html" },
        { label: "Skólabíll", href: "/leikskolastig/skolabill.html" },
        { label: "Lubbi finnur málbein", href: "/leikskolastig/lubbi-finnur-malbein.html" }
      ]
    },
    {
      key: "grunnskolastig",
      label: "Grunnskólastig",
      href: "/grunnskolastig/index.html",
      children: [
        { label: "Skóladagatal", href: "/grunnskolastig/skoladagatal.html" },
        { label: "Leyfisbeiðnir", href: "/grunnskolastig/leyfisbeidnir.html" },
        { label: "Reglur um skólasókn", href: "/grunnskolastig/reglur-um-skolasokn.html" },
        { label: "Mentor app", href: "/grunnskolastig/mentor-app.html" },
        { label: "Matseðill", href: "/grunnskolastig/matsedill.html" }
      ]
    },
    {
      key: "fristund",
      label: "Frístund",
      href: "/fristund/index.html",
      children: [
        { label: "Frístundabíll", href: "/fristund/fristundabill.html" },
        { label: "Dagskipulag", href: "/fristund/dagskipulag.html" },
        { label: "Reglur", href: "/fristund/reglur.html" },
        { label: "Leyfistilkynning", href: "/fristund/leyfistilkynning.html" }
      ]
    },
    {
      key: "foreldrarad",
      label: "Foreldrar",
      href: "/foreldrarad/index.html",
      children: [
        { label: "Foreldrafélag", href: "/foreldrarad/foreldrafelag.html" }
      ]
    }
  ];

  // Initial values only — admin-editable via the Site Info tab once Phase 7
  // ships. Source: CLAUDE.md "Confirmed Real-World Data" / Contact_info_box.txt.
  var SITE_SETTINGS = {
    schoolName: "Barnaskóli Kársness",
    principalName: "Gerður Magnúsdóttir",
    principalEmail: "",
    officeEmail: "barnaskolikarsness@kopavogur.is",
    phoneNumbers: [
      { label: "Skrifstofa", number: "441-7000", tel: "+3544417000" }
    ],
    address: {
      text: "Skólagerði 8, 200 Kópavogur",
      mapUrl: "https://ja.is/kort/?d=hashid%3AvMw014&x=357576&y=404392&type=map&nz=14.31"
    },
    officeHours: [
      { days: "Mán – Fim", hours: "08:00–15:30" },
      { days: "Fös", hours: "08:00–15:00" }
    ],
    externalBadges: [
      { label: "Unicef Ísland", href: "https://unicef.is" },
      { label: "Barnaheill", href: "https://barnaheill.is" }
    ],
    // Section 5b — separate from Linked Resources, same {icon,label,url}
    // shape. `enabled` is the site-wide toggle for non-homepage pages; the
    // homepage always renders its items regardless (see js/site.js).
    // Source list carried over from the old site, not a final selection.
    quickLinks: {
      enabled: false,
      items: [
        { icon: "matsedill", label: "Matseðill", url: "/leikskolastig/matsedill.html" },
        { icon: "skoladagatal", label: "Skóladagatal", url: "/leikskolastig/skoladagatal.html" },
        { icon: "vinaholl", label: "Vinahóll", url: "#" },
        { icon: "leyfisbeidni", label: "Leyfisbeiðni", url: "/grunnskolastig/leyfisbeidnir.html" },
        { icon: "mentor", label: "Mentor", url: "/grunnskolastig/mentor-app.html" },
        { icon: "farsaeld", label: "Farsæld", url: "#" },
        { icon: "einelti", label: "Einelti / Bullying", url: "#" }
      ]
    },
    // Homepage carousel (Section 13.2) — admin-editable add/remove/reorder
    // list, managed from Phase 7's admin (admin/js/admin.js's carousel
    // manager). The public homepage still renders the Phase 4/6 static
    // placeholder slides for now; wiring index.html's carousel to read
    // from this field is separate follow-up work, not done yet.
    carouselImages: []
  };

  var FUNCTIONS_BASE = "/.netlify/functions";

  // The slug get-page-data.js needs is exactly the value every page's
  // <main data-page-key="..."> already carries (Phase 3's template
  // contract) — same string, no transformation.
  function currentPageSlug() {
    var main = document.querySelector("main[data-page-key]");
    return main ? main.getAttribute("data-page-key") : null;
  }

  var SiteData = {
    nav: NAV,
    // Local fallback values — used whenever the real settings/banner Blobs
    // come back empty (not seeded yet) or the fetch itself fails, so the
    // site's chrome (header/footer/quick-contact) never breaks just
    // because the backend has nothing written yet.
    settings: SITE_SETTINGS,

    load: function () {
      var slug = currentPageSlug();

      if (!slug) {
        // No data-page-key on this page (shouldn't happen on a real page,
        // but keeps this safe to call from anywhere) — nothing to fetch.
        return Promise.resolve({ nav: NAV, settings: SITE_SETTINGS, banner: null, page: null, news: null, slug: null });
      }

      return fetch(FUNCTIONS_BASE + "/get-page-data?slug=" + encodeURIComponent(slug))
        .then(function (response) {
          if (!response.ok) throw new Error("get-page-data responded with HTTP " + response.status);
          return response.json();
        })
        .then(function (data) {
          return {
            nav: NAV,
            settings: data.settings || SITE_SETTINGS,
            banner: data.banner || null,
            page: data.page || null,
            news: data.news || null,
            slug: data.slug || slug
          };
        })
        .catch(function (err) {
          // Backend unreachable (e.g. running this file:// with no
          // `netlify dev`) or not yet seeded — fall back to local defaults
          // rather than leaving every page's chrome unrendered.
          console.error("SiteData.load(): falling back to local defaults —", err);
          return { nav: NAV, settings: SITE_SETTINGS, banner: null, page: null, news: null, slug: slug };
        });
    }
  };

  global.SiteData = SiteData;
})(window);
