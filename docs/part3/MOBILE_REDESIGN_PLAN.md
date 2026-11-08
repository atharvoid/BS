# BS EXIMNEXUS: mobile redesign and animation plan

**8 November 2026 · Planning only. No application implementation or deployment in this pass.**

## 1. Decision and scope

Give the phone its own composition, using the existing business content, models and destinations. Keep the buyer's path: understand the business → choose a product area → explore textiles or describe a requirement → enquire. The largest change should be the product section's presentation.

**Recommended direction:** a compact, copy-first home page; a real India-facing globe in its own area; six linked product cards in ordinary page flow, with real 3D inside their image areas; a textile hero with separate copy and cloth areas; and the existing single-page enquiry form with more comfortable controls.

The mobile product grid replaces the pinned tour and fixed six-slot bottom dock. Desktop composition remains the regression baseline. A small screen must not require nine screens of scrolling to reach a complete category directory.

Preserve:

- BS identity, logo, current palette, material character and established type families.
- All six category identities, representative models and order. Textiles stays first and remains the primary line; the business remains broader than textiles.
- `/textiles`, `/enquiry?category=…`, `/privacy`, acknowledgement semantics and existing Back/deep-link behaviour.
- The existing buyer/supplier choices, fields, validation rules, provider boundary and in-memory draft model.
- Fabric Types, the five swatches, Tamil Nadu and Gujarat content and illustrations. Retain their existing components; adjust a surrounding mobile container only where a demonstrated layout defect requires it.
- The approximately three-second BS brand animation, refresh/logo replay intention, and absence of a Skip introduction button. A proposed nonblocking mobile presentation is explained below.
- Automatic performance adaptation. No quality selector or row of 3D control buttons.

Owner facts, legal identity, registrations, delivery credentials and commercial promises stay deferred. This plan does not depend on inventing those details.

## 2. Evidence and its limits

Inspected the production site at https://bs-eximnexus.vercel.app and the checked-out source on `arena/e210227c-bs`, commit `3b6ea3189d70b36705bacb8cf48ce3acc9d0ae23`. Vercel's latest production deployment was still `dpl_GJELXZQ6rrvAa7GB7ypaFF1SAW2g`. No pull, checkout change or deployment was performed for this audit.

Browser inspection used requested viewports of **390×844, 360×640, 320×568 and 844×390**, covering home, the product section, the directory shortcut, navigation drawer, a category-to-enquiry handoff, the selector and textiles. This desktop browser reserves about ten CSS pixels for its scrollbar; its usable content width is slightly smaller than the requested viewport.

These are responsive-browser observations. They do not establish physical-phone smoothness, touch gesture arbitration, iOS keyboard/zoom behaviour, Safari rendering, thermal performance or screen-reader quality. No FPS, LCP or INP result is claimed from these screenshots. No enquiry was submitted.

Evidence folder: `C:/Users/Atharva Patil/.codex/visualizations/2026/11/08/bs-mobile-plan/`.

| Capture | What it records |
| --- | --- |
| `390-home.png` | Copy, actions and a live globe already stack without horizontal overflow in this state. |
| `390-menu.png` | Existing mobile menu, business identity and contact path. |
| `390-product-mid-scroll.png` | Model intersects the chapter label; the description has disappeared. |
| `390-directory.png` | Fixed product dock remains over the ordinary category list. |
| `390-enquiry.png` | Correct category handoff; substantial space before the actual fields. |
| `360-textile.png` | Cloth behind the title and copy; mobile canvas is faded to 55%. |
| `360-materials.png` | Existing two-column swatch layout is usable and worth preserving. |
| `320-home.png`, `320-products.png` | Short-phone composition; very small product metadata and split model/text positions. |
| `844-landscape.png` | Pinned runway disappears but a 108px fixed dock remains in a 390px-high view. |

The baseline workspace also contains the previously added `vercel.json`, generated `.prerender/` and a named recovery stash. Review that stash file by file before reusing any of its unfinished work; do not apply it wholesale over this revision.

## 3. First-principles requirements

1. **A trade buyer needs an answer and a next step.** Product names, useful text and enquiry links must exist independently of the renderer.
2. **A finger scrolls the same surface it touches.** Vertical scrolling and pinch zoom must remain available over a model. Rotation cannot own the whole screen.
3. **The phone has one narrow reading column.** Model, heading, description and action need distinct layout areas. Text cannot depend on an animation phase for its visibility.
4. **A product model earns its space by explaining material or category.** Keep the six actual models. Make each recognisable at its displayed size and keep its label beside it in the document.
5. **A slow device still has the same task.** It gets the same categories, links, copy and form, with an automatic change in rendering cost.
6. **Performance has several causes.** Download time, JS execution, procedural texture creation, shader compilation, pixel fill and layout work need separate remedies. A smaller canvas alone does not address all of them.
7. **Continuity matters more than an arbitrary animation count.** No composition jump when a still becomes live, a browser toolbar moves, a device rotates or a tab resumes.

## 4. Issue register and required resolution

`Observed` means reproduced in the browser. `Source` means confirmed in the inspected code but not profiled on a physical phone. Priorities describe implementation order, not a measured business-loss estimate.

| ID | Evidence and cause | Resolution | Acceptance |
| --- | --- | --- | --- |
| M01 · P0 | Source/observed: mobile `.journey__runway` is `900svh`; measured 7,596px at the 844px-high test. | Replace the phone runway with ordinary linked cards. | No artificial scroll runway or pinned reading panel on phone. |
| M02 · P0 | Observed: model intersects the chapter label; short phone splits tiny copy and model across the screen. CSS and `journeyPose` independently position them. | Give the model a bounded image area and let HTML grid/flow position all copy. | Model pixels never overlap heading, description or action, at any angle. |
| M03 · P0 | Source/observed: `detail` fades before `title`; a normal scroll leaves a category name without its explanation/action. | Keep category content visible for as long as its card is on the page. | Stop scrolling at any point: every visible card remains readable and actionable. |
| M04 · P0 | Observed: six fixed dock cells, roughly 63px each, persist over the directory. Labels use 7.68px parent text and 8.8px short text. | Use readable cards; remove the mobile fixed dock and its extra page padding. | No permanent product overlay on content or footer; full category names are legible. |
| M05 · P0 | Observed/source: short landscape removes the runway but leaves a 108px dock, consuming about 28% of a 390px-high view. | Use the same normal-flow product layout in short landscape. | No special landscape navigation obstruction or disappearing product information. |
| M06 · P0 | Observed/source: textile canvas fills the same rectangle as its title and is reduced to opacity `.55`. | Move cloth into a separate flow area below the copy. Restore its authored opacity/light there. | Neither text nor material relies on fading the other out. |
| M07 · P0 | Source: `Gallery` always calls `resolutionFor('high', …)`; `stableVisual` does likewise in `StageCanvas`. | Apply a shared runtime budget to every scene, while retaining a clarity floor. | Inject a measured slowdown: both scenes respond to the selected quality tier. |
| M08 · P0 | Source: all six gallery models/materials are compiled before its first reveal. | Show matching stills immediately; prepare the visible model set first and queue the rest without blocking input. | Names and links work while later models are still loading/compiling. |
| M09 · P0 | Source: fixed gallery visibility follows `data-begun`, which has no lower section boundary. It can remain active after the section. | Observe the actual stage/card visibility and release or sleep offscreen work. | Past products and in a hidden tab, there is no continuous product drawing. |
| M10 · P1 | Source: intro gates scene mounting; the hero has no actual model poster on the current home route. | Decouple brand timing from loading; show a deterministic still, prepare when appropriate and reveal only a complete frame. | Slow refresh has no blank model region or camera jump. |
| M11 · P1 | Observed: menu button is 42px; main enquiry action about 41px; selector options about 40px. These are below the proposed comfort target, not automatically WCAG AA failures. | Use 48px main controls and at least 44px secondary targets with space between them. | Comfortable targets remain distinct at 320px and with larger text. |
| M12 · P1 | Observed/source: inputs are 15.52px; several notes and category labels are much smaller. | Set mobile form/body text to at least 16px and useful secondary text to 14px. Test native focus/zoom on iOS. | User can read and type without compensating for tiny interface text. |
| M13 · P1 | Source: scroll writes anchor styles, then dispatches a gallery measurement event; several layout systems follow the same scroll. | Use CSS layout for phone content; measure model rectangles in one scheduled read batch. | No alternating geometry writes/reads for six moving chapter anchors on phone. |
| M14 · P1 | Source: gallery preparation can start from intro completion without a proximity condition; all six model definitions are shared eagerly. | Load a stage only near its useful viewport; prepare next visible assets progressively. | No gallery compilation at the same instant as the first hero simply because the intro ends. |
| M15 · P1 | Source: flat swatches depend on the Three module and are generated into 420px JPEGs on the visitor's main thread. | Generate the same swatch images at build time, preserving their appearance and labels. | Fabric Types works with image requests alone and no runtime weave generation. |
| M16 · P1 | Source: multiple full variable-font faces are requested, including large Fraunces roman/italic files. | Measure actual usage, subset licensed fonts safely, preserve fallback metrics, and preload only critical faces. | Font transfer fits the agreed critical budget; no heading reflow moves the primary action. |
| M17 · P1 | Source: document-wide text transitions can hide text until observers/intro state reveal it. | Keep critical content and forms visible; use a small number of nonessential section transitions on phone. | Fast scrolling, slow JS and reduced motion never conceal an action or field label. |
| M18 · P1 | Source/risk: existing mesh drag needs physical-device verification against page scroll, pinch and cancellation. | Use the existing Pointer Events path with a movement threshold and direction arbitration; avoid a second touch implementation. | Vertical movement scrolls, horizontal intended rotation works, pinch works, cancellation never leaves capture armed. |
| M19 · P1 | Observed/source: form category handoff works; Provider retains draft in the current app instance. | Preserve these semantics, improve control sizes/keyboard accommodation, verify Back and category changes. | User does not re-enter a requirement after ordinary internal navigation; reload persistence is not falsely promised. |
| M20 · P1 | Observed: online sending is unconfigured, while the submit caption still says Send the enquiry. | Keep that dependency deferred; make the current preparation/email path truthful and practical. | No false success; a buyer understands how to contact the business now. |
| M21 · P1 | Source: DPR is budgeted per canvas; there is no aggregate phone rendering allocation. | Coordinate active scene ownership and bound total active drawing pixels. | The gallery and hero do not both spend the full phone budget continuously. |
| M22 · P1 | Standards/design conflict: previous preference was endless automatic motion without controls. | Review the finite-motion proposal in §8 before implementation. | Do not claim accessibility compliance from automatic performance adaptation alone. |
| M23 · P2 | Source/observed: `THREE.Clock` deprecation warnings. They do not establish a cause for the reproduced layout failures. | Pin compatible versions, add a clock/resume regression and migrate through a supported renderer update when qualified. | No speculative dependency upgrade mixed into the initial layout fix. |
| M24 · P1 | Coverage gap: desktop-responsive checks cannot qualify Safari, touch, keyboard, thermal behaviour or real network loading. | Use the physical-device release matrix in §12. | Each evidence class is recorded independently; absent checks remain pending. |

Code pointers:

- `src/styles/journey.css:42` — nine-screen phone runway; `:54` — dock height; `:56` and `:77` — very small labels; `:113` — short-height special case.
- `src/components/ProductExplorer.tsx:27` — preparation; `:44` — begun state; `:66` — disappearing detail; `:74` — layout event.
- `src/components/category-journey.ts:9` — compact choreography; `:15` — six-way docking; `:25` — detail timing.
- `src/styles/site.css:173` — menu target; `:2143` — input font; `:2849` — faded textile canvas.
- `src/three/Gallery.tsx:187` — compile; `:277` — forced high-resolution calculation; `:329` — six-model gate.
- `src/three/StageCanvas.tsx:95` and `src/three/Stage.tsx:88` — stable rendering policy and intro gate.
- `src/three/TextileHeroScene.tsx:33` — runtime flat-swatch generation.

## 5. Mobile visual system

Keep the current identity: ink `#12100d`, cotton `#f2ebdd`, indigo `#1d2a45`, madder `#9c3a2d`, and restrained brass `#b0864a`. Do not introduce a second mobile palette or a glossy app-card style.

| Element | Proposed phone rule |
| --- | --- |
| Content alignment | One left edge for title, body, actions, section headings and form. Centre the model inside its own image area only. |
| Gutters | 16px on narrow phones; about 20px on normal phones; safe-area values added where needed. |
| Header | Approximately 64px plus safe area; brand left, a labelled 48px menu target right. Keep contact and enquiry links in the drawer. |
| Hero heading | Roughly 36–44px, fluid and allowed to wrap; confirm actual brand fonts at every width. |
| Body and inputs | 16–17px; body line-height about 1.5–1.65. |
| Section headings | Roughly 26–32px. Product card titles 16–18px, with full labels. |
| Secondary copy | About 14px. Small nonessential metadata 12px minimum. These are project targets, not claims of universal WCAG minimum font sizes. |
| Primary actions | 48–52px minimum height. Full width where that improves reach and clarity. |
| Spacing | Reuse a small 8/12/16/24/32/48px rhythm. Section padding generally 40–56px. |
| Surfaces | Existing quiet rules and material ground; little or no new shadow. No pop-up-style category tiles. |
| Height | Natural content height. Reserve explicit image aspect ratios, not full-screen reading stages. |
| Large text | Permit growth; remove fixed text heights and absolute copy positioning. Switch the product grid to one column when labels/body no longer fit. |

Use `svh` for a stable optional stage cap and `dvh` for a menu that must fit the currently visible viewport. A browser-toolbar resize should not recalculate a nine-screen story. Check these units and safe areas on Safari; provide sensible fallbacks.

## 6. Screen-by-screen composition

[Annotated structure wireframes](./mobile-wireframes.svg) accompany this plan. Model areas and layout are schematic; these are not final screen designs or proposed replacement business claims. Copy and card heights expand in the actual layout.

### Home and navigation

Order: header → business heading and short description → primary enquiry action → secondary Products link → globe area → product section → existing process explanation → contact/footer.

The current phone hero already follows much of this order. Refine its spacing and target sizes rather than rebuilding its identity. On a short phone, allow the globe to continue below the first screen. Do not shrink the text to make every hero element fit above the fold.

The globe gets a reserved stage approximately 220–300px high depending on width. On a normal phone it should occupy most of that area's width with breathing room. Keep desktop's large right crop separate from phone framing. Phone text must never sit under the globe. India is the initial pose on a new document or an intentional replay; subsequent animation and drag continue from the displayed pose.

The menu keeps Products, Textiles, Enquire, email and business identity. Use 48px-or-larger rows, an obvious close target and a scrollable drawer when necessary. Preserve the focus trap, covered-content inertness and return focus. Test iOS body-scroll locking and browser Back. Do not carry the desktop custom cursor onto touch input.

### Six products

Three possible compositions were considered:

| Composition | Assessment |
| --- | --- |
| Keep the pinned tour and tune breakpoints | Leaves scroll distance, transient reading windows and fixed overlays as structural costs. |
| Horizontal carousel with one large model | Gives each model space but hides categories, adds swipe discovery and a separate selection interaction. |
| Linked product cards in ordinary flow | Recommended: all six are explicit, existing destinations stay one tap away, and each model has a bounded space. |

At typical 360–430px widths, start with two columns and three rows. At 320px, with large text, or when the actual content needs more space, use one column. In wider landscape/tablet layouts, choose two or three columns from a minimum useful card width. The height of a card grows with its text.

Each card contains the existing model, full category name, useful existing category copy and one native link destination. Textiles is first and can carry the quiet existing primary-focus distinction. No nested interactive controls, no rotation buttons and no tiny action arrows standing in for a readable target. A tap on a category continues to the same route/query as today. Decorative model areas do not capture that tap.

Keep all current category information in shared content data. Do not silently delete meaningful chapter copy to meet an arbitrary card height; use normal wrapping and section growth. Avoid presenting a second duplicate mobile directory after the grid. The grid is the directory and carries the `products`/directory anchor contract, with compatible anchor aliases if needed.

Render the actual six models through one shared gallery canvas, aligned to their card image rectangles. Use measured rectangles in one batch and clip each view to its image area so models cannot spill onto text. Only draw visible cards. Bound the drawing buffer to the useful visible section area rather than the entire height of a long grid. Ordinary HTML links remain usable above that canvas. This uses the current shared-gallery concept; it does not create six WebGL contexts. Prove camera fit and clipping with one real card before committing to the full gallery implementation.

The object can turn gently when its card first appears, and can use a complete still if automatic adaptation requires it. All six stills must be renders of these models with the same lighting, initial angle and fit, with transparent or correctly matched backgrounds. No magnified phone screenshots. No blank boxes while waiting for the other five models.

### Textile page

Order: title/description/action → dedicated cloth area → existing Fabric Types and swatches → existing Tamil Nadu/Gujarat → existing fabric brief → existing enquiry.

Restore full intended material contrast in the dedicated cloth area. The material should remain recognisable throughout its automatic motion: use a bounded presentation turn for the thin cloth panel rather than spending time edge-on as a narrow line. Keep horizontal drag inside its area, vertical page scroll and pinch zoom available. Test front/back materials and all permitted angles.

The textile roll in the product grid is a different model from the textile-page cloth panel. Keep its existing cloth/wooden-roll clearance tests and verify the full turn visually; a geometry pass does not prove a readable mobile camera or texture.

Retain the working two-column swatches, current captions and region illustrations. Generate the flat swatch pixels during build instead of making a phone load Three just to draw five JPEGs. Keep the fabric brief as readable static information. Its examples and enquiry path do not need another continuous animation.

### Enquiry, privacy, acknowledgement and footer

Retain one form and existing fields. Reduce empty space in the enquiry introduction and repeated heading block; keep email easy to find. Keep category selection, role selection, requirement, location, name and email in their current logical order.

Use at least 16px text in editable controls and 48px-or-larger comfortable choices. Keep the custom selector's value/query contract. Prefer improving its existing popup to introducing a separate native/mobile value path; its options need sufficient height, viewport-aware placement and reliable dismissal. If native selection is later chosen, it must still be one value and one validation path.

Reserve room for the software keyboard through actual viewport behaviour. Do not pin a submit bar above the keyboard. Focused fields, errors and the submit action must be reachable without a dock covering them. Preserve input on validation or delivery failure; prevent duplicate submissions through the existing sending state.

The draft currently survives internal navigation through the Provider; it does not survive a full refresh. Preserve that privacy boundary unless persistence is separately approved. Browser Back must return to the same category and a sensible scroll position; a blanket scroll-to-top on every navigation needs review. Route changes should move focus to main content while menu dismissal restores focus appropriately.

Until delivery is configured, the form must clearly offer preparation/email rather than promise an online send. Reuse the existing email contact path. A future prepared-email action can encode a bounded subject/body and expose a selectable plain-text brief if the email URI is too long or unavailable. Never report provider acceptance without the provider's success response. Owner setup and real delivery tests remain deferred.

Privacy stays a readable single column; any contents list belongs in flow on phone. Acknowledgement distinguishes a valid receipt from no receipt. The 404 retains useful navigation. Footer links need real target area and spacing; no persistent product shelf may cover them.

## 7. Loading, clarity and scene ownership

Use one lifecycle for globe, cloth and gallery:

`HTML + exact still → assets preparing → camera/materials ready → complete frame drawn → live → sleeping/static/released as appropriate`.

- Size each stage before its assets load. A still and live model share the same framing rules and deterministic initial pose.
- The still is visible from the first useful paint. No rectangular screenshot, blank gap or indefinite animated spinner.
- Scene imports stay below the page-content boundary. Menus, links, category names and the enquiry route never await a renderer.
- Prewarm only a relevant nearby stage. Intro completion alone must not start every scene.
- Prepare required geography, texture and geometry before revealing the globe. Compile visible materials before handoff; queue later card materials progressively.
- Keep an image if initialization is delayed or fails. A bounded visible-stage retry may follow a genuine reconnect/context restoration. Do not reload the page or run an endless retry loop.
- Use matched camera fit and a transparent still at about 2× its actual display size where the transfer budget allows. Include responsive sources; do not download a desktop-sized screenshot for a small card.
- At most one continuously drawing 3D surface on phone. During a handoff, two contexts may exist briefly, but they share a single allocation and the offscreen one stops drawing. Release distant contexts/resources after a short grace period.
- Remove the current fixed full-viewport product canvas from the phone presentation. Render only visible image areas; scissor/viewport work must agree with the camera and clipping.
- Keep material detail until there is measured evidence it costs too much. Reduce redundant routes/particles, shadow cost and unnecessary samples before making a model visibly soft.
- Avoid a general renderer rewrite, new 3D framework or new animation library. Reuse current models, Three/Fiber, observer helpers and typed content.

## 8. Motion and adaptive performance

### Motion policy to resolve explicitly

Earlier instructions asked for continuous automatic motion without animation controls. Accessibility guidance requires a pause/stop/hide mechanism for qualifying automatic motion lasting more than five seconds alongside other content. Performance-based pausing is not a substitute for that user mechanism. [WCAG Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

**Recommended phone presentation:** real 3D performs a short, calm entrance/material turn, settles within five seconds, and renders on demand afterward. User-initiated globe/cloth rotation remains available and responsive. Do not restart the automatic sequence endlessly as the same card flickers in/out of view. This preserves live 3D and removes a need for a row of control buttons, but it deliberately changes the earlier endless-autoplay preference and needs agreement as part of accepting this plan.

Judge the complete moving section, including any stagger between models; six consecutive automatic introductions must not become one prolonged sequence. Confirm the final timing and user mechanism in the accessibility review rather than assuming that naming each object a separate animation establishes conformance.

If indefinite autoplay is retained, design an accessible motion pause mechanism, potentially within existing navigation settings. That would also amend the earlier no-controls preference. Do not silently choose either policy during implementation or claim full accessibility while the conflict remains unresolved.

The approximately three-second BS logo motion can remain on refresh/logo replay. Recommended mobile treatment: run it in/around the reserved header brand area while content becomes usable, preserving its duration without a three-second opaque waiting screen. Preserve immediate interruption by intentional input, reduced-motion behaviour and no Skip button. A full-screen three-second curtain and a useful-view target below 2.5 seconds are competing requirements; measure perceived readiness rather than hiding that tradeoff in a metric.

### Runtime behaviour

| Condition | Automatic behaviour |
| --- | --- |
| Capable phone, relevant visible stage | Sharp real 3D, responsive input, chosen motion policy. |
| Sustained rendering misses | Reduce inexpensive visual work, then render cadence/resolution gradually within clarity limits. |
| Deliberate 30fps mode | Judge against its 30fps target; do not compare to the current 33fps/50fps slow/fast constants. |
| Persistent poor performance | Hold a complete still or on-demand frame. Keep all content and destinations available. |
| Reduced motion | No automatic spins, cloth oscillation, intro curtain or scroll-linked movement. Keep usable stills and text. |
| Save-Data where supported | Avoid eager optional 3D downloads; prioritise the complete still/content path. No assumption that every browser exposes this signal. |
| Hidden tab, offscreen stage, open menu or typing | Suspend nonessential drawing; resume from the last stable pose without accumulated-time jumps. |
| No WebGL, failed import/asset, lost context | Matching still, functional links and a bounded recovery path. No empty slot or broken drag promise. |

Use rendered-frame intervals as feedback and inspect supported PerformanceObserver entry types for additional main-thread signals. Browser hints such as memory/cores/connection are starting hints only. Screen width and device brand are not performance scores. There is no reliable universal browser API that tells us the phone's thermal state or certifies GPU smoothness.

The sampler must ignore invisible/no-render periods, distinguish initialization from steady state, and still record startup/input stalls as user-experience problems. A target of 30 rendered frames needs an actual 30Hz drawing policy; changing animation speed alone does not reduce GPU work. Use elapsed time for animation phase so a different rendering cadence does not slow the story or compound drag drift. Keep cancellation/resume tests.

Use conservative, measured thresholds with hysteresis. The existing two-bad-window/six-good-window idea is useful, but requalify it against each intended target. A static scene cannot earn an upgrade merely from fast idle RAF callbacks; any recovery probe must be bounded, visible-stage-only and based on real draws.

Initial engineering budgets to validate, not claimed results:

| Budget | Proposal |
| --- | --- |
| Critical first-view compressed transfer | Aim at ≤400KB before optional 3D; verify in a clean network trace. |
| Rendering pixels | Start near ≤1.5 million active drawing pixels across phone scenes, DPR generally ≤2; calibrate with physical devices and image clarity. |
| Cadence | Stable 30fps is an acceptable conservative animated tier; use 60fps where input and hardware sustain it. |
| Primary interaction feedback | Visible response in about 100ms, with no shader compilation attached to a menu tap. |
| Core Web Vitals | Field 75th percentile: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. Lab tests are qualification evidence, not a field pass. [Threshold reference](https://web.dev/articles/vitals). |
| Recovery | At most one automatic retry for a relevant failure event; no retry storm or repeated large downloads. |

Do not lower image quality merely to hit a chosen number. If the critical or texture budget cannot meet quality and speed together, show measured alternatives before changing the target.

## 9. Touch, accessibility and browser contract

- Use one Pointer Events implementation. Avoid adding a second touch-listener path over existing handlers.
- Initially allow the browser to determine vertical scrolling; only intentional horizontal rotation within a globe/cloth image area claims a drag. Handle pointer cancel, lost capture, second finger, backgrounding, route exit and re-entry.
- Keep pinch zoom and browser navigation gestures. Do not globally use `touch-action:none`, cancel all `touchmove`, or disable page zoom.
- Product models are decorative inside real HTML category links; do not turn a card tap into rotation. Keyboard and assistive-technology users get the same category information/destination.
- Do not place essential information only on a model's back face or require dragging to read it. Nonessential rotation can be excluded from the task path.
- Test focus order, visible focus and menu restoration; no fixed surface may cover the focused field or link.
- Use WCAG 2.2 AA as the review target, with the larger project touch targets described above. Check contrast in rendered context, including muted captions. Do not equate an automated axe result with complete conformance.
- Exercise browser text enlargement and 200% zoom/reflow. Verify VoiceOver/TalkBack labels, radio groups, selector options, errors and receipt states manually.

## 10. Files and implementation boundaries

| Area | Planned files | Approach |
| --- | --- | --- |
| Mobile layout | `src/styles/site.css`, `tokens.css`, `journey.css` | Consolidate phone rules by component. Keep the approved desktop rules stable. |
| Products | `ProductExplorer.tsx`, `category-journey.ts`, `Gallery.tsx`, `content.ts` | Keep shared content and href logic; introduce normal-flow phone presentation and bounded model rectangles. Do not let hidden desktop choreography keep running. |
| Hero/cloth | `Overview.tsx`, `Textiles.tsx`, `GlobeScene.tsx`, `TextileHeroScene.tsx` | Separate mobile stages from text, deterministic fit/pose, preserve protected content. |
| Lifecycle/performance | `Stage.tsx`, `StageCanvas.tsx`, `performance.ts`, `FrameReporting.tsx`, `useSceneDrag.ts` | Shared budget, complete-frame handoff, actual visibility, drag/cadence/cleanup verification. |
| Flat images | `CategoryPoster.tsx`, existing texture generators, an asset build script and `public/` | Build actual model stills and current flat swatches; track source, dimensions and model revision. |
| Navigation/form | `Nav.tsx`, `CustomSelect.tsx`, `EnquiryForm.tsx`, `App.tsx` | Keep destinations and business state; fix target sizing, viewport/focus behaviour and history restoration. |
| Brand/text motion | `LogoIntro.tsx`, `TextTransitions.tsx` | Preserve brand sequence, adopt agreed phone presentation and visible-by-default task content. |
| Loading | `index.html`, `fonts.css`, `main.tsx`, `vite.config.ts` only as evidence requires | Keep renderer lazy; trim measured font/JS work; inspect dependency-boundary regressions. |

Avoid a parallel mobile application, duplicated enquiry state, separate product taxonomies, UA-specific routing and a new dependency just for responsive layout. If SSR/prerendering is introduced for first-paint resilience, qualify it separately with hydration, route and no-JS tests; it is not a prerequisite for fixing the demonstrated mobile layout defects.

## 11. Delivery sequence

1. **Freeze the baseline and confirm the two presentation decisions.** Preserve the stash and untracked deployment file. Approve the normal-flow product grid and the motion/intro policy. Reproduce the captured states and record current asset/bundle facts. No broad source restoration.
2. **Build the static phone composition first.** Establish header, hero stages, product cards, textile flow, input sizes and footer using actual content and exact stills. At this stage, every route and category link must work with the renderer absent.
3. **Repair the shared rendering lifecycle.** Matching first frames; visible-stage preparation; all quality tiers honoured; sleep/release boundaries; bounded failure recovery. Verify one hero and one category before bringing in the other five.
4. **Restore all six live product models and cloth.** One gallery context, confined views, consistent initial framing, progressive compilation, actual-phone drag tests and the selected motion policy.
5. **Trim loading costs and polish continuity.** Build flat swatches, optimise measured fonts/stills, remove phone scroll-measurement work, test input under load and rotation. Keep semantic content stable during resize and history traversal.
6. **Qualify one frozen candidate, then deploy only when requested.** Run the canonical checks, browser/failure matrix and physical-phone scenarios. Any subsequent source change invalidates affected captures/results and requires targeted requalification.

Each stage has a visible acceptance boundary. Do not declare success because the scene works in a local desktop tab or because an audit tool reports no findings.

## 12. Verification and release gates

Canonical mechanical checks remain `npm test` and `npm run build`. Retain geometry/cloth clearance and route-boundary tests. Add focused regressions for the new actual failure cases rather than a broad suite that merely restates CSS values.

| Test class | Required coverage |
| --- | --- |
| Responsive geometry | 320×568, 360×640, 390×844, 412×915, 430×932; 568×320 and 844×390 landscape; tablet at 768/820 widths; desktop baseline at 1024/1440. |
| Layout acceptance | No model/text overlap; no artificial phone runway or product overlay; full category names; natural card growth; no horizontal document overflow. |
| Text accessibility | Larger system text, 200% zoom/reflow, long category labels, email addresses and validation messages. |
| Loading | Cold and warm cache, slow network, delayed model assets, failing scene chunk, one missing texture, reconnect and late fonts. No blank task content. |
| Animation | India first on refresh; still/live fit; all six models present; cloth stays recognisable; chosen motion duration; different target cadences preserve speed. |
| Adaptation | Inject bad rendered windows, intentional 30fps target, static state, recovery, reduced motion and unsupported hint APIs. Both hero and gallery must honour the state. |
| Visibility/lifecycle | Scroll past products/footer, open/close menu, background/resume, context loss during drag, route loop home → textiles → enquiry → privacy → home repeated ten times. No accumulating contexts/listeners or hidden continuous render loop. |
| Touch | Physical vertical scroll over each model, intended horizontal rotation, pinch, multi-touch, cancellation, fast flicks and browser edge-swipe. |
| Form | Every category prefill, role selection, autofill, keyboard open/close, first-error focus, retained values, duplicate prevention, Back and query changes. Mock provider cases only until real delivery is authorised/configured. |
| Assistive technology | Keyboard-only plus physical VoiceOver/Safari and TalkBack/Chrome for menu, category links, selector, radios, errors and acknowledgement. |
| Physical performance | A small iPhone/Safari, a normal iPhone/Safari, a modest Android/Chrome and a stronger Android/Chrome. Record model, OS/browser, network and battery-saver state; profile repeated scrolling and 5–10 minutes of use. |
| Post-release | Confirm actual deployment revision, public direct route refreshes and correct assets. Keep local, deployed, provider-delivery and physical-device receipts separate. |

An animation is accepted only when the model is visible, correctly framed and responsive while the page remains usable. A model hidden in the source or a finite camera-coordinate unit test is insufficient.

## 13. Sources and skill use

Applied Product Engineering, Frontend Design, UI/UX Pro Max (touch and Three.js queries), Web Design Guidelines, Systematic Debugging principles and Humanizer. Used existing renderer/source inspection rather than assuming a CSS-only cause. UI/UX search results were treated as suggestions: the actual web target-size standard and this scene's measured pixel budget take precedence over generic platform units or blanket rendering advice.

Primary references retrieved for this plan on 8 November 2026:

- [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) — review criteria for focus, forms, touch and layout.
- [WCAG Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — AA minimum is 24 CSS pixels with defined exceptions; the larger project target is a design choice.
- [WCAG Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) — the explicit continuous-motion tradeoff.
- [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) — browser scroll/pinch and gesture responsibilities.
- [React Three Fiber: Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) — on-demand rendering, resource reuse and controlled redraws.
- [MDN PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) and [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — performance signals and frame scheduling.
- [Web Vitals](https://web.dev/articles/vitals) — field thresholds and the distinction between laboratory and field evidence.
- [MDN viewport-relative lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length) — small/dynamic viewport behaviour.

## 14. Acceptance decision

The proposed redesign keeps the business, categories, models, destinations and enquiry workflow. It changes the phone's screen composition and the rendering lifecycle. The only explicit policy choices left for agreement are whether phone 3D settles after its introduction or gains an accessible pause mechanism, and whether the three-second logo sequence becomes nonblocking on phone. Owner-dependent business/delivery work remains separate.

No implementation or deployment was performed while preparing this document.
