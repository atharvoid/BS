# Plan

## 1. The stutter in the header — diagnose, then fix at the root

Three suspects, in order of likely guilt:

1. **`mix-blend-mode: difference` on the cursor ring + dot** (`site.css:33,39`). Those two layers are `position: fixed` at `z-index: 250`, i.e. *above* the nav, which has `backdrop-filter: blur(18px)`. A blended layer above a backdrop-filtered one forces the compositor to re-blur and re-composite the nav region **on every pointer move**. That is exactly "stutter in the top area when I move the mouse".
2. **`will-change: transform`** on both cursor layers keeps them promoted forever, and the ring has a *transition* on width/height/border-color — transitions on composited layers re-rasterize.
3. The cursor rAF loop runs at 60 fps permanently, writing transforms even when the pointer is still.

Fix: remove both blend modes (the cursor becomes a madder-on-madder-ink hairline that reads correctly on cotton *and* ink without compositing tricks), drop `will-change`, and make the rAF loop self-cancelling — it stops when the cursor has settled and restarts on the next `pointermove`.

**Verification:** CDP frame-time sampling while moving the mouse across the nav, before and after.

## 2. Hero — replace the decorative cloth with yarn becoming cloth

The current hero cloth is a hanging panel that rotates. It is pretty but says nothing. Replace it with a **literal weaving animation**, ending on the finished cloth:

- **0.0s** a bundle of loose yarn, wound on a brass spindle, strands drifting.
- **0.2–1.2s** the strands *draw outward* into a warp sheet — the fibres separate and level into parallel threads.
- **1.2–4.0s** a shuttle crosses, laying weft; the cloth **fills upward from the hem**, the fill line glowing as it climbs.
- **4.0s+** the finished cloth hangs and breathes. It stays draggable, and a small `Re-weave` control replays it.

Mechanically: **one draw call for the warp** (an instanced strand mesh whose vertices are interpolated between "loose fibre" and "woven sheet" positions on the GPU by a single `uWeave` uniform) and **one for the cloth** (a shader that reveals the weave from the hem up). Scroll position inside the hero *nudges* `uWeave` forward, so scrolling genuinely speeds the weaving up — but time drives it too, so it animates continuously with no input. Per-frame CPU cost is one uniform write.

**Anti-slope holds:** the cloth settles level; the tilt clamp and drag damping are unchanged.

## 3. Process — the four stages become one pinned, scroll-driven sequence

- The stage list becomes a tall track. A `position: sticky` viewport-height frame holds **one canvas on the left**; the four text blocks scroll past on the right, each snapping the index.
- All four objects live in that single canvas. The active one **sweeps in along a circular arc from below** (the motion you described), settles upright, then idles — slow rotation and float, no interaction needed. The outgoing one sinks and spins out along the opposite arc.
- A vertical progress rail with `01 02 03 04` markers tracks position.
- Interactive throughout: each object is still independently draggable, and dragging pauses the idle drift so your angle is respected.
- **Mobile / reduced motion:** no pinning — the stacked cards return, but they keep the arc entrance and the continuous idle rotation.

## Order of work

1. Cursor fix + CDP measurement.
2. Weave shader + new hero scene.
3. Pinned process stage.
4. Typecheck, build, screenshot both breakpoints, re-measure frame times.
5. Commit and push.
