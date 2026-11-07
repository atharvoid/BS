# Website review and requested changes

## Verdict

**Overall: 7.0 / 10, provisional.** The implementation and design are stronger
than the site's launch readiness. The approved warm editorial direction is
retained, textiles remains the primary line, and the new category journey is
functional. It is not yet a fully verified production B2B acquisition channel:
real enquiry delivery, business identity evidence, deployment SEO and physical
mobile testing remain unresolved. Those cannot honestly be manufactured in code.

| Area | Rating | Reason |
| --- | ---: | --- |
| Design consistency | 8/10 | Existing palette, type, cursor and navigation preserved; new journey follows them. |
| Category UX | 8/10 | Six reversible chapters, retained models, persistent dock and direct skip/directory. Long storytelling remains an optional conversion tradeoff. |
| Content | 7.5/10 | Textile-led, specification-oriented copy; no invented availability, certifications or commercial promises. |
| Accessibility | 7.5/10 | Automated scans clean; focus, motion preference and fallback paths exercised. Manual screen-reader/touch certification is outstanding. |
| Performance | 7/10 | Lazy 3D, async category shader preparation, stable freeze, bounded buffers, offscreen/hidden-tab pause. Real GPU/mobile vitals still required. |
| Trust/credibility | 5.5/10 | Honest developing-business copy, but verified legal identity, contact details and evidence need owner input. |
| SEO/launch operations | 5.5/10 | Route metadata improved; client-only rendering, delivery setup and production server configuration are not verified. |

This is a scoped source and browser review, not a claim that every possible
browser/device/security issue has been eliminated. Ratings are qualitative,
not a Lighthouse score or measured Core Web Vitals.

## 1. Same live/static 3D

- Removed the category-poster/live-render substitution. The six models remain
  mounted in the same shared canvas and retain their orientation when frozen.
- Pausing prevents the model clock from advancing; it does not change materials,
  lighting, geometry or resolution. The homepage globe and category canvas use
  a device/viewport pixel budget independent of performance tier. Viewport
  resize/zoom may still require a different buffer size.
- The globe loads its relief mask, texture and vector data together. Relief and
  outlines are constructed before the first complete scene, rather than added
  visibly after a bare sphere renders.
- The globe stays mounted while offscreen and stops drawing. Returning does not
  rebuild it at a different angle. Navigating away releases the route's scenes.
- Category materials are compiled together before their first reveal, including
  later hidden chapters. A single staged reveal shows the actual renderer;
  there is no alternate placeholder artwork or model swap.
- The drag hint is hidden until the actual globe is ready.

**Physical limitation:** there are no previous GPU pixels in a new document,
and a lost WebGL context cannot preserve its destroyed buffer. A refresh must
load/render again; initial resources are revealed when ready. No “instant
identical pixels on every network/device” claim is made. Where WebGL is absent
or fails, accessible category information is shown instead of pretending a
replacement picture is an identical live render.

## 2. Category scroll journey

Each of six chapters uses the same continuous choreography: left-side model
entry and right-side copy entry → detail fade → title/model focus → shrink and
travel into its own bottom dock. Settled models continue automatic rotation
unless reduced motion or the performance fallback freezes them.

- One canvas, six persistent model instances, no drag controls on product models.
- Reversing scroll reverses the path. No wheel interception or scroll trapping.
- Textiles first, explicitly identified as the primary product line.
- Desktop split composition; stacked phone composition; compact treatment for
  short phone/landscape viewports.
- Six bottom boxes remain on the homepage after the story, with real category
  links. They leave on route change so the textile and enquiry pages are not
  covered. Footer clearance is reserved for the dock and safe-area inset.
- Skip link and ordinary category directory allow direct business navigation.
- Reduced motion bypasses the long runway and freezes real model renders.
  Missing/failed WebGL also bypasses the runway, leaving all six enquiry links.

## 3. Text transitions

One shared route-wide observer introduces text with a short opacity/10px motion
transition. Original typography and text DOM remain intact; there is no
letter-splitting. It covers main-page and footer text plus newly inserted text.
The journey has its own scroll-linked timing. Existing reveal wrappers are
coordinated rather than layered with a second hidden parent animation.

Safety exceptions: cursor, header/menu, intro, dropdown mechanics, live regions,
validation errors and screen-reader-only text are not delayed or concealed.
Keyboard focus exposes pending text immediately; reduced motion shows it without
travel. The textile page's layout, content, imagery and model are unchanged;
only the explicitly requested shared text timing applies there.

## 4. Findings and dispositions

| Issue found | Disposition |
| --- | --- |
| Poster/live substitution could change appearance | Fixed: same retained renderer, no category posters. |
| Performance tier could lower resolution visibly | Fixed for requested homepage objects: stable device/viewport budget; freeze motion instead. Textile policy preserved. |
| Globe relief/outlines arrived after initial sphere | Fixed: shared asset readiness and synchronous completed geometry. |
| Offscreen globe rebuild reset orientation | Fixed: retained homepage scene; offscreen rendering stops. |
| Later model entry could compile shaders visibly | Fixed: async preparation of all six category materials before reveal. |
| Six categories needed ordered storytelling | Implemented with continuous, reversible poses and persistent dock. |
| Long narrative could obstruct buyers who know their requirement | Fixed: skip link plus direct directory and dock links. Monitor conversion after launch. |
| Small/short screens have less space for copy and dock | Added compact layout and short labels; tested at 320, 390 and 1440px. Physical-device ergonomics remain unverified. |
| Offscreen/hidden-tab work | Preserved offscreen pause and hidden-tab stop; models remain allocated only on the current route. |
| Failed 3D could crash the journey or leave a long empty section | Fixed: local error boundary and ordinary directory fallback; no fabricated substitute render. |
| Text reveal coverage inconsistent by page | Fixed with shared observer and accessible exceptions. |
| Focus could remain in old navigation after SPA route change | Fixed: route changes focus the main landmark without scrolling it; main is a valid skip-link focus target. |
| Mobile drawer trapped Tab but left covered content available to assistive navigation | Fixed: main/footer are inert only while the drawer is open, then restored. Visual navigation design is unchanged. |
| Required fields were primarily visual indications | Added required semantics and radio-group labelling; kept custom dropdown unchanged. |
| Validation scrolling ignored reduced-motion preference | Fixed. |
| Unconfigured submission only became clear after completing the form | Fixed: upfront email alternative; no fake acknowledgement. |
| Hanging form request had no explicit timeout | Fixed: abort after 20 seconds, retain draft, allow retry. |
| Reserved CAPTCHA setting posted an empty token and claimed protection | Fixed fail-closed: no fabricated token/protection claim. Online submission remains unavailable if that unimplemented setting is enabled. Real anti-abuse verification requires integration. |
| Acknowledgement/404 shared a generic title | Fixed: distinct titles and descriptions. |
| Private/unknown routes lacked no-index handling | Fixed client metadata; preview/localhost no-index handling included. Server-side headers remain deployment work. |
| Missing route canonical/share URL | Fixed using actual origin or optional verified `VITE_SITE_URL`, without query/hash. |
| No useful content when JavaScript is disabled | Added basic business/email fallback. The full SPA still requires JS. |
| README described obsolete six canvases, swatches and two tests | Updated architecture, testing and launch notes. |
| Verified business identity/address/registration/contact evidence is absent | Owner action: supply verified, publication-approved facts. Not invented. |
| Email uses a general Gmail address | Owner decision: verified domain-based mail can improve trust; retain working contact until configured. |
| Inbox delivery and processor configuration not verified | Launch blocker: configure public access key, test accepted submission and confirm actual inbox receipt. No real enquiry was sent during tests. |
| Server-side SEO, sitemap, HTTP 404 and SPA rewrites not verified | Deployment action: prerender/SSR or static route pages; sitemap for verified domain; real unknown-route 404s. A client-rendered title alone is not full SEO. |
| Compression, HTTPS, cache/security headers and CDN behaviour unknown | Verify on the real host. Do not infer production headers from Vite preview. |
| Runtime 3D remains a large optional download | Three chunk is still about 919 kB uncompressed / 243 kB gzip. No three requests on enquiry/privacy; further mesh/material profiling needs real GPU evidence. |
| Evidence limited to headless Chromium/SwiftShader | Physical Android Chrome and iPhone Safari testing, screen readers, pinch zoom, context loss and field vitals remain required. |
| Copper model remains a stylised coiled object, not validated industrial product geometry | Preserved under the current “keep other design” instruction. Do not use it as product-specification evidence; consider a separately approved rebuild. |

### Further worthwhile changes — not fabricated or silently introduced

1. Confirm real enquiry receipt and server-side anti-abuse before launch.
2. Publish verified legal/business contact details and a domain-based mailbox.
3. Add a real, permission-cleared textile sample/specification brief or verified
   case study when available, without invented stock or testimonials.
4. Validate mobile frame rate/INP/LCP/CLS and thermal behaviour on physical
   devices. Compare long-story conversion with skip/direct-directory use.
5. Configure prerendering, canonical domain, sitemap, HTTP errors, compression,
   cache policy and preview no-index headers on the production host.
6. Consider reworking the industrial coil only as a separately reviewed model
   change; current representative imagery is not catalogue evidence.

## Validation evidence

- `npm test`: **56/56** tests pass; R3F stage scope check passes (52 source files).
- `npm run build`: TypeScript and production build pass. Optional Three chunk
  size warning remains; it is not being concealed.
- `npm audit --omit=dev`: **0 reported runtime dependency vulnerabilities** at
  review time. Not a security certification or audit of the submission service.
- New browser check: `scripts/category-journey.check.mjs` passes desktop 1440px
  and phone 390px forward/reverse/dock tests and renderer retention.
- Repeated frozen globe screenshots and repeated frozen category-canvas
  screenshots were **byte-identical** in reduced-motion tests. This establishes
  repeat frozen-frame stability, not cross-device or refresh-network identity.
- Automated axe WCAG 2 A/AA and 2.1 AA scan: no violations on overview, textiles,
  enquiry, privacy, acknowledgement and missing-page routes at 1440×900 and
  390×844 in the initial review run. Changed enquiry/metadata routes were
  rechecked after fixes and remained clean. No manual screen-reader claim.
- No page errors or horizontal document overflow in those route checks. Also
  checked the compact journey at 320×568; document width remained 320px.
- Missing-WebGL test: 0px runway, all six directory links retained.
- Invalid form: five errors, focus moves to visitor role; valid unconfigured
  form: email instruction, remains on enquiry, no false success.
- Text at the footer becomes visible after scrolling on checked routes.
- Fresh home/SwiftShader first-14s sample: 6 long tasks, **1514 ms total task
  duration**, maximum **731 ms**. These are still long tasks; this is not an
  INP pass or a real-device benchmark. Previous pre-remediation report was
  9891 ms total / 7253 ms maximum, from a different run.
- Intro polling: shown/drawing 147ms → clearing 2696ms → hidden/idle 3176ms,
  approximately **3.03s visible**. Intro implementation itself is unchanged.
- Fresh production requests: enquiry/privacy = 3 scripts, no Three. Textiles
  loads its own 3D; home loads globe/gallery lazily.
- Protected files unchanged: cursor component/CSS, custom dropdown, intro
  component and textile page component. Shared text transitions are intentional.

Measurements are from local production preview, Chromium and software rendering.
Real delivery, production cache/SEO behaviour and physical mobile GPU performance
are not verified. No deployment, GitHub push or real form transmission is implied.

## Subsequent three-pass verification

See `docs/three-pass-review.md` and its recorded evidence. The later review found
and fixed blocked-storage acknowledgement failure and small/short viewport
obstruction. It adds storage-failure and intercepted-delivery regression tests.
The final suite has 61 passing tests. Shorter-than-480px viewports use the direct
category directory rather than clipping chapter actions. The overall rating
remains provisional 7/10: three self-reviews are not independent certification,
and neither actual delivery nor production/device readiness has been verified.
