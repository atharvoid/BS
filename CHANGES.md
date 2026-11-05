# Change list

Ordered by risk. Each item names the problem, the decision, and how I will prove it.

## 1. Hero: the weaving sequence becomes a globe

**Problem.** The yarn-to-cloth sequence is a nice thing but it is not what the
hero needs: the business is *India connecting to elsewhere*, and the animation
says nothing about that.

**Decision.** Replace it with a real Earth rendered in WebGL, built from actual
Natural Earth geography rather than an approximation:

- **Coastlines come from Natural Earth 1:50m vector data** (public domain, downloaded
  at build time). Land is filled from a raster mask generated from the same
  polygons, and the *outline* is drawn as real vector line loops. Raster gives the
  fill, vectors give a crisp edge at any size. That is the only way to get "nothing
  rough" without shipping a satellite texture.
- **Land is carved, not painted.** The fragment shader derives a bevel from the
  mask gradient and perturbs the normal, so the continents stand proud of the
  ocean and catch the light along their coasts.
- **Gujarat and Tamil Nadu are exact coordinates**, not labels: Ahmedabad
  (23.0225 N, 72.5714 E) and Tiruppur (11.1085 N, 77.3411 E). They get a small
  pulsing marker.
- **Routes are true great circles** from those two points to Vietnam, Europe,
  the Gulf, Sri Lanka, Bangladesh and East Asia. Each carries a travelling
  comet: a bright head with a fading tail, animated in the shader. That is the
  "supply in motion" reading.
- Palette stays in-house: ink-indigo ocean, cotton-brass land, saffron and
  madder routes, verdigris markers. No blue-marble photography.
- Spins slowly on its own, drag to turn, and never captures the wheel.

**Cost.** The globe is the whole hero canvas, so it must be cheap: one sphere
with a custom shader, one line loop mesh for coastlines, one for routes, and a
handful of markers. All animation is uniform-driven.

## 2. Cursor

Three separate complaints:

- Ring is too big → 30px becomes 22px, hairline weight kept.
- Hover growth is absurd (1.9x) → 1.35x, plus a slower ease.
- **The native Windows arrow is still visible** → the cursor is never hidden,
  which is the actual bug. Hide it via a class the component adds at runtime, so
  a JS failure can never leave a visitor with no cursor at all.

## 3. Process sequence: smoothness and the mobile failure

- **Mobile was broken**: outside the pinned frame the steps stayed
  `position: absolute`, so all four collapsed into one block and only the first
  stage's canvas existed. Fixed by restoring normal flow below the breakpoint and
  giving every stage its own plate.
- **Jitter**: the arc eased inside `useFrame` while the text snapped on an index
  change, so the object and the paragraph disagreed for ~600ms. The visual
  progress is now damped toward the scroll target instead of being set directly,
  so it carries through with traction, and only the on-screen stage canvas
  renders.

## 4. Menu drawer: no hover feedback

Links had no hover state outside the active colour. Add a hover treatment that
matches the site's language: the link number and label shift, a hairline draws
in, and the active marker follows the pointer.

## 5. Copy hygiene

- Remove every em-dash used as a clause separator, rewriting the sentence
  rather than swapping punctuation.
- Remove anything that reads as developer scaffolding: the replay control dies
  with the old hero, and the enquiry form's failure state is reworded so it
  addresses a customer instead of exposing configuration.
