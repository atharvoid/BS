# Change list

Ordered by risk. Each item names the problem, the decision, and how it is
proven. The Part 2 work is implemented; the Part 1 research, audit and redesign
plan are in `docs/part1/`.

---

## Part 2 — the fixes

### 1. The hero globe

**Problem.** The globe had six control buttons (turn, tilt, pause, reset) that
nobody needed on a hero illustration, and it had been framed much smaller than
before.

**Decision.**

- **All scene controls deleted**, and the stylesheet and controller plumbing
  with them (`scene-controls.css`, `SceneController`, `setScenePaused`). Every
  scene turns by dragging and animates by itself.
- **Framing restored and measured.** The canvas is again 64% of the hero on a
  wide screen and full width below 900px. The sphere is now sized as a fraction
  of the frame (62% of height, capped by 46% of width) instead of a number tuned
  for a smaller canvas, so it reads as the subject of the first screen at every
  window shape:

  | viewport | globe diameter | share of hero height |
  | --- | --- | --- |
  | 1920×1080 | 670px | 62% |
  | 1440×900 | 558px | 62% |
  | 1366×768 | 476px | 62% |
  | 1280×800 | 496px | 62% |
  | 390×844 | 312px | 37% |

  The width term is what keeps the sphere inside its half of the hero, so it is
  never cropped by the headline.

**Proof.** The numbers above are computed from the camera and the framing code
(`node /tmp/measure3.cjs` logic), not estimated. The site renders on all six
routes with no console error (jsdom smoke run, see "Verification" below).

### 2. "What are you looking to source?"

**Problem.** Each category had become an outlined pop-up button with an arrow,
and the panel underneath mounted the entire enquiry form inside the homepage.
The section took two screens for six words.

**Decision.** A compact row again, but built properly this time:

- six **category tiles**, each with a live object turning continuously inside
  it, drawn by one shared canvas behind the row (see item 8), an index, the
  category name and one line of trade vocabulary;
- every tile is a link to `/enquiry?category=…` — no form is mounted on the home
  page;
- a running list of all six categories underneath, taken from the same
  `CATEGORIES` array, so the section is not textile-only;
- the whole section is roughly half the height it was.

**The rotation never stops.** A drag adds to the object's angle instead of
replacing it, so the object keeps turning from wherever the hand left it. There
is no pause state and no control; the only interruptions are the tab being
hidden and the adaptive quality system (item 7).

**Context budget.** Six tiles means six WebGL contexts, and the hero globe holds
one already — over a browser's practical cap of about eight, and worse on
Android. Rather than keep the row off phones, the six are drawn by **one**
context: a single orthographic view spans the strip and each object is placed at
its own tile's letterbox, measured from the DOM on scroll and resize. Only the
tiles actually on screen are drawn, so a swipe on a phone costs two objects, not
six. The page holds two contexts in total, at every width.

With one context the row animates on phones again, at the same cost as on a
desktop. Every tile also carries a still of its own object — a render of the
real model, not a drawing — which shows before the scene has drawn, on a device
that should not animate, and if WebGL is unavailable.

Six motifs were written for this: cloth bolt, hand-coiled basket, seed ring,
weaving shuttle, yarn bobbin and a folded swatch. They are procedural, like
everything else — no photographs, no downloads.

### 3. The cursor

**Problem.** Over a navigation item the pointer became a rectangular pill with
"Explore" written *underneath* it, below the cursor — the opposite of the
reference.

**Decision.** One **opaque circular disc, 88px, filled ink, with the word
Explore centred inside it and the disc centred on the pointer**. The label is
only ever visible while the disc is, so the word can never appear detached. The
disc tracks the pointer tightly (55ms follow) so it feels attached, and is only
nudged enough to stay on screen. Drawer rows and the header links use the same
disc.

**Proof.** `scripts/cursor.check.cjs` now asserts the shape rather than the old
behaviour: width ≥ 70px, width equals height, `border-radius: 50%`, background
not transparent, label opacity 1, label centre within 2px of the disc centre,
and the disc centre within 90px of the pointer (it is *on* the pointer, not
below it).

### 4. The textile page

- **No controls** below the animation, as on the home page.
- **Faster and continuous.** The hero cloth now carries its own slow spin
  (`2π/52` radians per second) on top of the idle drift, and the drift is
  applied as an absolute offset rather than a nudge away from the drag target.
  A visitor's drag moves the angle; it never stops the motion and nothing snaps
  back on release.
- **Never stops while dragging.** The scene clock is no longer paused by a
  pointer: `useSceneDrag` no longer calls `setPaused`, and the globe's comet
  clock and spin advance regardless of drag state. Only the adaptive quality
  system and reduced motion can settle a scene.
- **The Fabric Types, Tamil Nadu and Gujarat sections are untouched.** The
  swatch wall, the fibre/construction/finish explanation and the two regional
  blocks are the same mark-up and the same styles.

### 5. "Tell us about your fabric"

**Problem, and my honest opinion.** Remove it. The four objects were the
weakest thing on the site, for four reasons:

1. **They illustrated nothing.** A bolt, a shuttle, a bobbin and a reed happen
   to be textile objects; none of them says "fabric and use" or "acceptance and
   terms". Pairing an object with a contract term implies a relationship that
   does not exist.
2. **They competed with the words.** The section's actual value is four
   questions a buyer should answer. The objects made the eye go to the brass
   before the question.
3. **The motion was the story.** Because the objects swung in on scroll, the
   smoothness of the swing became the thing to judge, and any imperfection in
   damping or in the scroll-to-index handoff read as cheapness. A trade buyer
   notices exactly that.
4. **It cost a WebGL context and a scroll-driven render path** to say what one
   printed sheet says better.

**Replacement:** an **example enquiry brief** — a four-row sheet, each row
carrying the field, the question it answers, and an answer written the way a
buyer would write it, with a header rule and a footer note about attachments.
No canvas, no animation, nothing to keep smooth, and it is the part of the page
a buyer would screenshot and send to a colleague. It also reads correctly with
JavaScript, images and WebGL all unavailable.

`FABRIC_TOPICS` in `content.ts` lost its `object` and `objectLabel` fields, and
`TextileSequence.tsx`, `ProcessScene.tsx` and `useScrollProgress.ts` were
deleted with it.

### 6. The opening sequence

**Problem.** The BS/ship drawing played in about one second and had a "Skip
introduction" button.

**Decision.** Four beats over three seconds:

| when | what |
| --- | --- |
| 0.00–1.30s | BS, the ship and the wordmark draw themselves, then fill |
| 1.30–2.55s | the mark lifts into its place in the header |
| 2.55–3.00s | the curtain clears |

**The skip button is gone entirely** — element, styles, focus handling and test.
The sequence is short, and it is still interrupted by scrolling, a click,
Escape, Tab, a resize, or a reduced-motion preference, which is the behaviour a
skip control would have provided. The header mark is hidden until the flight
lands, so there is no double image.

### 7. Adaptive performance

**Can a browser detect whether it is running smoothly?** Yes, and better than a
synthetic benchmark can, because it measures the thing that actually matters:
the interval between consecutive `requestAnimationFrame` callbacks. That gap
includes everything — the globe's shader, a style recalculation, an image
decode, a throttled CPU on a laptop in power-save. `performance.now()` deltas
need no permission and cost nothing.

Three signals are combined (`src/three/performance.ts`):

- **Frame cadence**, sampled over 1.2s windows. Below 33fps the window counts
  against the current quality; above 50fps it counts in favour.
- **Long tasks**, via `PerformanceObserver` (`longtask`). One task over 250ms
  during a window is a visible freeze even when the mean frame rate looks fine,
  so it counts as a slow window on its own.
- **Device hints**: `hardwareConcurrency`, `deviceMemory`, `connection.saveData`
  choose where sampling *starts* — never where it ends.

Three outcomes, never exposed as a control:

| quality | what changes |
| --- | --- |
| `high` | full resolution, continuous animation |
| `medium` | resolution starts below the screen's own ratio, still continuous |
| `still` | one static frame; a scene redraws only for input (a drag) |

**Resolution has its own ladder, and it is the first thing given up.** Both
canvases were being drawn at one device pixel per CSS pixel — a halved image on
a 2× laptop and a thirded one on a 3× phone, which is why the models looked
soft. The ladder runs 3, 2.5, 2, 1.75, 1.5, 1.25, 1, taking the rung at or below
the screen's own ratio, with a 3-million-pixel budget bounding the top so a
large canvas cannot ask for the absurd. A slow window steps down one rung; only
when the ladder is exhausted does animation give way. Measured after the change:
the row draws at 2× on both a 2× laptop and a 3× phone, the desktop hero at 1.5×.

Downgrading needs two bad windows in a row; upgrading needs six good ones and
five seconds of quiet after any change — in both directions. Without that
hysteresis the site oscillates between qualities on a borderline machine, and
every change costs the scene a rebuild of its shaders.

**The measurement is of drawn frames, not of the browser's callback.** The
original sampler read the gap between `requestAnimationFrame` callbacks, which
is a frame rate only while something is drawing: an idle stage fires it on time
while drawing nothing, so a quiet page read as a slow one and a stopped scene
could never earn back its tier. Scenes now report their own drawn frames, and a
window with no reports is treated as no data rather than a bad window.

**What it offers, and what it refuses.** Clarity goes before animation, one rung
at a time, because a slightly softer frame is invisible and a stopped scene is
not. Nothing is offered as a control. The draw call's own duration is not
measured — R3F gives no hook that brackets only the draw, and a number obtained
by timing the wrong thing is worse than no number.

`still` is not "unmounted": the canvas switches to `frameloop="demand"`, the
scene freezes its clock, and a drag still redraws frame by frame — so a weak
device gets a static image that still responds to touch, rather than nothing.
Reduced motion is folded into the same state, and turning the preference off
restores the measured quality without a reload.

The sampler is reference counted and only runs while a stage is near the
viewport, visible, and the tab is in front.

### 8. Loading, touch and the cloth (Plan 2)

**Loading.** Four things were downloaded by every visitor on every route before
anything was on screen: three, the globe, the six product models and the textile
cloth. Opening the privacy page fetched the home page. The routes were static
imports, so lazy-loading the stage's canvas had nothing to defer — the scenes
were already in the entry chunk that imported it.

Scenes are now their own modules behind the stage boundary, which fetches them
by name. Measured on the built output: `/privacy` went from 11 scripts including
three to 5 with none; the entry chunk from 75.9 kB to 33.3 kB.

Route-splitting the pages was tried first and reverted. It moved three off the
critical path but made every page's own text late as well — the footer painted
above an empty document and then dropped two thousand pixels, a 0.51 layout
shift on every route. The saving never depended on splitting the pages, because
the scene boundaries are inside them.

**Touch.** A comment claimed `touch-action: pan-y` was what let a vertical swipe
scroll over a scene. It was on the canvas and not on the elements above it, so
the browser decided what a touch meant from the wrapper before the scene saw it.
Both heroes now declare the same contract on every element a finger can land on:
vertical scroll and pinch stay the page's, horizontal drag is the object's.

**The cloth.** It intersected the roll it was supposed to be unrolling from —
294 of 945 vertices inside the geometry. Rebuilt in the roll's own axial frame:
the sheet follows the roll's surface as an involute, is released tangentially,
eases to the floor and is given clearance at every step. 0 of 2015 vertices and
0 of 15360 triangle-surface samples are now inside the roll, at every tested free
length, through a full rotation.

**Stability.** A lost WebGL context is now rebuilt rather than leaving a blank
canvas — on the next frame, because a context stays dead for the rest of the task
that lost it and rebuilding immediately threw on the first shader upload.

`docs/plan2-acceptance.md` has every figure and the two things that could not be
proven in this environment.

---

## Structural clean-up done at the same time

- `Stage` no longer ships controller plumbing; `frameloop` is `always` /
  `demand` / `never` from visibility and quality.
- Stages go dormant after six seconds off screen and rebuild from the already
  loaded three.js bundle, to stay under the per-page WebGL context cap (this
  restores behaviour the earlier Stage had and the trade-homepage rewrite had
  dropped).
- `useSceneDrag` reports semantic pointer phases again (enter / press / drag /
  release / cancel / remove), so the cursor can say "Drag" over a scene and
  return to normal when the pointer leaves it. The trade-homepage rewrite had
  dropped this.
- `drag.ts` separates "the pointer is up" from "cancel": a flick now coasts and
  decays instead of stopping dead on release.
- Dead routes removed: the hero's scroll cue and the old ribbon/section CSS.
- New guard, `scripts/stage-scope.mjs`, run by `npm test`: it fails if a
  component calls `useFrame`/`useThree` and also renders a `<Stage>`, which is
  the mistake that produced a blank homepage during this work.

## Reported interaction regressions

- Restore horizontal globe drag by composing user yaw with automatic drift;
  rebase from the displayed angle without snapping. Persist pitch easing.
- Fix late intro subscriptions that could leave a deferred globe hidden.
- Keep product models visible on tile hover/focus by removing the occluding
  full-height pseudo-element; invert only the text panel.
- Use contrast-inverting Explore cursors over navigation, preserving the round
  60px shape and centred label with no dot.
- Slow all six previews to the same 0.18 rad/s rate. Pause the shared gallery
  offscreen/in hidden tabs, honour automatic still mode and correct tile culling.
- Add regression checks for yaw composition and intro replay/late subscription.
  Tests: 53 passing, plus stage scope guard; production build passes.

## Stable 3D, category journey, shared text transitions and site review

1. Homepage objects now freeze the same renderer instead of swapping to poster
   images. Hold resolution across performance tiers, preserve offscreen globe
   state and prepare globe relief/outlines before first reveal. Category shaders
   are compiled before reveal; refresh/context loss still require a fresh render.
2. Replace the strip with six reversible scroll chapters. Each retained model
   enters from the left, accompanying copy enters from the right, detail fades,
   then the model docks in a persistent bottom homepage row. Include direct skip,
   normal category directory, reduced-motion bypass and missing-WebGL fallback.
3. Coordinate text reveals across routes without changing typography or wrapping
   words. Preserve essential live UI, keyboard focus and reduced-motion access.
4. Review/fix enquiry transparency and timeout, required semantics, drawer
   background focus isolation, SPA route focus, route metadata, canonical URLs
   and no-JS contact fallback. Update stale architecture documentation.

Protected cursor/dropdown/intro/textile components and their approved design are
unchanged. Shared text transitions on the textile page are explicitly requested.
Full findings, a provisional **7.0/10** rating, evidence and owner/deployment
blockers are in `docs/website-review.md`. `npm test`: **56 passing**, stage scope
check passes; production build passes. Browser acceptance includes 1440/390px
forward/reverse docking, retained canvas and exact repeated frozen-frame pixels.
No real form submission or production delivery verification was performed.

## Three-pass verification follow-up

- Correct accepted-submission acknowledgement when sessionStorage is blocked or
  quota-limited: retain the latest accepted receipt in document memory, without
  fabricating acceptance on a fresh document. Clarify the fallback in privacy
  copy and add five focused unit regressions.
- Mark invalid visitor-role groups semantically invalid.
- Correct a compact heading overlap at 320×568. Under 480px viewport height,
  bypass the pinned narrative in favour of the existing category directory;
  avoid covering action links with the dock or shrinking the approved typography.
- Add reproducible full-category viewport/keyboard and intercepted-delivery
  checks. No real transmission, production key or test-only app control.
- Complete three distinct self-review passes and three fresh-context timing
  samples. Document evidence and unresolved blockers in
  `docs/three-pass-review.md`. Final Node tests: 61 passing, plus scope guard;
  normal production build passes. Overall 9/10 is not claimed.
