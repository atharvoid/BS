# Textiles and agriculture replacements

## Preview and scope

Production build preview runs on port **4181**, labelled **Updated website preview**. Scroll to Product areas: textiles is chapter 1; agriculture is chapter 3. Phone layouts show the same objects in product cards. This is a local working preview, not a deployment. Changes are uncommitted on `arena/e210227c-bs`.

Only these two category objects and their four poster files changed. The other four models, textile page, cursor, dropdown, intro and adaptive render policy were not modified. Gallery's only direct change is a diagnostic name on its existing spin group; production transforms/camera are unchanged.

- **Textiles:** three thin folded lengths with narrow selvedges, shared weave maps and an open upper leaf. Neutral/untextured inspection is in [fabric-neutral.png](sourcing/fabric-neutral.png). Recognisability remains a visual judgement; thin geometry alone is not user validation.
- **Agriculture:** stepped commodity sample holder, with representative rice/pulses/grain above low retaining edges. The [shallow prototype](sourcing/shallow-tray.png) hides its contents in the real frontal camera; the [stepped version](sourcing/stepped-holder.png) does not. These are illustrations, not stock/availability statements.

Both prototypes use the existing Exhibit, orthographic camera, framing and initial pose, not a separate flattering camera. At 375×300, six yaw samples from .7 to 5.95 radians retain 882–2,593 visible content pixels for the stepped holder; the shallow option has zero. This colour-mask check measures combined visible beds/grains, not the semantic recognition of individual commodities. Small real-material renders were also inspected at the five additional angles. Some compartments partially occlude others from behind, as expected.

## Identical-condition browser measurements

750×600, DPR1, frozen initial rotation [.05,.7,0], existing gallery Exhibit and lighting, same Chromium/SwiftShader launcher and script. Three fresh pages per model in each run; one browser process for each before/after batch. Timing includes module evaluation to rendered frame 3, **not** complete website load. Warm caches and software rendering limit timing generalisability. Raw runs: [measurements.json](sourcing/measurements.json).

| Metric | Textiles before → after | Agriculture before → after |
|---|---:|---:|
| Draw calls, including contact shadow | 6 → 4 | 10 → 8 |
| Rendered triangles, including instances | 4,370 → 2,930 | 4,874 → 3,878 |
| Renderer geometry allocations | 7 → 5 | 10 → 5 |
| Unique model/shadow geometries | 6 → 4 | 9 → 4 |
| Renderer texture count | 8 → 7 | 9 → 5 |
| Estimated decoded material texture bytes | 4,543,829 → 1,048,576 | 5,941,931 → 349,525 |
| Preparation median, ms | 364.0 → 248.2 | 662.3 → 263.8 |
| Full poster bytes | 33,608 → 11,300 | 32,360 → 9,478 |

Texture bytes are estimated width×height×4 plus mip overhead for material maps, including the contact shadow. They exclude studio/environment allocations and are **not measured GPU VRAM**. Renderer texture/geometry counts include common studio allocations. Geometry reduction and draw-call reduction are measured, not inferred from instancing.

**No physical Android/iPhone comparison was possible. Mobile smoothness remains unverified.** These browser numbers do not establish real-device FPS, battery use or responsiveness.

## Posters and initial pose

Selective command:

```sh
node scripts/build-posters.mjs /path/to/white-and-black-captures textiles agriculture
```

Omitting names retains all-model generation; invalid names fail before writing. Only these four files were regenerated: textiles/agriculture `-mobile.webp` and `-mobile-small.webp`. Their source captures are the live production factories rendered by the same Exhibit at the initial gallery pose, with no inspection overrides. Full posters are 750×600, small posters 375×300. Compositing the full WebPs over white and comparing them against those live captures gives mean absolute RGB errors of 0.262 and 0.185 on a 0–255 scale (lossy WebP/alpha reconstruction). There are no roll/sack assets left in these poster paths. Small-size byte counts and dimensions are in the measurements JSON.

## Verification

- `npm test`: **74/74 pass**; Stage scope guard passes (61 files).
- Framing tests now call the actual production replacement factories, not roll/sack stand-ins.
- New geometry tests check manifold closed sheets, real .012 thickness, non-crossing fold cross-sections (including interpolated strips), positive whole-layer clearance, visibly opened upper leaf, grain/wall clearance, and actual instanced triangle/call budgets.
- `npm run build`: passes (includes typecheck). Existing optional large-Three-chunk warning remains.
- `git diff --check`: passes.
- Preview browser checks: desktop 1440×900 chapter 1/3, phone-emulated 390×844 with live gallery, 320×568 reduced-motion poster-only. No uncaught page errors or horizontal overflow; mobile category canvas has `pointer-events: none`. All six phone posters load. Desktop screenshots confirm the new models in the existing chapter/dock experience. See [browser-checks.json](sourcing/browser-checks.json).

Browser checks are targeted regression checks, not a new full accessibility/site certification. The neutral fabric render and overall artistic finish should be reviewed in the preview before further refinements.
