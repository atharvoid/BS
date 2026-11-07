# Plan 2 — audit against the plan

An honest re-read of the plan against the code, measured on the built output.
Several of these contradict what I reported earlier, because two of my earlier
measurements were wrong. Both are called out.

## Score per plan item

| # | Plan item | Verdict | Evidence |
|---|---|---|---|
| 1 | Mobile baseline | **Partial** | Measured in headless Chromium + SwiftShader only. No Android Chrome, no iPhone Safari, no real GPU. |
| 2 | Shared canvas, six previews on phones | **Good** | 2 contexts at every width; six tiles, six links, no pointer capture, no errors; on-screen-only drawing on the strip. |
| 3 | Touch reliability | **Good** | Vertical scrolls, horizontal drags, tap navigates nothing, recovers after interruption; 9 unit cases. |
| 4 | Cloth off the roll | **Good** | 0/2015 vertices, 0/15360 triangle samples inside; 4 cases. |
| 5 | Sharpness | **Good** | Row 1×→2×, hero 1×→1.5×, holds at 200% zoom; 10 cases. |
| 6 | Loading | **FAILED** | three (918 kB) is fetched on `/privacy`. Regression I introduced in step 7 and reported wrongly. |
| 6 | 3 s intro, measured separately | **FAILED** | Nominal 3 s takes **11.5 s** to clear. 9.9 s of blocked main thread in the first 14 s, including one **7.1 s** task. |
| 6 | Profile procedural textures | **Not done** | No profiling pass; the texture cost is the thing that starves the intro. |
| 6 | Fonts | **Not trimmed** | 17 faces / 908 kB, including Vietnamese and latin-ext subsets of five families. |
| 7 | Adaptive quality | **Good** | 10 cases: hysteresis, cooldown both ways, clarity-before-animation, idle silence, hidden tabs, reduced motion, stalls, no controls. |
| 8 | Acceptance table | **Written, partly wrong** | `/privacy` claim and "Plan 1 preserved" were both measured wrongly. |

## What is actually broken

**1. `three` is on the critical path of every route.** My step-7 work added
`FrameReporter` to `performance.ts`, which imports `useFrame` from
`@react-three/fiber`. `Stage.tsx` imports `performance.ts`, and both pages
import `Stage.tsx` statically — so the 918 kB three chunk is in the entry's
import graph and is `modulepreload`ed in the HTML. `/privacy` fetches
`rolldown, index, react, three`.

I reported "5 scripts, no three". That measurement ran against a stale build
directory. It was wrong.

**2. The intro holds the page for 11.5 s.** Nominal `END = 3000`. Measured on
the built output, from `commit`:

```
184ms    shown/drawing
11696ms  hidden/idle      → 11.5 s
```

Behind it, long tasks: `1286+1331  2661+1186  3850+7253` — 9.9 s of blocked
main thread in 14 s, one task of 7.1 s. The profiler puts 5.3 s in `HeroScene`
and 3.9 s in three's uniform upload inside `renderBufferDirect`. The globe is
generating and uploading synchronously while the curtain is up, and
`setTimeout(finish, 3000)` cannot fire behind that.

This is the plan's own item — "keep the 3 s intro, measure its delay separately,
no extra pause after it" — and the measured delay is 8.5 s of extra pause.

**3. The industrial coil is not a coil.** Thin open helix, visibly off-axis,
paper-thin wall, no end caps. It is the weakest of the six and it is the first
thing anyone sees after the hero.

**4. Smaller defects found in the sweep**
- A stray `export` sits on a comment in `Stage.tsx` (compiles, but it is litter).
- Two WebGL capability probes (`webglAvailable` in `Stage`, `canRender3D` in
  `ProductExplorer`) doing the same thing.
- Fonts: 908 kB of woff2, five families, all subsets shipped.

## Score

| | |
|---|---|
| Items landing **Good** | 5 of 12 |
| Items **Partial** | 1 |
| Items **Failed** | 2 (loading, intro timing) |
| Items **Not done** | 2 (texture profiling, font trimming) |
| Items **Wrong in reporting** | 2 (`/privacy`, "Plan 1 preserved") |

**Overall: 5.5 / 10.** Below the 6.5 line, so it needs work rather than a
sign-off.

The geometric and interaction work is solid and tested. What is wrong is the
part that sequences the work: three still arrives too early, and the intro that
is supposed to cover loading is instead being stretched by it. Two of my
measurements were also wrong, which is the worse failure of the two.

## The two requests I cannot map

`Toast` and `Petra` appear nowhere in the repository, the plan, the Part 1
research, or the Part 3 proposal. I searched the whole tree including docs and
skills. I have not guessed at what they mean, because both readings lead to
different work and guessing wrong would waste your time:

- **Toast** — a notification/snackbar component (so, new UI), **or** the named
  visual reference (a design you want matched).
- **Petra** — a specific model (so, an asset/reference I would need), **or** the
  reference for "upgrade the standards" (a visual bar to hit).

The audit and the fixes it implies do not depend on the answer, so that work
starts regardless.

## Audit remediation — loading fixes (in progress)

The original 5.5/10 assessment above is retained as the baseline, not a rating
of the revised implementation. This is not yet a completed re-audit.

- Moved `FrameReporter` into a renderer-only module and `ContextLoss` into
  `StageCanvas`. Both were static R3F import leaks (not just the reporter).
  Production HTML now preloads only React and the rolldown runtime. Browser
  network checks: `/privacy` and `/enquiry` each fetch three JS files, **no
  three**; home and textiles still load the renderer when needed.
- Suppressed canvas mounting in `StageScene` while the intro is active. A direct
  interception of the intro attribute removal recorded clearing at **3160.5 ms
  after navigation**. A separate polling run observed drawing at 130 ms and
  hidden at 3133 ms (3003 ms span). Polling can report removal late if the first
  WebGL render blocks its next sample; use the direct removal timestamp too.
- Replaced CPU `drawImage`/`getImageData` mask readback with a lossless run-packed
  asset (`land.mask`, 80,958 bytes). The earlier diagnosis called this “PNG
  decode”, but the measurement included canvas drawing/readback, not just image
  decoding. The shading texture remains the original PNG. No approximate
  coastline rasterisation is used. All 2,097,152 CPU mask pixels are tested
  against the original PNG. `build-geo.mjs` regenerates both assets together;
  `node scripts/build-mask.mjs` can regenerate the CPU asset independently.
- Consolidated the duplicate WebGL capability probes and removed the stray
  comment-adjacent export. Context-loss callbacks remain inside the canvas.
- Fonts: preserved all six used variable family/style faces, but restricted
  the bundled subsets to Latin for the site's English copy. Build output drops
  from 17 assets / 903,544 bytes to **6 / 449,768 bytes**. This is emitted asset
  size, not a claim that all 17 previously downloaded on each visit. Both
  Fraunces preloads remain. If additional scripts are introduced, add their
  subsets explicitly.

Validation: production build; **50/50 tests**, plus stage scope check. New tests
cover renderer import boundaries, exact mask equivalence and malformed masks.
Browser checks use headless Chromium/SwiftShader, not a physical mobile GPU.
One post-fix first-14-second capture still had **5123 ms** of long-task duration,
with a maximum task of **1149 ms**. This is improved from the recorded 7253 ms
maximum, but shader/uniform startup and post-intro responsiveness are **not
solved**. These runs are variable; do not substitute them for hardware tests.

Outstanding: initial WebGL render cost and texture profiling; coil geometry;
remaining interrupted-drag paths; real-device validation. Toast remains deferred
until the audit failures are addressed. Do not raise the score above the user's
stop threshold without completing the remaining checks.

## Follow-up: reported hover and drag regressions

- Globe yaw now composes the actual drag target with automatic drift instead of
  discarding the drag target every frame. Pointer-down rebases against the
  displayed angle minus drift, avoiding a jump or double-counting. Pitch easing
  now persists its current value too. Regression tests cover left/right yaw,
  paused drift, release continuity and grabbing during easing.
- Fixed a late-subscription intro-store bug introduced/exposed by deferred
  canvas mounting: if observation began while the intro was already active,
  the store's cached false state could suppress the clearing notification and
  leave the globe absent. Observation now seeds its state from the DOM. A test
  covers late subscription, clearing, logo replay and unsubscription. Earlier
  intro-timing-only checks were insufficient to establish globe readiness.
- Removed the tile's full-height dark pseudo-element, which painted above the
  sibling shared canvas. Only the label panel inverts; the model band remains
  transparent on hover and keyboard focus. Browser screenshot confirms the
  agriculture model remains visible on hover.
- Explore now uses a white difference-blend circle with black lettering,
  inverting the underlying navigation text instead of obscuring it. Drag keeps
  its theme-based treatment; dimensions and hidden-dot rules are unchanged.
- All six preview spins are 0.18 rad/s (formerly 0.28–0.40). The shared gallery
  now stops rendering outside the viewport and while the tab is hidden, and
  respects the quality system's still tier. Culling uses measured letterbox
  rectangles rather than mixing offset-parent and viewport coordinates.

Checks: **53/53 tests**, scope guard and production build pass. Headless desktop
browser recorded enter/press/12 drag events/release on a sideways globe gesture.
At 390×844 the globe mounts, all six tile links exist, scroll width equals
viewport width (390), no page errors occurred, and tapping the textile tile
navigates to `/textiles`. These remain Chromium/SwiftShader checks, not physical
Android/iPhone certification. Screenshots were captured in the session under
`/tmp/shots/fixed-{globe,product-hover,explore,phone-products}.png` (not tracked).

The outstanding coil rebuild, initial shader cost and real-device measurements
remain outstanding; these interaction fixes do not constitute a new score.
