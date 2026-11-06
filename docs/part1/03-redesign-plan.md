# Part 1C — Redesign plan

A plan only. No implementation in this document. It assumes the fixes in Part 2
are in place, and it is written so that any later implementation is a
*replacement of sections*, not a rewrite of the system: the type, palette,
copy discipline and 3D capability all stay.

---

## 1. The problem to solve

The site currently reads as **a website about sourcing textiles from India**.

The business is **an import-export house that leads with textiles**. Those are
different things, and the gap shows in four places: the navigation, the
homepage after the hero, the absence of category pages, and the absence of
anything a buyer can *evaluate* (specifications, policy, credentials).

There is a second, subtler problem. The site is more careful about what it
does not claim than it is informative about what it does. Caution without
substance reads as inexperience. The fix is not to make bolder claims — it is
to add **substance that is true**: named areas, named families, named stages,
named credentials, named policies.

**Design principle for the whole redesign:** *every screen must answer a buyer's
question.* If a section only expresses a mood, it is decoration and it goes.

---

## 2. Positioning, stated once

> **BS EXIMNEXUS sources and coordinates the export of Indian goods for
> overseas buyers, beginning with textiles and fabrics from Tamil Nadu and
> Gujarat, and covering handicrafts, home decor, agri produce and industrial
> materials on enquiry.**

That sentence should be recognisable in the hero, the meta description, the
footer and the About page. Everything else follows from it:

- **Textiles are the lead, not the boundary.** There is a dedicated textile
  page, and it is given more depth than any other category. The other
  categories are real, with their own pages, but shallower at the start.
- **Three audiences, three doors**: overseas buyer, buyer in India, Indian
  supplier. Each door has a different first step.
- **The unit of the site is a category page**, not a homepage section.

---

## 3. Site structure

```
/                             Home
/categories                   All product areas (index of the five below)
/textiles                     Textiles & fabrics          ← deep page
/handicrafts                  Handicrafts & home decor
/agro                         Agriculture, spices & food
/industrial                   Industrial & packaging materials
/organic                      Organic & sustainable sourcing
/how-we-work                  The seven stages, in detail
/quality                      Inspection, evidence, what we ask of suppliers
/credentials                  Registrations, memberships, documentation
/about                        The business, the place, the person
/faq                          Buyer questions
/enquiry                      Start an enquiry (category in the query string)
/enquiry/acknowledgement
/privacy
/terms                        Enquiry and quotation terms (plain language)
/404
```

Fifteen routes beats five for three reasons: a buyer can find their category, a
search engine has something to rank, and the site stops depending on one long
homepage to explain everything.

**Deliberately not included yet:** prices, stock, a cart, logins, a blog with
no author, a "our clients" wall, country landing pages (add these only when
there is real trade under them — otherwise they are thin duplicate pages).

### Navigation

Primary navigation becomes **five items**, not three:

```
Products ▾   How we work   About   [Enquire]
```

- **Products** is a real menu (desktop dropdown, drawer accordion on mobile),
  listing the five categories with one-line descriptions each. It is a
  destination (`/categories`) *and* a menu, so the top-level link always works.
- **How we work** carries the process, quality and credentials pages as
  anchored sections; it is the page that replaces "trust us".
- **About** carries the business, the place and the person.
- **Enquire** stays a button, always visible, always one click.
- **Textiles** leaves the top bar. It is the first entry in Products, linked
  from the hero, and it keeps its own page. Keeping it in the top bar would
  re-state "textile-only" on every screen, which is the exact impression the
  redesign is removing. (If the business later decides textiles should stay
  promoted, add it as the sixth item — but only then.)
- The footer carries all five categories, How we work, Privacy, Terms, and the
  contact block with address and phone.

### URL and anchor rules

- One `h1` per route; category name appears in the title, description and `h1`.
- Every category page has a stable anchor list: `#families`, `#specifications`,
  `#areas`, `#enquiry`.
- The enquiry always carries its category in the query string and the form
  pre-fills it. No modal forms anywhere.

---

## 4. The home page

Nine sections, in this order, with a stated job for each. The whole page should
answer "yes, these people can handle my category" before the first scroll ends
and "these people are real" by the third.

| # | Section | Job | Content |
| --- | --- | --- | --- |
| 1 | **Hero** | Say what, where, for whom | Headline naming the trade *and* the categories. One line of lede. Two actions: "Explore products", "Start an enquiry". The globe stays — it is the best thing on the site — at the size Part 2 restored, with no controls. Add a small, honest strapline: "Textiles first. Handicrafts, home decor, agri and industrial on enquiry." |
| 2 | **Category row** | Route the visitor in one click | The six live tiles from Part 2, each linking to its category page. Keep the running list beneath it. This is the single most important section on the page. |
| 3 | **What we do** | Explain the business in three sentences | Buying side: find, verify, sample, inspect, document, ship. Selling side: Indian suppliers get a route to overseas buyers. No adjectives. |
| 4 | **How it works** | Prove a process exists | Five visible stages with one line each: Enquiry → Specification → Sample → Order & inspection → Documents & dispatch. A "Read the detail" link to `/how-we-work`. |
| 5 | **Categories with depth** | Show the shape of the business | Three cards, not six: Textiles (the deep one, with a note about families and regions), Handicrafts & home decor (with cluster names), Agri & industrial (combined). Each with a link to its page. |
| 6 | **Where** | Place the business | A map-free section: Tamil Nadu and Gujarat named with what they are known for, plus "elsewhere in India on enquiry". The globe's two origins are the visual. |
| 7 | **Credentials strip** | Answer the compliance question | IEC · GST · FIEO · Udyam, each with the number where it exists, plus one honest line about what is in progress. If any are missing, say what is being arranged. |
| 8 | **Who you are talking to** | Put a person and a place on it | City, state, a named contact, phone, email on a business domain, working hours and time zone, response commitment. One real photograph if one exists. |
| 9 | **Close** | Convert | One short enquiry prompt, the five (now eight) fields described in one line, and the mailto fallback. |

**Removed from the current homepage:** the standalone "The conversation"
paragraph, the repeated boundaries list (it moves to `/quality` and `/terms`,
with a one-line link from the home page), and any section that only expresses
mood.

**Kept:** the globe, the live category row, the type system, the palette, the
copy voice, the honesty.

---

## 5. Category pages

Five pages, one template, different depth. Each page answers, in order:

1. **What this category is** — one paragraph, in trade language.
2. **Families** — the sub-categories, named the way the trade names them.
3. **Specifications** — a table of the attributes a buyer will be asked about,
   with a footnote: "representative ranges; confirmed per enquiry".
4. **Where it comes from** — Indian clusters and states, honestly scoped.
5. **How an enquiry in this category works** — what to send, what comes back,
   when.
6. **Enquiry** — pre-filled for this category.

### 5.1 `/textiles` — the deep one

This keeps everything Part 2 preserved (fabric types, Tamil Nadu, Gujarat,
the written brief) and adds the commercial layer around it:

- **Families by construction**: woven (plain, twill, satin, dobby, jacquard),
  knitted (single jersey, interlock, rib, fleece), printed (screen, rotary,
  digital, block), dyed (reactive, vat, pigment, natural), and **made-ups**
  (bed linen, table linen, towels, bags, aprons) — because a textile export
  house is asked for made-ups far more often than for greige fabric.
- **Families by fibre**: cotton (including organic and BCI), silk, viscose and
  blends, linen, wool, polyester blends, and handloom.
- **Specification table**: fibre composition · construction · weight (GSM) ·
  width (inches/cm) · finish · shrink and colour-fastness expectations · use
  (shirting, workwear, home textiles, uniforms, accessories) · packing
  (roll/bale, units per carton).
- **Regions**: Tamil Nadu (Coimbatore, Tiruppur, Erode, Karur — cotton knit,
  home textiles, made-ups) and Gujarat (Ahmedabad, Surat, Bhuj — cotton,
  printing, dyeing, bandhani). Each with two sentences, no invented capacity.
- **Craft vocabulary**: handloom, block print, bandhani, ikat, kantha, khadi —
  with a line that craft and mill production are different supply chains and
  are quoted differently.
- **Sample and MOQ policy** in plain words.
- **The written brief** (from Part 2) stays, because it is the best piece of
  content on the site.

### 5.2 `/handicrafts` (handicrafts and home decor)

- **Families**: metal (brass, copper, aluminium), wood (carved, lacquered,
  reclaimed), stone and marble inlay, ceramics and terracotta, glass, natural
  fibre (jute, cane, bamboo, sabai), textiles for the home (cushions, throws,
  rugs, dhurries), festive and gifting.
- **Clusters named**: Moradabad (brass), Jaipur and Sanganer (block print,
  blue pottery), Jodhpur (wood, iron), Bhuj/Kutch (weaving, embroidery),
  Panipat (rugs, recycled textiles), Firozabad (glass), Khurja (ceramics),
  Channapatna (lacquer toys), Saharanpur (wood carving), Bidri (Bidar).
- **The commerce of craft**: artisan lead times, seasonal availability,
  variation between pieces as a *feature that must be specified*, packing for
  fragile goods, moisture protection, carton strength, and export packaging.
  This is where a buying house sounds professional — most craft sites never
  mention fragility, and every importer has been burned by it.
- **Specification fields**: material · finish · dimensions · weight ·
  artisan/QC variation tolerance · packing (individual wrap, master carton,
  pallet) · units per container.
- Deep-link sub-sections: `#metal`, `#wood`, `#textiles-home`, `#festive`,
  each becoming its own page once there is enough to say.

### 5.3 `/agro` (agriculture, spices and food)

Even as an enquiry-only category, it needs the compliance frame buyers expect:
APEDA, Spices Board, FSSAI, phytosanitary certificates, lab reports (aflatoxin,
pesticide residue, microbiology), moisture and shelf life, packaging (jute,
PP, vacuum), container type, and seasonality. Say plainly which of these the
business can arrange through partners and which it cannot.

### 5.4 `/industrial` (industrial and packaging materials)

Inputs, components, packaging: corrugated, moulded pulp, non-woven bags,
textile packaging, hardware, small engineering goods. Frame it as
**specification-first sourcing**: drawings, tolerances, material grades, and
pre-shipment inspection. This is the category where a process page does most of
the selling.

### 5.5 `/organic` (organic and sustainable sourcing)

Do not put a leaf on it. Frame it as **evidence-based**: which certification
matters for which market (GOTS, GRS, OEKO-TEX, Fairtrade, EU organic), what a
certificate actually proves, what it does not, and how BS verifies scope and
validity. This page can be short and still be the most credible page on the
site — because every competitor over-claims here.

---

## 6. The supporting pages

### `/how-we-work`

Seven stages, each with three columns: **you send · we do · you receive**.

1. Enquiry (a paragraph; a spec is not required)
2. Specification and feasibility (what can be made, from where, against what)
3. Sampling (who pays courier, how long, what a sample proves)
4. Quotation and terms (Incoterms, payment, MOQ, lead time — all in writing)
5. Order and production (approval points, change control)
6. Inspection (AQL, who inspects, what the report contains, photographs)
7. Documents and dispatch (invoice, packing list, COO, HS code, B/L,
   phytosanitary where relevant, container loading)

This one page does more for credibility than every animation on the site.

### `/quality`

The current BOUNDARIES list becomes the *quality* argument rather than an
apology: what we verify, what we ask suppliers to evidence, what we will never
claim, and what a buyer should check themselves. Same honesty, reframed as
diligence.

### `/credentials`

IEC (with number), GST (with number), FIEO/Udyam if held, bank and trade
references if available, and a **supplier evidence policy**: what documents are
requested for each category. Include a downloadable one-page company profile.

### `/about`

Short. Where the business is, who runs it, why these categories, what is being
built and what is not ready. One photograph. No "journey".

### `/faq`

Twelve questions, answered in three lines each: MOQ, samples, private label,
payment terms, Incoterms, lead time, inspection, documentation, claims and
returns, customisation, minimum first order, how to become a supplier. Answer
"it depends" only after saying what it depends on.

### `/terms`

Plain-language enquiry terms: what a quotation is, what it is not, validity,
variation, and that nothing is binding until written confirmation.

---

## 7. Design system evolution

Keep the palette, type and grid. Add discipline, not novelty.

- **One 3D idea per page, maximum.** Hero globe on home and textiles; nothing
  in category pages except perhaps one small turning object in the category
  header. Everything else is typography and data.
- **Introduce a data layer to the design**: specification tables, credential
  blocks, stage lists, policy panels. These are what a trade site looks like.
  Build three components and reuse them everywhere:
  `SpecTable`, `StageList`, `EvidenceBlock`.
- **Photography rule**: no stock. Either a real photograph of a real place
  (mill, cluster, workshop, sample table) with a caption naming it, or a
  procedural illustration labelled as representative — exactly as the site
  already does. Never a photograph that implies stock.
- **Reduce the "developing" language** to two places (About and the
  credentials block) and replace the rest with statements of what exists.
- **Typography scale**: add a small, dense "trade" size for tables and policy
  text; keep the display sizes for section openings only.
- **Motion budget**: the globe and the category tiles. Everything else
  responds to input rather than moving by itself. This also makes the adaptive
  quality system's job easier and the site feel more expensive, not less.

## 8. Content model (so this scales)

Extend `src/content.ts` from a copy file into a small content model:

```
CATEGORIES[]  id, label, short, families[], clusters[], specFields[], policy
STAGES[]      n, title, buyerSends, weDo, youReceive
EVIDENCE[]    document, proves, doesNotProve, category[]
CREDENTIALS[] label, number, issuer, status
FAQ[]         q, a, category
```

Rules that survive: no prices, no MOQs stated as universal numbers, no
certifications claimed that are not held, imagery always labelled.

**Where the plan must stay silent — deliberately:** actual MOQ numbers, lead
times, prices, capacity, client names, shipment volumes. Those are business
facts. The site should show the *shape* of the answer ("agreed per enquiry, in
writing") until the owner supplies real numbers, and then show them.

## 9. SEO and sharing

- `robots.txt`, `sitemap.xml`, canonical on every route, `og:url`, `og:image`
  (a rendered 1200×630 plate: wordmark, the globe, one line of positioning).
- JSON-LD: `Organization` with `address`, `telephone`, `email`, `sameAs`;
  `LocalBusiness`; `BreadcrumbList` on every inner page; `ItemList` for the
  category index; `FAQPage` once FAQ exists.
- Titles in one format: `Textiles & fabrics from India | BS EXIMNEXUS`.
- Descriptions written for the buyer query, not the business.
- One crawlable text link to every category from the homepage and the footer.
  No anchor-only navigation for primary destinations.
- Consider prerendering (Vite SSR or a static prerender step) so trade
  directories and Bing see content. If that is too much, at minimum ship real
  content in `index.html` for the homepage.

## 10. Measurement and operations

- **Analytics** (privacy-respecting: Plausible or self-hosted) with four events
  only: category tile click, category page view, enquiry start, enquiry sent.
- **Response window commitment** published, and a simple internal rule to keep
  it.
- **Form delivery verified** end to end with a real submission before launch.
- **Deployment**: a static host with an SPA rewrite so deep links resolve,
  plus a staging URL and a documented release step.

## 11. Phasing

| Phase | Work | Why first |
| --- | --- | --- |
| **0 — Credibility** | Address, phone, named contact, domain email, credentials block, response commitment, real delivery test, deployment rewrite | Cheapest; largest trust gain; unblocks everything else |
| **1 — Structure** | New navigation, `/categories`, five category routes with a shared template, footer rebuild | Makes the site match the business |
| **2 — Substance** | Textile specification table and families, handicraft clusters, `/how-we-work`, `/quality`, `/faq`, `/terms` | Converts the structure into something a buyer can evaluate |
| **3 — Search and sharing** | robots, sitemap, canonicals, JSON-LD, og:image, prerender | Brings the buyers in |
| **4 — Refinement** | Photography of real places, downloadable profile PDF, per-family pages, per-market pages | Compounding gains, only once the base is real |

## 12. What to stop doing

- Stop adding animation that is not carrying information.
- Stop expanding the textile page while four other categories have no page.
- Stop using "developing business" as a substitute for stating what exists.
- Stop treating the homepage as the whole site.

## 13. The one-page test

Before any section ships, ask: **could a buyer in Rotterdam, reading only this
section, make a decision or write a better email?** If the answer is no, the
section is decoration, and this site no longer has room for decoration.
