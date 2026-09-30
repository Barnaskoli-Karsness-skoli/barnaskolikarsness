# Skólasíða — Barnaskóli Kársness School Website

## Project Overview

A 30-page school website for Barnaskóli Kársness (Kópavogur, Iceland), editable by non-technical school staff (secretary, principal, up to 5–10 editors) with no code access. Matches the ice-and-glass visual aesthetic of the school's existing internal tool, Póst-IT (reference files in `/Postit files`).

This document is the single source of truth for architecture and decisions. **Do not re-litigate anything marked "fixed" below.** If your understanding of the project changes mid-build, update this file and tell Claude Code explicitly: "CLAUDE.md was updated, re-read it." This file — not chat history — is the tiebreaker if tools disagree.

---

## Core Architecture (fixed — do not redesign)

- **Hosting:** Netlify, fully static site + Netlify Functions (backend) + Netlify Blobs (content store).
- **Content storage:** Netlify Blobs only, via `getStore` (NOT `getDeployStore` — must survive redeploys). No Google Sheets or GitHub in the content-editing loop. GitHub, if used, holds only site code.
- **Rendering:** fetch-on-load. Each page/news item is its own Blob entry (`page:<slug>`, `news:<id>`), not one shared file — concurrent edits to different pages never conflict.
- **Caching:** stale-while-revalidate CDN caching on the Function's read responses. Strong consistency overridden specifically on write-then-immediately-read paths (save confirmation, search index update). Save endpoint actively purges/version-busts the specific page's cached entry.
- **Auth:** Netlify Identity, invite-only, restricted to @kopskolar.is accounts — checked both in Identity settings AND server-side in the Function. Shared "editor" role for all 5–10 editors; add/remove editors via the Netlify dashboard, no code changes needed. Admin page has a hidden (not linked) URL as a minor extra layer; the real security is Identity + domain check.
- **Content editor:** Editor.js (open-source, MIT-licensed, vendored locally — not CDN-linked). Core + official plugins (Header, List, Bold, Link) + custom plugins (image-row layout for 2–3 images side by side, Embed, Add Link). Outputs JSON, not HTML. A JSON-to-HTML renderer converts it at render time, then DOMPurify sanitizes before injection into the page.
- **Embed & Add Link blocks:** custom Editor.js block types storing only structured data — `{url}` for Embed, `{icon, label, url}` for Add Link — never raw HTML. DOMPurify's domain-allowlist (canva.com, docs.google.com, drive.google.com) generates the actual iframe from trusted code.
- **Backup:** the save Function also writes a plain-text extraction (via one shared JSON→plain-text utility, also used for search snippets) of saved content to a Google Sheet via Apps Script `doPost`, with a shared-secret token. Timestamped, human-readable disaster-recovery backup, text only (not images). Emails an alert if this backup write fails.
- **Images:** compressed client-side (canvas resize to ~1920px max width, target 300–500KB, 1MB hard ceiling), converted to WebP during compression. Required alt text stored as regular content (not Blob metadata, which is capped at 2KB). Each uploaded image gets a unique, content-addressed key — never overwritten in place — so image responses can carry far-future, immutable cache headers. `loading="lazy"` on images below the fold (excluding hero/first carousel slide).
- **No file hosting** for PDFs/docs/videos. Instead: "Linked Resources" — icon+label+URL cards. 10 standard icons: PDF, Document, Presentation, Video, YouTube, Facebook, Calendar/Meeting, Event/Theme Day, Photo, generic Link. Data model: `{icon, label, url}` per link.
- **No multilingual UI.** Icelandic-only; relies on browser-native translate. (Póst-IT's 4-language dictionary engine — IS/EN/PL/PT via `data-i18n` attributes — is that project's own feature and does NOT carry over here.)
- **Privacy rule:** only the principal is named on the site — no other staff names/photos in page text or news.

### Performance optimizations (compatible with all of the above)
- **One combined read per page load**: page content, nav config, site-settings, and banner state returned in a single Function response, not several separate fetches.
- **Editor.js (the editor and its plugins) never ships to the public 30 pages** — only `/admin` loads it. Public pages load a small JSON-to-HTML renderer only.
- **The search index is fetched only when a visitor opens the search box**, not on every page load.
- Nav config, shared header/footer markup, site-settings content, and the search index all cache client-side in sessionStorage — fetched once per session, reused across every page.
- Shared JS/CSS minified/bundled as part of the deploy. If custom web fonts are used, `font-display: swap` and a limited set of weights.

---

## Design System

**Concrete starting point — do not design from scratch.** Póst-IT's actual `index.html`, `styles.css`, `app.js`, and `tickets.html` (in `/Postit files`) define the real ice-glass look already in production:
- Fonts: DM Sans (body) + Space Grotesk (headings), loaded from Google Fonts
- CSS custom properties for the palette (superseded — see "Green Retheme" below): `--ink:#173044`, `--muted:#66808b`, `--glass:rgba(255,255,255,.15)`, `--border:rgba(255,255,255,.72)`, `--shadow:0 22px 55px rgba(75,122,133,.12)`
- Glass panels: `backdrop-filter: blur(17px)`, translucent white backgrounds (`rgba(255,255,255,.3)`), soft box-shadows per `--shadow`
- Blurred ambient background circles (`.ambient-one`, `.ambient-two` — fixed, decorative, radial-gradient blurred circles, `z-index:-1`, `filter: blur(3px)`)
- Card hover: `translateY(-6px)` lift with expanded shadow (`transition: transform .25s ease, box-shadow .25s ease`)
- Body background: soft diagonal gradient (superseded — see below) plus a faint grid overlay masked to fade out toward the bottom
- Buttons: dark primary (superseded — see below), rounded (10–11px radius), bold 11–12px DM Sans labels with wide letter-spacing

Extend this actual CSS. Do not approximate the aesthetic from scratch — the files are in `/Postit files`, read them directly.

### Green Retheme (fixed — supersedes the blue palette above, decided 2026-09-30)

Admins approved the site's simplicity/glass look but asked for the blue tint to become green, matching the Kópavogur logo, keeping the same white/glass structure. New palette derived by rotating each old color's hue to the logo's actual green (H=155°) while holding its original saturation and lightness — so visual "weight"/intensity matches the old blue palette exactly, just re-hued:

| Token | Old (blue) | New (green) | Notes |
|---|---|---|---|
| Brand anchor (darkest) | — | `#00302d` | Sampled directly from the Kópavogur logo wordmark/shield outline |
| Brand anchor (bright) | — | `#00844d` | Sampled directly from the Kópavogur logo "K" fill — this is the hue (155°) every other token below is rotated to |
| `--ink` | `#173044` | `#174431` | Headings, primary text |
| `--muted` | `#66808b` | `#668b7c` | Secondary text |
| Button primary | `#1d4a59` | `#1d5940` | Primary buttons |
| Shadow tint | `rgba(75,122,133,.12)` | `rgba(75,133,109,.12)` | `--shadow` |
| Body gradient stop 1 | `#f5fbfa` | `#f5fbf8` | `linear-gradient(120deg, …)` |
| Body gradient stop 2 | `#e8f5f6` | `#e8f6f0` | middle stop |
| Body gradient stop 3 | `#f7f7f4` | `#f4f7f6` | last stop |
| `--glass`, `--border` | `rgba(255,255,255,…)` | unchanged | white/glass stays white — only tinted colors move |
| Carousel dots, other UI greens | — | tasteful mid-tones between `--ink` (new) and `--muted` (new) | do not reuse the old Póst-IT `--forest-green:#228B22` — too saturated/dated next to this palette |

**Audit requirement before the retheme is "done":** it's unconfirmed whether every color reference actually lives in these CSS custom properties. Before repainting, VS Code Claude Code must audit and report back (not just patch `styles.css`) for hardcoded color values living outside the variable definitions — likely places for this project specifically:
- Inline SVG `fill=`/`stroke=` attributes (icons, the reserved logo slot, the 10 linked-resource icons)
- JS-generated inline styles (`element.style.background = …`, template strings building `style="..."`) in `app.js`-equivalent files, the carousel script, and the admin portal's dynamically-built rows/buttons (`tickets.html`-derived `.ticket-table` row actions, summary cards)
- Any Tailwind/utility-class color literals if such a framework crept in
- Duplicate hex values pasted directly into a second CSS file instead of referencing the shared custom properties
- The banner (emergency/snow-day) component, which may have its own color logic separate from the main stylesheet
- **Editor.js's own vendored plugin CSS** (the plugins' default toolbar/selection/focus-ring colors, not just the site's own stylesheet) — these live under the vendored Editor.js folder, easy to skip over as "not our code"
- **Pre-baked icon image assets:** confirm whether the 10 linked-resource icons are `currentColor` stroke SVGs (repaintable via CSS) or flat pre-colored PNG/SVG files (need re-exporting in green, not a find-and-replace) — check both possibilities explicitly, don't assume
- **Favicon and any social-preview (OG) image**, if either was generated with the old blue
- **Explicitly exclude admin-saved content from any blanket replace.** The WYSIWYG's "highlight color" feature lets editors pick a color that's saved *inside page content* (Blobs) — that is user data, not site theme, and must NOT be touched by a color sweep. Scope every replace to source/template files only, never to Blob content or seeded/sample content.
- **Success/failure feedback colors in the admin** (save confirmation, etc.) commonly default to green-for-success — once the *brand* color is also green, these need to stay visually distinct from each other (and from error red) so "saved" vs "not saved" stays unambiguous at a glance.

Only after that audit confirms full coverage (or the gaps are patched to route through the custom properties) is a global find-and-replace of the hue-shift table above safe to call complete. **The audit's own completeness still has to be spot-checked** — Claude (in this chat) has no access to the actual repo to verify Claude Code's report; treat the audit output as a claim to review, not a guarantee.

### Green Retheme — audit results and decisions (fixed, 2026-09-30)

The audit (82 tracked files, vendored Editor.js + Identity widget included) came back: the 6-value table above only covers a small fraction of the actual blue — ~30 more derived tints live hardcoded in `css/main.css` and `admin/css/admin.css`, plus more inside the vendored `editorjs.umd.js`/`list.umd.js`. Full derived mapping (same rule: hue rotated to 155°, original S/L held), to be added as new `:root` custom properties in `main.css` (site) and reused by `admin.css` — **stop hardcoding these; every one below becomes a variable**:

| Old (blue) | New (green) | Old (blue) | New (green) |
|---|---|---|---|
| `#183847` | `#184733` | `#5d7b84` | `#5d8474` |
| `#1d3b47` | `#1d4736` | `#64838c` | `#648c7b` |
| `#25505e` | `#255e46` | `#7a969c` | `#7a9c8e` |
| `#2c5964` | `#2c644d` | `#89a0a5` | `#89a599` |
| `#3a5a63` | `#3a6352` | `#527582` | `#52826e` |
| `#3f6068` | `#3f6857` | `#cfe4e8` | `#cfe8de` |
| `#3f6874` | `#3f745e` | `#eaf5f7` | `#eaf7f2` |
| `#1c4858` | `#1c583f` | `#4f8390` (icon) | `#4f9075` |
| `#5c7680` | `#5c8071` | `#1d6b7a` (link) | `#1d7a53` |
| `#2a6876` (checkbox accent) | `#2a7656` | `#73a8ae` (focus) | `#73ae95` |
| `#173c48` (submit hover) | `#174834` | `#6e8990` | `#6e9082` |

RGBA tints, same treatment:
| Old | New |
|---|---|
| `rgba(23,48,68,.92)` | `rgba(23,68,49,.92)` |
| `rgba(245,251,250,x)` | `rgba(245,251,248,x)` |
| `rgba(29,74,89,x)` | `rgba(29,89,64,x)` |
| `rgba(29,107,122,.35)` (link underline) | `rgba(29,122,83,.35)` |
| `rgba(205,231,230,.6)` (icon tile) | `rgba(205,231,220,.6)` |
| `rgba(116,158,163,x)` (borders) | `rgba(116,163,143,x)` |
| `rgba(20,42,52,x)` (overlay) | `rgba(20,52,39,x)` |
| `rgba(43,83,94,.25)` | `rgba(43,94,73,.25)` |
| `rgba(28,72,88,.2)` | `rgba(28,88,63,.2)` |
| `rgba(194,231,232,.62)` (ambient circle 1) | `rgba(194,232,216,.62)` |
| `rgba(217,228,249,.5)` (ambient circle 2) | `rgba(217,249,236,.5)` — yes, convert this one too even though its hue reads more lavender than blue; the ask was the *whole thing* green-tinted, two distinct green depths reads better than one green + one leftover lavender |
| `rgba(160,192,195,x)` (admin input borders) | `rgba(160,195,180,x)` |
| `rgba(117,165,170,x)` | `rgba(117,170,148,x)` |
| `rgba(115,168,174,.13)` (admin focus ring) | `rgba(115,174,149,.13)` |

**Carousel/hero placeholder gradients (main.css:456, 550–553)** that currently mix blue with lime/lilac/peach: replace with a spread of in-family green tones (light mint → sage → the new `--ink`) rather than converting just the blue stop and leaving lilac/peach clashing next to it — same instruction as the ambient circles, keep it one cohesive family.

**Success vs. brand-green collision — decided:** don't try to out-rotate this one (the audit's own math shows `#4e8a70` already sits almost on top of the new brand hue). Instead, swap roles: admin **success** feedback moves to a blue accent — `#2f6db8` — paired with a ✓ icon and its own text ("Vistað"), since blue is now free of brand duty. **Error** (`#b66e68`) and **danger** (`#a8544a`) are already in the red family and correctly distinct from both brand green and the new success blue — leave both exactly as they are, no rotation. **Loading** (`#78969d`) rotates like any other neutral-ish tint → `#789d8e`.

**Editor.js's own internal toasts** (`#34c992`/`#33b082`/`#41ffb1`, the brief per-block save/error bubbles baked into `editorjs.umd.js`) — leave alone. They're momentary and contextual to a single block, not the persistent page-level Save button the collision concern above is really about; not worth patching a vendored file for.

**Editor.js chrome colors (`#388AE5` active icons, `#e1f2ff`/`#d4ecff` selection backgrounds, the various low-alpha blue focus/rubber-band tints, `#2eaadc33`, and `list.umd.js`'s `#369FFF`/`#0059AB`) — rotate all of them**, `#006FEA` and `rgba(56,138,229,.16)` included (their context wasn't identified, but rotating is safe: worst case an already-green pixel gets a no-op-ish shift, whereas leaving them blue guarantees a visible mismatch). Route these through a **new override stylesheet loaded only on `/admin`, after Editor.js's injected `<style>`** — not a hand-patch of the vendored `editorjs.umd.js`/`list.umd.js` source — so a future Editor.js version upgrade doesn't silently eat the edit. The one exception: `#a8d6ff`, the fake-selection highlight Editor.js sets via `execCommand` in JS (not CSS) — that one genuinely needs a small JS patch (its rotated value, `#a8ffdb`, hardcoded at the call site), since no stylesheet can reach it.

**Netlify Identity widget (`netlify-identity-widget.js`) — left untouched for now.** Its modal blues (`#366dc7`, `#14314f`, `#205081`, `#0e1e25`) are a third-party auth popup seen only by the 5–10 @kopskolar.is editors, not the public site; revisit only if it visibly bothers you later. Its OAuth provider brand buttons (Google `#4285f4`, Facebook `#1877f2`, GitLab `#e24329`) **must never change** — those are the providers' own trademarks, not site theme.

**`postit files/` (both casings) — reference-only, confirmed already, leave untouched.** **Blob-stored/seeded content — confirmed no highlight-color tool exists, so this risk doesn't apply; still, never run a blanket color replace against Blob content or `scripts/seed-content.js`, source/template files only.**

### Green Retheme — step 2 applied, one follow-up fix decided (2026-09-30)

Step 2 landed (`css/main.css`, `admin/css/admin.css`, `admin.html`, `embed-tool.js`, `editorjs.umd.js`'s single JS swap, the new admin-only `admin/css/editorjs-overrides.css`, plus a self-caught correction: all 21 subpages had the `#eaf5f7` `theme-color` meta too, not just the 3 originally checked — all fixed). Checks so far were grep-only (no old blue literals left outside `postit files/`, no undefined `var()` names) — **nobody has looked at a rendered page yet.**

**Decided now — the "neon icon" problem the implementer flagged:** rotating hue while holding the *original* saturation breaks down on Editor.js's own accents because they were fully-saturated, opaque blues (`#388AE5` active icons/loader/drag-handle, `#369FFF` checked checkbox) — literal rotation gives a harsh, overly-bright green (`#38e59d`, `#36ffab`) that doesn't match the rest of the (comparatively muted) palette. Fix: for these two specific opaque, high-visibility accents only, **don't rotate — hardcode the actual brand-bright anchor `#00844d` instead.** It reads as intentionally "on-brand" rather than neon, and reinforces the Kópavogur-logo tie-in. Everything else in `editorjs-overrides.css` (the low-alpha glows/backgrounds, pale selection tints) keeps its literal rotated math — alpha dilutes those enough that the harshness doesn't apply.

**Confirmed correct, no change needed:** leaving `#006FEA` / `rgba(56,138,229,.16)` alone — they're the vendored bundle's devtools console-log badge styling, never drawn on any page. Good scoping call, not a gap.

**One more paired-value fix, found by checking the two changed tokens against their neighbors in `editorjs-overrides.css`:**
- `--ejs-active-bg` is still `rgba(56,229,157,.1)` — the translucent wash meant to sit *behind* `--ejs-active`. It's the old rotated-math color, not derived from the new `#00844d` the icon itself now uses, so the highlight background no longer chromatically matches the icon sitting on top of it (subtle at 10% alpha, but a real mismatch). **Fix: change it to `rgba(0,132,77,.1)`** (the same `#00844d`, just as an rgb triplet for the alpha syntax) so the wash and the icon are the same color again.
- `--ejs-checkbox-hover` (`#00ab64`) does **not** need touching — checked independently (lighten `#00844d` by ~8% lightness, same hue/saturation, lands at `#00ad65`), it's already almost exactly that value. The leftover rotated math happened to land in the right place for this one; leave it.

**Both applied and confirmed (2026-09-30).** `--ejs-active-bg` is now `rgba(0,132,77,.1)`; `--ejs-checkbox-hover` left as-is. This closes the hue-rotation/math work specifically.

### Green Retheme — found by actual visual QA, not grep (2026-09-30)

First real screenshots came in (subpages `fristund/reglur.html`, `grunnskolastig/matsedill.html`). Confirmed good: header, nav, footer, hero, the homepage quick-link icon row (`.quick-link-icon`) all render green correctly.

**New bug, out of scope of every prior audit pass:** the "Tengd skjöl" (Linked Resources / the "Add Link" Editor.js block's rendered output) icon tile — visible on both screenshotted subpages for its PDF icon — is a soft **lavender/purple** tile + icon, not green, and was never touched. This was never going to be caught by the "find every blue and rotate it" audits (all of them, including the original one), because it isn't blue — it's a separate accent color, presumably original Póst-IT styling for resource/attachment tiles that nobody had a reason to flag as part of the blue palette.

**Root cause found — not CSS at all.** `.resource-icon` (now `main.css:560`, moved down as `:root` grew) was never the problem: it's already correctly green (`rgba(var(--icon-tile-rgb),.6)` background, `color:var(--icon)`), confirmed by full-repo text search finding no purple/lavender value anywhere. The actual cause: `fristund/reglur.html` and `grunnskolastig/matsedill.html` (plus 7 more of the 30 placeholder pages) are **pre-seed static markup** with hand-written emoji glyphs (`📄`, `📅`, `🔗`) standing in for the real Add Link block, e.g. `<span class="resource-icon">📄</span>`. Emoji are pre-colored by the font/platform — no CSS `color` rule can touch them, which is exactly why every hex/rgba-hunting audit came up clean: there was never a color value to find.

**Fixed:** all 10 emoji across those 9 static pages replaced with the same `currentColor` SVGs from `resource-icons.js` used everywhere else (no new color invented) — `fristund/reglur.html`, `grunnskolastig/{matsedill,mentor-app,reglur-um-skolasokn,skoladagatal}.html`, `leikskolastig/{matsedill,reglur,skoladagatal(×2),vala-app}.html`. Also added a missing `.resource-icon svg{width:20px;height:20px}` size rule (`main.css:561`) the emoji never needed but the SVGs do. **Not yet re-confirmed in a browser** — do that before closing this out. The other 9 resource-icon *types* (Video, Calendar, YouTube, etc.) are confirmed to be `currentColor` SVGs with no hardcoded color anywhere in the codebase, so this class of bug can't recur there — but none of them has actually been eyeballed rendered yet either.

**Reminder for later, not a retheme concern:** these are pre-seed placeholder pages (per CONTENT GAPS above) — once the seed script runs and `site.js` renders real Blob content over this static markup, this exact fix is what the seeded Add Link block already produces natively. Nothing to do about this now, just don't be surprised if static fallback markup like this needs the same treatment again if it's ever hand-edited again before Phase 5–7 land.

**Still outstanding regardless of the above:** the admin's Editor.js toolbar itself (the `#00844d` icon swap, the checkbox states) still hasn't been looked at in a browser. Confirm that too before calling any of this done.

**Why that check is still blocked (2026-09-30):** opening `admin.html` via `file://` locally hits "Failed to load settings from /.netlify/identity" — expected, not a retheme bug. Netlify Identity only resolves against a real deployed site; there's no local server for it to talk to yet (nothing committed/pushed). One thing this *did* confirm: the login modal shell itself (dark overlay, "Skrá inn" button) is already correctly green — the `tickets.html`-derived login dialog styling picked up the retheme fine. To actually see the Editor.js toolbar, either deploy (even a draft/branch deploy on the Netlify account) or run `netlify dev` locally — the latter is likely blocked by this machine's application allow-listing, so deploying is the realistic path.

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

Reused from the old site's actual structure (source: `/Postit files/Dropdown_menu.txt` — note this file is a reference for content/structure only, not styling), restyled with frosted/translucent glass panels instead of solid green, with hover-to-reveal on desktop **and tap-to-open on touch devices** (hover alone doesn't work on tablets/phones — the old version used `.dropdown:hover .dropdown-content{display:block}` only, which must be extended with a click/tap handler for touch).

Five top-level categories, each a dropdown of subpages:
- **Forsíða** (Home) — plus links to Unicef verkefni (unicef.is) and Barnaheill (barnaheill.is)
- **Leikskólastig** (preschool level) — Skóladagatal, Leyfistilkynning, Reglur, Vala app, Matseðill, Skólabíll, Lubbi finnur málbein
- **Grunnskólastig** (elementary level) — Skóladagatal, Leyfisbeiðnir, Reglur um skólasókn, Mentor app, Matseðill
- **Frístund** — Frístundabíll, Dagskipulag, Reglur, Leyfistilkynning
- **Foreldraráð** (parent council) — Foreldrafélag

Responsive: full horizontal nav on desktop, hamburger menu on tablet/mobile (the old version only handled this by stacking dropdowns vertically at ≤768px — build a real hamburger toggle instead, matching the ice-glass design system). Back button on every non-homepage page (`history.back()`, homepage fallback) for iPad/iPhone users lacking an OS-level back button.

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

**Backend:** Netlify Function(s) reading/writing Blobs, restricted to authenticated @kopskolar.is Identity users. On save: writes to the relevant Blob entry, purges the CDN cache for that entry, writes the plain-text Sheets backup, updates the search index (strong consistency on this write-then-read path).

**Scope (resolved):** fully free-form WYSIWYG via Editor.js, not fixed fields.

---

## News & Banner (Section 8)

**News:** secretary adds entries via the admin's News form. Stored under a `news` key structure in Netlify Blobs (each item its own entry, `news:<id>`). Clicking a news card opens a single reusable `news.html?id=<id>` detail page — not a modal, needs to be shareable/linkable.

**Emergency Banner:** single Blob entry with `active` (true/false), `bannerText`, an optional `imageURL`, and `LastUpdated`. Behavior:
- Full-size on activation (e.g. "Snow blizzard, school closed today")
- Shrinkable to a persistent scrolling pill via a manual click (not full dismiss)
- Shrink state uses `sessionStorage` (resets on new tab/browser session — NOT tied to calendar day)
- Actual visibility controlled by a separate manual on/off toggle in admin

**Search:** one shared search index (`search-index` Blob entry), fetched lazily only when the visitor opens the search box — not on every page load.

---

## Homepage (Section 13 — fixed sequence, unique to this one page)

In order, top to bottom:
1. Intro text (same Editor.js instance as every other page, not a separate plain-text field) + school photo, side-by-side
2. **Image carousel.** A working reference version exists at `/Postit files/Pic_carousel.txt` — auto-rotates every 5 seconds (`setInterval`, 5000ms), pauses on hover (`mouseenter`/`mouseleave` clear/restart the interval), clickable dot navigation, smooth sliding transition (`transform: translateX(-${index*100}%)` with `transition: transform 0.8s ease-in-out`). Keep this interaction as-is. What changes: the image source (currently a hardcoded `images` array of kopavogur.is URLs — becomes the admin's add/remove/reorder list, fetched from Blobs) and the visual styling (currently solid forest-green dots — `--forest-green:#228B22` — restyle to frosted/translucent ice-glass dots matching the rest of the site, e.g. white/blue-tinted with the same blur treatment as other glass elements).
3. Card grid of the 6 newest news entries (date, title, ~100-character auto-generated excerpt) pulled from the news Blob — not manually arranged
4. Pagination for older news entries

She edits the intro text, swaps the school photo, manages carousel images, and adds news entries — the homepage assembles itself from those pieces.

---

## Linked Resources (Section 15)

Instead of hosting PDFs/docs/videos as files: icon+label+URL cards. An "Add link" button in the admin's Editor.js toolbar. Data model: each link is `{icon, label, url}`, stored alongside the page's Editor.js content. Icon set (10): PDF, Document, Presentation, Video, YouTube, Facebook, Calendar/Meeting, Event/Theme Day, Photo, generic Link.

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
5. **Phase 5 — Netlify Function (backend):** build the Function(s) for reading/writing Blobs.
6. **Phase 6 — Shared content loader:** write the JSON-to-HTML renderer for Editor.js content (public-facing, does NOT include the Editor.js library itself), fetched from the Phase 5 Function, sanitized with DOMPurify.
7. **Phase 7 — Admin portal UI (Sections 7, 15):** build the custom admin portal per the spec above — page/section dropdown, WYSIWYG editor, image upload with compression and alt text, Embed button, Add Link button, carousel editor, News entry form, banner toggle. On Save, call the Phase 5 Function.
8. **Phase 8 — Identity integration:** wire Netlify Identity into the admin portal's access control.
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
