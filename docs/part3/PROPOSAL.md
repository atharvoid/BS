# Part 3 — Improvements after the competitor research

**Status: proposal only. Nothing in this document has been built.**

This is the list and the plan for item 5. It takes the fifteen tactics in
[Part 1A §2](../part1/01-competitor-research.md) and the audit findings in
[Part 1B](../part1/02-website-audit.md) and turns them into work that is worth
doing on *this* site, in an order that makes sense.

The rule for all of it is the one already applied to the site: no invented
numbers, no stock photographs of other people's goods, and nothing that makes
the business look bigger than it is. Everything below either states a fact we
have, states a policy in "how we agree it" language, or makes an existing fact
easier to find.

---

## 1. The short version

| # | Change | Why it is worth doing | Size | Needs input from you |
| --- | --- | --- | --- | --- |
| A1 | **Contact block**: city, state, working hours, named contact, response window | The single largest trust gap. Buyers look for a place and a person before they write. | S | City, name, hours |
| A2 | **Registrations block**: IEC, GST, FIEO, Udyam, and the supplier evidence we ask for | Competitors show badges; a text line naming the registration is stronger and honest. | S | Which registrations are held / pending |
| A3 | **"How we work" page**: seven named stages, what you send, what comes back | Competitors convert "no catalogue yet" into a process. This is the page that replaces a catalogue. | M | Confirm stage names and who does what |
| A4 | **Commercial policy page**: MOQ, samples, lead time, Incoterms, documents, payment | The questions every buyer asks, answered in "how we agree it" form. | M | Confirm the policy lines |
| A5 | **Enquiry form**: quantity band, destination country, timeline, response promise | Turns an enquiry into an RFQ. The three fields are what a quote needs. | S | Response window |
| B1 | **Fabric families table** on `/textiles` | Length, width, GSM, weave, typical use, marked *representative*. Buyer language. | M | Confirm the family list |
| B2 | **Category pages** for the other five product areas | Five of six categories currently have no page of their own. | L | — |
| B3 | **Region-plus-product pages**: textiles from Tamil Nadu, textiles from Gujarat | The pages that actually rank; the content already exists on `/textiles`. | M | — |
| C1 | **FAQ**, nine questions, from the buyer's side | MOQ, samples, private label, payment, documents, lead time, inspection, shipping terms, minimum order. | M | Answers only you know |
| C2 | **Company profile PDF** and a specification template | Downloadable = credible. Both are generated from content already on the site. | M | Confirm details |
| D1 | **SEO plumbing**: `robots.txt`, `sitemap.xml`, canonical tags, JSON-LD (Organization, BreadcrumbList, FAQPage) | Cheap, mechanical, and currently missing. | S | Legal name, address |
| D2 | **404 and error states** that keep the enquiry path open | A wrong URL currently ends the visit. | S | — |
| E1 | **Verify enquiry delivery** end to end (Web3Forms key + a real submission) | An enquiry form that silently fails is worse than no form. Already flagged C13/T9. | S | A test submission |

Sizes: **S** ≈ under half a day, **M** ≈ a day, **L** ≈ several days of work.

---

## 2. What I would deliberately *not* do

Taken from Part 1A §3, and worth restating because they are the tempting ones:

- No keyword-stuffed paragraphs, no repeated "sourcing agent in India" lines.
- No invented scale: no visitor counters, no "10,000+ clients", no shipment
  figures we cannot support.
- No logo wall of unlabelled badges.
- No product grid of stock photographs. The site's own 3D objects and generated
  material are more honest than a photograph of someone else's goods.
- No autoplaying video, no carousel.

---

## 3. The plan, in the order I would build it

Four stages. Each stage is shippable on its own, and each one is verifiable
with what exists in this repo (`npm run typecheck`, `npm run build`, `npm test`,
the route smoke harness). Stages 1 and 2 are the ones that change the business
outcome; 3 and 4 are leverage and housekeeping.

### Stage 1 — Trust scaffolding (A1, A2, E1)

**Files:** `src/content.ts` (a `CONTACT` and `CREDENTIALS` block),
`src/components/Footer.tsx`, a new `src/components/TrustBar.tsx` used on the
home page and above the enquiry form, `src/pages/Enquiry.tsx`.

1. Add the contact and credential facts to `content.ts` as data, not markup, so
   every page renders the same values.
2. A compact trust line on the home page — city, working hours, response
   window, the registrations held — as text, not badges.
3. The same block repeated beside the enquiry form, where the decision is made.
4. Confirm Web3Forms delivery with one real submission and record the result.

**Done when:** every page shows where the business is and how fast it answers,
and one real enquiry has arrived in the inbox.

### Stage 2 — The process pages (A3, A4, A5)

**Files:** new `src/pages/Process.tsx`, `src/pages/Policy.tsx`; routes in
`src/App.tsx`; three fields in `EnquiryForm.tsx` (`quantity`, `destination`,
`timeline`) added to the `EnquiryDraft` type, the validation, and the Web3Forms
payload; nav and footer entries.

1. "How we work": seven stages, each with *you send* / *we return* / *typical
   duration band*. Deliberately no invented durations — bands described as
   "agreed at enquiry" where that is the truth.
2. "Commercial policy": MOQ, samples, lead time, Incoterms, documents, payment,
   inspection, all in the same voice as the rest of the site.
3. The three new enquiry fields, each optional, plus the response promise in
   the form's own copy.

**Done when:** a buyer can answer "what happens after I press send" without
asking, and a submitted enquiry carries quantity, destination and timeline.

### Stage 3 — Buyer language and reach (B1, B2, B3, C1)

**Files:** `src/pages/Textiles.tsx` (families table added below the existing
Fabric Types / Tamil Nadu / Gujarat sections — those stay exactly as they are),
new category pages sharing one template, region-plus-product pages, a
`Faq` component and an `FAQPage` JSON-LD block.

1. Fabric families table: composition, construction, typical weight, typical
   width, typical use, marked *representative — confirmed per order*.
2. Five category pages on one template: what the category covers, the families
   inside it, how an enquiry for it runs, and an enquiry link pre-filled with
   that category.
3. Region-plus-product pages, built from the Tamil Nadu and Gujarat content
   that already exists.
4. FAQ, nine questions, each answered plainly.

**Done when:** all six categories have a page, `/textiles` speaks in GSM and
width rather than adjectives, and the FAQ answers the nine questions.

### Stage 4 — Mechanical credibility (C2, D1, D2)

**Files:** `public/robots.txt`, `public/sitemap.xml` (generated from the route
table at build time), canonical tags and JSON-LD in `index.html` plus a small
`Seo.tsx`, the profile and template PDFs, `src/pages/NotFound.tsx` reworked.

1. A one-page company profile and a blank specification template, both
   generated from the site's own content.
2. `robots.txt`, `sitemap.xml`, canonical tags, Organization / BreadcrumbList /
   FAQPage structured data.
3. A 404 that offers the six categories and the enquiry form.

**Done when:** a crawler sees a sitemap and structured data, and a mistyped URL
still has a way forward.

---

## 4. What I need from you before Stage 1

These are facts, not design decisions. Without them I would have to invent
them, and inventing them is exactly what the research says loses the enquiry.

1. **City, state and country** to publish, and whether to publish a phone
   number.
2. **A named contact** — a person's first name and role is enough.
3. **Working hours and time zone.**
4. **Registrations**: which of IEC, GST, FIEO, Udyam are held, and which are in
   progress. I will phrase the in-progress ones as in progress.
5. **Response window** you are willing to promise.
6. **Commercial defaults**: how samples are handled, how MOQ is set, which
   Incoterms are normally quoted.

Answer whichever of those you can and I will build the rest around them; I will
leave a clearly-marked placeholder rather than guess a value.

---

## 5. What "approved" would mean

If you approve the list as it stands, I build it stage by stage in the order
above, one commit per stage, reporting after each the same way as for items
1–4. If you want a subset, say which numbers (A1, B2, C1 …) and I will do those
in the same order.
