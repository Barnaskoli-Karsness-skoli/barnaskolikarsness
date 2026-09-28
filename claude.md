# Skólasíða — Barnaskóli Kársness School Website

## Project Overview

A 30-page school website for Barnaskóli Kársness (Kópavogur, Iceland), editable by non-technical school staff (secretary, principal, up to 5–10 editors) with no code access. Matches the ice-and-glass visual aesthetic of the school's existing internal tool, Póst-IT (reference files in `/Postit files`).

This document is the single source of truth for architecture and decisions. **Do not re-litigate anything marked "fixed" below.** If your understanding of the project changes mid-build, update this file and tell Claude Code explicitly: "CLAUDE.md was updated, re-read it." This file — not chat history — is the tiebreaker if tools disagree.

---

## Core Architecture (fixed — do not redesign)

- **Hosting:** Netlify, fully static site + Netlify Functions (backend) + Netlify Blobs (content store).
- **Content storage:** Netlify Blobs only, via `getStore` (NOT `getDeployStore` — must survive redeploys). No Google Sheets or GitHub in the content-editing loop. GitHub, if used, holds only site code.
- **Rendering:** fetch-on-load. Each page/news item is its own Blob entry (`page:<slug>`, `news:<id>`), not one shared file — concurrent edits to different pages never conflict.
- **Caching:** stale-while-revalidate CDN caching on the Function's read responses (`Cache-Control: public, max-age=300, stale-while-revalidate=3600`, see `netlify/functions/utils/cache.js`), each response carrying a `Cache-Tag` naming everything it embeds. Save endpoints purge the matching tag via Netlify's Purge API (`POST /api/v1/purge`, see `netlify/functions/utils/purge-cache.js`) immediately after a successful Blob write — a literal purge of just the affected cached entries, not a short-TTL approximation. `get-page-data.js` tags every response `page-<slug>,site-settings,banner` (all three are embedded in it), so `save-site-settings.js`/`save-banner.js` purge every page's cached read with one shared tag instead of enumerating slugs; `save-page.js` purges only its own `page-<slug>`; `get-news-item.js` tags its response `news-<id>`, and `save-news.js` purges both `news-<id>` and `page-homepage` (the homepage's combined read embeds the 6 newest news items, so either the item's own detail page or the homepage's list can go stale on a news save); `search-index` writes purge their own `search-index` tag. Requires the `NETLIFY_PURGE_TOKEN` env var (see `.env.example`).
- **Auth:** Netlify Identity, invite-only, restricted to @kopskolar.is accounts — checked both in Identity settings AND server-side in the Function. Shared "editor" role for all 5–10 editors; add/remove editors via the Netlify dashboard, no code changes needed. Admin page has a hidden (not linked) URL as a minor extra layer; the real security is Identity + domain check.
- **Content editor:** Editor.js (open-source, MIT-licensed, vendored locally — not CDN-linked). Core + official plugins (Header, List, Bold, Link) + custom plugins (image-row layout for 2–3 images side by side, Embed, Add Link, Layout Grid). Outputs JSON, not HTML. A JSON-to-HTML renderer converts it at render time, then DOMPurify sanitizes before injection into the page.
- **Layout Grid block:** a configurable 1–2 column, 2–3 row grid for laying out text and images side by side within any page's content — the same layout the homepage's hardcoded intro section uses, as a reusable block anywhere. Deliberately small/capped, not a spreadsheet-style table. Each cell is either plain text (a plain `<textarea>`, not a nested Editor.js instance) or a single image, reusing the same compression/upload/required-alt-text pipeline as the image-row tool. `validate()` requires every cell filled in (text non-empty, or image with both url and alt) — a half-finished or entirely empty grid gets flagged, not silently saved. Renders with no visible grid lines/borders, spacing only (`js/render-content.js`'s `renderLayoutGrid`; admin tool at `admin/vendor/editorjs/tools/layout-grid-tool.js`).
- **Embed & Add Link blocks:** custom Editor.js block types storing only structured data — `{url}` for Embed, `{icon, label, url}` for Add Link — never raw HTML. DOMPurify's domain-allowlist (canva.com, docs.google.com, drive.google.com) generates the actual iframe from trusted code.
- **Backup:** the save Function also writes a plain-text extraction (via one shared JSON→plain-text utility, also used for search snippets) of saved content to a Google Sheet via Apps Script `doPost`, with a shared-secret token. Timestamped, human-readable disaster-recovery backup, text only (not images). Emails an alert if this backup write fails.
- **Images:** compressed client-side (canvas resize to ~1920px max width, target 300–500KB, 1MB hard ceiling), converted to WebP during compression. Required alt text stored as regular content (not Blob metadata, which is capped at 2KB). Each uploaded image gets a unique, content-addressed key — never overwritten in place — so image responses can carry far-future, immutable cache headers. `loading="lazy"` on images below the fold (excluding hero/first carousel slide).
- **No file hosting** for PDFs/docs/videos. Instead: "Linked Resources" — icon+label+URL cards. 10 standard icons: PDF, Document, Presentation, Video, YouTube, Facebook, Calendar/Meeting, Event/Theme Day, Photo, generic Link. Data model: `{icon, label, url}` per link.
- **No multilingual UI.** Icelandic-only; relies on browser-native translate. (Póst-IT's 4-language dictionary engine — IS/EN/PL/PT via `data-i18n` attributes — is that project's own feature and does NOT carry over here.)
- **Privacy rule:** only the principal is named on the site — no other staff names/photos in page text or news.

### Performance optimizations (compatible with all of the above)
- **One combined read per page load**: page content, site-settings, and banner state returned in a single Function response, not several separate fetches. (Nav config is not part of this read — see "Nav config storage" below.)
- **Editor.js (the editor and its plugins) never ships to the public 30 pages** — only `/admin` loads it. Public pages load a small JSON-to-HTML renderer only.
- **The search index is fetched only when a visitor opens the search box**, not on every page load.
- Shared header/footer markup, site-settings content, and the search index all cache client-side in sessionStorage — fetched once per session, reused across every page.
- Shared JS/CSS minified/bundled as part of the deploy. If custom web fonts are used, `font-display: swap` and a limited set of weights.

**Nav config storage (resolved during Phase 5):** nav stays in code, not Blobs. The Admin Portal spec has no nav editor UI — only the Site Info tab (principal, emails, phones, address, hours, Quick Links) is admin-editable — so nav is developer-edited the same way the Header Module already is. It ships in `js/site-data.js` as a static JS array and never makes a network round trip at all, which is strictly better for the "one combined read" performance goal than fetching it. `get-page-data.js`'s combined read therefore returns page content + site-settings + banner only.

---

## Design System

**Concrete starting point — do not design from scratch.** Póst-IT's actual `index.html`, `styles.css`, `app.js`, and `tickets.html` (in `/Postit files`) define the real ice-glass look already in production:
- Fonts: DM Sans (body) + Space Grotesk (headings), loaded from Google Fonts
- CSS custom properties for the palette: `--ink:#173044`, `--muted:#66808b`, `--glass:rgba(255,255,255,.15)`, `--border:rgba(255,255,255,.72)`, `--shadow:0 22px 55px rgba(75,122,133,.12)`
- Glass panels: `backdrop-filter: blur(17px)`, translucent white backgrounds (`rgba(255,255,255,.3)`), soft box-shadows per `--shadow`
- Blurred ambient background circles (`.ambient-one`, `.ambient-two` — fixed, decorative, radial-gradient blurred circles, `z-index:-1`, `filter: blur(3px)`)
- Card hover: `translateY(-6px)` lift with expanded shadow (`transition: transform .25s ease, box-shadow .25s ease`)
- Body background: soft diagonal gradient (`linear-gradient(120deg,#f5fbfa 0%,#e8f5f6 47%,#f7f7f4 100%)`) plus a faint grid overlay masked to fade out toward the bottom
- Buttons: dark teal primary (`#1d4a59`), rounded (10–11px radius), bold 11–12px DM Sans labels with wide letter-spacing

Extend this actual CSS. Do not approximate the aesthetic from scratch — the files are in `/Postit files`, read them directly.

**Admin backend reuse:** `tickets.html`'s admin dashboard pattern is the structural starting point for the new site's admin portal — login-gated dashboard (`loginDialog` → `dashboard`), summary cards (`.summary-grid`, 4 stat cards), a table with inline per-row actions (status `<select>` + Save/Complete buttons per row, `.ticket-table`), and a `.settings-card` form (labeled input, save button, status message with success/error states). The settings-card pattern maps directly onto this project's Site Info tab; the table-with-row-actions pattern maps onto the page/news list. **Does NOT carry over:** `tickets.html`'s login, which POSTs a password to a Google Apps Script endpoint (`verifyPassword` action) and stores it in `sessionStorage` — that entire flow is replaced by Netlify Identity. Only the visual shell of the login dialog (the frosted modal, the kicker/heading/label styling) is reused, not its logic.

---

## Header Module (developer-edited — code, not Blobs, not in admin portal)

- School name: **Barnaskóli Kársness**
- A reserved logo slot — empty placeholder for now (principal hasn't chosen a logo yet), built so a real logo drops in later with zero layout rework
- The school's motto/core values text, once decided (not yet known)
- A small "quick contact" bar frozen at the top, showing a list of phone numbers — pulls from the same `site-settings` Blob entry as the footer (see below), never hardcoded separately, so there's one source of truth
- **External link badges:** two fixed badges, one linking to UNICEF Iceland (unicef.is), one to Barnaheill (barnaheill.is). Hover effect: the badge lifts slightly (translateY) and scales up a touch; click opens the external site in a new tab. These are separate from — and in addition to — a plain link to the same two sites inside the "Forsíða" nav dropdown (see Navigation below).

---

## Navigation (Section 5)

Reused from the old site's actual structure (source: `/Postit files/Dropdown_menu.txt` — note this file is a reference for content/structure only, not styling), restyled with frosted/translucent glass panels instead of solid green.

Five top-level categories, each **its own real landing page** (intro text + photo, same pattern as the homepage) with a dropdown of subpages:
- **Forsíða** (Home) — plus links to Unicef verkefni (unicef.is) and Barnaheill (barnaheill.is)
- **Leikskólastig** (preschool level) — `/leikskolastig/index.html`, dropdown: Skóladagatal, Leyfistilkynning, Reglur, Vala app, Matseðill, Skólabíll, Lubbi finnur málbein
- **Grunnskólastig** (elementary level) — `/grunnskolastig/index.html`, dropdown: Skóladagatal, Leyfisbeiðnir, Reglur um skólasókn, Mentor app, Matseðill
- **Frístund** — `/fristund/index.html`, dropdown: Frístundabíll, Dagskipulag, Reglur, Leyfistilkynning
- **Foreldraráð** (parent council) — `/foreldrarad/index.html`, dropdown: Foreldrafélag

**Nav interaction (revised from the original hover/tap-toggle plan):** each top-level label is a real link to its category landing page, not a toggle.
- **Desktop (>900px):** the label navigates on click; the dropdown reveals on `:hover` and on `:focus-within` (keyboard tab) via CSS only — no JS click handler on the label. Trade-off accepted: a touchscreen device that falls in the desktop-width range (rare — most tablets hit the ≤900px hamburger breakpoint) can't hover to see the dropdown; the category landing page itself lists all of its subpages as plain links, so touch users can still reach them in one extra tap.
- **Mobile/tablet (≤900px, hamburger nav):** the label is a real link; a separate caret button next to it expands/collapses the subpage sublist. Tapping the label navigates, tapping the caret does not.
- Category landing pages follow the same template contract as any other page (`data-page-key`, `.page-content`) — see `/leikskolastig/index.html` etc.

Responsive: full horizontal nav on desktop, hamburger menu on tablet/mobile (the old version only handled this by stacking dropdowns vertically at ≤768px — a real hamburger toggle was built instead, matching the ice-glass design system). Back button on every non-homepage page (`history.back()`, homepage fallback) for iPad/iPhone users lacking an OS-level back button.

---

## Quick Links Module (Section 5b)

A row of icon+label shortcut buttons to frequently-used destinations, separate from Linked Resources (Section 15) — same `{icon, label, url}` shape, but its own list, since the final trimmed set of shortcuts isn't decided yet and the two lists serve different purposes (Quick Links = site-wide shortcuts curated by an editor; Linked Resources = per-page attachments added inline while writing a page).

- **Source list (from the old site, not final):** Matseðill, Skóladagatal, Vinahóll, Leyfisbeiðni, Mentor, Farsæld, Einelti/Bullying.
- **Icons:** custom SVGs matching the ice-glass aesthetic (line-based, `currentColor` stroke, matching the existing `.gear-icon svg` treatment in the Póst-IT reference) — **not** the old site's PNGs. Placeholder icons are acceptable until real ones are commissioned. Icon set lives in `js/icons.js` as an id → inline-SVG map; each Quick Link item references an icon id, the same pattern the 10 Linked Resource icons will use.
- **Data model:** `site-settings.quickLinks = { enabled: <bool>, items: [{icon, label, url}, ...] }`. Admin-editable (add/remove/reorder items, toggle `enabled`) via the Site Info tab once Phase 7 ships — no code change needed to adjust the list.
- **Render rule:** the homepage renders its Quick Links row **by default, regardless of `enabled`** (it's part of the fixed homepage sequence). Every other page template ships the same empty mount point (`#quick-links`) so that flipping `enabled: true` turns the row on site-wide as a settings change, not a rebuild — no template edits needed later. A page's mount only renders when either `enabled` is true or the page explicitly force-shows it (the homepage does, via a `data-force-show` marker on its mount).

---

## Confirmed Real-World Data

Source: `/Postit files/Contact_info_box.txt` (content only — ignore its green/white municipal styling, which does not carry over).

- **Address:** Skólagerði 8, 200 Kópavogur — with a map link: `https://ja.is/kort/?d=hashid%3AvMw014&x=357576&y=404392&type=map&nz=14.31`
- **Office hours:** Mán – Fim (Mon–Thu) 08:00–15:30, Fös (Fri) 08:00–15:00
- **Office phone:** 441-7000 (`tel:+3544417000`)
- **Office email:** barnaskolikarsness@kopavogur.is
- **Principal (Skólastjóri):** Gerður Magnúsdóttir

These populate `site-settings` (see Admin Portal below) — treat as the initial values to seed, not permanently hardcoded (they're admin-editable).

---

## Infrastructure & Access (added 2026-09-28)

**GitHub:** Real repo transferred from a personal account into a shared GitHub organization, `Barnaskoli-Karsness-skoli`, owned by the official school account (barnaskolikarsness@kopskolar.is). Repo: `Barnaskoli-Karsness-skoli/barnaskolikarsness`. Both the primary developer's personal GitHub account (BjornMagnusAndersson) and the shared school account are Owners of this org, so either can manage it independently — access doesn't depend on either single account staying active. The repo is currently **Public** (not Private) — this was necessary because Netlify's free tier cannot deploy a private repo owned by a GitHub Organization. This is considered safe because no secrets are ever committed to the repo; all credentials live in Netlify's environment variables. A leftover placeholder repo, `barnaskoli-karsness-vefsida`, also exists in the org from initial setup exploration and can be deleted — it holds no real content.

**Netlify:** The live site is hosted entirely under the shared school account's own Netlify account (not the developer's personal account), on the Free plan. This avoids any recurring personal cost and means the school account has full, independent access to the site, its environment variables, and Identity users — not dependent on the developer's personal account remaining active. Day-to-day development still happens via the developer's normal GitHub push workflow; Netlify auto-deploys from the org repo regardless of which account owns the Netlify project.

**Environment variables set on the live Netlify project:**
- `NETLIFY_SITE_ID` — the project's own site ID (required explicitly; automatic context injection does not work for Functions on this account).
- `NETLIFY_PURGE_TOKEN` — a Netlify Personal Access Token (not an arbitrary secret) generated from the shared school account, marked as a secret value. Used both as the Blobs read/write credential (default in `netlify/functions/utils/stores.js`) and as the Purge API bearer token (`netlify/functions/utils/purge-cache.js`). No expiration date set — note this needs periodic review/rotation since Netlify tokens don't expire automatically here.
- `SHEETS_BACKUP_URL` / `SHEETS_BACKUP_TOKEN` — **not yet set**. The Google Sheets backup feature described in the Backup section above is not yet built or deployed. This remains an open task; until it exists, there is no working disaster-recovery backup of saved content, beyond Netlify Blobs itself.

**Known accepted risk:** the shared school account (barnaskolikarsness@kopskolar.is) has no 2FA enabled, and the school has no dedicated device to support one easily. Recommended future fix: set up an authenticator app on a shared office computer, or printed backup codes stored securely at school — not urgent, but should be addressed before this account becomes the sole gatekeeper of more sensitive functionality.

**Fixed (2026-09-28):** the admin login (`admin.js`'s `initLoginGate()` / `admin-api.js`'s `authHeaders()`) used to treat a cached-but-expired Identity session as valid and silently swallow a failed token refresh instead of forcing re-login — editors could appear logged in while saves silently failed. This is resolved: both paths now funnel through a shared `forceReLogin()` (`window.AdminAuth.forceReLogin`, defined in `admin.js`) that clears the stale session and drops back to the login screen — `handleUser()` proactively calls `user.jwt()` before trusting a cached session enough to show the dashboard, and `authHeaders()`'s reactive check calls it if a token refresh fails mid-session.

---

## Admin Portal (Section 7)

Hand-built custom UI (not a CMS product), ice-glass styled per the design system above.

**Access control:** Netlify Identity, invite-only, @kopskolar.is domain checked client-side AND server-side. Admin URL not linked publicly.

**Admin frontend includes:**
- Page/section dropdown to pick what to edit
- Editor.js WYSIWYG (bullets, bold/italic, font size, highlight color, links, image-row layout tool for 2–3 images side by side)
- Image upload with client-side compression (WebP conversion, 300–500KB target, 1MB ceiling) and a required alt text field
- Embed button (Canva/Google Slides, domain-validated)
- Add Link button (icon+label+URL for PDFs/docs/videos, per Linked Resources below)
- Carousel image add/remove/reorder (homepage only)
- News entry form
- Banner on/off toggle
- Explicit Save success/failure feedback (no silent saves), browser "unsaved changes" warning before navigating away

**Site Info tab** (separate from the page/news editor — simple labeled fields, not the full WYSIWYG, since this is short structured data):
- Principal's name
- Principal's email
- School office email
- An add/remove list of phone numbers, each `{label, number}` — e.g. School Main, Fristund, and later Kindergarten. Both label and number are editable; adding or removing an entry needs no code.
- Address with its map link
- Opening hours
- Renders in the shared footer AND header quick-contact bar as real `mailto:`/`tel:` links (not plain text)
- **Quick Links** (Section 5b): add/remove/reorder list of `{icon, label, url}` shortcut buttons, plus a site-wide on/off toggle. Separate control from the homepage's own Quick Links row, which always renders regardless of the toggle.

**Backend:** Netlify Function(s) reading/writing Blobs, restricted to authenticated @kopskolar.is Identity users. On save: writes to the relevant Blob entry, purges the CDN cache for that entry, writes the plain-text Sheets backup, updates the search index (strong consistency on this write-then-read path).

**Scope (resolved):** fully free-form WYSIWYG via Editor.js, not fixed fields.

---

## News & Banner (Section 8)

**News:** secretary adds entries via the admin's News form. Stored under a `news` key structure in Netlify Blobs (each item its own entry, `news:<id>`). Clicking a news card opens a single reusable `news.html?id=<id>` detail page — not a modal, needs to be shareable/linkable. Its data comes from `get-news-item.js` (Phase 5, public read); the `news.html` page template itself is still open work for Phase 6/7.

**Emergency Banner:** single Blob entry with `active` (true/false), `bannerText`, an optional `imageURL`, and `LastUpdated`. Behavior:
- Full-size on activation (e.g. "Snow blizzard, school closed today")
- Shrinkable to a persistent scrolling pill via a manual click (not full dismiss)
- Shrink state uses `sessionStorage` (resets on new tab/browser session — NOT tied to calendar day)
- Actual visibility controlled by a separate manual on/off toggle in admin

**Search:** one shared search index (`search-index` Blob entry), fetched lazily only when the visitor opens the search box — not on every page load. `get-search-index.js` (public, no auth) serves it; `save-page.js`/`save-news.js` regenerate a page/news item's entry on every save via `utils/search-index.js`, which purges the `search-index` Cache-Tag on every write so the read stays strongly consistent.

**News listing:** `list-news.js` (public, no auth) returns every `news:<id>` entry as a lightweight `{id, date, title, excerpt}` list, newest-first, tagged `news-list` — no Editor.js body, since it's for lists/pagination, not detail rendering (`get-news-item.js` still serves the full item). `save-news.js` purges `news-list` alongside its other tags on every save. Powers both the public homepage's news grid/pagination (`js/homepage.js`) and the admin News tab's full browse list (`admin/js/admin.js`) — closing the "no list all news" gap flagged after Phase 7.

---

## Homepage (Section 13 — fixed sequence, unique to this one page)

In order, top to bottom:
1. Intro text (same Editor.js instance as every other page, not a separate plain-text field) + school photo, side-by-side
2. **Quick Links row** (Section 5b) — renders here by default, always on for the homepage regardless of the site-wide `enabled` toggle
3. **Image carousel.** ✅ done — interaction ported unchanged from `/Postit files/Pic_carousel.txt` (auto-rotates every 5s via `setInterval`, pauses on hover, clickable dot navigation, `transform: translateX(-${index*100}%)` sliding transition), dots restyled to frosted ice-glass. Image source is `site-settings.carouselImages` (admin's add/remove/reorder list, Phase 7), with a fallback to static placeholder slides when that list is empty (`js/homepage.js`).
4. Card grid of the 6 newest news entries (date, title, ~100-character auto-generated excerpt), now pulled from `list-news.js`'s full newest-first list — not manually arranged
5. Pagination for older news entries — `js/homepage.js` paginates client-side over that same full list

She edits the intro text, swaps the school photo, manages carousel images, and adds news entries — the homepage assembles itself from those pieces.

---

## Linked Resources (Section 15)

Instead of hosting PDFs/docs/videos as files: icon+label+URL cards. An "Add link" button in the admin's Editor.js toolbar. Data model: each link is `{icon, label, url}`, stored alongside the page's Editor.js content. Icon set (10): PDF, Document, Presentation, Video, YouTube, Facebook, Calendar/Meeting, Event/Theme Day, Photo, generic Link — placeholder SVGs live in `js/resource-icons.js` (Phase 6), rendered via `js/render-content.js`'s `addLink` block handling. Distinct from Quick Links' own icon set (`js/icons.js`, Section 5b) — different module, different purpose.

---

## Code Quality Standard (Section 12)

Every function/file gets purpose comments; consistent naming conventions; file-header comments. Shared JS/CSS minified/bundled as part of the deploy, not shipped as raw dev files.

---

## Accepted Risks & Decisions (Section 14 — do not engineer around these)

- No tested restore-from-Sheets-backup procedure yet (straightforward but not built)
- "Last write wins" on concurrent edits to the SAME page — mitigated by telling editors not to edit the same page simultaneously
- No staging environment — mitigated by local testing before deploy
- Single point of maintenance (sole IT person) — accepted; this document is meant to be complete enough for someone else + AI to pick up if needed

---

## CONTENT GAPS — not yet provided, needed before those parts can be finished

- **The real text and photos for each of the 30 pages** — placeholder/lorem content only until supplied
- **Homepage intro copy specifics** — what the intro text should actually say
- **The school's motto/core values** — principal hasn't decided yet; header has a placeholder slot reserved
- **The school's logo** — not yet chosen; header has an empty slot reserved for it
- **Exact visual styling specifics not covered by the Póst-IT reference** — confirm colors/fonts/icon set choices for the 10 linked-resource icons if the Póst-IT palette needs extending
- **Full 30-page list with names/slugs** — the nav structure above gives categories and known subpages from the old site; confirm this is the complete, final list of 30

---

## Build Plan — Phased Approach (Section 16)

Work through these phases one at a time, testing as you go. Do not skip ahead.

1. **Phase 1 — Project setup:** create the Netlify project, connect the repo, enable Blobs and Identity.
2. **Phase 2 — Design system, template, nav (Sections 4–5):** build the shared design system and single reusable page template — ice-and-glass aesthetic matching Póst-IT, responsive header with hamburger nav on mobile from the nav structure above, and a footer. Each page body is an empty container with a unique `data-page-key`. Build one fully worked example page for review.
3. **Phase 3 — Batch page generation:** generate the remaining pages from the template once the example page is approved.
4. **Phase 4 — Homepage layout (Section 13):** build the homepage's fixed section sequence — intro text + school photo side-by-side, image carousel below it, then the 6-newest-news card grid, then pagination.
5. **Phase 5 — Netlify Functions (backend):** ✅ done — `netlify/functions/get-page-data.js` (combined public read), `get-news-item.js` (single news:<id> read, for `news.html?id=`), and `get-search-index.js` (public search-index read), `save-page.js`, `save-news.js`, `save-site-settings.js`, `save-banner.js` (all admin-gated writes with literal Cache-Tag purge on save), `upload-image.js` + `get-image.js` (content-addressed image storage), and shared helpers under `netlify/functions/utils/` (`stores.js`, `blob-keys.js`, `auth.js`, `cache.js`, `purge-cache.js`, `content-to-text.js`, `search-index.js`, `sheets-backup.js`, `email-alert.js`). `package.json`/`netlify.toml` added at the repo root. Needs: `npm install` to fetch `@netlify/blobs`, a `NETLIFY_PURGE_TOKEN` env var, real `SHEETS_BACKUP_URL`/`SHEETS_BACKUP_TOKEN` env vars (see `.env.example`), an actual Apps Script backend for the Sheets backup, and a chosen email provider for backup-failure alerts (currently a console.error stub). Not yet wired to the frontend — that's the Phase 6 handoff.
6. **Phase 6 — Shared content loader:** ✅ done — `js/render-content.js` (JSON-to-HTML renderer: paragraph/header/list/imageRow/embed blocks, addLink blocks grouped into a Linked-Resources section using `js/resource-icons.js`'s 10-icon set, embed domain-allowlist enforced in the renderer itself, sanitized through the locally vendored `js/vendor/dompurify.min.js` before injection). `js/site-data.js`'s `SiteData.load()` now really `fetch()`es `get-page-data.js` (slug derived from `data-page-key`), falling back to local defaults if the backend is unreachable or not yet seeded. `js/site.js` renders `.page-content` from the fetched page (leaving the Phase 3/4 placeholder markup alone if nothing's been seeded yet) and broadcasts a `sitedata:ready` event with the full fetched payload. `js/homepage.js`'s news grid now reads the homepage's embedded news items from that event instead of the `js/news-data.js` mock (mock kept as seed material, unused at runtime). `news.html` + `js/news-page.js` (new) is the single reusable news detail page, reading `?id=`, fetching `get-news-item.js`, rendering through the same renderer, with a graceful not-found state. `scripts/seed-content.js` (new, `npm run seed`) is the one-time seed script transcribing every page's Phase 3/4 placeholder copy plus the news-data.js mock into real `page:<slug>`/`news:<id>` Blob entries via `@netlify/blobs` directly (needs `NETLIFY_SITE_ID`/`NETLIFY_AUTH_TOKEN`, not yet run — no live site to run it against). Not started: Phase 7 admin portal.
7. **Phase 7 — Admin portal UI (Sections 7, 15):** ✅ done — `admin.html` + `admin/css/admin.css` + `admin/js/*` (`admin.js` app logic, `admin-api.js` Function wrappers, `editor-setup.js`, `image-compress.js`). Gated behind a placeholder sessionStorage "logged in" flag (`admin/js/admin.js`'s `initLoginGate()`) — real Netlify Identity + the @kopskolar.is check are Phase 8; the Phase 5 Functions already enforce real auth server-side regardless, so save calls correctly fail until Phase 8 wires real login through.
   - **Editor.js vendored, not npm-installed**: this sandbox has no Node/npm, so `@editorjs/editorjs@2.31.7`, `@editorjs/header@2.8.9`, `@editorjs/list@2.0.9` UMD bundles were downloaded directly from their published npm packages (via jsdelivr) into `admin/vendor/editorjs/` — same end state ("vendored, not CDN-linked at runtime") as an `npm install` + copy would produce, but done without the tool. Whoever has Node available should still add these to `package.json` and manage them via real `npm install` going forward, for update tracking.
   - Custom blocks `admin/vendor/editorjs/tools/{image-row,embed,add-link}-tool.js`: Image Row (upload → `upload-image.js`, per-image required alt text, 2–3 images), Embed (domain-allowlist checked here for UX, matching `render-content.js`'s real enforcement), Add Link (icon picker from `js/resource-icons.js`'s 10-icon set).
   - Page dropdown built from `SiteData.nav` (all 22 pages) plus News/Banner/Site Info as separate tabs (not dropdown entries, since they aren't `page:<slug>` content).
   - Homepage-only carousel manager (add/remove/reorder, uses the same compression+upload path) persists to `site-settings.carouselImages`.
   - Every save path wired to its Phase 5 Function with explicit success/error `form-message` feedback (no silent saves) and a `beforeunload` "unsaved changes" warning tracked across all editors/forms.

   **Post-Phase-7 follow-up (done):** `netlify/functions/list-news.js` (public, lightweight `{id,date,title,excerpt}` list, newest-first — see "News listing" above) closed the "no list all news" gap; the admin News tab now browses/edits any item, not just the homepage's 6 newest. The public homepage's carousel (`js/homepage.js`) now renders from `site-settings.carouselImages` when non-empty, falling back to the original static placeholder slides (and their exact auto-rotate/pause-on-hover/dot-nav/transform interaction, untouched) when it's empty — so a freshly seeded site isn't stuck with a blank carousel before the school's first image upload. The homepage's news grid/pagination now reads the full `list-news.js` list instead of the mock `js/news-data.js` array (still kept as seed material for `scripts/seed-content.js`).
8. **Phase 8 — Identity integration:** ✅ code done, ⚠️ needs dashboard configuration before it can be tested end-to-end (see below). `netlify-identity-widget@2.0.3`'s browser bundle vendored to `admin/vendor/netlify-identity/netlify-identity-widget.js` (downloaded directly, same no-Node caveat as Phase 7's Editor.js vendoring — added to `package.json` `devDependencies` for a future real `npm install`). `admin/js/admin.js`'s `initLoginGate()` now uses the real widget (`netlifyIdentity.init/on/open/close/logout`) instead of the Phase 7 sessionStorage flag: shows Identity's own hosted login/invite modal, re-checks the @kopskolar.is domain client-side right after login as a UX belt (logs out + shows a clear message on a mismatch — never the actual security boundary), and displays the logged-in user's email next to the logout button. `admin/js/admin-api.js` now attaches `Authorization: Bearer <jwt>` (via `user.jwt()`, which auto-refreshes an expired cached token) to every call to every Phase 5 Function, including the public reads (harmless — they ignore it). **`netlify/functions/utils/auth.js` needed no logic changes** — it was already the real check from Phase 5 (`context.clientContext.user` + domain, Netlify's classic Functions runtime verifies the JWT itself before this code ever runs), it just had nothing real to check until the client started sending a JWT. Confirmed unauthenticated by design: `get-page-data.js`, `get-news-item.js`, `get-search-index.js`, `list-news.js` — none call `requireEditor`.
   - **Dashboard configuration — not code, needs doing by you before end-to-end testing works:** (1) enable Identity on the actual Netlify site if not already done in Phase 1; (2) set Identity registration to invite-only; (3) send yourself and the other editors an invite. Until Identity is enabled on the real site, `netlifyIdentity.init()` has nothing to talk to — the login button will not work locally or on an unconfigured deploy.
9. **Phase 9 — Test pass:** verify as a whole — save/load round trips, cache invalidation on save, banner behavior, search, responsive nav on mobile including touch-tap dropdowns.

---

## Working With This Document

If anything here turns out to be wrong, incomplete, or superseded during the build, **update this file** rather than just telling Claude Code verbally — and say explicitly "CLAUDE.md was updated, re-read it" so the change is picked up. Chat history is not authoritative; this file is.

## Reference Files

Place these Póst-IT files in a `/Postit files` folder at the project root (read-only references, not part of the new site's own codebase):
- `index.html`, `styles.css`, `app.js` — the public-facing Póst-IT design system
- `tickets.html` — the admin backend pattern to adapt
- `Contact_info_box.txt` — confirmed real contact data (content only, ignore its green styling)
- `Dropdown_menu.txt` — confirmed nav structure (content/structure only, ignore its green styling)
- `Pic_carousel.txt` — working carousel interaction to reuse (behavior only, restyle the dots)

Chat history from initial infrastructure setup (repo transfer, Netlify account choice, env var setup) is not authoritative — the "Infrastructure & Access" section above is. If that history and this file ever disagree, this file wins, same rule as everywhere else in this document.
