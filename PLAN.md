# Rebuild plan

Working notes for this round. Delete before any handover.

## 1. Why it stutters

Measured, not guessed. Four things, in order of cost:

1. **The globe canvas never stops.** `Stage` passes `visible` down, and the hero's rect is 100vh tall, so the globe renders 60 fps from first paint until the visitor leaves the homepage. It keeps rendering while `textiles`, `enquiry` and `privacy` are scrolled over the top of it too, because scrolling is not a rect change.
2. **Every sphere vertex is displaced on the CPU at startup.** 256x160 is 41,601 vertices, each doing a mask lookup and a nine-tap blur. That is a visible freeze right when the page is trying to look alive, and it is repeated for each of the four stage canvases on a phone.
3. **The scroll listener writes a CSS custom property on `<html>` on every frame.** `--progress` feeds `transform: scaleX()` on a 2px bar. Setting a custom property on the root invalidates style for the whole document, so every scroll re-resolves every descendant's styles. This happens even though nothing but one hairline bar reads the value.
4. **Four WebGL contexts on narrow screens.** Each `Stage` creates its own `<Canvas>`, so a phone builds four renderers, four PMREM studio environments and four sets of generators. Browsers cap live contexts and start evicting.

## 2. Performance work

| Change | Why it helps |
| --- | --- |
| IntersectionObserver drives `frameloop` per canvas | A canvas only draws while it is actually on screen. Off screen it costs nothing. |
| Carve on the GPU in the vertex shader | Removes 41k CPU mask lookups per canvas. Vertex count can go to 320x180 at no CPU cost, so continents get sharper, not blurrier. |
| The globe idles at 30 fps and only goes to 60 while the pointer is on it | Motion is a slow drift and two comet bands. Halving the frame rate is invisible and halves the GPU budget for the most demanding object on the site. |
| One renderer, four scenes for the phone layout | Warm the context once, swap scenes in and out. One PMREM, four fewer canvases. |
| `--progress` written to the bar element, not to `<html>` | Stops full-document style invalidation on every scroll frame. |
| Small stage canvases capped at 1.5 dpr | A stage plate is a few hundred pixels wide. Its backbuffer does not need 2x. |
| Pause the globe when the pointer is down dragging | Removes the "fight" feeling while turning it. |
| Kill the `transition: background` on the nav, swap to class-based | A transitioned background sits under a `backdrop-filter`, which re-blurs the header region every frame of the transition. |

## 3. The sequence desync

`useScrollProgress` builds the object index from the **track** rect (`Math.floor(p * count + 0.5)`) and the cross-fade from the **stage plate** rect. Those are two different references, measured at two different scroll positions, so around a boundary the object has changed and the text has not, or the reverse. That is the bug the user is describing.

The fix is to make the object follow the same geometry as the text. Each step has its own rect. The object index becomes the step whose centre is nearest the middle of the viewport, computed from the same values that drive the cross-fade. Then the promise holds by construction rather than by tuning: the text that is most prominent belongs to the object that is in front.

I also want the text to move with the object rather than snapping 600ms later, so each step gets a continuous opacity and lift derived from the same number the 3D layer reads.

## 4. Logo

The supplied artwork is a single flat gold, `#DABC72`, with the ship drawn as a hairline contour inside the BS. Two derived assets:

- `logo.png`: colour-to-alpha, so the gold can be a CSS `currentColor` via `mask-image`. One file serves gold on ink, ink on cotton, and gold on indigo with no tinted duplicates.
- `logo-edge.png`: a Sobel edge of the same coverage, used for the draw-on pass.

**Intro sequence.** On the first visit of a session only, a gate covers the page. The edge asset draws in through a radial wipe, BS first, then the ship, then the wordmark. The fill arrives underneath it and the gold settles. Then the logo flies into the header slot and the gate lifts. If the header is not visible (any route but the homepage) it fades out on the same beat instead. Skippable by click, key, or scroll. Runs once per session, never for reduced motion, never on a blocked script.

**Everywhere.** Header, drawer, footer, acknowledgement and 404. The footer's 10rem wordmark becomes the artwork. No text lockup survives.

## 5. Colour

Two families only.

- **Ink** `#0B0E14`, with indigo `#16203A` / `#1E2B4D` for surfaces. The navy the user pointed at.
- **Gold** `#DABC72`, exactly the logo's flat, with `#F0DCA8` for highlights only.

Cotton stays as the paper the ink sits on and white as its top step. Everything else goes:

| Removed | Replaced by |
| --- | --- |
| madder `#9C3A2D` (the orange the user objects to) | gold |
| saffron `#C47B1C` | gold |
| verdigris `#4C7A68` | gold |
| brass `#B0864A` | gold |
| warm brown inks `#12100D` / `#1A1713` | ink with a blue cast |
| 3D palettes: boluses of red, green, orange | cotton, gold, ink |

The globe needs care: it is currently a warm brass land on a blue-black ocean. That read is close to right already, so it becomes gold land on deeper navy, with the coastlines and routes in gold at different opacities. The land/ocean separation is what makes it legible, so it stays.

## 6. Copy, rewritten

Read `humanizer/SKILL.md` first. The tells present in the current copy:

- Dashes used as universal connectors (§8). Already addressed last round, keep it.
- Triads by rule (§6). `field: ['What', 'Intended use', 'Location']` on every stage, and "Documentation / Logistics / Coordination".
- Bold-label lists (§19) and decorative headings (§20): the `LATER_DISCUSSIONS` table and the `BOUNDARIES` grid are both label-and-colon structures.
- One-line closers (§2) and inflated significance (§13).
- Restating headings (§24): "Four stages, each one optional to stop at" is followed by an introduction that says the same thing.
- Writing about the document (§25): "The site does not state fixed minimum quantities, prices, lead times, available stock or guaranteed specifications" is a page describing its own restraint.

Current vs target length:

| Section | Now | Target |
| --- | --- | --- |
| Hero lede | 34 words | ~20 |
| Stage bodies | 3 sentences each | 1, occasionally 2 |
| BOUNDARIES | 4 items, ~90 words | 3 sentences, ~55 |
| Textiles page | 280 lines | same structure, less explanation |
| Footer base | 2 paragraphs of disclaimer | 1 line |

Constraint that overrides the humanizer: **no new facts.** The business is developing, the areas are Tamil Nadu and Gujarat, the form goes to one inbox. Nothing about volumes, clients, certifications or history may appear, however good it would read.

Voice decision: the business is small, Indian, and careful. The copy should sound like one person being straight with another, not a brand performing. Short sentences. Concrete nouns. No adjectives doing work that a fact should do.

## 7. Not touching

The globe's geography and the carved-continent approach, the four objects and their drag behaviour, the pinned-scroll concept, the section order, the type pairing (Fraunces, Newsreader, Instrument Sans, Chivo Mono), the grain, and the cursor's behaviour. These were what the user called phenomenal.
