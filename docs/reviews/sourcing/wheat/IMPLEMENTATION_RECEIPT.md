# Golden wheat implementation receipt

16 November 2026 · local implementation on `arena/e210227c-bs`, starting HEAD `9c57be94afeea2b9ba6f30e5cc9177ab9392e141`.

[Review preview](http://127.0.0.1:4386/) · [Production-build website](http://127.0.0.1:4383/#products)

Agriculture only. The existing textile design, category ordering, copy, enquiry route, lighting, orthographic framing and scroll choreography remain in place. Nothing was published or committed. The starting modifications to `src/dev/PosterCapture.tsx` and the supplied review assets were preserved.

## Implementation

- Extracted the approved mesh into `src/three/wheatGeometry.ts`. The neutral authoring study and production wheat use that same factory. Production positions, normals and indices match the approved attributes byte-for-byte; the baked lean and pivot are unchanged.
- Added one white, vertex-coloured `MeshStandardMaterial`, roughness 0.90, metalness 0, black emissive. No new material textures, geometry detail or postprocessing.
- Switched only the agriculture registry entry, retaining 0.18 rad/s. Desktop chapter and dock share the same exhibit. The phone uses the existing render budget and bounded 4,500 ms section window.
- Wheat phase advances and is recorded only when the adaptive renderer actually draws. No wall-clock catch-up or per-frame React state. The phone retains its gallery after its first visit and keeps the wheat mounted while other visible models change.
- Planned suspension and page lifecycle boundaries capture one bounded transparent specimen/shadow crop and its phase. Resume requires a matching asset version, slot height, device DPR and motion policy. A missing compatible pair starts with canonical poster and canonical first frame together. Snapshot/storage failures remain recoverable. Snapshot size is bounded to 1500 × 1200 backing pixels without intentional downsampling.
- Desktop loading artwork occupies the existing active anchor, fitted by height at 125% width inside its clipped square. The large chapter explicitly requests the full poster. The unavailable-renderer directory shows compact golden wheat. Phone context loss uses a valid retained frame when available.
- Generated both agriculture posters from composited white/black 750 × 600 captures. Both responsive URLs use `?v=golden-wheat-v1`.

## Final palette

| Part | sRGB swatch |
|---|---|
| Husk midtone | `#C99B49` |
| Raised ribs / shoulders | `#DDB96F` |
| Roots | `#9D783C` |
| Cut stem | `#B79453` |
| Awns | `#CDA958` |

Three's installed `Color` API converts the swatches to linear values before interpolation. No palette correction was needed after inspection of the complete turn.

## Observed evidence

| Measurement | Result |
|---|---|
| Isolated gallery, wheat + contact shadow | **2 draw calls, 2,914 triangles** |
| Starting stepped holder + shadow | 8 draw calls, 3,878 triangles |
| Neutral approved wheat + shadow | 2 draw calls, 2,914 triangles |
| Estimated material texture memory, including shared shadow | **349,525 bytes** for all three |
| Full / small poster | **8,876 / 4,292 bytes**, 750 × 600 / 375 × 300 |
| Neutral four quarter turns vs original study | Pixel-identical at all four poses |
| Gold vs neutral silhouettes | Alpha masks pixel-identical at all four poses |
| Full poster opaque-object RGB difference vs authoring render | 2.00/255 mean absolute difference |
| Actual 390 × 844 phone poster/live RGB difference | **2.60/255**, 3,326 intersecting object pixels |
| Delayed desktop loading poster / canonical first frame | **1.91/255**, yaw exactly 0.7 |
| Actual dock live / retained pair | **2.40/255** |
| Phone image stage | **168.609 × 134.875 CSS px**, DPR 2 |
| Desktop large square / poster width | 549 / 686.25 CSS px, correct height fit |
| Other posters | All **21** unrelated WebP hashes unchanged |
| Isolated textiles, pottery, copper, cotton, crate, globe and cloth | Before/after renders pixel-identical |

Desktop RGB measurements use the interior object mask, excluding a two-pixel edge band affected by fractional CSS crop sampling. Dock boundary bounds differed by at most one pixel; thin awns were also inspected visually. The phone comparison uses the intersecting object mask rather than blank stage margins. Frozen canvases produced pixel-identical repeated screenshots after settling.

Three like-for-like isolated runs are recorded in `output/golden-wheat-preview/baseline-metrics.json` and `gold-metrics.json`. Preparation times are noisy under software rendering; no device smoothness or timing improvement is claimed.

## Verification

- `npm test`: **81 passed**, plus the stage-boundary guard.
- `npm run build`: passed. The existing ~923 KB Three chunk warning remains; no budget or warning threshold was raised.
- `git diff --check`: passed.
- `scripts/wheat-journey.check.mjs`: passed against the final production build, covering desktop chapter/dock/reverse, one gallery canvas, reload pose, height fit and full poster selection; phone frozen pixels, offscreen return, reload, Back, correct enquiry navigation, retained context-loss artwork; 320 × 568 reduced-motion single column, Save-Data, unavailable WebGL, six category links and no horizontal overflow. No page exceptions or authoring/turntable requests appeared in the production request log.
- Additional local capture checks passed for delayed desktop 3D and canonical first-frame parity, dock retained-pair parity, four silhouettes and the seven isolated regression views.

To rerun the tracked browser check after building and serving `dist`:

```text
SITE_URL=http://127.0.0.1:4383 PLAYWRIGHT_MODULE=playwright node scripts/wheat-journey.check.mjs
```

On Windows, set these environment variables using PowerShell. `BROWSER_EXECUTABLE` is optional for an existing Chromium installation. Playwright was installed only inside ignored `.poster-build/tools`; project dependencies and lockfile were not changed. The older category/viewport journey browser scripts still assume desktop runway markup on phones; the focused wheat check exercises the actual phone cards instead.

## Changed source and review files

Production: `src/three/{wheatGeometry.ts,WheatHead.tsx,WheatContinuity.tsx,wheat-presentation.ts,FrameReporting.tsx,Gallery.tsx,categoryObjects.tsx}`, `src/components/{CategoryPoster.tsx,MobileProducts.tsx,ProductExplorer.tsx}`, `src/styles/{journey.css,mobile.css}`, and the two `public/posters/agriculture-mobile*.webp` assets.

Authoring/tests: `src/dev/WheatHead.tsx`, `scripts/{category-framing.test.mjs,sourcing-geometry.test.mjs,wheat.test.mjs,wheat-journey.check.mjs}`. Existing holder fixtures remain tested. Review additions are this receipt, `golden/phone-comparison.png`, `golden/golden-turn.webp`, and `output/golden-wheat-preview/`.

## Evidence limits

Browser evidence is Chromium with software WebGL. Visibility suspension and context loss were simulated. Physical Android, iPhone/Safari, real hidden-tab power use, GPU/process kill behavior, historic warmed browser caches and public deployment were not observed. URL versioning and actual responsive `currentSrc` were checked, but no claim is made about a previously deployed visitor cache. Dedicated textile-page regression evidence here covers the isolated cloth render and unchanged page sources, rather than a full before/after page interaction recording.

A forced kill or sudden GPU loss can discard the latest frame. Only the last valid retained pair, or the canonical golden fallback, is available in that case. The site's existing ScrollManager returns to the top on reload; the saved pose is verified when re-entering the matching chapter or dock.
