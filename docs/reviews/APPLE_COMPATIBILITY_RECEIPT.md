# Apple browser compatibility and footer logo

17 November 2026. Implemented locally on top of the previously published `a0fa403` version.

## Changes

- The capability check now requires a healthy WebGL 2 context, matching the installed Three.js renderer. A WebGL 1-only or already-lost context retains the static product view instead of attempting an incompatible renderer.
- Desktop category positions use the fixed artwork layer's actual width. WebKit can include a scrollbar gutter in its reported layout width; the previous measurement displaced the last shelf object by approximately 10 CSS px in the reproduced fixture. Objects now align with their actual shelf cells.
- The normal loading state no longer inserts/removes an availability notice above the footer. That temporary paragraph caused a reproduced 57 px scroll-anchor shift when WebKit returned through Back. The notice now follows stable capability/fallback status, and unavailable graphics use that status from the first render.
- The bottom text-built wordmark is replaced by the existing shared BS EXIMNEXUS SVG logo. It retains the header's gold colour, the original `113:83` proportions, unique inline mask IDs and responsive 140–224 px width. No new image asset or production dependency was added.

## Verification

- `npm test`: **91 passed**, including three new capability regressions, plus the Stage boundary guard.
- `npm run build`: passed; the existing approximately 923 kB Three.js chunk warning remains.
- `git diff --check`: passed.
- `scripts/apple-compat.check.mjs`: **8 viewport journeys passed** in WebKit 27.2 and Chromium 153.0.8010.12, with no application runtime errors recorded.
- The same four viewport journeys passed in the installed Google Chrome browser, version 157.0.8103.79.
- Viewports: **1440 × 900**, **390 × 844**, **768 × 1024**, and **1024 × 768**, using the declared desktop/phone/tablet scale and touch settings.
- Checks cover completed introduction, actual product rotation, background phase hold, card traversal or scroll chapters, shelf hover ownership/alignment, menu lock and viewport-height changes, Back restoration, reduced motion, footer colour/proportions, unique SVG mask IDs and horizontal overflow.
- WebGL 2-unavailable fixtures passed in WebKit and Chromium: visible category directory, six enquiry/category links, no live canvas and no Three.js bundle download.
- Eight additional scene checks passed for the globe and dedicated textile hero in WebKit and installed Chrome, at desktop and phone widths: real canvas readiness and changing rendered pixels were observed without runtime errors.

The approved object geometry, textures, posters and category palette remain unchanged.

## Evidence and preview

- Updated site: <http://127.0.0.1:4383/>
- Footer comparison: <http://127.0.0.1:4391/>
- Cross-engine results and captures: `output/apple-compatibility-20261117/engine-results.json` and the adjacent footer images.
- Installed Chrome results: `output/apple-compatibility-20261117/chrome-stable/engine-results.json`.
- Capability fallback results: `output/apple-compatibility-20261117/fallback-results.json`.
- Globe and dedicated textile scene results: `output/apple-compatibility-20261117/scene-results.json`.
- Baseline, failing regressions, scrollbar measurements and local build/test logs: `.poster-build/apple-compat-20261117/`.

To rerun, set `PLAYWRIGHT_MODULE` to an available Playwright module and `BROWSER_EXECUTABLE` to the desired Chromium/Chrome binary, then run `node scripts/apple-compat.check.mjs` against the built preview. `ENGINE=webkit` or `ENGINE=chromium` selects one engine; `VIEWPORT` selects one named fixture.

## Evidence boundary

These are browser-engine checks on Windows, with touch/viewport emulation and a software renderer for Chromium/Chrome. They do not establish physical iPhone/iPad/Mac performance, branded Safari behaviour, native iOS toolbar/keyboard/pinch gestures or thermal/battery behaviour. Playwright does not expose wheel/swipe input for mobile WebKit; its menu lock was checked with keyboard input and viewport resizing rather than a native finger swipe.

Safari remains the intended primary Apple browser. The fallback is based on actual graphics capability, rather than user-agent detection or an automatic browser redirect. Chrome is covered by the separate installed-browser run; changing browsers is not treated as a guaranteed GPU/OS workaround.

Primary references: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer), [Playwright browser/operating-system notes](https://playwright.dev/docs/browsers). Real Apple-device qualification remains open.
