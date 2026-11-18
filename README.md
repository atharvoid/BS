# BS EXIMNEXUS — website

A developing, India-focused sourcing and trade coordination business, beginning
with textiles and fabrics. This is the public site: it explains the initial
sourcing focus, shows how a sourcing conversation may proceed, and collects just
enough information to start an enquiry.

Built with Vite, React, TypeScript and react-three-fiber. No UI framework, no CSS
utility library, no stock imagery — the type, palette, textures and 3D objects are
all defined in this repository.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check, then production build into dist/
npm run preview    # serve the production build
npm run typecheck  # types only
```

The phone layout uses normal-flow category cards and one shared canvas that draws
when the cards are visible. The implementation and remaining device
qualification are recorded in [the mobile receipt](docs/part3/MOBILE_IMPLEMENTATION_STATUS.md).
`npm run assets:swatches` regenerates the prebuilt woven images.

Node 22.18+ recommended (the tests import TypeScript using Node’s built-in type stripping).

### Targeted checks

`npm test` runs the Node regression suite (geometry clearance, drag, globe
orientation, loading boundaries, quality state, resolution and scroll choreography) and then
`scripts/stage-scope.mjs`, a static guard that fails if a component calls
`useFrame`/`useThree` and also renders a `<Stage>` — the mistake that produces
"Hooks can only be used within the Canvas component" and a blank section.

With Playwright available, `node scripts/logo-intro.check.cjs` checks startup,
replay, interruptions, focus recovery, route/hash behavior and reduced motion.
It defaults to `http://localhost:5173`; set `SITE_URL` to test a production preview.
`node scripts/globe-hover.check.cjs` measures the actual pointer handler against
the Vite development server and rejects recursive decorative picking. Set
`PLAYWRIGHT_MODULE` to an existing Playwright package path if it is not installed
locally. No additional runtime dependency is required.

The supplied startup is adapted in `LogoIntro.tsx`; its inline outline geometry
is in `Logo.tsx`. Only the logo package's artwork and animation were imported.
The broader trade-homepage and textile-migration proposal is in
`IMPLEMENTATION_PLAN.md`.

---

## What is on the site

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Overview | Hero globe, six product areas at `/#products`, and how an enquiry works |
| `/#product-tour` | Product tour | The scroll-led tour of all six models, directly below the category cards on supported viewports |
| `/textiles` | Textiles & fabrics | The textile focus, representative swatches, the two sourcing areas, and a written enquiry brief |
| `/enquiry` | Sourcing enquiry | Five questions and a product category that can be preselected through a category link |
| `/enquiry/acknowledgement` | Enquiry acknowledgement | Says plainly that the page alone does not confirm inbox delivery |
| `/privacy` | Enquiry privacy | What is collected, how it is processed, how to request a correction |
| `*` | Not found | — |

All copy lives in **`src/content.ts`**. Edit words there rather than in components,
so the form, the process steps and the disclaimers cannot drift apart.

---

## The 3D layer

**The hero is the Earth**, built from real geography rather than an
approximation:

- **Coastlines** are Natural Earth 1:50m vector loops, resampled onto the sphere.
- **Land** is a 2048x1024 coverage mask sampled in the fragment shader, so the
  continents stay solid at any angle.
- **The sphere itself is carved** from that same mask: every vertex is displaced
  by land coverage, so continents are real relief, and the normals are derived
  so coasts catch the light.
- **Gujarat and Tamil Nadu are exact coordinates** (Ahmedabad and Tiruppur), each
  with a pulsing marker.
- **Routes are true great circles** from those two points to Vietnam, the Gulf,
  Sri Lanka, Bangladesh, Singapore, Europe, Australia and North America, each
  carrying a travelling comet so the surface reads as supply in motion.

No third-party geographic service is contacted: `src/three/geo/` holds the texture, lossless CPU mask and packed vectors,
served as local static assets when the globe loads. `scripts/build-geo.mjs` regenerates them from Natural
Earth and is the only thing that needs the raw data:

```bash
# once, into /tmp/earth: land50.geojson and borders50.geojson from
# https://github.com/nvkelso/natural-earth-vector (public domain)
node scripts/build-geo.mjs
```

**Hero motion.** The globe and textile illustration settle after a short motion
window. Both still respond to dragging. Reduced motion and Save Data show stills.

**The product tour.** One shared canvas draws six procedural models: a
cloth roll, ceramic vase, golden wheat head, copper coil, cotton boll and export crate.
Scroll-driven chapters introduce each category and move that same model into a
labelled dock during the tour. Textiles is first and the primary product line. The
featured model turns while its chapter is active; docked models turn only under
pointer hover or keyboard focus. The canvas leaves pointer input to the page
and its links. Products opens the six cards directly. The cards rotate while
visible when settings and performance allow. On viewports that can fit the
tour, it follows the cards and begins on scroll on every visit. Reduced
motion, Save Data and unavailable WebGL show the directory stills.

### Stable renders and performance

The homepage globe and category models retain their drawing resolution,
materials and lighting when performance falls back to still mode. The same
canvas freezes; it does not become a different image. Resolution is bounded by
the device ratio and pixel budget, and changes only with viewport sizing, not
with the automatic performance tier. The globe stays mounted but stops drawing
when offscreen, preserving its orientation. Both homepage contexts are released
when the route unmounts. The textile page retains its existing resolution policy.

`src/three/performance.ts` samples actual rendered frames, not idle browser RAF
callbacks. Hidden-tab time is excluded. No customer-facing quality control is
added. A fresh document or lost GPU context necessarily has to render again;
there is no claim that pixels survive browser teardown.

Browser acceptance check (Playwright installed separately):

```bash
npm run build
npm run preview
SITE_URL=http://localhost:4173 node scripts/category-journey.check.mjs
SITE_URL=http://localhost:4173 node scripts/design-audit.check.mjs
```

Set `PLAYWRIGHT_MODULE` and optionally `BROWSER_EXECUTABLE` for a custom browser
installation. The check covers forward/reverse scrolling, the six docked
models, narrow layouts, retained renderer and repeated frozen-frame pixels.

### SEO and launch configuration

Set optional `VITE_SITE_URL` to the verified public origin before building.
The current serving origin is used otherwise; no domain or legal identity is
invented. Route metadata is client-rendered: production prerendering/SSR,
real 404 status codes, redirects, cache headers and a domain-specific sitemap
remain deployment checks. The preview should receive a server-side no-index
header as well as its client-side metadata.

Configure the form and verify delivery from the hosted origin before launch.
See the enquiry setup below.

### Design decisions worth keeping

**Drag never traps the page.** There is no `OrbitControls`. The camera is fixed and
the *object* turns, so a visitor can always scroll past a 3D object — on desktop and,
because the canvas is `touch-action: pan-y`, on a phone too.

**"Anti-slope."** Tilt is clamped either side of level, release velocity is capped and
decayed, and rotation is damped toward a target. A hard flick settles. The composition
cannot be left in a tipped, unreadable state.

**Continuous by design.** Idle motion is added as an *absolute* offset, not as a nudge
away from a drag target, so a visitor's angle becomes the new centre of rotation: the
object keeps turning from wherever the hand left it and nothing snaps back on release.

**Reduced motion lands on the finished cloth** rather than watching it weave,
and the idle drift stops.

**Everything is generated.** `src/three/textures.ts` draws the plain-weave patterns,
the timber grain, the yarn windings and the studio environment into canvases at
runtime; `src/three/geometry.ts` builds the cloth, the shuttle hull, the bobbin and
the reed in code. Nothing is fetched, so there are no missing assets and no licensing
questions.

**Progressively enhanced.** three.js is lazy-loaded after first paint, each stage
mounts only when it scrolls near the viewport, off-screen stages stop rendering
(`frameloop="never"`), and a WebGL failure falls back to a styled still rather than a
blank box.

---

## Enquiry delivery

The form sends submissions to **Web3Forms**, which checks submissions for spam.
Visitors can submit without an interactive challenge.

1. In the Web3Forms dashboard, verify the notification recipient and ensure the form does not require a CAPTCHA.
2. Set `VITE_WEB3FORMS_KEY` in ignored `.env.local` for development and in the intended hosting environment before building. Set `VITE_ENQUIRY_CONTACT_EMAIL` to override the business address used for manual recovery. The access key controls automatic delivery.
3. Submit one labelled test from the intended origin. Confirm arrival in the selected inbox and check that Gmail's Reply action addresses the visitor.
4. For client handover, configure the equivalent settings on the client's form, swap the access key and manual recovery contact, rebuild, and repeat the delivery check.

The form preserves the draft after errors and shows the acknowledgement only after
Web3Forms accepts the submission. If a timed-out request may have been accepted,
check before resending. The browser check in `scripts/enquiry-delivery.check.mjs`
uses a fixture key and intercepted requests. It never sends email.

Form entries are never written to browser storage. A small receipt (subject, visitor
type, timestamp) is kept in `sessionStorage` after a successful submission so the
acknowledgement page can show what was handed over.

---

## Information boundaries

These are load-bearing, not decorative. Copy must not claim:

- a catalogue, or confirmed availability of any product;
- prices, minimum quantities, lead times, or stock levels;
- certifications, customer numbers, shipment history;
- guaranteed quality or shipping performance;
- accounts, payments or automatic tracking.

Textile imagery and 3D objects are **representative of material families**. They are
not photographs of supplier stock and not evidence of specific products. Specific
fabric options and the scope of services are discussed per enquiry.

`src/content.ts` → `BOUNDARIES` holds this list, and it is rendered on both `/` and
`/textiles`, so the site states its own limits.

---

## Design system

Tokens are in `src/styles/tokens.css`; the palette is drawn from Indian textile dyes.

| Role | Colour |
| --- | --- |
| Raw cotton (light ground) | `#f2ebdd` |
| Ink (dark ground) | `#12100d` |
| Indigo vat | `#1d2a45` |
| Madder root (accent) | `#9c3a2d` |
| Saffron | `#c47b1c` |
| Verdigris | `#4c7a68` |
| Brass | `#b0864a` |

Four typefaces, each doing one job (all self-hosted variable fonts):

- **Fraunces** — display. Variable `SOFT` / `WONK` axes are used so headings feel cut rather than typeset.
- **Newsreader** — editorial serif for ledes and long-form paragraphs.
- **Instrument Sans** — interface and form text.
- **Chivo Mono** — labels, indices, metadata.

All body and small text meets WCAG AA contrast on its ground; the smallest labels were
checked and lifted where they fell short.

Reduced motion, keyboard focus, skip links and `aria` labelling are handled throughout.
The custom cursor only appears for fine pointers, and switches off for reduced motion.
