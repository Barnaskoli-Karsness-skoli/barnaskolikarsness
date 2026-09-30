/**
 * seed-content.js
 * One-time seed script (CLAUDE.md Phase 6, item 4): writes the same
 * placeholder copy already hand-authored into each page's .page-content
 * (Phase 3/4) into real page:<slug> Blob entries as Editor.js JSON, plus
 * the mock news-data.js entries into real news:<id> Blob entries — so the
 * site has real Blob content to fetch from day one instead of relying on
 * every page's static placeholder markup as a permanent fallback.
 *
 * A regex/HTML-scraping version of this script was considered and
 * rejected: 21 pages with slightly different markup shapes made that
 * fragile for a one-time job. Transcribing the same text directly into
 * Editor.js blocks here is slower to write but impossible to get subtly
 * wrong by mis-parsing a tag.
 *
 * Run once, manually, after the site has a real Netlify project + site ID:
 *   NETLIFY_SITE_ID=<id> NETLIFY_AUTH_TOKEN=<personal access token> node scripts/seed-content.js
 *
 * Uses @netlify/blobs directly (not through save-page.js/save-news.js) —
 * this is a trusted local/CI operation run with real Netlify credentials,
 * not a public request that needs the Identity/domain check those
 * Functions enforce. It intentionally skips the search-index update, the
 * content backup, and the cache purge that those Functions do on every
 * save — this is a one-time bulk load before the site has any visitors or
 * cached reads to invalidate, not an editor's save action. Deploy once
 * after seeding so get-page-data.js's own reads warm up naturally.
 */
const { getStore } = require("@netlify/blobs");

function siteScopedStore(name) {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!siteID || !token) {
    throw new Error("NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN must both be set to run this script.");
  }
  return getStore({ name, siteID, token });
}

function p(text) {
  return { type: "paragraph", data: { text } };
}
function h(text, level) {
  return { type: "header", data: { text, level: level || 2 } };
}
function ul(items) {
  return { type: "list", data: { style: "unordered", items } };
}
function addLink(icon, label, url) {
  return { type: "addLink", data: { icon, label, url } };
}
function content(blocks) {
  return { time: Date.now(), version: "2.30.0", blocks };
}

// slug -> { title, content } — slug matches each page's data-page-key exactly.
const PAGES = {
  homepage: {
    title: "Barnaskóli Kársness",
    content: content([
      h("Velkomin í skólann okkar"),
      p("Barnaskóli Kársness er skóli fyrir leikskóla- og grunnskólabörn í Kópavogi, þar sem lögð er áhersla á öruggt og styðjandi námsumhverfi, gleði í leik og starfi, og náið samstarf við heimilin."),
      p("Hér á síðunni má finna nýjustu fréttir, hagnýtar upplýsingar fyrir hvert skólastig og leiðir til að hafa samband við skólann.")
    ])
  },

  "leikskolastig-index": {
    title: "Leikskólastig",
    content: content([
      p("Leikskólastig Barnaskóla Kársness er heimili yngstu barnanna okkar. Þar er lögð áhersla á leik, öryggi og hlýlegt umhverfi þar sem hvert barn fær að vaxa og dafna á eigin hraða í nánu samstarfi við foreldra og forsjáraðila."),
      p("Hér að neðan er hægt að nálgast skóladagatal, reglur, matseðil og aðrar hagnýtar upplýsingar sem varða leikskólastigið."),
      h("Upplýsingar og hlekkir"),
      ul([
        '<a href="/leikskolastig/skoladagatal.html">Skóladagatal</a>',
        '<a href="/leikskolastig/leyfistilkynning.html">Leyfistilkynning</a>',
        '<a href="/leikskolastig/reglur.html">Reglur</a>',
        '<a href="/leikskolastig/vala-app.html">Vala app</a>',
        '<a href="/leikskolastig/matsedill.html">Matseðill</a>',
        '<a href="/leikskolastig/skolabill.html">Skólabíll</a>',
        '<a href="/leikskolastig/lubbi-finnur-malbein.html">Lubbi finnur málbein</a>'
      ])
    ])
  },

  "leikskolastig-skoladagatal": {
    title: "Skóladagatal",
    content: content([
      p("Hér má finna skóladagatal leikskólastigs Barnaskóla Kársness fyrir yfirstandandi skólaár, þar á meðal skipulagsdaga, frídaga og aðrar mikilvægar dagsetningar."),
      h("Skipulagsdagar"),
      p("Skipulagsdagar eru nýttir til undirbúnings og fagþróunar starfsfólks. Leikskólinn er lokaður þessa daga og foreldrar/forsjáraðilar eru upplýstir með góðum fyrirvara."),
      ul(["Dæmi um efnislið — skipulagsdagur (dagsetning fylgir þegar staðfest)", "Dæmi um efnislið — skipulagsdagur (dagsetning fylgir þegar staðfest)"]),
      h("Frídagar og leyfi"),
      p('Almennir frídagar fylgja skóladagatali Kópavogsbæjar. Sjá einnig <a href="/leikskolastig/leyfistilkynning.html">Leyfistilkynningu</a> fyrir tilkynningar um leyfi barns utan skipulagðra frídaga.'),
      h("Tengd skjöl"),
      addLink("calendar", "Skóladagatal (PDF)", "#"),
      addLink("document", "Nánari upplýsingar", "#")
    ])
  },

  "leikskolastig-leyfistilkynning": {
    title: "Leyfistilkynning",
    content: content([
      p("Ef barn þarf að vera fjarverandi frá leikskóla umfram skipulagða frídaga — til dæmis vegna ferðalags eða annarra ástæðna — biðjum við foreldra/forsjáraðila um að tilkynna það til leikskólans með góðum fyrirvara."),
      h("Hvernig er leyfi tilkynnt?"),
      p("Tilkynning um leyfi er send skriflega til deildarstjóra eða leikskólastjóra, eða eftir öðrum leiðum sem leikskólinn tilgreinir. Æskilegt er að tilkynna leyfi með að minnsta kosti viku fyrirvara þegar því verður við komið."),
      h("Hafa ber í huga"),
      ul(["Löng leyfi (lengri en tvær vikur) þarf að ræða sérstaklega við leikskólastjóra.", 'Sjá einnig <a href="/leikskolastig/skoladagatal.html">Skóladagatal</a> fyrir fasta frídaga.'])
    ])
  },

  "leikskolastig-reglur": {
    title: "Reglur",
    content: content([
      p("Hér má finna helstu reglur sem gilda á leikskólastigi Barnaskóla Kársness — settar til að tryggja öryggi, vellíðan og gott samstarf milli heimila og leikskóla."),
      h("Mæting og afhending"),
      p("Foreldrar/forsjáraðilar fylgja barni inn á deild og láta starfsfólk vita af komu og brottför. Aðeins þeir sem tilgreindir eru sem sækjendur mega sækja barnið, nema annað sé sérstaklega tilkynnt."),
      h("Fatnaður og búnaður"),
      p("Mælt er með að börn séu í fatnaði sem hentar útiveru og leik í öllum veðrum, merktum nafni þar sem því verður við komið."),
      h("Tengd skjöl"),
      addLink("document", "Reglur leikskólastigs (PDF)", "#")
    ])
  },

  "leikskolastig-vala-app": {
    title: "Vala app",
    content: content([
      p("Vala er appið sem leikskólastig Barnaskóla Kársness notar til daglegra samskipta við foreldra og forsjáraðila — þar á meðal tilkynningar, myndir úr starfinu og upplýsingar um daginn hjá barninu."),
      h("Að byrja að nota Vala"),
      p("Foreldrar/forsjáraðilar fá boð í appið við upphaf leikskóladvalar. Sé boð ekki komið er hægt að hafa samband við deildina."),
      h("Tengd skjöl"),
      addLink("link", "Sækja Vala appið", "#")
    ])
  },

  "leikskolastig-matsedill": {
    title: "Matseðill",
    content: content([
      p("Leikskólastig Barnaskóla Kársness leggur áherslu á fjölbreytta og næringarríka fæðu í samræmi við ráðleggingar um mataræði barna."),
      h("Ofnæmi og óþol"),
      p("Foreldrar/forsjáraðilar sem þurfa að tilkynna um ofnæmi eða fæðuóþol barns eru beðnir um að hafa samband við deildina eða skrifstofu leikskólans."),
      h("Tengd skjöl"),
      addLink("document", "Matseðill vikunnar (PDF)", "#")
    ])
  },

  "leikskolastig-skolabill": {
    title: "Skólabíll",
    content: content([
      p("Sum börn á leikskólastigi eiga rétt á akstursþjónustu til og frá leikskóla. Hér má finna upplýsingar um fyrirkomulag, tímasetningar og hvernig sótt er um þjónustuna."),
      h("Hvernig er sótt um?"),
      p("Umsókn um skólabíl er send til skrifstofu skólans. Nánari upplýsingar um skilyrði og afgreiðslutíma fást hjá skrifstofunni.")
    ])
  },

  "leikskolastig-lubbi-finnur-malbein": {
    title: "Lubbi finnur málbein",
    content: content([
      p("Lubbi finnur málbein er málörvunarverkefni sem notað er á leikskólastigi Barnaskóla Kársness til að styðja við hljóðkerfis- og málvitund barna á skemmtilegan og aðgengilegan hátt."),
      h("Hvernig er unnið með Lubba?"),
      p("Efnið er samofið daglegu starfi deildanna — meðal annars í gegnum söngva, sögur og leiki sem tengjast persónunni Lubba.")
    ])
  },

  "grunnskolastig-index": {
    title: "Grunnskólastig",
    content: content([
      p("Grunnskólastig Barnaskóla Kársness tekur við þar sem leikskólastigið sleppir og fylgir nemendum í gegnum grunnskólagönguna. Áhersla er lögð á fjölbreytta kennsluhætti, öflugt námsumhverfi og gott samstarf við heimilin."),
      p("Hér að neðan er hægt að nálgast skóladagatal, reglur um skólasókn, matseðil og aðrar hagnýtar upplýsingar sem varða grunnskólastigið."),
      h("Upplýsingar og hlekkir"),
      ul([
        '<a href="/grunnskolastig/skoladagatal.html">Skóladagatal</a>',
        '<a href="/grunnskolastig/leyfisbeidnir.html">Leyfisbeiðnir</a>',
        '<a href="/grunnskolastig/reglur-um-skolasokn.html">Reglur um skólasókn</a>',
        '<a href="/grunnskolastig/mentor-app.html">Mentor app</a>',
        '<a href="/grunnskolastig/matsedill.html">Matseðill</a>'
      ])
    ])
  },

  "grunnskolastig-skoladagatal": {
    title: "Skóladagatal",
    content: content([
      p("Hér má finna skóladagatal grunnskólastigs Barnaskóla Kársness fyrir yfirstandandi skólaár, þar á meðal skipulagsdaga, frídaga og aðrar mikilvægar dagsetningar."),
      h("Skipulagsdagar"),
      p("Skipulagsdagar eru nýttir til undirbúnings og fagþróunar starfsfólks. Skólinn er lokaður þessa daga og foreldrar/forsjáraðilar eru upplýstir með góðum fyrirvara."),
      ul(["Dæmi um efnislið — skipulagsdagur (dagsetning fylgir þegar staðfest)", "Dæmi um efnislið — skipulagsdagur (dagsetning fylgir þegar staðfest)"]),
      h("Frídagar og leyfi"),
      p('Almennir frídagar fylgja skóladagatali Kópavogsbæjar. Sjá einnig <a href="/grunnskolastig/leyfisbeidnir.html">Leyfisbeiðnir</a> fyrir umsóknir um leyfi barns utan skipulagðra frídaga.'),
      h("Tengd skjöl"),
      addLink("calendar", "Skóladagatal (PDF)", "#")
    ])
  },

  "grunnskolastig-leyfisbeidnir": {
    title: "Leyfisbeiðnir",
    content: content([
      p("Ef nemandi þarf leyfi frá skóla umfram skipulagða frídaga — til dæmis vegna ferðalags — þarf að senda inn formlega leyfisbeiðni."),
      h("Hvernig er sótt um leyfi?"),
      p("Leyfisbeiðni er send skriflega til umsjónarkennara, eða eftir öðrum leiðum sem skólinn tilgreinir, með góðum fyrirvara. Umsjónarkennari metur beiðnina og upplýsir um niðurstöðu."),
      h("Hafa ber í huga"),
      ul(["Löng leyfi (lengri en tvær vikur) þarf að ræða sérstaklega við skólastjórnendur.", 'Sjá einnig <a href="/grunnskolastig/reglur-um-skolasokn.html">Reglur um skólasókn</a>.'])
    ])
  },

  "grunnskolastig-reglur-um-skolasokn": {
    title: "Reglur um skólasókn",
    content: content([
      p("Regluleg skólasókn er mikilvæg forsenda náms og vellíðunar nemenda. Hér má finna helstu reglur sem gilda um mætingar og fjarvistir á grunnskólastigi Barnaskóla Kársness."),
      h("Skráning fjarvista"),
      p("Foreldrar/forsjáraðilar tilkynna fjarvistir til umsjónarkennara eða skrifstofu skólans eins fljótt og hægt er, helst fyrir upphaf skóladags."),
      h("Ítrekaðar fjarvistir"),
      p("Ef fjarvistir verða ítrekaðar eða langvarandi hefur skólinn samband við foreldra/forsjáraðila til að finna lausn í sameiningu."),
      h("Tengd skjöl"),
      addLink("document", "Reglur um skólasókn (PDF)", "#")
    ])
  },

  "grunnskolastig-mentor-app": {
    title: "Mentor app",
    content: content([
      p("Mentor er upplýsingakerfi grunnskólastigs Barnaskóla Kársness þar sem foreldrar/forsjáraðilar og nemendur geta fylgst með stundatöflu, verkefnum, einkunnum og samskiptum við kennara."),
      h("Aðgangur að Mentor"),
      p("Foreldrar/forsjáraðilar fá aðgang að Mentor við upphaf skólagöngu barns. Ef aðgang vantar er hægt að hafa samband við skrifstofu skólans."),
      h("Tengd skjöl"),
      addLink("link", "Opna Mentor", "#")
    ])
  },

  "grunnskolastig-matsedill": {
    title: "Matseðill",
    content: content([
      p("Grunnskólastig Barnaskóla Kársness leggur áherslu á fjölbreytta og næringarríka fæðu í samræmi við ráðleggingar um mataræði barna og unglinga."),
      h("Ofnæmi og óþol"),
      p("Foreldrar/forsjáraðilar sem þurfa að tilkynna um ofnæmi eða fæðuóþol nemanda eru beðnir um að hafa samband við skrifstofu skólans."),
      h("Tengd skjöl"),
      addLink("document", "Matseðill vikunnar (PDF)", "#")
    ])
  },

  "fristund-index": {
    title: "Frístund",
    content: content([
      p("Frístund er frístundaheimili fyrir nemendur Barnaskóla Kársness utan hefðbundins skólatíma. Þar er boðið upp á fjölbreytt og skemmtilegt starf í öruggu umhverfi undir leiðsögn starfsfólks."),
      p("Hér að neðan er hægt að nálgast dagskipulag, reglur og aðrar hagnýtar upplýsingar sem varða Frístund."),
      h("Upplýsingar og hlekkir"),
      ul([
        '<a href="/fristund/fristundabill.html">Frístundabíll</a>',
        '<a href="/fristund/dagskipulag.html">Dagskipulag</a>',
        '<a href="/fristund/reglur.html">Reglur</a>',
        '<a href="/fristund/leyfistilkynning.html">Leyfistilkynning</a>'
      ])
    ])
  },

  "fristund-fristundabill": {
    title: "Frístundabíll",
    content: content([
      p("Sum börn sem sækja Frístund eiga rétt á akstursþjónustu að lokinni dvöl. Hér má finna upplýsingar um fyrirkomulag og tímasetningar."),
      h("Hvernig er sótt um?"),
      p("Umsókn um frístundabíl er send til skrifstofu skólans eða Frístundar. Nánari upplýsingar um skilyrði og afgreiðslutíma fást þar.")
    ])
  },

  "fristund-dagskipulag": {
    title: "Dagskipulag",
    content: content([
      p("Frístund býður upp á fjölbreytt og skemmtilegt starf fyrir nemendur eftir að hefðbundnum skóladegi lýkur. Hér má sjá almennt dagskipulag starfsins."),
      h("Dæmi um dagskrá"),
      ul(["Móttaka og frjáls leikur", "Skipulögð hreyfing eða skapandi starf", "Nesti/kaffitími", "Útivera", "Rólegar stundir og heimferð"]),
      p("Nákvæm tímasetning og fyrirkomulag getur verið breytilegt eftir árstíma og aldri barna.")
    ])
  },

  "fristund-reglur": {
    title: "Reglur",
    content: content([
      p("Hér má finna helstu reglur sem gilda í Frístund — settar til að tryggja öryggi, vellíðan og gott samstarf milli heimila og starfsfólks."),
      h("Afhending barna"),
      p("Aðeins þeir sem tilgreindir eru sem sækjendur mega sækja barn úr Frístund, nema annað sé sérstaklega tilkynnt fyrirfram."),
      h("Tengd skjöl"),
      addLink("document", "Reglur Frístundar (PDF)", "#")
    ])
  },

  "fristund-leyfistilkynning": {
    title: "Leyfistilkynning",
    content: content([
      p("Ef barn þarf að vera fjarverandi frá Frístund — til dæmis vegna ferðalags eða annarra ástæðna — biðjum við foreldra/forsjáraðila um að tilkynna það með góðum fyrirvara."),
      h("Hvernig er leyfi tilkynnt?"),
      p("Tilkynning um leyfi er send til starfsfólks Frístundar eða skrifstofu skólans.")
    ])
  },

  "foreldrarad-index": {
    title: "Foreldraráð",
    content: content([
      p("Foreldraráð Barnaskóla Kársness er samráðsvettvangur foreldra og forsjáraðila um skólastarfið. Ráðið er skólanum til ráðgjafar og stuðlar að góðu samstarfi milli heimila og skóla."),
      p("Hér að neðan er hægt að nálgast upplýsingar um Foreldrafélag skólans."),
      h("Upplýsingar og hlekkir"),
      ul(['<a href="/foreldrarad/foreldrafelag.html">Foreldrafélag</a>'])
    ])
  },

  "foreldrarad-foreldrafelag": {
    title: "Foreldrafélag",
    content: content([
      p("Foreldrafélag Barnaskóla Kársness er vettvangur foreldra og forsjáraðila til að styðja við skólastarfið og efla samstarf milli heimila og skóla."),
      h("Hlutverk félagsins"),
      p("Foreldrafélagið stendur meðal annars fyrir viðburðum og verkefnum sem styrkja skólasamfélagið, í samstarfi við starfsfólk og Foreldraráð."),
      h("Þátttaka"),
      p("Allir foreldrar/forsjáraðilar nemenda Barnaskóla Kársness eru sjálfkrafa félagar í Foreldrafélaginu. Áhugasamir um að taka virkari þátt geta haft samband við skrifstofu skólans.")
    ])
  }
};

// Mirrors js/news-data.js exactly — same 8 mock entries, now as real
// news:<id> Blob records instead of a client-side placeholder array.
const NEWS_ITEMS = [
  { id: "vetrarfri-2026", date: "2026-09-20", title: "Vetrarfrí framundan", text: "Minnum á að vetrarfrí grunnskólastigs er dagana sem koma fram á skóladagatali. Leikskólastig og Frístund fylgja sama dagatali — sjá nánar á síðum hvers skólastigs." },
  { id: "haustfagnadur-2026", date: "2026-09-12", title: "Haustfagnaður skólans", text: "Árlegur haustfagnaður Barnaskóla Kársness var haldinn með glæsibrag. Þakkir til allra sem lögðu hönd á plóg — nemenda, starfsfólks og foreldrafélagsins." },
  { id: "ny-heimasida", date: "2026-09-01", title: "Ný heimasíða skólans komin í loftið", text: "Barnaskóli Kársness hefur tekið í notkun nýja heimasíðu. Síðan verður í stöðugri þróun næstu vikur og mánuði eftir því sem efni bætist við." },
  { id: "skolasetning-2026", date: "2026-08-22", title: "Skólasetning haustannar", text: "Skólasetning fór fram með pomp og prakt. Við bjóðum alla nemendur, nýja sem gamla, velkomna til náms á nýju skólaári." },
  { id: "starfsdagur-agust", date: "2026-08-18", title: "Starfsdagur starfsfólks", text: "Starfsfólk skólans kom saman til undirbúnings fyrir komandi skólaár. Áhersla var lögð á fagþróun og skipulag vetrarins." },
  { id: "sumarleyfi-2026", date: "2026-06-05", title: "Sumarleyfi framundan", text: "Skólastarfi lýkur formlega í byrjun júní. Skrifstofa skólans verður með takmarkaða viðveru yfir sumarið — sjá opnunartíma í síðufæti." },
  { id: "utskrift-2026", date: "2026-05-29", title: "Útskrift elstu nemenda", text: "Elstu nemendur skólans voru kvaddir með hátíðlegri athöfn. Við óskum þeim alls hins besta á næsta skólastigi." },
  { id: "vorhatid-2026", date: "2026-05-15", title: "Vorhátíð Barnaskóla Kársness", text: "Vorhátíð skólans var haldin með fjölbreyttri dagskrá — sýningum, tónlist og útimarkaði í umsjón foreldrafélagsins." }
];

async function seedPages() {
  const store = siteScopedStore("pages");
  for (const [slug, page] of Object.entries(PAGES)) {
    const record = {
      slug,
      title: page.title,
      content: page.content,
      updatedAt: new Date().toISOString(),
      updatedBy: "seed-script"
    };
    await store.setJSON(`page:${slug}`, record);
    console.log(`Seeded page:${slug}`);
  }
}

async function seedNews() {
  const store = siteScopedStore("news");
  for (const item of NEWS_ITEMS) {
    const record = {
      id: item.id,
      title: item.title,
      date: item.date,
      content: content([p(item.text)]),
      updatedAt: new Date().toISOString(),
      updatedBy: "seed-script"
    };
    await store.setJSON(`news:${item.id}`, record);
    console.log(`Seeded news:${item.id}`);
  }
}

async function main() {
  await seedPages();
  await seedNews();
  console.log("Done. Note: this script does not update the search index, commit the content backup, or purge any cache — deploy/warm the site normally afterward.");
}

main().catch((err) => {
  console.error("seed-content failed:", err);
  process.exitCode = 1;
});
