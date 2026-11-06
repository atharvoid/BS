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
  it, an index, the category name and one line of trade vocabulary;
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
one already. The live row is therefore reserved for `(min-width: 900px) and
(any-pointer: fine)`; phones and tablets get a woven swatch in each tile's own
colour. Same information, no contexts, no risk of a browser silently dropping
the oldest surface.

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
| `medium` | device pixel ratio capped at 1, still continuous |
| `still` | one static frame; a scene redraws only for input (a drag) |

Downgrading needs two bad windows in a row; upgrading needs six good ones and
five seconds of quiet after any change. Without that hysteresis the site
oscillates between qualities on a borderline machine.

`still` is not "unmounted": the canvas switches to `frameloop="demand"`, the
scene freezes its clock, and a drag still redraws frame by frame — so a weak
device gets a static image that still responds to touch, rather than nothing.
Reduced motion is folded into the same state, and turning the preference off
restores the measured quality without a reload.

The sampler is reference counted and only runs while a stage is near the
viewport, visible, and the tab is in front.

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
