# Textile roll refinement — approval plan

16 November 2026 · **Approved by the owner and implemented locally.** See the [implementation receipt](refined/IMPLEMENTATION_RECEIPT.md) and [result preview](http://127.0.0.1:4389/refined/).

## Intended result

One horizontal fabric roll with its short loose tail retained, the current indigo colours, a clean softly rounded ecru rim, convincing wound cut ends and a restrained woven pattern. The loose fabric should flow smoothly off the roll and settle naturally onto the surface.

**Remove only the kraft-paper sample tag. Keep the tail and improve its fall.** The owner clarified that “fall” referred to the drape and smoothness, not tail removal. The previous concept is preserved for comparison.

## Visual decisions

| Element | Planned treatment |
|---|---|
| Colour | Keep face `#34495F`, reverse/cut-end blue-grey `#526476` and ecru `#D5C8A9`. Preserve the current perceived colour balance under the studio lights. |
| Main roll | Keep the horizontal proportions, small real core opening and short loose cloth section. Remove the paper tag. Check the resulting footprint with the existing gallery fitting rules and alongside the other products. |
| Fabric fall | Keep the tail short. Let it peel tangentially from the roll, bend progressively under its own weight and settle gently onto the surface. Preserve a slight crosswise sag and thin cut edge. |
| Exposed rim and border | One continuous, even-width ecru selvedge with matching edge positions on the roll and tail. Smooth the barrel-to-cut-face shoulder, align the trim through the contact arc and free span, and remove the doubled/offset edging. |
| Fabric detail | Keep the fine grain and add **one subtle tonal herringbone weave**. Use the existing indigo family, approximately 5–8% local lightness contrast as a starting point. It should read as woven structure in the chapter and settle into a quiet texture on the phone. |
| Trim finish | Keep the rim matte and clean. Reduce coarse colour noise and bump relief on the trim so the light does not break its outline into a ragged line. |
| Cut ends | Retain soft winding detail and the core opening. Replace the visibly stepped radial relief with a smooth cut face and small rounded shoulder. Keep the winding texture restrained. |
| Lighting and motion | Keep the current Studio, lights, matte roughness, zero metalness, contact shadow, camera and 0.18 rad/s turn. |

## What the inspection found before implementation

The existing roll and tail carry separate selvedges. Their axial positions differ by approximately 0.05 scene units, equivalent to up to about 11 CSS px in the large study and 2.8 CSS px at phone size before view-angle foreshortening. This contributes to the two borders reading as separate edges during rotation.

The barrel and cut ends use 32 radial segments, with the end's radial bands alternating outward by 0.003 scene units. The cream trim also receives the fabric's repeating weave and bump map. These are specific sources of the coarse edge appearance; merely increasing texture resolution would leave the joins and relief unchanged.

The planning inspection used the previous turntable around yaw `0.7 + π/4` and `0.7 + 5π/4`, along with its geometry and material source. These findings informed the approved implementation below.

## Implementation sequence after approval

1. **Preserve the accepted reference.** Keep the current renders and source evidence for comparison. Work on the refined roll as the next candidate; preserve the wheat and other owner changes.
2. **Remove the tag; refine the fall.** Remove the paper geometry and its unused texture area. Keep the tail's thin closed volume. Shape a smooth transition from the roll-contact arc into the hanging span, with continuous tangents and gradual curvature, then ease it onto a shared floor reference. Keep roll clearance throughout the complete triangle surface. Check that the leading edge rests naturally and the roll does not appear to float. Reuse the existing constrained cloth approach; no cloth simulation is needed.
3. **Rebuild the rim and align the selvedge.** Derive barrel, rounded shoulder and cut-face boundaries from matching coordinates and angular samples. Give the roll and tail a shared fabric-width/border reference so the selvedge continues through the contact arc without a lateral step. Use continuous surface normals through the shoulder, a flat cut face and a constant-width trim. Start at 64 radial segments; increase only if close-up evidence still shows faceting and the existing budget permits it. Remove the alternating stepped cap bands, using a simpler cap to preserve the budget for the retained drape.
4. **Refine the material.** Add the low-contrast herringbone to the existing procedural fabric texture. Make the wrap periodic at its seam, maintain even thread density, and use mip filtering. Give the trim a quiet, smooth response. Reuse the existing texture/material approach rather than adding a shader system or runtime texture generation loop.
5. **Validate the complete turn.** Inspect front, back, both ends, the two previously problematic border angles and a full revolution. Compare at 549 px chapter height, in a 240 × 160 dock cell and at the measured 168.61 × 134.88 phone stage. Check close-up views as well as normal viewing size.
6. **Complete local integration.** Carry the accepted refinement into textile slot 1 with its own presented-pose/version key, correctly fitted loading/fallback artwork and matching versioned textile posters. Preserve `/textiles`, the dedicated page and the six-category order. Verify the real desktop and phone paths and return the local preview. Publication remains a separate instruction.

## Acceptance checks

- The exposed cream rim and tail border stay smooth and continuous throughout the turn: no doubled line, lateral step at the attachment, gaps, protruding bands, flickering overlap or abrupt lighting seam.
- The motif remains restrained, wraps continuously and does not shimmer or produce moiré in the small card or during rotation. Colour remains consistent with the accepted study.
- The roll has finite normals, outward-facing cut surfaces, a real core opening and a closed exterior. The rounded shoulder and selvedge maintain their intended dimensions around the circumference.
- The tag is absent and the loose tail remains. Its fall has smooth tangent transitions, a slight natural sag and a settled leading edge. No cloth triangle penetrates the roll or floor, and the roll and tail share the same floor reference. The shadow and framing match the revised footprint.
- Target **at most 3 draw calls and 2,930 triangles including the shadow**, with estimated material texture memory no higher than the current sample's recorded **961,195 bytes**. Measure the final result; do not increase budgets to pass.
- Target full/small textile posters at or below 12/5 KB. Compare actual poster/live object pixels, aiming for mean RGB difference at most 3/255 and silhouette drift at most 1 CSS px.
- Run `npm test`, `npm run build` and `git diff --check`. Update active model tests to exercise the revised roll; keep still-used comparison fixture coverage. Add focused checks for rim continuity, texture wrap and removed active parts.
- Check desktop chapter → dock → reverse, phone freeze/return, reload, Back, reduced motion, Save-Data, unavailable WebGL and context loss. Confirm the correct links, one gallery canvas, no overflow or page exceptions, and unchanged wheat/unrelated poster hashes.
- Report physical-device and Safari evidence only if actually observed. Fresh implementation results are recorded in the receipt.

## Files expected to change during implementation

Geometry and finish: `src/three/textileGeometry.ts`, `src/three/TextileSample.tsx`, the textile geometry tests and authoring capture entry. Local integration will also touch the textile registry entry, shared category presentation/poster handling, relevant fallback styles and the two textile poster assets. Shared changes require the wheat regression check.

**Approved direction:** current colours, roll with its short tail retained, a smoother natural fabric fall, aligned continuous selvedge, subtle herringbone detail, smooth rounded rim and no paper tag. Implemented through the local preview; publication remains separate.
