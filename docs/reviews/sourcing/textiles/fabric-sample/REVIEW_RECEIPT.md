# Textile sample design study

16 November 2026 · [Three-size preview and full turn](http://127.0.0.1:4389/fabric-sample/) · [Implementation plan](../IMPLEMENTATION_PLAN.md)

The proposed object is one indigo fabric roll, a short draped tail, a narrow ecru selvedge, visible wound layers at the cut ends and a small kraft-paper sample tag. It uses the existing studio lighting, contact shadow, orthographic camera and framing. This is the revised design study requested after the neutral S pleat and neutral roll reviews.

The study is implemented in `src/three/textileGeometry.ts` and `src/three/TextileSample.tsx`, available only through the authoring entry's `iteration=fabric-sample`. The production textile registry, production posters and dedicated `/textiles` page have not been changed for this proposal.

## Observed cost

| Including contact shadow | Starting textile | Proposed sample |
|---|---:|---:|
| Draw calls | 4 | 3 |
| Triangles | 2,930 | 2,774 |
| Estimated material texture bytes | 1,048,576 | 961,195 |

The sample has two model meshes: fabric, then cut-end/paper details sharing one small atlas. Colour weave is 256 × 256; bump is 128 × 128; the cut-end/paper atlas is 256 × 128. Textures are mip-filtered. Material roughness is 0.93 for cloth and 0.96 for details, with zero metalness. No additional accessories or postprocessing were added.

The cloth palette is `#34495F` face, `#526476` reverse and `#D5C8A9` selvedge. The paper base is `#B99666`. Broad colour and texture remain part of the specimen rather than adding UI text or claims to the card.

## Checks

- `npm test`: 84 passed, plus the stage-boundary guard.
- `npm run build`: passed; existing Three chunk warning remains.
- `git diff --check`: passed.
- The actual roll-tail factory is tested for closed thin edges and clearance across every triangle's projection against the cylinder, rather than just vertex samples. Cut-face normals point outward; the core remains a small physical opening.
- Preview checked at 1440 × 1000, 390 × 844 and 320 × 568: no horizontal overflow or page exceptions. Reduced motion uses the still.
- Phone comparisons use 169 × 135 px stages. Wheat, pottery and copper in the family comparison are renders of the actual existing registry entries under the same lighting.
- Wheat poster hashes remain unchanged. The proposed sample is excluded from the current production bundle.

The 34.9-second turntable and four views are review assets only. Browser evidence uses Chromium/software WebGL; physical-device smoothness, Safari, production poster/live parity and deployment remain unverified at this design stage.

## Next implementation slice

After this revised concept is accepted, register it in textile slot 1, preserve the `/textiles` link and page, give it a separate versioned presented-pose store, regenerate and version only the two textile posters, add matching desktop loading/fallback artwork, and verify the real desktop chapter/dock and phone card paths. This keeps the material, posters and registry switch together in one candidate.
