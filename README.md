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
| `/` | Overview | Hero globe, six scroll-led categories, a direct category directory and how an enquiry works |
| `/textiles` | Textiles & fabrics | The textile focus, representative swatches, the two sourcing areas, and a written enquiry brief |
| `/enquiry` | Textile enquiry | The five-answer form, already identified as a textiles enquiry |
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

**Nothing on the site has controls.** Every scene turns by dragging it and
animates by itself. There is no pause button, no reset, no arrow pad: the
sections that once had them (`Tell us about your fabric`, and the hero globe)
now either animate continuously or were replaced by written content.

**The category journey.** One shared canvas draws six procedural models: a
cloth roll, ceramic vase, grain sack, copper coil, cotton boll and export crate.
Scroll-driven chapters introduce each category and move that same model into a
persistent homepage dock. Textiles is first and the primary product line. The
canvas never captures a pointer; category labels remain real links. All six
links are also available in an ordinary directory, with a skip link. Reduced
motion and missing WebGL bypass the long choreography. No separate poster is
swapped into a loaded scene.

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

Configure `VITE_WEB3FORMS_KEY` and verify delivery to the business inbox before
launch. An unconfigured form clearly provides the email alternative. The
reserved CAPTCHA key must remain empty until a real token flow is integrated;
no empty CAPTCHA token or unsupported protection claim is sent. See the
review in `docs/website-review.md` for launch blockers and unverified items.

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

The form posts to **Web3Forms**, with optional **hCaptcha**. Both are configured by
environment variable — see `.env.example`.

```bash
cp .env.example .env
# add VITE_WEB3FORMS_KEY
```

**Delivery is not yet verified.** The project handoff records that Web3Forms account
setup and real delivery still need confirming. If no access key is present the form
deliberately shows the visitor a "not connected yet" note instead of a success
message, and does not navigate to the acknowledgement page. Before this form is
relied upon:

1. Set `VITE_WEB3FORMS_KEY`.
2. Submit a real enquiry.
3. Confirm it arrives at **bsexim.nexus@gmail.com**.
4. Only then treat the form as working.

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
