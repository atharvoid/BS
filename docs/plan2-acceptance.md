# Plan 2 — acceptance

Every figure below was measured on the built output (`npm run build`, served by
`vite preview`), not on the dev server, and not estimated. Where a measurement
is limited by the test environment that is stated rather than smoothed over.

## What was built

| # | Requirement | State |
|---|---|---|
| 1 | Mobile baseline | Measured — see *Baseline* below |
| 2 | One shared canvas for six previews | Done — 2 contexts total, on phones too |
| 3 | Touch reliability on the two draggable scenes | Done, with tests |
| 4 | Cloth no longer penetrates the roll | Done, with tests |
| 5 | Sharpness | Done — 1× → 2× on the row, 1.5× on the hero |
| 6 | Loading | Done — three arrives after each page's markup |
| 7 | Adaptive quality | Done, with tests |
| 8 | This table | — |

## The row of six previews

Two WebGL contexts on the page, at every width, in every state measured:
one for the hero globe and one for all six product objects.

| Check | 1440×900 @2× | 390×844 @3× |
|---|---|---|
| Six tiles present | 6 | 6 |
| Every tile links somewhere | 6/6 | 6/6 |
| Labels are HTML and laid out | 6/6 | 6/6 |
| Canvases on the page | 2 | 2 |
| Shared canvas takes the pointer | no (`pointer-events: none`) | no |
| Stills replaced by live pixels | 6/6 | 6/6 |
| Console errors | 0 | 0 |

Contexts stayed at **2** across four scroll cycles on and off the row, and
across a route change: `2,2,2,2,2,2,2,2`.

On a phone only the tiles whose letterbox is on screen are drawn — a swipe
costs two objects, not six. Before that, the row was desktop-only and phones got
coloured swatches.

## Touch

Measured on a 390-wide touch viewport, driving real `TouchEvent`s through CDP.

| Gesture on the globe | Result |
|---|---|
| Vertical swipe | Page scrolls (205px) |
| Horizontal swipe | Globe turns, `scrollY` stays 0 |
| Tap | Nothing navigates |
| Drag interrupted by the tab hiding | Resumes on the next drag; cursor returns from `dragging` to `scene` |

Nine cases in `scripts/drag-state.test.mjs` cover what a screenshot cannot: a
cancelled pointer leaves nothing armed and does not coast; a second pointer
cannot take over a drag already running; a non-primary pointer is ignored so a
pinch cannot turn the object; the capture is always given back, and once.

## Cloth

`scripts/cloth-clearance.test.mjs` — 4 cases, all passing:

- 0 of 2015 vertices inside the roll at five free lengths
- 0 of 15360 triangle-surface samples inside the roll
- Attachment radius within 0.05 of the roll's radius
- Free edge rests on the floor
- End caps and kraft band clear the cloth

The original defect was 294 of 945 vertices inside the roll.

## Sharpness

Both canvases were being drawn at one device pixel per CSS pixel. On a 2× laptop
and a 3× phone that is a halved, then a thirded, image stretched back up — the
softness the models showed, worst on the two largest surfaces.

| Surface | Device ratio | Before | After |
|---|---|---|---|
| Hero, desktop | 2× | 1× | 1.5× |
| Tile row, desktop | 2× | 1× | 2× |
| Hero, phone | 3× | 1× | 2× |
| Tile row, phone | 3× | 1× | 2× |

At 200% browser zoom (a 720-wide CSS viewport at 4× density) both canvases hold
2×, within the pixel budget, and the row is legible at twice the size:

```
100%   hero 1.5×  row 2×   label 15.1px
200%   hero 2×    row 2×   label 14.7px
```

Labels are HTML, so they scale with the page and are never resampled from a
texture. Ten cases in `scripts/resolution.test.mjs` pin the ladder: no draw
above the screen's own ratio, every rung reachable, a 25% maximum step between
rungs, the budget bounding a large canvas on both axes, and the two real
surfaces at their real sizes.

## Loading

Measured on the built output by loading each route and recording every script
request.

| Route | Before | After |
|---|---|---|
| `/privacy` | 11 scripts, incl. three | **5 scripts, no three** |
| `/textiles` | 11 scripts, incl. three | three only when its hero is due |
| `/` | three with the entry chunk | three after the hero's own markup |

Entry chunk: 75.9 kB → 33.3 kB (gzip 23.5 → 11.4 kB).

`/privacy` — the page with no 3D at all — used to download the globe, the six
product models and the generated textures. It now downloads the page.

## Vitals

Measured from first paint, on the built output, with the page left to settle.

| Route | Viewport | LCP | CLS |
|---|---|---|---|
| `/` | 1440×900 @2× | 729 ms | **0.0000** |
| `/` | 390×844 @3× | 241 ms | **0.0000** |
| `/textiles` | 390×844 @3× | 252 ms | 0.0177 |
| `/privacy` | 390×844 @3× | 144 ms | 0.0164 |

Targets: LCP ≤ 2.5 s, CLS ≤ 0.1. Both met with room.

The CLS figure started at **0.51 on every route** — a regression introduced by
route-splitting the pages, which painted the footer above an empty document and
then dropped it two thousand pixels. Four separate shifts were found by
measuring and each is fixed: the route boundary, the serif fallback face (Times
is narrower than either webfont, so the hero's lede reflowed by a line), the
stacked hero's stage collapsing to zero height before its canvas mounted, and
the hero title re-wrapping when the italic face arrived 25 ms after the roman.

### INP

Target ≤ 200 ms. Measured separately with touch emulation, tapping the menu and
a tile:

| Interaction | Event processing | Presentation |
|---|---|---|
| Menu tap | 0–1 ms | 568 ms |
| Tile tap | 0 ms | 112–384 ms |

**The processing figure is the one that means anything here.** Event handlers
return immediately; the presentation delay is a software rasteriser drawing a
full-screen WebGL canvas on a core with no GPU, which is what SwiftShader is.
It is not representative of a phone, and INP should be re-measured on real
hardware before the target is claimed as met.

## Adaptive quality

Ten cases in `scripts/quality-state.test.mjs`, all passing, driving the state
machine through its public API with a stubbed clock:

- A fast device keeps the highest tier; one bad window changes nothing
- A sustained miss gives up clarity before animation, one rung at a time
- A device that never recovers ends at a still scene
- A window where nothing was drawn is not judged, in either direction
- A hidden tab is not counted against the device
- Reduced motion is always a still scene, and turning it off restores the tier
  already measured — no reload, no relearning
- Stalls count even when the mean frame rate looks fine
- No change twice inside the cooldown, in either direction
- The module offers no control to the visitor

## Stability

| Check | Result |
|---|---|
| Contexts over scroll cycles | bounded at 2 |
| Lost context | rebuilt on a fresh context, drawing again, 0 errors |
| Reduced motion | identical frames two seconds apart — holds a still |
| Quality controls offered to the visitor | none |

Lost-context recovery was tested by forcing `WEBGL_lose_context` on the hero. The
canvas is disposed and rebuilt on the next frame; rebuilding inside the losing
task threw `shaderSource: parameter 1 is not of type WebGLShader`, which is why
the rebuild is deferred by one frame rather than done immediately. Two losses
within five seconds leaves the drawn fallback up instead of thrashing.

## Regression checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | **47 pass, 0 fail** |
| Scope guard | PASS — no component mixes R3F hooks with a `<Stage>` boundary (46 files) |
| `npm run build` | green |
| jsdom smoke, 6 routes | 0 errors |
| Plan 1: intro, cursor, globe starts at India | intact |

Fabric Types, Tamil Nadu and Gujarat sections were not touched.

## What is not proven here

- **Real-device numbers.** Baseline was taken in headless Chromium with a
  software rasteriser. It proves what the code does; it does not predict a
  Pixel or an iPhone. INP in particular needs real hardware.
- **iPhone Safari.** Safari cannot be driven from this environment. The code
  uses no API Safari lacks, and the fallbacks are the same paths that were
  measured, but the browser itself was not run.
- **Long-run memory.** Context counts were checked, heap growth over a ten-minute
  session was not.
