# Round 2: your notes, my view, and a standard scope for a ₹40,000 site

Status: **plan for review.** Nothing in this file is built yet.

## 1. Your notes, recorded

| # | Your note | What I'd do |
|---|---|---|
| N1 | Logo back to the original gold | Original gold `#dabc72` everywhere it can be read: dark mode, footer, intro. **Problem:** on light cotton that gold measures **1.55:1**, so the small "EXIMNEXUS" line nearly disappears. Recommendation: on light backgrounds use a deeper shade of the *same* gold (`#9a7a2c`, 3.4:1), so it still reads as the gold logo. Your call (Q1). |
| N2 | Real or AI images in the swatch strips (textiles, handicrafts, and the rest) | When a strip opens, a photo appears inside the dyed cloth (fades and rises in). Tapping the photo opens a larger view (lightbox) with a caption marked "representative image". |
| N3 | A pop-up for the photo | The lightbox in N2: full-screen on phones, closes with Esc, a tap outside or the close button, keyboard-trapped while open. |
| N4 | Realign the whole site and its content | Section 3 below: one layout grid, one type scale, one spacing scale, consistent section order, copy pass. |
| N5 | Dark-mode toggle, top right, animated | Sun ↔ moon icon that morphs (the sun's rays retract and a crescent slides in), about 400ms. Starts from the visitor's system setting, remembers their choice, no flash of the wrong theme on load. Dark mode = ink ground, the same six dyes, cotton text, original gold logo. Respects reduced motion. |

## 2. Where the images come from (Q2)

| Option | Quality | Cost and risk |
|---|---|---|
| **A. Your client's own photos** of real fabric, products, samples | Best: real and honest | Needs the client to send 6+ photos |
| **B. Free stock photos** (Unsplash or Pexels: free commercial licence, no attribution required) | Good, but other businesses use the same pictures | I'd shortlist; you approve each image before I download it. Must be labelled "representative" (the site's own rule) |
| **C. AI-generated** | Can match the dye colours exactly | I cannot generate images myself. You (or the client) generate them with an image tool from prompts I write, and I fit them in. Should still be labelled representative |
| **D. The 3D renders already in the repo** (`public/posters/<category>.webp`) | Consistent and owned, but illustrations, not photos | Zero cost, available now. Good as a placeholder until A, B or C arrive |

Recommendation: build the photo slot and lightbox now with **D as placeholders**, ship with **B** where the client has nothing, and swap in **A** as photos arrive. Each strip needs one image (6 total), landscape about 1600×1000.

## 3. What "standardized" means for this site

**Layout and content alignment (N4)**
- One content width and one 12-column grid used on every page; all section headings start on the same left edge.
- One vertical rhythm: every section uses the same top and bottom spacing; no ad-hoc paddings.
- One heading scale (page title, section title, sub-title, body) applied the same way on every page.
- The same section order on every inner page: hero → what it is → what to send → enquiry.
- A copy pass: one voice, consistent naming (categories always named the same way), no duplicate sentences between pages.

**What a standard small-business site is expected to have** (and this one lacks)

| Item | Why it matters | Needs from the client |
|---|---|---|
| **Working enquiry delivery** | The form is the whole point; delivery is still unverified | Web3Forms key, and a test enquiry received |
| **Domain email** (e.g. `enquiry@<domain>`) instead of Gmail | The biggest credibility gap for a B2B exporter | A domain and a mailbox (setup, not code) |
| **WhatsApp chat button** | Standard for Indian trade businesses; often converts better than a form | Business WhatsApp number |
| **Contact block**: city, working hours, response time | Buyers look for a place and a person before writing | City, hours |
| **Registrations line**: IEC, GST (only if actually held) | Overseas buyers check these first | Which are held, and the numbers |
| **SEO basics**: per-page titles, sitemap.xml, robots.txt, share image, business structured data | Findable on Google; good previews when shared on WhatsApp/LinkedIn | — |
| **Analytics** (privacy-friendly, e.g. Vercel Analytics) | Know if anyone visits | — |
| **Favicon and share image** in the brand gold | Currently a generic SVG | — |
| **Dark mode** (N5) | Requested | — |
| **Performance pass** | three.js is 919 kB; load it only when the globe is on screen, keep posters as the first paint | — |
| **Cleanup** of unused code and images from removed features | Smaller site, easier to maintain | — |
| **Handover doc**: how to edit text, swap images, change email | Client can maintain it | — |

## 4. Scope for ₹40,000 (assuming rupees)

At this budget a standard deliverable is: the pages that exist now, finished and consistent, working enquiries, the trust details, SEO basics, and a handover. Not included: a CMS, a blog, multiple languages, product catalogue pages, or custom photography.

| Package item | In scope |
|---|---|
| N1 to N5 (logo, photos + lightbox, realignment, dark mode) | Yes |
| Working enquiry delivery + test | Yes (needs the key) |
| WhatsApp button, contact block, registrations line | Yes (needs the details) |
| SEO basics, analytics, favicon and share image | Yes |
| Performance pass and cleanup | Yes |
| Handover doc + one revision round after you review | Yes |
| Per-category pages (5 new pages like /textiles) | Optional extra; worth doing later when there is real content for each |
| CMS, blog, multilingual (Hindi/Gujarati) | Not at this budget |

## 5. My view of the site so far

- **Working:** the swatch book gives the site its own identity; the category dye carrying into the enquiry form is the best detail; the copy stays honest.
- **Weakest now:** the globe still dominates the first screen (Codex flagged this twice). With dark mode, the globe will look at home again on the dark theme; on light it stays the biggest competitor to the swatch book. Making it about 20% smaller on light mode is a cheap middle ground.
- **Biggest real-world risk:** not design. An exporter with a Gmail address and an unverified form loses buyers before any of the visual work matters. Those two items should come first.

## 6. Proposed order

1. Logo gold (N1) and dark mode (N5): self-contained, visible quickly.
2. Photo slot + lightbox with placeholder images (N2, N3).
3. Realignment and copy pass (N4).
4. Trust items: contact block, WhatsApp, registrations (as details arrive).
5. SEO, analytics, favicon, share image, performance, cleanup.
6. Enquiry delivery test, handover doc, PR.
