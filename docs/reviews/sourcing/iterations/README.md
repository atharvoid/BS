# Round two — alternatives and zoom clarity

The round-one folded lengths / stepped holder were rejected aesthetically. They remain on the normal site only until a replacement is selected; **do not describe them as newly approved**.

## Four different prototype directions

Comparison preview: **4182**, “Compare four new product directions”.

- **T1 — swatches:** four fanned woven swatches with a brass ring.
- **T2 — rail:** three draped fabric lengths on a simple sample rail.
- **A1 — scoops:** three open commodity sampling scoops.
- **A2 — bowls:** a low cluster of commodity sampling bowls.

These are real Three geometry, not generated concept pictures. All renders and live inspection views use the same `Exhibit`, framing and camera as the gallery. Initial images are 750×600; comparison buttons open one live viewer at a time, with gallery/side/reverse angles. These are visual prototypes, not final geometry or user-tested recognition claims. The rail currently has nine draw calls including shadow and would need its supports merged before production. The swatches use double-sided thin surfaces, not final closed-volume geometry. Ring attachment and final separation need design refinement after selection. No final performance approval is claimed for the alternatives.

Normal-site imports do not include `SourcingIterations` or the comparison pictures. Source is in `src/dev`; renders and comparison HTML are in this documentation directory, not public assets.

To recreate the comparison after rebuilding the authoring output:

```sh
npm run build -- --mode posters --outDir .poster-build
mkdir -p .poster-build/iteration-assets
cp docs/reviews/sourcing/iterations/{swatches,rail,scoops,bowls}.png .poster-build/iteration-assets/
cp docs/reviews/sourcing/iterations/iterations.html .poster-build/iterations.html
python scripts/serve-iterations-preview.py
```

## All-six-products clarity fix

The desktop journey previously sized its shared canvas to the whole screen even when all six objects occupied only a narrow dock. The 3-million-pixel budget was therefore spread over a mostly empty backing surface. `gallery-viewport.ts` computes a padded bounding rectangle of visible letterboxes. The same single scene, camera, transforms and models draw into that tighter rectangle, with slot coordinates offset to preserve exact screen positions.

Resolution is recalculated for the smaller surface and additionally capped by the previous full-screen backing-buffer pixel allowance. No larger texture files, extra scenes, extra WebGL contexts or postprocessing passes were added. Phone rendering and fallback poster selection are unchanged. This reuses the existing budget, rather than promising infinitely sharp models at any zoom.

Main website preview with the fix: **4181**, “Updated website preview”. Refresh an already-open preview before comparing.

### Browser evidence

The test emulates equivalent CSS viewport dimensions and DPR for a 1440×900 screen with native 2× density at 50%, 67%, 80%, 100% and 125% browser zoom. **This is device-metrics emulation, not a manual native browser zoom test.** Fresh pages and identical scroll position show all six docked models. Actual buffer dimensions were read from the live canvas. Raw data: `zoom-before.json` and `zoom-after.json`.

| Zoom-equivalent | Product CSS-pixel density before → after | Backing pixels before → after |
|---|---:|---:|
| 50% | 0.76 → 1.00 | 2,998,110 → 360,964 |
| 67% | 1.00 → 1.25 | 2,886,107 → 427,632 |
| 80% | 1.00 → 1.50 | 2,025,000 → 524,619 |
| 100% | 1.50 → 2.00 | 2,916,000 → 762,256 |
| 125% | 1.75 → 2.00 | 2,540,160 → 625,936 |

No horizontal overflow, page exceptions or WebGL errors in that matrix; canvas pointer events remain `none`. This measures sharper sampling with a smaller backing surface. It **does not prove zero added GPU time**: more samples over the objects themselves can cost more fragment shading even with less total buffer/clear work. No physical-phone smoothness, GPU-time, bandwidth-neutral byte-exact bundle, or unlimited “HD” claim is made. There is a small amount of new viewport-calculation code; no extra runtime assets are fetched.

### Checks

- **78/78 tests pass**, scope guard passes (63 files).
- Production build/typecheck pass; existing optional Three chunk-size warning remains.
- New tests cover crop containment, exact orthographic screen-coordinate preservation, hidden slots and finite startup, and no backing-pixel budget growth.
- Targeted site checks repeated after the change: desktop chapters 1/3, phone-emulated live gallery at 390×844 and reduced-motion poster-only at 320×568; no page exceptions or horizontal overflow, all phone posters load.
- Comparison page: four images load; all four live viewers prepare successfully; only one iframe exists at a time; no page exceptions.
- `git diff --check` passes. No push/deployment performed.

## Next step

Get the user's choice of T1/T2 and A1/A2 (or another direction). Then refine actual attachment/cloth/vessel geometry, merge support meshes where needed, run full replacement geometry/framing/clearance tests, measure selected-model performance, and regenerate its two matching posters. Do not silently install either comparison choice in production.
