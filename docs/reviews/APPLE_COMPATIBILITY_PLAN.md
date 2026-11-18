# Apple browser compatibility and footer logo

Scope: retain the approved objects and motion orchestration; improve compatibility for Safari on iPhone, iPad and Mac, with Chromium coverage; replace the footer's text-built wordmark with the existing BS EXIMNEXUS SVG logo. No new renderer, animation library or browser redirect.

## Plan

1. Run a baseline in actual WebKit and Chromium engines at phone, tablet and desktop viewports. Check intro completion, WebGL readiness, scrolling, route return, resize, reduced motion, context failure and footer rendering.
2. Repair demonstrated compatibility gaps at their shared source. Check the WebGL capability probe against the installed renderer's requirements, viewport/safe-area handling and animation suspension/resume. Keep content and links available if 3D cannot run.
3. Render the shared gold `Logo` component in the footer wordmark area, with responsive sizing and its original proportions. Preserve contact links and copyright.
4. Run the existing tests/build and motion regressions, capture the footer at desktop/phone sizes, and record engine results separately from real-device qualification.

## Acceptance

- Supported WebGL 2 devices can prepare and display the existing scenes; unsupported/lost contexts retain usable stills and links.
- Safari-engine and Chromium checks can complete the opening, reach product areas, traverse cards/chapters and return through navigation without stranded text or misplaced objects.
- Menus fit changing viewport heights, release page locks and respect safe areas. Native scroll/pinch gestures remain available over scene surfaces.
- The bottom brand is the same vector BS EXIMNEXUS logo as the header, in gold, without distortion, duplicate SVG mask IDs or horizontal overflow.
- Reduced-motion preferences continue to take precedence. No automatic attempt to open a different browser.

## Verification boundary

The host is Windows. Playwright WebKit is a patched WebKit build, not branded Safari or an Apple GPU/OS. Real iPhone, iPad, Mac/Safari, native toolbar behaviour and sustained device frame rates require separate physical-device verification.

Primary references: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer) requires WebGL 2; [Playwright browser documentation](https://playwright.dev/docs/browsers) describes the WebKit/Safari and operating-system differences.

## Completed work

Implemented healthy WebGL 2 detection, fixed-surface width measurement, a stable availability notice during navigation, and the shared gold footer logo. The WebKit/Chromium matrix and installed Chrome checks passed; see [the receipt](APPLE_COMPATIBILITY_RECEIPT.md) for evidence and remaining device checks.
