# Website motion repair receipt

Implemented and verified locally on 16–17 November 2026. This receipt covers local verification before the owner's subsequent GitHub publication request; no public deployment was qualified.

## Result

The six desktop objects follow their current scroll anchors into their own shelf slots. Docked objects hold their last angle. Hover or keyboard focus turns one selected docked object, including when automatic motion has degraded to the still tier. Leaving it stops rotation without rewinding.

The phone retains its normal card layout and touch scrolling. All six product models remain mounted in one shared canvas, while only visible artwork is drawn. Scrolling between rows no longer changes the compilation key or makes the whole gallery return to posters.

| Reproduced failure | Repair |
| --- | --- |
| Objects drawn at an earlier scroll position while a cropped canvas changed size and camera framing | Stable, pixel-budgeted surface; synchronise the camera and current DOM anchors at the draw boundary |
| Snapshot readback restored an old outer transform and painted it into the visible canvas | Capture after a real draw; suspension draws synchronise every current pose before rendering |
| All docked objects continued rotating | One hover/focus owner; unattended docked objects pause; the idle shelf stops requesting continuous frames |
| Four models advanced on skipped renderer ticks while wheat/textile used presented frames | All product rotation advances through the actual draw callback |
| New routes could retain a long page's scroll offset, and Back replayed the opening | Instant route positioning before paint, explicit history restoration ownership, and no intro replay on Back |
| Section links could update the fragment without reaching the section | Route section links through the existing app scroll handler; keyboard content skip explicitly moves focus |
| Open phone menu kept the page inert and scroll-locked after entering desktop layout | Close the drawer at the layout boundary and return focus to desktop navigation |
| Reduced-motion desktop still downloaded and mounted the product renderer | Use the existing renderer-free motion/data-saving boundary for desktop products too |

## Observed verification

- `npm test`: **88 passed**, plus the Stage boundary guard.
- `npm run build`: passed. The existing approximately 923 kB Three.js chunk warning remains visible.
- `git diff --check`: passed.
- `scripts/motion-journey.check.mjs`, built preview: **10 journeys passed**, with no application runtime errors. Covers six chapters, all six hover owners, keyboard ownership, reverse/fast scrolling, idle holds, hidden-tab pixels and phase, routes/Back, directory skip, exit below products, reduced motion, Save Data and unavailable WebGL.
- Phone/tablet browser viewports: **390 × 844, 320 × 568, 844 × 390 and 768 × 1024**, at 2× DPR. Forward/reverse card visits, drawer, routes, Back and crossing the desktop breakpoint passed. No readiness resets were observed in the tested card visits. One product canvas remained mounted.
- Dev draw diagnostic: **388 actual draws** sampled against current DOM letterboxes, all within the 2 CSS px tolerance; the recorded maximum numerical discrepancy was below 0.01 CSS px. The forced adaptive-still hover fixture also passed.
- `scripts/scene-motion.check.mjs`: passed actual desktop pointer drag, horizontal touch rotation after the phone globe settled, native vertical touch scrolling, home/product navigation, textile enquiry navigation, keyboard content skip and privacy section links.
- Final smoke check: normal opening completion and replay, direct directory entry, fragment reload and live WebGL context loss all passed; context loss recovered to the usable six-link directory without runtime errors.
- Both preview recordings loaded, played and sought to later decoded frames successfully. The review server supports video byte ranges; the original recordings are retained.
- All **23 poster hashes** match the pre-repair baseline. Approved object geometry, materials, textures, colours and category registry are unchanged by this repair.

## Evidence and preview

- Live local build: <http://127.0.0.1:4383/#products>
- Desktop and phone replay: <http://127.0.0.1:4390/>
- Built-site matrix, captures and recordings: `output/motion-review/`.
- Globe/touch and section-link results: `output/motion-review/scenes/scene-results.json`.
- Opening/context-loss and replay checks: `output/motion-review/final-smoke.json` and `preview-playback.json`.
- Draw samples and adaptive-still result: `.poster-build/motion-audit/final-deep/`.
- Before-state source/poster identities and tracked patch: `.poster-build/motion-audit/before/`.
- Final source/build identities: `.poster-build/motion-audit/final-source-hashes.json` and `final-build-hashes.json`.

To rerun the browser matrix, point `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` at the installed local Playwright module and Chromium binary, then run:

```powershell
node scripts/motion-journey.check.mjs
node scripts/scene-motion.check.mjs
```

For actual draw sampling, use the dev server with `SITE_URL=http://127.0.0.1:4384`, `DEEP_SCROLL=1` and `MOTION_FLOW=desktop`. This diagnostic imports that server's own Fiber root registry; it does not add a renderer dependency to the public page entry.

## Limits

Browser evidence uses Chromium with SwiftShader and emulated viewport/touch settings. It establishes the tested interaction and position behaviour, not physical-device frame rates. Physical phones, Safari, native pinch/zoom and screen-reader operation remain unverified. There is no public deployment from this task.

The stable desktop backing surface replaces the previous changing crop. It stays within the existing 3-million-pixel allocation ceiling; the shelf stops continuous rendering when idle. This trades changing allocation/sharpness for stable positioning and avoids scroll-time GPU surface reallocations.
