# Refined textile roll — implementation receipt

16 November 2026 · [Result preview](http://127.0.0.1:4389/refined/) · [Integrated website](http://127.0.0.1:4383/#products) · [Approved plan](../REVISION_PLAN.md)

The approved refinement is implemented and integrated locally in textile slot 1. The tag is removed; the loose tail is retained with a smoother fall, aligned ecru selvedge, rounded roll shoulders and subtle tonal herringbone. The indigo palette, existing lighting, orthographic camera and 0.18 rad/s rotation are preserved. `/textiles` and its dedicated green cloth hero and five swatches remain available.

No publication or commit was performed. The working branch and starting HEAD remain `arena/e210227c-bs` / `9c57be94afeea2b9ba6f30e5cc9177ab9392e141`. Existing owner work and the previous design studies were preserved.

## Geometry and material

- Roll and tail now share a 1.256-unit fabric width and common selvedge positions. The tail remains a closed 0.008-unit volume, with the roll-contact arc flowing into a tangent cubic fall and a horizontal settled end. Both rest on the same floor reference. Tests check every projected tail triangle against the roll radius.
- The barrel uses 64 angular samples. Rounded shoulders meet the barrel and flat cut ends with matching boundary positions and smooth normals. A regression check also verifies matching wrapped weave phase across both barrel/rim joins. The previous stepped end bands are removed.
- Face `#34495F`, reverse `#526476` and ecru `#D5C8A9` are unchanged. The cloth uses roughness 0.93, cut ends 0.96 and zero metalness. The herringbone introduces approximately 7% peak-to-trough tonal variation without a new hue. The selvedge is quiet in both colour and bump maps.
- Texture wrap is periodic at the circumference seam. Fabric colour is 256 × 256, bump 128 × 128, and the wound-end texture 128 × 128. The paper geometry, stamp and unused half-atlas are removed from the active model.

## Cost and poster evidence

| Including shared shadow | Original textile | Previous tagged concept | Final refinement |
|---|---:|---:|---:|
| Draw calls | 4 | 3 | **3** |
| Triangles | 2,930 | 2,774 | **2,810** |
| Estimated material texture bytes | 1,048,576 | 961,195 | **873,813** |

Three final isolated 750 × 600, DPR 1 captures returned the same cost. Raw runs are in `three-runs.json`; preparation time varies under software WebGL, so no hardware smoothness or timing gain is claimed.

The two textile posters were generated from composited white/black captures of the final production registry. Full/small assets are **9,018 / 3,982 bytes**, 750 × 600 / 375 × 300, encoded at quality 78. `scripts/build-posters.mjs` now accepts an optional `--quality=` argument; its default remains 90. Both textile URLs use `?v=indigo-roll-v2`.

Observed mean absolute RGB differences:

| Comparison | Result / 255 |
|---|---:|
| Full poster vs canonical authoring render, opaque object | **2.52** |
| Actual phone static poster vs canonical live textile | **1.66** |
| Delayed desktop poster vs canonical first frame | **2.53** |
| Dock live frame vs retained still at its pose | **0.51** |

The full poster's alpha silhouette is within one source pixel of the original render. Phone colour comparison uses the actual versioned WebP and fully opaque specimen pixels, excluding one native renderer pixel at resampled alpha edges. At a capped canvas this spans two DPR-2 screenshot pixels. Thin outlines were inspected separately. The retained PNG is used to identify the alpha mask, not as the static poster being compared. Frozen settled canvas screenshots are pixel-identical.

## Integration and continuity

`CategoryContinuity.tsx` and the renderer-free `category-presentation.ts` reuse the previously implemented wheat approach for both real consumers. Textile state uses `bs:textiles:indigo-roll-v2`; the wheat version and key remain `bs:agriculture:golden-wheat-v1`. A regression test checks that the stores cannot share a pose or asset version.

Phase advances only on an actual draw. Planned suspensions capture a bounded matching still; remount and same-tab reload use a compatible still/pose pair, otherwise the canonical pair. No per-frame React updates or pixel readback were introduced. Phone motion still follows the existing section window and render budget.

Textile loading artwork now occupies the existing active desktop anchor, fitted by height at 125% width in its clipped square. A compact textile poster is available in the no-WebGL directory. The card remains a single native link to `/textiles` with decorative imagery.

The wheat static-poster check exposed slightly excessive high-DPR small-image resampling error. High-DPR two-column wheat cards now select the existing full poster; low-DPR fallback cards still select the small asset. This brought the actual wheat phone comparison to **2.58/255** without changing wheat artwork or material. All **21 unrelated poster hashes**, including both wheat files, are unchanged.

## Verification

- `npm test`: **88 passed**, plus the stage-boundary guard. Full log: `tests.log`.
- `npm run build`: passed. The existing ~923 KB Three chunk warning remains; its threshold was not raised. Log: `build.log`.
- `git diff --check`: passed.
- Textile browser journey: desktop chapter, forward/reverse docking, same canvas, reload pose, full poster selection and correct height fit; 390 × 844 phone freeze, offscreen return, reload, Back, context loss and `/textiles` navigation. The dedicated textile hero drew successfully and all five swatches remained present.
- Reduced motion at 320 × 568 uses the single-column layout. Save-Data, unavailable WebGL, six category links, no horizontal overflow, no page exceptions and no authoring/turntable production requests passed.
- Wheat browser regression passed the same pose, navigation, fallback and canonical static-poster checks. Reports: `wheat-regression.json` and `static-parity.json`.
- Additional delayed-renderer and dock retained-pair capture checks passed. Report: `loading-parity.json`.

Tracked browser commands, after building and serving `dist`:

```text
SITE_URL=http://127.0.0.1:4383 PLAYWRIGHT_MODULE=playwright node scripts/textile-journey.check.mjs
SITE_URL=http://127.0.0.1:4383 PLAYWRIGHT_MODULE=playwright node scripts/wheat-journey.check.mjs
```

On Windows, set variables using PowerShell. `BROWSER_EXECUTABLE` can select an existing Chromium. Playwright remains in ignored `.poster-build/tools`; no project dependency or lockfile change was needed.

## Limits

Browser evidence is Chromium with software WebGL. Visibility suspension and renderer loss were simulated. Physical Android, iPhone/Safari, real hidden-tab power use and public deployment were not observed. An abrupt GPU/process failure can lose the last frame; that path has only the last valid retained pair or canonical fallback available.

The existing ScrollManager returns to the top on reload. Pose restoration was checked on re-entering the matching chapter/card/dock. Historical visitor cache contents were not reproduced; both responsive textile URLs are versioned and actual `currentSrc` selection was checked.

## Main changed paths

`src/three/{textileGeometry.ts,textileTextures.ts,TextileSample.tsx,CategoryContinuity.tsx,category-presentation.ts,wheat-presentation.ts,Gallery.tsx,categoryObjects.tsx}`, category poster/desktop fallback components and styles, the two textile poster assets, focused geometry/texture/presentation/browser checks, and the targeted poster generator option. `WheatContinuity.tsx` was replaced by the shared category component. The dedicated textile page, globe model and unrelated model factories remain unchanged.
