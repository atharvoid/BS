# Website motion repair

Approved scope: repair homepage scrolling and animation orchestration, including phone layouts. Preserve the approved objects, materials, colours and existing content. Local implementation and preview; no publication.

## Interaction contract

- Desktop: each chapter enters once along its authored path, remains aligned with its text, then settles into its own bottom shelf slot. Forward, reverse and fast scrolling derive the same pose from the current scroll position. No stray objects over the hero or footer.
- Featured objects may turn while their chapter is active. Docked objects stay still; only the shelf item under the pointer or keyboard focus rotates. Leaving it freezes its current angle without snapping. Passing over an empty slot does nothing.
- Phone and tablet: retain the native product-card layout and normal touch scrolling. Models stay inside their card artwork areas, hand over from posters only after drawing, and remain stable when returning, resizing or changing orientation. Touch does not depend on hover.
- Intro, text reveals, globe drag, section links, navigation and Back must remain usable when animations are interrupted. Reduced motion, data saving, hidden tabs and WebGL failure retain readable content and working links.
- Keep one shared product canvas. Stop unattended rotation, avoid resizing its GPU surface on every scroll frame, and preserve the existing quality and lazy-loading boundaries.

## Ordered implementation

1. Capture the current source/poster identities and reproduce failures against the actual page. Measure DOM anchors against rendered model centres while scrolling.
2. Add regressions for observed failures. Repair scroll boundaries, canvas positioning and frame readiness at their source.
3. Add shelf hover/focus ownership. Keep every other docked object at its last displayed pose.
4. Verify phone card alignment and readiness through full forward/reverse traversal, breakpoint changes and route return. Repair lifecycle gaps found in those flows.
5. Exercise intro interruption/replay, globe drag, in-page and route navigation, preferences and failure fallbacks. Run `npm test`, `npm run build`, and browser regressions on the final build.
6. Provide the local preview, motion evidence and a receipt stating exactly what was inspected. Browser emulation does not qualify physical phones or Safari.

## Acceptance evidence

- Continuous rendered-position sampling through all six desktop chapters, forward and reverse, plus large scroll jumps.
- Per-object angle samples before/during/after shelf hover and keyboard focus: exactly one docked object advances.
- Desktop and phone captures, no overflow or misplaced canvas after scrolling below products, resizing, route changes or Back.
- Phone product cards at 390 × 844 and 320 × 568; tablet and short landscape; reduced motion and unavailable WebGL.
- Fresh canonical checks and unchanged approved model/material/poster assets.

## Investigation log

- Baseline source and poster hashes plus the dirty tracked diff are preserved in `.poster-build/motion-audit/before/`.
- Source confirms that every visible product currently advances its phase, including all six docked objects. There is no shelf hover/focus ownership.
- Browser sampling reproduced the canvas/camera timing mismatch and historical-position snapshot redraws. The renderer now uses a stable surface and reads current anchors at the actual draw boundary.
- Reproduced and repaired Back replaying the intro, route changes retaining the previous scroll offset, and native fragment scrolling competing with the app's fragment handler. Section links now have one scroll owner.
- Retained the complete six-model set on phones; scrolling no longer changes the shader preparation key or hides the entire gallery between rows.
- Reproduced and repaired the open phone menu retaining its scroll lock after crossing into desktop layout.
- Verified the static reduced-motion view and Save Data loading boundary. Explicit shelf hover also works in a forced adaptive-still fixture at the cheaper draw cadence.
- Canonical checks, the built-site desktop/phone matrix, actual touch gestures and continuous draw-position sampling passed. See [the implementation receipt](MOTION_REPAIR_RECEIPT.md) for evidence and limits.
