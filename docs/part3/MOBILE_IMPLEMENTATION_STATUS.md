# Mobile implementation receipt

8 November 2026. Implemented locally on `arena/e210227c-bs`, against baseline
`3b6ea3189d70b36705bacb8cf48ce3acc9d0ae23`. Local verification preceded Git
publication. No production deployment was performed as part of this implementation.
The recovery stash was preserved; the existing Vite deployment configuration
accompanies the source. The [accepted plan](MOBILE_REDESIGN_PLAN.md) remains the planning record.

## What changed

The phone has its own normal-flow product grid. All six real models, category
names, full chapter descriptions and existing destinations remain. At 320px it
uses one column, at ordinary phone widths two, and at wider compact widths three.
The nine-screen runway and fixed product dock belong only to desktop now.

The home globe has a reserved phone area and an India-facing model still while
its live assets prepare. The textile cloth occupies its own area below the copy.
Fabric Types, the five swatch labels, Tamil Nadu and Gujarat text/illustrations
are retained. Flat swatches now load as prebuilt 840px images.

Phone 3D gets one automatic 4.5-second window per section/document, then renders
on demand. Phone product motion stays within a readable three-quarter range,
so flat fabric never settles edge-on. Globe and cloth dragging remain available. Only the most visible
eligible phone surface draws continuously; the active surface has a 1.5-million
pixel budget and DPR ceiling of 2. Offscreen/hidden surfaces sleep, and distant
phone stages release their context. A context-lost hero retries once, then keeps
its poster if it fails again. Other load/render failures retain their stills.
Reduced-motion and Save-Data preferences avoid initiating the phone renderer.

Actual rendered frames drive quality measurement. The medium tier draws at 30Hz
and its intervals are normalized so intentional 30Hz rendering does not trigger
another downgrade. Measured quality applies to both hero and gallery. Desktop's
composition and product tour remain; its original motion policy is unchanged.

The phone logo drawing occupies the header for about three seconds while page
content and actions remain usable. Main controls are at least 48px; inputs use
16px text. The menu focus loop includes its close button. The category listbox
uses available viewport space and closes when that space changes. History restores
scroll positions and the existing in-memory enquiry draft survives internal routes.
When online delivery is unconfigured, validation prepares a selectable email
brief with an email-app link; it never creates an acceptance receipt.

## Issue coverage

| Plan IDs | Local implementation and evidence |
| --- | --- |
| M01–M05 | Phone grid replaces the runway/dock; readable, persistent text and native links; inspected at 320×568, 390×844 and 844×390. |
| M06 | Cloth starts below copy at 360×640, with opacity 1 and no horizontal overflow. |
| M07 | Adaptive resolution replaces forced-high overrides; actual-draw/30Hz regressions pass. Hardware slowdown qualification remains pending. |
| M08, M14 | Visible phone models mount and compile progressively; matching responsive stills carry all cards beforehand. Gallery preparation begins at its viewport, independently of intro completion. |
| M09 | Actual lower/viewport boundaries and document visibility govern drawing. Phone gallery unmounts outside its section. |
| M10 | Reserved, matching model stills precede complete-frame handoff; scene preparation runs independently of the brand sequence. Fresh phone refresh was inspected. |
| M11–M12 | Larger controls, input text and wrapping labels; narrow-phone and validation-focus checks pass in the responsive browser. Native iOS focus/zoom is unverified. |
| M13 | Phone uses CSS flow and a scheduled batch of model-rectangle reads; desktop choreography is not mounted there. |
| M15 | Five same-palette woven images are generated ahead of time; no runtime `SwatchPlane` or renderer dependency for Fabric Types. |
| M16 | Licensed Fraunces subsets preserve every axis value used by the site. Pair reduced from about 271KB to 169KB. Responsive stills added. The proposed 400KB critical-transfer aim is not established as passed; see budgets below. |
| M17 | Phone critical text/actions do not wait for route-wide reveal choreography. |
| M18 | Shared Pointer Events binding waits for horizontal touch intent; direction/cancellation regressions pass. Physical scroll/pinch remains unverified. |
| M19 | Category handoff, draft retention, selector placement and Back behavior inspected. Reload persistence is not added or promised. |
| M20 | Local email preparation works after validation, including long-copy fallback. No real provider submission or email was sent. |
| M21 | One continuous phone owner plus pixel/DPR caps; policy regressions pass. Real GPU/thermal qualification remains pending. |
| M22 | Implemented the accepted finite phone-motion and nonblocking brand policies. No quality or animation-control buttons added. |
| M23 | Installed Three/Fiber/Drei/type versions pinned; globe background-resume regressions pass. Upstream `THREE.Clock` deprecation remains and is not suppressed. A renderer clock migration needs a separately qualified compatible update. |
| M24 | Responsive-browser and mechanical evidence recorded separately. Physical-device and assistive-technology checks are still release gaps. |

## Verification

- `npm test`: **69/69 passed**, plus the 59-file Stage/R3F scope guard.
- `npm run build`: TypeScript and production build passed.
- `git diff --check`: passed.
- New regression coverage: aggregate render allocation, single motion ownership,
  finite motion, readable product angles, horizontal touch intent, deliberate 30Hz sampling and email brief
  encoding/long-copy behavior. Existing geometry, cloth/roll clearance, globe
  pose/replay/resume, drag, quality, resolution and receipt tests remain passing.
- Browser: 320×568, 360×640, 390×844, 844×390 and 1280×900. Checked phone refresh,
  model regions, product destinations, menu Tab/Escape, selector containment,
  invalid-answer focus, local email preparation, Privacy/Back draft retention,
  and desktop hero/product rendering. No browser JavaScript errors observed.
- At 390×844 the full home document measured **3,307px**, including all six full
  category descriptions, versus **10,196px** in the planning audit. This is a
  layout comparison, not a performance score.
- A fresh `/privacy` has no canvas and no Three.js module preload. Production
  asset-authoring code is absent from the normal application build.
- Final phone gallery inspection confirmed live/ready first and last category
  models. At the footer the gallery was unmounted and the document had zero
  canvases; the settled textile-roll angle remained readable.

Screenshots are in
`C:/Users/Atharva Patil/.codex/visualizations/2026/11/08/bs-mobile-implementation/`.
Representative files: `390-home.png`, `390-products.png`, `320-products.png`,
`360-textile.png`, `844-landscape-products.png`, `1280-desktop-home.png` and
`1280-desktop-products.png`. Earlier captures in that folder show intermediate
states; the source/build identity below describes the final local candidate.

Final application entry: `index-CUjyQG0L.js`; stylesheet `index-DBLeOUXL.css`;
renderer `three-BsM4ig7U.js`. Local production preview: http://127.0.0.1:4175/.

## Budgets and remaining qualification

The entry, React and runtime chunks total about **109KB gzip**, with about
**18KB gzip CSS**. The optional Three chunk is still **919KB raw / 243KB gzip**;
the build warning remains visible. The phone globe still is **35KB at 500px**
or **95KB at 1000px**; all six smaller card stills total about **61KB**.

The proposed ≤400KB critical first-view transfer is an aim, not a measured pass.
A conservative sum including the entry, CSS, normally used fonts and small globe
is roughly **450KB before optional 3D**, depending on actual font use and response
compression. A clean production network trace must decide what is truly critical.
The current choice preserves the site's type and crisp model images rather than
quietly changing their quality to report a smaller number.

No field LCP/INP/CLS, physical FPS, Safari, iOS keyboard/zoom, real touch/pinch,
VoiceOver/TalkBack, battery-saver or thermal result is claimed. Use the plan's
physical-device matrix before calling this mobile release qualified. Online
delivery, owner legal/business details and confirmed production identity remain
deferred as requested. No new dependency upgrade or deployment was performed.

## Asset regeneration

- `npm run assets:swatches` uses the existing weave generator and palettes.
- `python scripts/build-fonts.py` requires FontTools and Brotli; font licence is
  shipped in `public/fonts/`. It retains SOFT 10–40, WONK 0–1, weight and optical axes.
- Build the isolated authoring entry with
  `npm run build -- --mode posters --outDir .poster-build`, then preview that
  directory. Capture each model after “Capture ready” over white and black
  mattes using `?motif=globe|cloth|textiles|handicrafts|agriculture|industrial|organic|general&matte=white|black`.
  Use 1000×720 for phone globe, 1280×800 for desktop globe, 1000×800 for cloth
  and 750×600 for products. Name pairs as expected by `scripts/build-posters.mjs`.
  Run `node scripts/build-posters.mjs <capture-directory>` to recover transparency
  and create full/small WebP variants. Rebuild the normal application afterwards.
