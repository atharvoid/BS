# Globe picking and supplied logo startup

## Local implementation update — 6 November 2026

The trade homepage, category explorer and general enquiry flow are implemented. The textile route owns the regional material and four-object sequence. The cursor uses filled Explore states for menu targets and a transparent Drag ring for actual scene hits. Shared scene controls expose turn, tilt, pause/play and reset. Mobile mounts one active textile sequence canvas, and hidden/offscreen scenes suspend drawing. Reduced motion uses demand rendering.

The existing plan modification was present before this implementation pass. GitHub, remote repositories and deployment were untouched. All source changes remain local.

Local verification observed the following.

- Production build passes TypeScript and Vite bundling. The existing large Three.js chunk warning remains.
- Both Node regression tests pass, covering analytic globe picking and cursor proximity hysteresis.
- Product journey checks pass for category switching, retained draft, Back, valid/invalid links, unconfigured sending, legacy/corrupt receipts, malformed responses, pending lock and intercepted successful submission. No real provider submission was sent.
- Cursor browser check passes for filled Explore, native inputs, transparent Drag, capture state, removal and reduced motion. A separate real mouse sequence over the actual globe produced scene cursor mode and left Play animation available after dragging.
- Logo checks pass for draw timing, replay, interruptions, modified clicks, hash entry, SPA cleanup, Back and mobile width.
- The integrated globe hover check produced one hit for all 24 events, zero decorative raycasts, a 0.429 ms mean and a 6.3 ms maximum in local Chromium.
- The reduced-motion desktop screenshot shows the complete right-cropped globe. The textile route had zero horizontal overflow at 390px.

Physical touch devices, Safari, screen readers, sustained hardware/GPU profiling and real inbox delivery remain unverified. Cursor sizes and rotation speeds use the agreed initial settings and remain available for visual tuning. Context-loss and focus-recovery coverage remains a manual follow-up.

The earlier baseline record follows.

Verified locally on 6 November 2026 in BS-2. Baseline: clean `main` at `83d4749`.

## Changes implemented

- Globe picking uses one analytic sphere intersection and stops recursion into decorative geometry. The rendered Earth, coastlines, routes and shaders are unchanged.
- The supplied logo's inline outlines, draw/fill timing and movement into the header are adapted to React. Homepage lifecycle owns cancellation and cleanup. Only scoped logo styles were added.
- The broader trade-led homepage, category explorer, general enquiry and textile migration are proposed in `IMPLEMENTATION_PLAN.md`; those page changes are not implemented in this slice.

## Root cause and measured result

The globe's pointer handlers were on a parent group. React Three Fiber called recursive intersection testing for the whole group. The two geography line meshes contain 46,568 segments, and the Earth mesh contains 81,408 triangles. One actual pointer event produced 30,138 intersections. Picking took 114.5 ms; the complete handler took 1,380.1 ms on the main thread.

The first post-fix 24-event run averaged 0.454 ms, with a 3 ms maximum. The final repeat, after integrating the startup, averaged 0.529 ms with a 4.8 ms maximum. Every event produced one intersection; decorative raycast calls were zero. These are local Chromium handler timings, not FPS or physical-device measurements.

Mechanism references: [React Three Fiber events](https://r3f.docs.pmnd.rs/api/events) and [Three.js raycasting](https://threejs.org/docs/pages/Raycaster). The installed Three.js implementation explicitly stops child traversal when an object's raycast returns false.

## Completed checks

| Check | Observed result |
| --- | --- |
| Fresh baseline `npm run build` | Passed |
| Regression before fix | Failed because decorative geometry was visited |
| Final `npm test` | 1 passed, 0 failed; transformed hit, miss, near/far clipping and no decorative traversal |
| Final `npm run build` | Passed TypeScript and production build |
| `scripts/globe-hover.check.cjs`, development site | Passed: 24 events, one hit each, zero decorative calls, maximum below 100 ms |
| `scripts/logo-intro.check.cjs`, production preview at port 4175 | Passed: draw timing, replay, Escape/Tab, skip and focus recovery, wheel/touch interruption, modified clicks, direct hash, SPA cleanup and Back, reduced motion, resize, mobile width |
| Rendered inspection | Startup composition, finished desktop header and 390px mobile header inspected; mobile width did not overflow |
| Early mouse drag smoke check | No application exception observed; recorded development-server WebSocket errors were unrelated HMR connection errors |

The original short-lived-animation checks could miss a replay between Playwright calls. The final check inspects starting and interrupted states in a single browser task and separately waits for automatic dismissal. It also waits for the router's rendered transition before asserting unmount cleanup. A later extended mouse journey exceeded the diagnostic tool's timeout and supplies no additional evidence.

Visual captures and the baseline hover JSON are saved outside the repository at `C:\Users\Atharva Patil\Documents\project\BS-2-evidence\2026-11-06`. The automated commands above are repeatable from the repository; Playwright is supplied by the existing local runtime through `PLAYWRIGHT_MODULE`.

## Remaining boundaries

- Existing build warning: the Three.js chunk is approximately 919 KB before gzip. It appeared in the baseline too.
- This work does not establish sustained GPU performance, physical touch-device behavior, Safari, screen-reader qualification or real enquiry delivery.
- The new category/enquiry and textile-page behavior is still proposed work. No real enquiry was sent and nothing was deployed.
