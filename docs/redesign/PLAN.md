# BS EXIMNEXUS: reimplementation plan

Status: **plan for review. Nothing built yet.**
Branch: `redesign/sourcing-desk`, cut from `origin/continuous_globe_about_page` (the branch that matches the live site; `main` is an older version).
Inputs: the Codex + Claude review (`design-ecosystem/reviews/bs-eximnexus.md`), the repo's own docs (`docs/part1`, `docs/part3`, `docs/reviews`), and the design-director process.

---

## 1. What is wrong, in one paragraph

The site is well built and honest, but it looks like the model's "tasteful default": charcoal hero, parchment body, serif headline with one italic orange word, mono uppercase labels, amber accent, a glowing globe. The repo's own tokens say the palette comes from Indian textile dyes (indigo, madder, saffron, verdigris, brass), **but the render barely uses them**: what you see is ink, parchment and amber. The homepage also says the same thing twice (six category cards, then a six-screen 3D tour of the same six), puts "Start an enquiry" about ten times, and the globe takes a full phone screen before any content. The fix is not a new coat of paint. It is to make the site look like the thing it actually is.

## 2. What stays (load-bearing, do not touch)

| Keep | Why |
|---|---|
| `src/content.ts` as the single source of words | It enforces the "no invented facts" rule. |
| The information boundaries (no stock, prices, certifications, customer counts) | They are the site's integrity. |
| Routes: `/`, `/textiles`, `/about`, `/enquiry`, `/enquiry/acknowledgement`, `/privacy`, `*` | No new routes in this pass. The 15-route plan in `docs/part1` is a later, content-dependent job. |
| Enquiry logic: `EnquiryForm`, `enquiry-config`, `receipt-store`, Web3Forms wiring, the honest "not connected" state | Works; only its look changes. |
| `ScrollManager`, `PageMetadata`, skip link, focus handling, reduced-motion handling | Accessibility work already done. |
| `vercel.json`, Vite config, React 19, the build | No framework change. |

## 3. Three directions (pick one; the dealt seeds are in section 10)

Each passes the swap test: put "DHL", "Alibaba" or "a Shopify textile store" on it and it no longer fits.

### A. The dye house (recommended)
- **Product:** India-based desk that turns a buyer's or supplier's need into a sourcing conversation, textiles first.
- **Character:** saturated, exact, handmade.
- **World:** a bandhani and block-print dye yard: vats of indigo, madder and turmeric, cloth drying in strips, tied-dot patterns, chalk-marked tallies.
- **Palette (roles):** ground raw cotton `#F2EBDD`; surface unbleached `#E8DDC8`; ink lamp-black `#1A1611`; rule `#1A1611` at 12%; **six dyes, each owning exactly one product category**: indigo `#1D2A45` textiles, madder `#9C3A2D` handicrafts, turmeric `#C9931E` agriculture, iron-grey `#4A4F55` industrial, verdigris `#4C7A68` organic, brass `#B0864A` other. Action colour is indigo only. Many hues, one job each, one neutral holding them. (These are mostly the repo's existing dye tokens, finally used.)
- **Type:** Fraunces display (kept, but no italic-accent formula), Instrument Sans for everything else. Chivo Mono only for numbers and specification values. Display about 3x body.
- **Hard rule:** a colour appears only where its category is meant. Nothing is coloured for decoration.
- **Moment:** the **swatch book**. The six categories are six cloth strips hanging side by side, dyed in their colour with a generated weave texture (the repo already generates weave textures). Hover or tap one and it opens into that category's brief: what to tell us, plus a button that starts an enquiry pre-filled with that category.
- **Signature:** a bandhani dot row (tied-resist dots) used as the only divider on the site.
- **Concept:** every colour on the page is a dye with a job. Empty state: undyed cotton. In use: the chosen dye spreads. Done: the acknowledgement page shows the strip you chose.

### B. The specification desk (Codex's direction)
- **World:** a sourcing desk: kraft sample envelopes, ruled specification sheets, graphite notes, a stapled swatch.
- **Palette:** kraft `#E8DDC8`, paper `#F7F0E2`, graphite `#24231F`, muted `#625C50`, rule `#B8AA91`, one indigo action `#274962`.
- **Type:** serif titles, Instrument Sans, mono for fields.
- **Hard rule:** no decorative imagery; every visual is a document.
- **Moment:** an **enquiry docket** on the homepage that fills itself in as you pick a category, then becomes the real form.
- **Signature:** a ruled specimen label (category + field number).
- **Risk:** calm and credible, but quiet. Less "India", more "office". Could read as cold.

### C. The shipping manifest
- **World:** bills of lading, rubber stamps, stencilled crate marks, railway goods sheds.
- **Palette:** manila `#EDE3C8`, carbon `#1B1B1B`, stamp red `#B3261E` only for the one action, stencil blue `#2B4C7E` for routes.
- **Type:** mono everything for data, a condensed grotesk for display.
- **Hard rule:** everything sits on the manifest grid; no curves.
- **Moment:** the hero is a manifest line being typed: origin (Gujarat / Tamil Nadu), goods, destination, which you can edit, and it becomes your enquiry.
- **Signature:** stencil crate marks on section numbers.
- **Risk:** strongest personality, but implies logistics and shipments the business has not done. Close to the information-boundary line.

**Recommendation: A.** It is the only one that is specifically Indian *and* specifically textiles, it reuses work already in the repo (dye tokens, weave texture generator), and its many-colour palette has a rule that keeps it from turning into noise. B's enquiry docket can be borrowed as the enquiry page treatment.

## 4. What gets removed

| Remove | Reason | Risk |
|---|---|---|
| Hero globe (`HeroScene`, `GlobeScene`, globe geo data) | Stock "global trade" symbol; full phone screen of nothing. | Big prior investment. **Option:** keep a small, static Gujarat + Tamil Nadu map on `/textiles` where the regions are discussed. Your call (Q3). |
| 3D product tour (`ProductExplorer`, `Gallery`, `CategoryContinuity`, related CSS) | Duplicates the category cards. | None; content is in `content.ts`. |
| The italic-orange-word formula on every heading | A device on every heading is not emphasis. | None. |
| Custom cursor (`Cursor`, `cursor.css`) | Decoration; hides the native cursor. | Low. |
| Logo intro animation on every load (`LogoIntro`) | Delays content every visit. | Low. Could keep once per session (Q4). |
| ~10 repeated "Start an enquiry" buttons | One primary action: nav, hero, close of page. | None. |
| Wide-tracked uppercase mono labels | Generic tell; mono kept only for numbers/specs. | None. |
| Hover-scale, infinite animations, backdrop blur (tell-checker hits) | Motion without purpose. | None. |

Every deletion is confirmed by `git grep` for imports before the file goes, and the build must pass after each one.

## 5. Page by page

**Home `/`**
1. Hero: one sentence of positioning (from `docs/part1`: sources from India for overseas and Indian buyers, textiles first). No image. Undyed cotton ground. Primary action "Start an enquiry", secondary "See what we source".
2. The swatch book (the moment). Six strips; textiles is wider because it is the lead line. Opening a strip shows its brief from `CATEGORIES[].hint` and an enquiry link with `?category=`.
3. How an enquiry works: the three steps, numbered because they really are a sequence.
4. What a first message needs (`FIRST_MESSAGE`).
5. Close: one enquiry action.

**Textiles `/textiles`**: keep `FabricBrief` (the thing the review said works). Restyle around indigo. Tamil Nadu and Gujarat as two named regions (map optional, Q3). Boundaries block stays.

**About `/about`**: desk facts table and founder card, restyled. Copy issue, see section 8.

**Enquiry, acknowledgement, privacy, 404**: logic untouched. Enquiry page takes B's docket look: ruled fields, the chosen category's dye as the only colour. Acknowledgement shows the chosen strip.

**Nav and footer**: plain text links, one action, no mono caps. Footer keeps contact, legal, privacy.

**Mobile**: swatch book becomes a vertical stack of strips; everything single column under 600px; no element taller than one screen without content in it.

## 6. Technical approach

- **CSS:** rewrite `tokens.css`; replace `site.css` (2,870 lines) with per-area files (`base`, `layout`, `components`, `pages/*`). Remove dead files (`cursor.css`, `logo-intro.css`, `posters.css`, `journey.css`, `products.css` if unused).
- **three.js:** if the globe and tour go, three.js may only be needed for the swatch weave. Plan is to draw the weave texture to a 2D canvas or CSS (the generator in `src/three/textures.ts` already draws to canvas) and **drop three.js from the homepage entirely**. Expected: much smaller first load. I will measure bundle size before and after and report the numbers.
- **Fonts:** keep Fraunces and Instrument Sans; Newsreader and Chivo Mono are candidates to drop (fewer font files). Decided during the build by what the type actually needs.
- **Direction comment** at the top of `tokens.css` (the six lines), so the tell-checker and future agents can see it.
- No new dependencies.

## 7. How I will prove it works

Every phase ends with:
1. `npm run typecheck` and `npm run build` pass.
2. `design-ecosystem/scripts/check.mjs` on the built CSS/JS: no FAIL.
3. Screenshots at 1440, 820 and 390 in my browser pane, saved to `docs/redesign/shots/<phase>/`.
4. Contrast checked for every text/ground pair (4.5:1, large text 3:1). Six dyes on cotton is where this can fail, so each is measured.
5. Keyboard pass: tab order, visible focus, swatch book operable with keys.
6. Reduced motion: page fully usable with motion off.

At the end: Codex + Tether runs the same design-critic review on the Vercel preview URL, and I compare scores with the baseline (Distinctiveness 2, Coherence 3, Hierarchy 3, Craft 2, Usability 2, Restraint 2). Target: nothing under 3, Distinctiveness at least 4.

## 8. Content problems found (need the founder's answer, not mine)

1. **About page claims contradict the site's own rule.** `ABOUT_OWNER` and `ABOUT_STANDARDS` say he tracks orders through dispatch, checks lab dips, and confirms prices and minimums in writing before shipment. The house rule in `content.ts` says no shipment history or confirmed process claims. Either these are true (then keep them) or they come out. I will not change these words without your answer (Q5).
2. **Gmail address** (`bsexim.nexus@gmail.com`) for a B2B trade desk. A domain email is the cheapest credibility fix. Not a code change I can make.
3. **Enquiry delivery is unverified** per the README. Out of scope, but noted.

## 9. Git workflow (git CLI)

```
branch   redesign/sourcing-desk  (from origin/continuous_globe_about_page)
commits  one per phase below, message says what and why
push     after each phase: git push -u origin redesign/sourcing-desk
preview  Vercel builds a preview URL per push (if the GitHub integration is on; I check on first push)
merge    PR into the production branch only after you approve the preview
```

Phases (each is one commit, each leaves the site building):
0. Baseline: screenshots + tell-checker of the current build into `docs/redesign/baseline/`.
1. Tokens + direction comment + fonts.
2. Remove dead weight: tour, cursor, intro, globe (per your answers). Build passes.
3. Shell: nav, footer, base styles.
4. Home page with the swatch book.
5. Textiles page.
6. About page (copy per Q5).
7. Enquiry, acknowledgement, privacy, 404.
8. Motion, accessibility, mobile pass.
9. Verification: check.mjs, screenshots, Codex review, bundle numbers. Write `docs/redesign/RESULT.md`.

I will not push to the production branch, force-push, or delete remote branches. Nothing is pushed until you approve this plan.

## 10. Design ledger

Dealt seeds (from `deal.mjs`), and what happened to them:
- typewriter bench / no shadows or gradients / terminal-as-product: **took "no shadows, no gradients, no blur"** as a global rule for A. Rejected the terminal layout (wrong audience).
- Rangoli at dusk / nine hues each with one job / sticky rail: **took "each hue owns one job"**; it is the core of A. Sticky rail rejected (adds chrome).
- Rangoli / type only / contact sheet: rejected "type only"; the swatch strips are the one image the site needs.

## 11. Answers so far (2026-11-24)

- **Globe: keep it, refine it** to fit the chosen direction. Section 4's "remove globe" row is withdrawn. Refinement scope: recolour to the direction's palette, stop it taking a full phone screen before content (smaller or placed after the hero copy on mobile), keep Gujarat and Tamil Nadu markers. three.js therefore stays on the homepage; the bundle measurement still runs.
- **Logo intro: keep.** Section 4's intro row is withdrawn. It is restyled to the direction, not removed.
- **About page: order tracking through dispatch is not in place, so it is removed from the copy.** The sentence in `ABOUT_OWNER.summary` that mentions tracking orders through dispatch is the only copy change this answer authorises.
- **Framing:** the business is a broader sourcing and trade coordination desk; textiles are one important category alongside the others, not the boundary. The homepage hero copy and the swatch book proportions follow that (see open question on textiles' weight).

- **Direction: A, dye house.**
- **Production branch: `continuous_globe_about_page`.** The final PR targets it; nothing is pushed there directly.
- **About claims:** written terms stay; the lab-dip / swatch-check claim is removed (from `ABOUT_OWNER.summary` and `ABOUT_STANDARDS`).
- **Textiles: equal with the other five** on the homepage. All six strips are the same width; `/textiles` stays as its own page.

## 12. Original questions (all answered above)

1. **Direction:** A (dye house), B (spec desk) or C (manifest)?
2. **Which branch does Vercel deploy to production?** It looks like `continuous_globe_about_page`, not `main`. I need this before the final PR.
3. **Globe:** remove entirely, or keep as a small static region map on `/textiles`?
4. **Logo intro:** remove, or play once per browser session?
5. **About page claims** (section 8.1): are order tracking, lab-dip checks and written terms before shipment true today?
