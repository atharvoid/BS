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

Node 20+ recommended.

### Targeted checks

`npm test` checks globe picking without traversing decorative geometry, including
transformed hits, misses and near/far clipping. It uses Node's built-in test
runner and native TypeScript support (Node 22.18+ or 24).

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
| `/` | Overview | Business purpose, initial sourcing areas, the four-stage process, what a first message needs, information boundaries, company introduction, enquiry |
| `/textiles` | Textiles & fabrics | The textile focus, representative swatches, the dimensions of a fabric, guidance on what to include in an enquiry |
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

Nothing is downloaded at runtime: `src/three/geo/` holds 22 KB of mask and
108 KB of packed vectors. `scripts/build-geo.mjs` regenerates them from Natural
Earth and is the only thing that needs the raw data:

```bash
# once, into /tmp/earth: land50.geojson and borders50.geojson from
# https://github.com/nvkelso/natural-earth-vector (public domain)
node scripts/build-geo.mjs
```

**The process pins.** The four stages share one canvas. The text scrolls past on
the right; on the left, the active object swings in along a circular arc,
settles level and idles until the next arrives. Only one object exists at a
time, so this is one WebGL context where there used to be four.

Four objects, each still independently draggable: a cloth bolt, a weaving
shuttle, a yarn bobbin, a brass reed.

### Design decisions worth keeping

**Drag never traps the page.** There is no `OrbitControls`. The camera is fixed and
the *object* turns, so a visitor can always scroll past a 3D object — on desktop and,
because the canvas is `touch-action: pan-y`, on a phone too.

**"Anti-slope."** Tilt is clamped either side of level, release velocity is capped and
decayed, and rotation is damped toward a target. A hard flick settles. The composition
cannot be left in a tipped, unreadable state. Idle drift stops the moment a visitor
takes over, so their angle is respected.

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
