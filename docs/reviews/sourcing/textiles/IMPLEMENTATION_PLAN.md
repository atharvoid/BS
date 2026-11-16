# Indigo fabric roll and kraft sample tag — implementation plan

Historical concept plan. The owner’s final approved direction removes the tag and retains a smoother tail: [approved revision plan](REVISION_PLAN.md), [implementation receipt](refined/IMPLEMENTATION_RECEIPT.md).

16 November 2026. Textile category only; preserve the golden wheat and the current owner workspace.

## Direction

One horizontal roll of fabric with a short draped tail and a small kraft-paper sample tag beside it. The cut end shows wound layers and a real core opening. A narrow ecru selvedge and filtered weave make the cloth legible at phone size. The tag has one clipped corner, a small hole and a quiet “FABRIC SAMPLE” stamp. Use the existing studio, camera, `Exhibit`, measured framing, contact shadow and 0.18 rad/s rotation.

The finished palette is washed indigo `#34495F`, reverse blue-grey `#526476`, ecru `#D5C8A9` and quiet kraft brown `#B99666`. Preserve the site's typography and category copy. The additional detail belongs to the specimen; no new controls, badges or claims belong on the production card.

## Sequence and decision

1. **Selected roll shape — built.** Reuse the existing clearance-constrained roll-tail path. Give the tail a closed thin edge, a hollow core and wound cut ends. Verify exterior cut-face normals and every projected tail triangle against the roll radius. The S-pleat study was rejected; it is retained only as review history.
2. **Realism study — built for review.** The owner requested more realistic detail, paper beside the roll, visualization and a simple plan. Show the finished indigo-and-kraft concept at the 549 px chapter height, in a 240 × 160 dock cell and at a 168.61 × 134.88 phone stage, plus four views and a full turn. Compare with the existing wheat, pottery and copper under identical lighting. This is an authoring study, not production registration.
3. **Finish.** Use linear vertex colours for the face, reverse and narrow selvedge; matte roughness 0.93, zero metalness. Reuse the existing 256 px filtered weave with a smaller 128 px bump map. One 256 × 128 atlas carries the wound-end detail and paper stamp, keeping texture memory below the starting envelope. No cord, extra accessories or postprocessing. Inspect close-up and side views for shimmer.
4. **Local integration.** Replace only the textiles model, preserve `/textiles` and its dedicated page, extend the existing presented-frame continuity to a separate textile asset/state key, add a height-fitted desktop loading poster and directory fallback, and generate only the two textile production posters. Version both responsive URLs together.
5. **Verification and preview.** Run `npm test`, `npm run build`, `git diff --check`, and focused desktop/phone browser checks. Cover first paint, forward/reverse docking, freeze, offscreen return, reload, Back, static fallbacks and context loss. Confirm six links, one gallery canvas, no overflow or page exceptions, no authoring assets requested in production, and unchanged wheat/other poster hashes. Supply a separate textile preview and receipt.

## Budgets and evidence

The actual finished study measures **3 draw calls, 2,774 triangles and 961,195 estimated material texture bytes**, including the shared shadow. The starting textile measures 4 calls, 2,930 triangles and 1,048,576 bytes in three isolated runs. The detail uses two model meshes and one shadow; the paper and cut ends share an atlas/material.

For production, target full/small posters at or below 12/5 KB. Compare actual poster/live specimen pixels, with a target mean RGB difference of at most 3/255 and silhouette drift at most 1 CSS px. Repeat the three isolated runs on the integrated candidate. Production registration, matching posters and pose-continuity changes remain pending review of this revised concept.

Browser viewport evidence is distinct from physical-device evidence. Record Android, iPhone/Safari and deployment only if observed. Publication needs a separate instruction.
