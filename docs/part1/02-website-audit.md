# Part 1B — Full website audit

Reviewed: the whole site as it stands on branch `arena/e210227c-bs` — home,
textiles, enquiry, enquiry acknowledgement, privacy, 404 — on desktop and
mobile widths, with the 3D layer both running and blocked. I also read the
source, the build output and the copy in `src/content.ts`.

I have marked findings that Part 2 has **already fixed** in this branch, so this
document can be re-used as a checklist rather than read as a stale complaint.

---

## Ratings

### The whole website: **6.0 / 10**

**What is genuinely good**

- The typography and colour system is better than most Indian export sites:
  Fraunces + Newsreader + Instrument Sans + Chivo Mono, with a dye-derived
  palette. It reads as an editorial trade house, not a template.
- The copy is honest, specific and free of marketing noise. This is rare and
  valuable, and it is the site's best commercial asset.
- The 3D work is technically excellent: real Natural Earth geography, true
  great-circle routes, shader-carved continents, no downloaded assets.
- Accessibility fundamentals are present: skip link, focus styles, reduced
  motion, real labels, an aria-live form status.
- The enquiry form refuses to fake success. That integrity is unusual.

**What holds it at 6**

- It is a **showcase, not a supplier site**. A buyer arrives wanting to know
  what you can supply, from where, at what minimum, with what evidence, and how
  fast you answer. Four of those five are absent.
- **Commercial content is extremely thin.** Six routes; one product category
  page; no specifications, no MOQs (not even "agreed per enquiry" stated as a
  policy), no HS codes, no packing, no documentation, no sample policy, no
  FAQ.
- **Trust scaffolding is missing**: no city, no phone, no named person, no
  registrations (IEC / GST / FIEO), no working hours, no business hours or time
  zone, no company address. The only contact route is a Gmail address.
- **One category of six has a real page.** Handicrafts, food, industrial and
  organic are words in a row of tiles and nothing else.
- **Performance is heavy** on the one route that matters most (see §3).
- **SEO is close to absent**: no per-category URLs, no sitemap, no robots.txt,
  no structured data, no canonical, no og:image, weak titles.
- **Design consistency drifted**: two cursor systems had accumulated, the hero
  had scene-control buttons on a decorative globe, the "what are you looking
  to source" section had turned tiles into pop-up buttons. Parts of the site
  felt like an internal experiment. (Part 2 addresses these.)

### The overall plan: **7.5 / 10**

**Strong**

- The information boundaries are the most professional thing in the whole
  project: a written list of what the site will *not* claim, enforced in one
  content file, rendered on the pages themselves. Most agencies would not think
  of it.
- Single source of truth for copy; enquiry-first rather than catalogue-first;
  honest "developing business" framing; a real privacy page.
- The category-first homepage idea (six product areas, textile as one of them)
  is the right instinct for a multi-category business — even though the
  implementation regressed.

**Weak**

- The plan is **textile-shaped**. Every detail — fabric swatches, Tamil Nadu
  and Gujarat, four craft objects, "tell us about your fabric" — is textile.
  There is no plan element for handicrafts, home decor, food or industrial
  goods beyond a label in an array.
- **No commercial content model.** No decision was ever made about
  specifications, MOQ policy, sample policy, Incoterms, documentation, or
  categories per page.
- **No SEO model.** Route structure was chosen for storytelling, not search.
- **No trust model.** Nothing about credentials, address, people, response
  commitment, or evidence.
- **The 3D ambition is undersized in usefulness and oversized in cost.** The
  expensive assets explain the *idea* of trade; none of them help a buyer
  decide. Some are genuinely beautiful (the globe) and should stay; others are
  decoration that will need to be cut as categories grow.

Plan → 7.5, because the judgement behind it is sound and the writerly voice is
an asset. What is missing is trade knowledge, not taste.

---

## 1. Design

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| D1 | Two cursor implementations had accumulated (`site.css` legacy rules + `cursor.css`). Over nav items the cursor became a pill with "Explore" *below* the pointer — the opposite of the reference image. | High | **Fixed in Part 2** — one disc, 88px, opaque, word centred, on the pointer. |
| D2 | A decorative globe carried six interactive controls (turn, tilt, pause, reset). On a hero illustration this reads as a demo reel, not a business site. | High | **Fixed in Part 2** — controls removed everywhere. |
| D3 | The globe's canvas was shrunk into the right-hand 64% but the framing maths was tuned for a full-bleed canvas, so the sphere rendered small and floated. | High | **Fixed in Part 2** — framing restored to 62% of hero height. |
| D4 | "What are you looking to source?" had become six outlined boxes with `↗` and an empty panel underneath that mounted the **whole enquiry form** inside the homepage. Two forms' worth of UI in one section. | High | **Fixed in Part 2** — one row of live category tiles, no form on the homepage. |
| D5 | That section also occupied roughly two screens of vertical space for six labels. | Medium | **Fixed in Part 2** — compact row plus a running list of categories. |
| D6 | The hero headline "Import and export sourcing in India" never says *what* is sourced. First-time visitors cannot tell textiles are the lead category. | Medium | Open |
| D7 | Section rhythm is uneven: a full-screen hero, then a dense explorer, then a single short paragraph, then a footer. The middle of the page is nearly empty. | Medium | Open |
| D8 | Mixed visual languages: some sections are editorial (purpose/brief), others are hardware-y (dark plates, monospace clusters). Coherent at the section level, less so across the page. | Low | Partly fixed |
| D9 | The `logo-1024.png` in the repo root is unused and unreferenced (50 KB of dead weight, also shipped by git but not by the build). | Low | Open |
| D10 | `HeroScene.tsx`, `weave.ts` and parts of `geometry.ts` are now unreferenced after the textile sequence was replaced. Dead 3D code inflates the bundle's reachable surface. | Low | Partly fixed (ProcessScene, TextileSequence, useScrollProgress removed) |

## 2. Content

| # | Finding | Severity |
| --- | --- | --- |
| C1 | **No specifications anywhere.** No composition, construction, weight (GSM), width, finish, or use, in any category. This is the single biggest content gap; buyers judge suppliers on exactly this. | Critical |
| C2 | **Five of six categories have no page and no content.** Handicrafts, agriculture, industrial, organic — they exist only as tile labels. | Critical |
| C3 | **No MOQ, lead time, sample policy, packing, Incoterms, HS code, or documentation content**, not even as policy statements ("agreed per enquiry, in writing"). The site's caution has become silence. | Critical |
| C4 | **No credentials.** No IEC, GST, FIEO, Udyam, or product-certification stance. There is no statement of what will be asked of suppliers. | Critical |
| C5 | **No place and no person.** No city, state, phone, named contact, or working hours. Only `bsexim.nexus@gmail.com`. For import/export this is the defining trust signal. | Critical |
| C6 | The four "fabric" topics were **illustrated by a bolt, shuttle, bobbin and reed**, which imply a relationship between the object and the contract term that does not exist — and the motion was not smooth. | High | **Replaced in Part 2** with a written brief. |
| C7 | Textiles page never explains **what a buyer can actually ask for**: fabric families by use (shirting, workwear, home textiles, made-ups), by construction (woven, knit, printed, dyed), and the made-up categories a textile exporter normally handles. | High |
| C8 | No **FAQ**. Every competitor that converts has one, because buyers ask the same nine questions. | High |
| C9 | No **case study, no sample enquiry, no worked example** of the conversation. The site describes a process; it never shows one. | Medium |
| C10 | Nothing about **India's craft clusters** (Moradabad brass, Jaipur/Sanganer block print, Karur home textiles, Panipat rugs, Bhuj/Kutch weaving, Firozabad glass). That vocabulary is what makes a sourcing partner sound like one, and it is free to add. | Medium |
| C11 | The "developing business" framing is used ~8 times. Honest, but it starts to undermine confidence rather than build it. Two mentions plus a clear "what exists today" block is stronger. | Medium |
| C12 | Privacy page is good but does not mention **retention period**, **lawful basis / consent**, or **the right to complain to a data-protection authority** (relevant for EU buyers). | Medium |
| C13 | Acknowledgement page correctly says delivery is unverified — but the underlying **Web3Forms delivery has never been confirmed**. Until a real enquiry lands in the inbox, the site's only conversion path is unproven. | Critical (operational) |

## 3. Performance

Measured from the production build in this branch: **2.4 MB total, of which
a 919 KB (243 KB gzip) three.js chunk** is loaded on the homepage, plus
`land.json` (110 KB) and a 22 KB land mask.

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| P1 | three.js (919 KB) is fetched on the hero. It is code-split and lazy, so first paint is unaffected — but on a 4G phone the globe arrives ~1.5–3 s after the text, which is exactly when the visitor is reading the headline. | High | Partly addressed (adaptive quality) |
| P2 | The homepage ran **two** WebGL contexts (hero + product explorer panels) and the textiles page up to five. Browsers cap contexts at ~8–16; older Android drops the oldest silently and shows a blank plate. | High | **Fixed in Part 2** — the explorer's single context replaced by small per-tile canvases with dormancy, and the four-object sequence removed. |
| P3 | Every scene ran continuously whether or not the device could keep up, and there was no fallback short of reduced-motion. | High | **Fixed in Part 2** — measured quality (high / medium / still), with automatic, non-user-facing adaptation. |
| P4 | 17 `@font-face` declarations from four variable families, including unused Vietnamese and latin-ext subsets of Fraunces (~330 KB of the woff2 payload). Only latin is needed. | Medium | Open |
| P5 | Frame rate was capped by a hand-rolled gate in the older Stage implementation and removed later; there is no cap now, so a 120 Hz display renders 120 fps of a slow drift. | Medium | Partly addressed (adaptive quality) |
| P6 | No `preconnect`, no `font-display` audit, no image optimisation pipeline (there are no images — everything is procedural, which is a genuine advantage). | Low | Open |
| P7 | Long tasks during first scroll: shader compilation for the globe happens on the main thread at first frame. With the intro overlay it is hidden; without it (a direct `/textiles` visit) it can stutter. | Medium | Migrated: the intro now runs 3 s, which covers compilation |

## 4. UX

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| U1 | Navigation is three items (Products, Textiles, Enquire) for a six-category business. "Products" jumped to an anchor on the homepage rather than to a products destination. | High | Open |
| U2 | The only way to reach a category was a tile that opened an inline form — no category landing page, so a visitor could not read about handicrafts before enquiring. | High | **Fixed in Part 2** — every tile routes to `/enquiry?category=…`; category pages are proposed in 1C. |
| U3 | `#process` anchored to a section about *sourcing conversation*, while the enquiry form's "how it works" link and hero secondary CTA both pointed elsewhere. Anchors had drifted from their labels. | Medium | Open |
| U4 | Logo click replays a 1-second intro animation with a "Skip introduction" button — a control nobody asked for, on a sequence nobody wanted repeated. | Medium | **Fixed in Part 2** — 3 s sequence, skip removed, still interrupted by scroll/Escape/Tab. |
| U5 | Mobile: the hero emphasises the globe and the copy competes with it. The CTA sits below a tall illustration on a 390 px screen. | Medium | Open |
| U6 | The horizontal tile strip on the homepage scrolled with no scrollbar, no arrows visible at all widths, and no label saying it scrolls. | Medium | **Fixed in Part 2** — arrows plus native snap-scroll with a peek. |
| U7 | Form has five fields, none of them about **quantity, destination country, or timeline** — so the first reply cannot be commercially useful. | High | Open |
| U8 | No confirmation of expected response time anywhere near the form. | Medium | Open |
| U9 | No breadcrumbs on inner pages; a buyer arriving from search at `/textiles` has no sense of the site's shape. | Low | Open |
| U10 | Mobile drawer works and traps focus correctly. Good. | — | — |

## 5. Mobile

| # | Finding | Severity |
| --- | --- | --- |
| M1 | The globe is now almost full-width and 62% of the hero height on a phone: it dominates the first screen before any words. On a 390×844 viewport the headline and the CTA fall below the fold. |
| M2 | Per-tile 3D canvases in the new explorer row are ~110 px tall on a phone; if the device is weak they are the first thing to stutter, and there are six of them. **Watch this** — the adaptive system should hold them still, but it is the one place I would cut the canvases entirely below 720 px if real-device testing shows trouble. |
| M3 | Long text blocks (the brief, the boundaries list) are comfortable but the fabric table (proposed) must not become a horizontally-scrolling table on mobile. |
| M4 | Tap targets in the new row's arrow buttons are 40 px — under the 44 px guideline. Should be lifted. |
| M5 | No `env(safe-area-inset-*)` handling; the fixed nav can sit under a notch in landscape. |
| M6 | `100svh` is used for the hero — correct — but the nav's `backdrop-filter` combined with the parallax transform on `.hero__canvas` will jank on mid-range Android. Consider disabling the transform there. |

## 6. Trust and credibility

| # | Finding | Severity |
| --- | --- | --- |
| T1 | **No physical address, no phone, no named human.** The single largest gap on the site. |
| T2 | **No registrations shown** (IEC, GST, FIEO, Udyam). Buyers check DGFT's IEC database; not being able to find you is a stop signal. |
| T3 | **No company profile PDF** to forward internally. Buyers routinely send a supplier's PDF to a colleague; without one, you are a link they cannot share. |
| T4 | **Gmail address only.** Understandable at this stage, but paired with no phone and no address it reads as "individual with a website". A domain mailbox (`@bseximnexus.com`) is a cheap, large credibility gain. |
| T5 | The site says "developing business" but never defines *what is already in place* — that asymmetry makes a buyer assume nothing is. |
| T6 | Sample imagery is procedural (correct, and honestly captioned) but there are no real photographs of goods, clusters, or people. One real, captioned photograph of a mill or a craft cluster would out-convert all six 3D tiles. |
| T7 | No testimonials, references, or buyer logos — correctly, because they would be false at this stage. Which means T1–T4 must carry the load. |
| T8 | `og:image` is absent, so a link shared on WhatsApp or LinkedIn shows no image. In this trade, WhatsApp is the sharing channel. |
| T9 | Form delivery is unverified, and if it silently fails the site takes enquiries into a void. |

## 7. SEO

| # | Finding | Severity |
| --- | --- | --- |
| S1 | Five routes, one product category. No per-category, per-region or per-family URLs, so there is nothing to rank for the queries buyers actually use ("cotton fabric exporter Tamil Nadu", "brass handicrafts supplier India"). |
| S2 | No `robots.txt`, no `sitemap.xml`, no canonical tags, no `hreflang`. |
| S3 | No structured data at all (Organization, LocalBusiness, BreadcrumbList, ItemList, FAQPage). |
| S4 | Titles are generic and inconsistent in format (`… | BS EXIMNEXUS` vs `… | BS EXIMNEXUS`). Description tags are fine but thin. |
| S5 | No `og:image`, no `twitter:card`, no `og:url`. |
| S6 | Client-side rendering only. Google executes JS, but Bing and many trade-directory crawlers index the empty shell — and a buyer's first sight of you is often a directory scrape. |
| S7 | The `<h1>` on the homepage is two spans with a trailing space (`Import and export  sourcing in India.` — double space, visible in the DOM). Trivial, but it is the string a search engine reads first. |
| S8 | Anchor-only navigation to `/ # products` gives no crawlable category links. |
| S9 | No `lang` variation, no market targeting (buyers in the Gulf, EU, US search differently). |
| S10 | Alt text is absent everywhere by design (decorative), which is correct — but there is no textual equivalent of the *content* the 3D objects are meant to convey. |

## 8. Anything else

- **Analytics: none.** There is no measurement of any kind, so there is no way
  to know which category buyers open, where they leave, or whether the form is
  ever submitted. Every judgement about this site is currently a guess.
- **No error monitoring.** A runtime failure in the 3D layer falls back
  gracefully, but nobody is told it happened.
- **Deployment is undefined.** No `vercel.json`/`netlify.toml`, no SPA rewrite
  rule documented, no staging URL. Deep links (`/textiles` refreshed) will 404
  on a static host without a rewrite. This is a launch blocker.
- **No content security policy**, and `VITE_*` environment variables are baked
  into the client bundle (fine for a Web3Forms public key, but should be a
  conscious decision and documented).
- **Repo hygiene**: `logo-1024.png` and `skills/`+`.agents/skills/` (duplicated
  humanizer skill) sit in the root; `VERIFICATION.md`, `CHANGES.md` and
  `IMPLEMENTATION_PLAN.md` are internal documents that are public because the
  repo is public. Nothing secret, but it exposes how the sausage is made.
- **No test for the enquiry delivery path** against a real key, and no
  regression test for the honeypot/validation states beyond the mocked checks.
- **Two `Logo` implementations have existed**; the header SVG now depends on a
  mask with a fixed `useId`, which is robust, but the mask path is hand-authored
  and should be verified against the source artwork at large sizes.

---

## Priority order for what to fix next

1. **T1–T2: address, phone, name, registrations.** Cheapest, largest trust gain.
2. **C3: a written commercial policy** — MOQ, samples, lead time, Incoterms,
   documentation, all phrased as "how we agree it", not invented numbers.
3. **C1 + S1 + C2: category pages with a specification table** per family.
4. **U7: three more form fields** (quantity band, destination country,
   timeline) and a stated response window.
5. **C13/T9: confirm real enquiry delivery.**
6. **C8: an FAQ** written from the nine questions buyers actually ask.
7. **S2–S3: robots, sitemap, canonical, JSON-LD.**
8. **Deployment rewrite rule + a staging URL.**

Everything else in this document is polish or preference.
