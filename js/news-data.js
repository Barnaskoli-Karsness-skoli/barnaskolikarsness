/**
 * news-data.js
 * Mock news list standing in for the `news` Blob entries (see CLAUDE.md
 * "News & Banner" — each item is its own `news:<id>` Blob). Phase 5/6 swap
 * NewsData.items for a real fetch of the shared news list; homepage.js
 * already treats it as an array sorted newest-first, so the swap is
 * transparent to the rendering code. No longer read at runtime (homepage.js
 * fetches list-news.js instead) — this file now only feeds
 * scripts/seed-content.js's own hand-mirrored NEWS_ITEMS array.
 *
 * TEST-ONLY DATA: the `coverImage` fields below (picsum.photos URLs) are
 * placeholder images added purely to visually verify the news cover-image
 * feature's crop-to-fill behavior (landscape + portrait sources both
 * filling a 16:9 box via object-fit: cover) — NOT real school photos, and
 * NOT mirrored into scripts/seed-content.js's NEWS_ITEMS. Do not carry
 * these into real seed content; strip them once the feature's been
 * eyeballed, or replace with the school's own images.
 */
(function (global) {
  "use strict";

  var ITEMS = [
    {
      id: "vetrarfri-2026",
      date: "2026-09-20",
      title: "Vetrarfrí framundan",
      excerpt: "Minnum á að vetrarfrí grunnskólastigs er dagana sem koma fram á skóladagatali. Leikskólastig og Frístund fylgja sama dagatali — sjá nánar á síðum hvers skólastigs."
    },
    {
      id: "haustfagnadur-2026",
      date: "2026-09-12",
      title: "Haustfagnaður skólans",
      excerpt: "Árlegur haustfagnaður Barnaskóla Kársness var haldinn með glæsibrag. Þakkir til allra sem lögðu hönd á plóg — nemenda, starfsfólks og foreldrafélagsins.",
      // TEST-ONLY placeholder (landscape source) — see file header.
      coverImage: { url: "https://picsum.photos/seed/haustfagnadur/1000/560", alt: "Prufumynd (langsnið) — ekki alvöru fréttamynd, aðeins til að prófa útlit forsíðumyndar." }
    },
    {
      id: "ny-heimasida",
      date: "2026-09-01",
      title: "Ný heimasíða skólans komin í loftið",
      excerpt: "Barnaskóli Kársness hefur tekið í notkun nýja heimasíðu. Síðan verður í stöðugri þróun næstu vikur og mánuði eftir því sem efni bætist við."
    },
    {
      id: "skolasetning-2026",
      date: "2026-08-22",
      title: "Skólasetning haustannar",
      excerpt: "Skólasetning fór fram með pomp og prakt. Við bjóðum alla nemendur, nýja sem gamla, velkomna til náms á nýju skólaári.",
      // TEST-ONLY placeholder (portrait source) — see file header.
      coverImage: { url: "https://picsum.photos/seed/skolasetning/500/900", alt: "Prufumynd (skammsnið) — ekki alvöru fréttamynd, aðeins til að prófa útlit forsíðumyndar." }
    },
    {
      id: "starfsdagur-agust",
      date: "2026-08-18",
      title: "Starfsdagur starfsfólks",
      excerpt: "Starfsfólk skólans kom saman til undirbúnings fyrir komandi skólaár. Áhersla var lögð á fagþróun og skipulag vetrarins."
    },
    {
      id: "sumarleyfi-2026",
      date: "2026-06-05",
      title: "Sumarleyfi framundan",
      excerpt: "Skólastarfi lýkur formlega í byrjun júní. Skrifstofa skólans verður með takmarkaða viðveru yfir sumarið — sjá opnunartíma í síðufæti."
    },
    {
      id: "utskrift-2026",
      date: "2026-05-29",
      title: "Útskrift elstu nemenda",
      excerpt: "Elstu nemendur skólans voru kvaddir með hátíðlegri athöfn. Við óskum þeim alls hins besta á næsta skólastigi.",
      // TEST-ONLY placeholder (portrait source) — see file header.
      coverImage: { url: "https://picsum.photos/seed/utskrift/480/860", alt: "Prufumynd (skammsnið) — ekki alvöru fréttamynd, aðeins til að prófa útlit forsíðumyndar." }
    },
    {
      id: "vorhatid-2026",
      date: "2026-05-15",
      title: "Vorhátíð Barnaskóla Kársness",
      excerpt: "Vorhátíð skólans var haldin með fjölbreyttri dagskrá — sýningum, tónlist og útimarkaði í umsjón foreldrafélagsins.",
      // TEST-ONLY placeholder (landscape source) — see file header.
      coverImage: { url: "https://picsum.photos/seed/vorhatid/1000/560", alt: "Prufumynd (langsnið) — ekki alvöru fréttamynd, aðeins til að prófa útlit forsíðumyndar." }
    }
  ];

  global.NewsData = { items: ITEMS };
})(window);
