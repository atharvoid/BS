# BS EXIMNEXUS implementation plan

Updated 6 November 2026 for C:/Users/Atharva Patil/Documents/project/BS-2.

This is the authoritative handoff for the trade homepage, textile page, enquiry flow, scene motion and adaptive cursor. It replaces the earlier assembled proposals in this file. The current task prepares the plan and preserves the supplied references. Work packages below are for later delegation.

## 1. Product direction and acceptance

A buyer should understand the sourcing business on arrival, find the relevant category, and either explore textiles or describe a requirement. A supplier should be able to introduce what they offer using the same contact flow. The visual experience should support those decisions through clear type, product illustrations and predictable controls.

The homepage introduces import, export and sourcing from India. Textiles leads the product explorer. The textile page owns the regional material and the four-object sequence. The desktop hero retains its right-hand globe composition and cropped edge. Reuse the current Fraunces, Newsreader, Instrument Sans and Chivo Mono typography, cotton/ink/indigo grounds and warm accents.

The cursor follows one visual language. Menu options receive a filled shape with an Explore cue where space allows. Draggable scenes receive a transparent outlined circle with Drag. Shape changes anticipate nearby targets while clicks continue to use their actual hit areas.

The complete slice is accepted when these journeys work.

- A first-time overseas buyer understands the proposition and reaches a textile enquiry.
- An Indian buyer selects another category and sees the correct prompt and form.
- A supplier chooses Indian supplier and submits their offer as a supply enquiry.
- A visitor switches categories without losing typed answers or accidentally submitting.
- A mouse user sees a responsive menu cursor, a hollow Drag ring over a 3D object and a clear pressed state during a turn.
- A touch or keyboard user can use navigation, category selection, enquiry and scene controls.
- A reader can stop ambient movement, inspect an object and keep that angle.
- The existing globe hit-testing regression and startup behavior continue to pass.

Business copy must follow the supplied brief. Availability, specifications and commercial terms are discussed per enquiry. Use evidence for product credentials, stock, operating history, registrations, clients and destinations. Keep financial planning and margin priorities internal.

## 2. Sources, observed state and evidence limits

### 2.1 Authority

1. The user's directions in this chat, including the screenshot-based cursor request.
2. The final page, copy and interaction contracts in this plan.
3. The existing business brief at C:/Users/Atharva Patil/Documents/projects/BS/BS_EXIMNEXUS_WEBSITE_BRIEF.md and the relevant company-profile material it summarises.
4. Existing implementation and shared tokens in this React/Vite checkout.
5. The recorded local results in VERIFICATION.md.

The previous 7/10 editorial assessment explained why the earlier plan needed consolidation. The new cursor and layouts require rendered review before judging their effect.

### 2.2 Supplied menu references

The two user-supplied screenshots were inspected on 6 November 2026. Their source URL, device and input method were not supplied. The files have been preserved for later agents.

| File | Pixel size | Observed content |
| --- | --- | --- |
| [Full menu](docs/references/menu-cursor-full.png) | 687 × 730 | Stacked large text links separated by rules, a dark filled disc labelled EXPLORE near About, and an accent on the active row index |
| [Detail](docs/references/menu-cursor-detail.png) | 282 × 231 | The disc overlaps the boundary between two large text options |

SHA-256 of the full image is 386DCB7D3AA1407C6112881405D4E568D810A1BE51F35287EEFE4E95763B0942. SHA-256 of the detail is 79E041AAD4965771D6B7D04A38ED86ACEBC99CF177880C882A5ED1B8411AAED3.

**Observed** — a filled labelled circular affordance, large menu rows and restrained active feedback.

**User-requested adaptation** — proximity-sensitive shape changes and a transparent version labelled Drag over 3D objects.

**Proposed design** — the exact capsule dimensions, magnetic offset, easing, collision avoidance, pressed state and contrast treatment in section 6.

**Unverified in the reference** — live cursor physics, speed, click behavior, blending, keyboard operation and touch behavior. The screenshots establish appearance only. Reference images belong under docs and serve as design evidence.

### 2.3 Current source audit

This is React 19 with Vite, TypeScript, React Three Fiber and Three.js. The older Astro site is a content and logo source for the earlier work, with a different implementation.

| Boundary | Current source finding | Consequence for the work |
| --- | --- | --- |
| Cursor.tsx | One ring/dot, generic hot-target detection, event-driven animation loop, capability checked at mount | Extend this component. Add semantic modes, changing input preferences and cleanup |
| site.css cursor block | Native cursor hidden globally through has-custom-cursor, form exceptions, no blend-mode | Transfer cursor styles to one scoped owner and fix fallback coverage |
| Nav.tsx | Compact desktop links and a responsive drawer, close on pathname change, Escape handler | Add same-route anchor closing, focus handling, link targets and cursor markers |
| Overview.tsx | Textile-led hero, ribbon, Purpose, Areas, Process, Bring, Boundaries, Introduction, closing CTA | Reduce to the four sections in section 3 |
| Overview.tsx drag hint | Hint is a paragraph and engaged never changes | Connect first interaction and make the pointer cue complementary |
| EnquiryForm.tsx | Subject defaults to textiles, prop seeds state once, two subject values, local draft, Web3Forms submit | Make category changes explicit and preserve draft state |
| App.tsx | ScrollManager responds to pathname/hash, Cursor and LogoIntro are global | Keep category updates from causing scroll jumps. Own session state here |
| GlobeScene.tsx | Automatic spin, root drag handlers and analytic globe raycast | Reuse the cheap hit test for cursor feedback |
| objects.tsx / drag.ts | Shared direct manipulation, casts React events, release on pointer leave, no explicit cancel/lost-capture bind | Resolve actual R3F and DOM capture semantics and all end paths |
| ProcessScene.tsx | Desktop bounded drift, mobile spin, several object slots with visibility toggles | Unify motion per object and exclude hidden slots from picking |
| Stage.tsx | One observer with a generous near-viewport margin also influences visible state, WebGL probe and fallback boundary | Separate loading proximity from drawing visibility and release probe resources |
| StageCanvas.tsx | Visible stages use always, others never, touchAction pan-y | Add hidden-tab and paused/reduced-motion handling plus pinch support |
| Privacy / receipt | Form entries stay out of persistent storage, receipt uses bs.enquiry.receipt | Preserve this behavior and accept existing textiles/general receipts |

These findings are from reading source. The current planning pass does not constitute a fresh runtime qualification.

### 2.4 Prior implemented slice

The globe's parent pointer handlers previously scanned the detailed globe children. One recorded hover generated 30,138 hits and took 1,380.1 ms overall. The implemented analytic sphere pick stops decorative traversal. The latest recorded 24-event repeat averaged 0.529 ms with a 4.8 ms maximum, one hit per event and zero decorative raycast calls.

The supplied logo startup is already adapted in Logo.tsx, LogoIntro.tsx and logo-intro.css. Its preservation contract is BS draw at 0ms, ship at 100ms, name at 160ms, each draw lasting 460ms. Fills finish at 600ms. Docking starts at 690ms and lasts 330ms. Finish is at 1040ms with a 1500ms fallback. Keep unique SVG mask IDs, native modified clicks, normal homepage replay, direct-hash entry behavior, interruption and reduced motion. Recorded checks cover these paths and all 15 supplied SVG outlines were preserved.

These are prior local results. P0 must establish a fresh candidate before further source changes. VERIFICATION.md keeps the earlier evidence separate from later results.

## 3. Page placement and exact copy

### 3.1 Shared navigation

Use the logo as Home. Desktop navigation has Products, Textiles and Enquire. Keep the same destinations in the responsive drawer. Privacy and email belong in the footer and enquiry recovery state.

- Products goes to /#products.
- Textiles goes to /textiles.
- Enquire goes to /enquiry and opens a general enquiry.
- On the homepage, an ordinary logo click retains the supplied startup replay. From another route, it returns home. Modified clicks keep native behavior.
- A drawer link to a same-page anchor closes the drawer and restores scrolling before revealing the section.
- A labelled menu toggle exposes its expanded state. Escape closes the drawer and returns focus to the toggle. Opening it moves focus into the menu and contains keyboard focus until dismissal. Restore the prior scroll position and prior root overflow value.

Each navigation item remains a normal link. Hover and proximity provide feedback. Activation occurs on click, tap or keyboard.

### 3.2 Homepage

| Order | Section and placement | Copy and action | Source change |
| --- | --- | --- | --- |
| H1 | Hero, copy left and cropped globe right on desktop | Heading “Import and export sourcing in India”. Body “BS EXIMNEXUS is developing a sourcing business for overseas buyers, buyers in India and Indian suppliers.” Actions “Explore products” and “Start an enquiry” | Replace the textile hero copy. Remove the status eyebrow, duplicated audience cards and regional fact strip |
| H2 | Product explorer immediately below hero | Heading “What are you looking to source?” Six horizontal category tiles. Textiles selected first. One panel beneath | Replace the ribbon and the home textile sequence with this single category entry point |
| H3 | Compact text section after explorer | Heading “How sourcing enquiries work”. Body “Tell us what you need or supply, and where the goods are going. The first discussion covers the product and any specifications you have. Availability, quantities and terms are agreed for each enquiry.” | Consolidate useful material from Purpose, Bring, company introduction and the commercial process |
| H4 | Shared footer | Brand, contact email, Products, Textiles, Enquire, Enquiry privacy and the existing year | Replace the second CTA banner and regional/status lists with a compact contact ending |

Use a single h1 per route. Keep a comfortable body measure around 55–65 characters, with responsive heading wrapping based on real text. The hero's small-screen layout must retain a readable introduction and an obvious action before any tall scene.

Give the globe the description “Globe with illustrative trade routes from India”. Keep the illustration caption short. The globe carries no business activity figures.

The explorer tile row also serves as the category list. On touch layouts use native horizontal overflow, visible next-item peeking and previous/next buttons when overflow exists. Keep the rest of the page on its normal vertical scroll path.

### 3.3 Explorer content

| Stable ID | Tile label | Panel title or requirement hint | Action |
| --- | --- | --- | --- |
| textiles | Textiles & fabrics | “Explore fabric types and the sourcing areas of Tamil Nadu and Gujarat.” | Primary “Explore textiles” to /textiles. Secondary “Textile enquiry” to /enquiry?category=textiles |
| handicrafts | Handicrafts & home decor | “Describe the item, its material and how it will be used.” | Inline enquiry |
| agriculture-food | Agriculture & food | “Which crop, ingredient or food product are you interested in?” | Inline enquiry |
| industrial-materials | Industrial materials | “Name the material or manufacturing input. Include the grade if you know it.” | Inline enquiry |
| organic-sustainable | Organic & sustainable products | “Describe the product and any certification you require.” | Inline enquiry |
| general | Other sourcing requests | “What would you like to source or supply?” | Inline general enquiry |

Preserve the full profile scope in the data behind these short labels. It includes textile made-ups, lifestyle goods, industrial commodities, packaging and buyer-specific requirements. Organic or sustainability credentials require product-specific evidence.

Use “Enquire about [category]” for each enquiry panel, with grammatical labels recorded in the category data. Put its prompt under the requirement field once. Avoid an extra description that repeats the same prompt above the form.

On first entry without a category, the homepage selects textiles. An explicit valid category in the URL selects that panel. An invalid category selects general. Products remains a useful destination while other category pages are undeveloped.

### 3.4 Textile page

| Order | Section | Final content direction | Illustration and action |
| --- | --- | --- | --- |
| T1 | Introduction | h1 “Textiles and fabrics from India”. Body “Explore fabric types and the regions where we’re beginning our sourcing work.” | Existing textile presentation with a direct “Start a textile enquiry” link |
| T2 | Fabric types | Explain “Fibre” with cotton, silk and blends. Explain “Construction” with woven and knitted. Explain “Finish” with printed and dyed | Existing swatches keep accurate colour names such as Indigo and Raw cotton. One group caption reads “These illustrations show colour and weave. Availability is checked for each enquiry.” |
| T3 | Tamil Nadu and Gujarat | “Tamil Nadu is an initial sourcing area for cotton, silk and blended fabric enquiries.” “Gujarat is an initial sourcing area for cotton, printed and dyed fabric enquiries.” | Move the existing regional motifs here, with a short line “Suppliers elsewhere in India can also share what they offer.” |
| T4 | Four-object sequence | Heading “What to tell us about your fabric”. Use the four topics below | Existing bolt, shuttle, bobbin and reed. Captions name the illustrated object |
| T5 | Enquiry | Heading “Enquire about textiles”. Use the same five-field form with textiles selected | End with the shared footer |

The four topics are ordered to help someone describe a requirement.

1. **Fabric and use** — “What are you making, and how should the fabric feel?”
2. **Samples** — “Mention a sample or reference you would like to match.”
3. **Quantity and packing** — “Include an approximate quantity if you have one.”
4. **Acceptance and terms** — “Which details need agreement before you can place an order?”

Keep the topics as useful text next to representative craft objects. Caption the objects “Cloth bolt”, “Weaving shuttle”, “Yarn bobbin” and “Brass reed”. These pairings carry an editorial sequence. They make no claim that an object depicts a contract term or a category of finished fabric.

Extract the existing Process composition into TextileSequence.tsx with explicit topic data. Move the regional section into Textiles.tsx. Remove the extra shuttle vignette, the duplicated enquiry checklist, the Why textiles first essay and the repeated limitations section. Use the representative-imagery caption where the illustrations appear.

Desktop retains the established pinned scene/text arrangement. Mobile places the matching topic and object together in normal flow. Use one active mobile sequence renderer mounted in the topic nearest the viewport's reading centre, with representative stills for the other slots. Do not mount the hidden desktop version on mobile. Cancel a drag before changing its active topic. Derive the text, rail and live object from the same active-topic calculation so they cannot disagree during a transition. Text remains readable when motion, WebGL or JavaScript scene loading is unavailable.

### 3.5 Form and supporting routes

Retain five required answers.

| Field | Label and guidance |
| --- | --- |
| Role | “Which best describes you?” Options Overseas buyer, Buyer in India, Indian supplier |
| Requirement | “What do you need or supply?” Category-specific hint from the table above |
| Location | “Destination or business location” with a short city/region/country example appropriate to the selected category |
| Name | “Your name” |
| Email | “Email address” |

The general enquiry heading is “Start an enquiry”. Show the selected subject beside the form. A general route can offer the same compact category selector so a direct visitor can choose a subject. Let the requirement carry trade direction.

Keep attachment and sensitive-data guidance together beside “Send enquiry”. Use “Sending…” while waiting. Preserve input after validation and request failure. Use direct field corrections such as “Enter your email address”. Keep existing length and email limits unless a check demonstrates a problem.

On a failed request use “We couldn’t send your enquiry. Try again or email bsexim.nexus@gmail.com.” When sending is unconfigured, use “To send your enquiry, email bsexim.nexus@gmail.com.” Validation and sending status must remain visible and associated with the form.

Show “Enquiry submitted” after confirmed service acceptance with the receipt's category, role and time. Use the short qualifier “Inbox delivery has not been confirmed.” when that distinction is relevant. With no valid receipt, use “No enquiry recorded in this tab” and “Start an enquiry”. Email remains an explicit recovery path.

The acknowledgement is a compact receipt view. Remove its duplicate decorative bobbin scene and related Stage imports so the confirmation has a clear reading order. Retain the bobbin in the textile sequence.

Privacy retains its collection, purpose, processor, receipt storage, correction and contact information. Align its category and draft-storage wording with the final implementation. Keep sensitive text out of URL parameters, logs, localStorage and cookies.

Use “Page not found” on the 404 route with Home and Products links. Use “BS EXIMNEXUS | Import and export sourcing in India” for homepage and sharing titles. Give Textiles a route-specific title and description. Ensure direct route loading, navigation, form subjects and search snippets describe the same business.

### 3.6 Copy review at integration

Read the whole journey in route order, including footer, form hints, error states and receipt. Each section must answer a different question. Use one product category list, one short company introduction and one form instruction at each form. Put any material qualification next to the item it qualifies.

Run a humanizer pass on prose after the assembled layout is visible. Preserve business facts, source links, data IDs and commands. Remove decorative numbering and repeated “five answers”, “developing”, “not a catalogue” and specification disclaimers where the same message already appears locally.

## 4. Category, form and routing contracts

Settle these interfaces in P1 before agents build dependent components.

### 4.1 Category data

Keep the canonical list in src/content.ts. Each entry needs id, navigation label, enquiry title, requirement hint, scope and experience. Experience is either textile detail or enquiry. Use the stable IDs in section 3.

Extend the existing EnquirySubject representation to these IDs so the draft and receipt keep a single subject field. Map the category query parameter to that subject. Existing subject values textiles and general remain valid. Unknown values resolve to general.

The textile discussion topics need their own FABRIC_TOPICS array. Keep business-wide process copy separate from textile-topic copy. Reuse the existing object-kind values bolt, shuttle, spool and reed as the renderer keys.

### 4.2 Draft ownership

App owns one in-memory enquiry draft shared by the explorer and standalone enquiry route. Reuse the existing EnquiryDraft fields. EnquiryForm becomes controlled through draft and onDraftChange, with its existing validation and sending logic kept together. Avoid giving each tab an independent local form.

The explorer displays one active panel. Keep the draft above that panel so an unmount cannot erase it. Returning from the textile preview restores the same draft. A full page reload starts a new draft. Preserve the existing receipt-storage behavior.

Changing a category updates subject and its visible heading. It leaves role, requirement, location, name and email intact. Clear obsolete validation state only for fields the visitor edits. A category change cannot silently replace text with an example.

### 4.3 URL and history

Use /#products for the explorer, /textiles for detail and /enquiry?category=<stable-id> for direct enquiries. The explorer mirrors explicit selection in the homepage category query. Use a normal history entry for an explicit category choice so Back/Forward can restore selection. Arrow-key movement through an unactivated tab changes focus only.

Use manual-activation tab semantics with Tab, arrow keys, Home/End and Enter/Space. Tabs have aria-selected, aria-controls and a labelled panel. The overflow scroll buttons move the row by a useful visible distance without changing selection.

Category updates preserve scroll position and keyboard focus. ScrollManager currently uses pathname/hash, which helps isolate search changes. Add safe hash lookup, reduced-motion-aware scrolling and an after-mount retry bounded to the section's mount. Unknown hashes have a useful top-of-page result without exceptions.

### 4.4 Submit and receipt

1. Validate the current draft and focus the first invalid field.
2. Freeze a submission snapshot of its category and answers.
3. Lock the form and category selection while that request is pending, with visible disabled state.
4. Send the snapshot once using the existing provider.
5. On rejected, malformed or network responses, keep the draft and show recovery.
6. On confirmed service acceptance, write the receipt from the snapshot and navigate to acknowledgement.
7. Guard rapid double clicks and stale async responses. On route unmount, cancel the local request and prevent a late response from navigating the visitor.
8. An interrupted request has an unknown remote outcome. Do not invent a successful receipt or claim that the remote provider could not have received it.

Validate receipt parsing, including legacy textiles/general entries, missing fields, invalid timestamps, malformed JSON and unavailable sessionStorage. Render a safe general/no-record state as appropriate. A receipt stores subject, role and time only. The current subject prop only seeds useState once, so explicit draft ownership is required for dynamic categories.

Tests use intercepted requests. Real inbox delivery requires its own authorized check.

## 5. Scene motion and manipulation

### 5.1 Proposed motion values

| Asset | Default | Manual range |
| --- | --- | --- |
| Globe | 0.045 radians/second around its upright axis, approximately 140 seconds per full turn, initial India-facing pose | Full yaw and the existing bounded pitch |
| Bobbin | One upright revolution per 45 seconds | Full yaw with bounded pitch |
| Shuttle | Trial one upright revolution per 45 seconds from a slightly elevated view | Full yaw with bounded pitch |
| Hanging cloth, open bolt and reed | Front-facing with a roughly ±12° yaw sweep, trial period 14 seconds | Full yaw with bounded pitch |
| Swatches and regional motifs | Static | Normal image behavior |

These are proposed trials. Watch the whole mesh through a turn before settling the shuttle setting. Use the shallow sweep if the long thin end makes it difficult to recognise. Inspect back faces, seams, normals and lighting before promising full-turn inspection on any mesh.

Retain the existing entry arc on the textile sequence where motion is allowed. When reduced motion or paused viewing applies, scrolling between topics shows the appropriate object at a readable settled pose. Adjacent text must track the displayed object.

### 5.2 Motion ownership and continuity

Keep one in-memory pause preference in App for scene ambient motion. SceneControls consumes it for the visible scene. The three renderer owns current pose, automatic phase and drag offsets. Separate those values so stopping, resuming and changing modes cannot snap the object.

- Play advances ambient phase from its paused value.
- A pointer press or a step turn pauses ambient animation and keeps the current pose as the manual starting point.
- A short click/tap can pause the presentation. Treat it as an inspection action.
- Drag release may keep a short capped easing tail, then holds the chosen angle. Play is the explicit way to resume.
- Keep pause preference between textile objects and routes during that app session.
- Pause freezes bobbing, drift and route pulses too. The scroll-driven choice of the current topic still responds.
- Use elapsed active time to advance phase. A background tab must not accumulate a large rotation jump.
- Runtime reduced-motion changes stop ambient movement immediately. Show deliberate turn/reset controls in that mode, with instant pose updates and a stationary initial view.

### 5.3 Controls and scene semantics

Add shared compact controls below the interactive area, labelled Turn left, Pause animation / Play animation, Turn right and Reset view. A 15° horizontal step is the initial turn amount. Reset shows the asset's authored starting angle and keeps it paused. Use visible buttons with usable touch targets around 44 × 44 CSS pixels and explicit accessible names.

For the globe, also expose Tilt up and Tilt down within the existing pitch limits so the alternative controls cover the same orientation changes as dragging. For products, include the same pitch controls when they support pitch. Disable a direction at its tilt bound. Keep all controls in normal keyboard order, with visible focus. The paused state must be understandable from the control label.

Stage currently has role=img around its contents. Move image semantics to the illustration/fallback element, and keep controls as siblings outside any role that hides their semantics. Name each scene. On WebGL failure, show the representative fallback, remove unavailable scene controls and move focus to the scene heading if a disappearing control held it.

### 5.4 Pointer capture and end paths

Resolve capture at the shared drag boundary in drag.ts and its callers. DOM capture uses the actual canvas. R3F exposes capture on its event target. Replace the existing event casts with a small explicit input adapter if needed, using the documented capture surface.

Only a primary pointer starts manipulation. Ignore secondary mouse buttons and a second touch pointer. Preserve native vertical pan and pinch using touch-action: pan-y pinch-zoom. Do not attach a wheel-prevention handler or globally prevent touch defaults.

Distinguish a pointer press from drag movement with a proposed 4px threshold. Track pointerId through the interaction. End or cancel safely on pointerup, pointercancel, lost capture, Escape, window blur, hidden tab, menu opening, WebGL loss and route unmount. Ordinary exit from the silhouette keeps an active captured drag alive until release. Uncaptured hover exit clears the cue.

A completed drag cannot activate a nearby link or a category tile. Navigation and controls remain separate DOM targets. A vertical touch pan that cancels pointer manipulation restores normal scrolling and clears all pressed cursor state.

### 5.5 Rendering and picking budgets

Preserve the existing analytic globe raycast. Add no second detailed scene scan for a cursor. Use simple explicit hit envelopes for product objects and exclude hidden/inactive slots from picking. A moving product's envelope follows the same transform.

Stage loading proximity and draw visibility need separate observers. The current 320px margin can warm assets. Drawing uses the real viewport intersection plus document visibility. Disconnect observers, end active gestures and dispose route-owned resources on unmount. Release the temporary WebGL capability-probe context after checking support.

Allow continuous rendering while ambient animation or a transition is active. Use demand rendering for a paused or reduced-motion scene, invalidating on deliberate turns, drag updates, resize, scroll-topic changes and asset completion. Suspend entirely when offscreen or hidden. A cursor approaching an offscreen canvas must not wake it.

## 6. Adaptive cursor contract

### 6.1 Scope and visual direction

Extend the existing Cursor.tsx ring/dot rather than adding a second cursor system. Use the existing mono font for short cursor labels. The pointer remains a decorative aid with aria-hidden=true and pointer-events:none.

The large-menu disc follows the reference's filled, labelled affordance. Its colours adapt to the current surface. On dark navigation use a cotton fill and ink label. On a light surface use ink fill and cotton label. Avoid a site-wide blend mode or backdrop filter.

The 3D ring has a fully transparent interior in every state. Use a fine contrasting border with a restrained second edge, plus a short text shadow where needed over the globe's bright land. The Drag text stays opaque and readable. All measurements below are initial CSS-pixel targets for the rendering review.

### 6.2 States

| State | Shape and content | Entry and exit |
| --- | --- | --- |
| Native / hidden | Native pointer, with the custom layer hidden | Touch, pen, keyboard navigation, fields, selected text, reduced motion, forced colours, blur, unsupported setup or cursor failure |
| Idle | Existing approximately 21px ring and 3px dot, empty label | Fine mouse movement over ordinary content |
| Approach | Ring eases toward the upcoming target shape with subdued stroke, empty label | Within the registered target's approach margin, before a real hit |
| Menu row | Filled disc around 76px diameter, label Explore | Actual hover on a large menu link |
| Compact navigation | Rounded filled capsule around 64–112px wide and 34–38px tall, label Explore where it fits | Actual hover on a compact navigation link |
| Ordinary action / category tab | Restrained ring or shallow capsule, empty label | Real action button, link, tab or scene control. The existing text supplies its name |
| 3D ready | Transparent circle around 72px diameter, label Drag | Actual cheap hit on a draggable envelope |
| 3D dragging | Transparent circle around 62px diameter, label Drag with a firmer edge | Active press/captured manipulation. Release returns to 3D ready only if still over the asset |

The small dot always marks the true pointer coordinates. The larger body may trail or offset. This prevents the decorative body from suggesting a different click position.

The cursor may morph on approach, but Explore or Drag appears only when its real target is actionable. Approaching a category does not select it. There is no typed-text animation, bouncing label or permanently moving text inside the ring.

### 6.3 Proximity and shape adaptation

For DOM targets, measure only registered visible navigation/selector targets after mount, menu transition completion, fonts ready, resize and meaningful layout changes. Start with a 24px approach margin and an additional 10px exit margin. Clip those rectangles to the visible viewport and ignore hidden or covered targets.

Measure distance from pointer to target rectangle. Blend the approach amount from zero at the margin to one at its boundary. A direct hit wins over proximity. Between neighbours use the nearest eligible target and retain the current choice through the exit margin until a competitor is at least 6px closer. This hysteresis prevents flickering between options.

Cap any attraction of the decorative body at 8px. The real link and click position stay fixed. For a compact header link, place the filled capsule beneath the text with a small gap. Size it from the label width plus padding, clamped to the table range. For large menu rows, follow the pointer with a small offset, then bias into trailing whitespace when the filled body would obscure the link name. Read the label rectangle from cached measurements. Keep the original label legible. Where a row is too narrow to fit both, use the restrained action ring instead of covering its label.

Keep the cursor within the viewport, switching its offset near an edge. During active capture, prioritise the actual pointer and the transparent ring over a menu attraction.

For 3D proximity, use a projected simple envelope already owned by the scene, or its cached screen bounds for an unlabelled approach cue. Promote to Drag only after the existing cheap raycast reports an actual hit. The full hero canvas covers copy and empty space, so a canvas rectangle alone cannot authorise the Drag state. Pointer motion over copy, controls or an open drawer takes precedence over any scene bound beneath it.

### 6.4 Timing and implementation

Try 180ms to enter a shape, 120ms to leave, 100ms for a label fade and about 90ms of position settling. Keep these values in one cursor style/motion definition. Use frame-time-aware damping so the cursor feels consistent at different refresh rates.

Record pointer coordinates in refs. Read cached geometry, compute one resolved state and write transforms in one scheduled frame. Update React state only when the semantic mode or target changes. Separate the shape layer from the text layer so a circle-to-capsule change never stretches the label.

Use transforms for translation and body scaling. Update shape dimensions on target changes, with a local transition that affects only the fixed decorative layer. Stop requesting frames after position and shape settle. Listen for the next pointer, scroll, resize or semantic change to wake it. Avoid full-document target scans and getBoundingClientRect calls on every pointer event.

Read the current DOM hit path before selecting a scene mode. Recompute it once on scroll when the pointer is stationary, so a scene scrolling out from under the pointer cannot leave Drag stuck on the screen.

### 6.5 Event and semantic contract

Use the following explicit data-cursor values on DOM elements.

| Value | Owner | Meaning |
| --- | --- | --- |
| menu | NavLink, with data-cursor-size compact or row | Filled Explore treatment on real hover |
| action | Normal buttons, links and scene controls | Restrained feedback with existing action text |
| select | Category tab | Tab shape feedback, selected state still belongs to the tab |
| native | Inputs, textareas, selects, editable areas and relevant fallback wrappers | Native cursor and selection behavior |
| approach | Scene host when geometry can supply an approach envelope | Unlabelled approach only, never a blanket Drag claim |

A small typed bridge, proposed as src/three/interaction.ts, reports scene boundary changes to the existing global Cursor. Payload fields are sceneId, phase, pointerId and pointerType. Phase is enter, leave, press, drag, release, cancel or remove. Include the hit envelope bounds only when they change. Publish no per-frame React updates and no private enquiry information.

Keep the bridge as one local utility and one documented event, for example bs:scene-pointer. Subscribe once in Cursor and clean up on unmount. Use stable scene IDs hero-globe, textile-hero and textile-sequence. The sequence also reports the current object kind when that slot changes. Cancel capture and publish removal for the old kind before making the new slot interactive. Do not raycast both sides of an entry/exit transition.

R3F callbacks on the existing hit envelope publish enter/leave and gesture transitions. Ordinary pointer positions already come from the browser listener. Stop propagation through decorative siblings where necessary. All end paths in section 5 clear the same active scene owner.

### 6.6 Resolution order and recovery

Resolve states in this order.

1. Disabled capability, forced-colour/reduced-motion preference, hidden window or native text interaction.
2. Active captured scene manipulation belonging to the current pointer.
3. The topmost real DOM action, including a menu or scene control.
4. The topmost actual scene hit.
5. Eligible nearby target for an unlabelled approach.
6. Idle.

Opening a drawer first cancels scene manipulation. Menu close, route change, scene removal, context loss or preference changes clear stale ownership. Ignore an event from a scene that is already unmounted.

Enable the custom layer only for mouse events when a fine hover-capable pointer is available. Use runtime media-query listeners and the current pointerType so hybrid devices can switch between touch and mouse. After a touch, hide the layer and restore native behavior until a fresh eligible mouse move.

Handle Tab by hiding the decorative pointer and exposing normal focus styling. Restore the layer on a new eligible mouse movement. Restore the native pointer on blur, pointer exit, selection, errors in the cursor setup/tick, reduced motion and forced colours. A setup failure must never leave has-custom-cursor enabled.

Inside form controls the I-beam and native selection remain visible, with the overlay suppressed. A select, file picker, hCaptcha iframe or external control keeps its own native behavior. The custom layer is removed from hit testing at all times.

### 6.7 Coordination with startup and menu

During the one-second logo startup, suppress the enlarged Explore/Drag treatments. Use the native pointer for Skip introduction. On dismissal, resolve the actual element at the last mouse coordinates before showing the custom ring. The intro's data-intro-active attribute is already available for this coordination.

Drawer animation affects target bounds. Invalidate measurements when the menu opens/closes and again when it settles. Remove link padding/letter-spacing motion that would fight the cursor's measurements. Keep one restrained underline or colour change for focus and a fallback hover response.

Give the cursor one root layer above navigation, with no intercepting surface. Its filled body is label-aware and its 3D fill is transparent. Keep native focus rings and the explicit scene controls visible beside it.

### 6.8 Visual and interaction acceptance

- Approaching a menu link smoothly changes the cursor toward its target shape.
- Actual menu hover shows Explore while the full destination name remains legible.
- Moving between neighbouring links or from a row to its border produces no mode flicker.
- The ring changes continuously between menu, idle and 3D modes during quick reversals.
- A drag-ready asset has a clear hollow ring and readable Drag label across bright land, dark ocean, pale cloth and brass.
- Dragging beyond the silhouette or viewport edge keeps capture until a defined end event.
- Over the hero copy, form, scene controls, empty stage area and an open drawer, the cursor reflects that actual surface.
- Stopping the mouse stops cursor frame writes after settling. Scrolling or route changes still resolve the state correctly.
- Touch, pen, keyboard, forced-colour and reduced-motion users receive normal native controls.

## 7. Implementation map

The listed new files are proposed. Existing files retain their responsibilities wherever practical.

| Boundary | Existing files | Proposed additions / change |
| --- | --- | --- |
| Business/category copy | src/content.ts | Category metadata, semantic IDs and FABRIC_TOPICS |
| Draft and route session | src/App.tsx | One in-memory draft, one scene-session provider, route-safe integration |
| Product explorer | src/pages/Overview.tsx | src/components/ProductExplorer.tsx and src/styles/products.css |
| Textile detail | src/pages/Textiles.tsx, useScrollProgress.ts, current Process/Areas in Overview | src/components/TextileSequence.tsx, reuse existing sequence styles |
| General form and receipt | EnquiryForm.tsx, pages/Enquiry.tsx, Acknowledgement.tsx, Privacy.tsx | Controlled draft, normalised category/legacy receipt handling |
| Cursor | src/components/Cursor.tsx, current cursor block in site.css | src/styles/cursor.css and, only if pure resolver logic needs isolation, a small cursor-state helper |
| Scene gesture / bridge | src/three/drag.ts, objects.tsx, GlobeScene.tsx | src/three/interaction.ts |
| Scene session and controls | src/three/motion.ts, Stage.tsx, StageCanvas.tsx, ProcessScene.tsx | src/three/SceneSession.tsx and src/components/SceneControls.tsx with scoped control styles |
| Navigation | src/components/Nav.tsx | Semantic markers and scoped navigation feedback styles |
| Integration / footer / metadata | Overview.tsx, Footer.tsx, App.tsx, main.tsx, site.css, index.html | Route titles and consolidated composition |
| Regression evidence | Existing scripts and VERIFICATION.md | Bounded cursor/scene/journey checks using the existing available browser runtime |

Reuse installed React, R3F, Three.js and browser animation APIs. The screenshot effect needs no new cursor library, animation framework, UI framework or renderer. Keep shared utilities small and tied to these specific boundaries.

## 8. Delegation order and work packages

The lead integrator owns dispatch, scope, shared-file conflicts and final acceptance. Prepare at most three independent workers at a time, leaving one slot for integration/review. Dispatch only after the preceding contract gate passes. One safe first wave after P1 is P2, P5A and P7. The next available slots can take P3, P4 and P5B as their dependencies finish, followed by P6. P8 integrates all completed pieces. A reviewer reports findings and evidence to the lead. Each worker changes only its assigned files.

~~~mermaid
flowchart TD
  P0[Fresh baseline] --> P1[Content and interface contract]
  P1 --> P2[Controlled form and receipt]
  P1 --> P5A[Gesture and scene bridge]
  P2 --> P3[Product explorer]
  P2 --> P4[Textile page and sequence]
  P5A --> P5B[Scene motion and controls]
  P5A --> P6[Adaptive cursor]
  P1 --> P7[Navigation]
  P3 --> P8[Page and shared-style integration]
  P4 --> P8
  P5B --> P8
  P6 --> P8
  P7 --> P8
  P8 --> P9[Rendered journeys and regression checks]
  P9 --> P10[Final review and evidence handoff]
~~~

### P0 — Establish the baseline

**Owner** — lead integrator. **Dependencies** — none.

1. Read repository instructions and this plan. Confirm the checkout and current branch.
2. Record HEAD, git status, relevant file hashes, existing diff and untracked files. Identify pre-existing owner changes.
3. Run npm test, npm run build and git diff --check. Capture actual exit status and the existing chunk warning.
4. Use the existing dev server only after checking its process and project path. Start a separate preview when needed and wait for its ready message.
5. Run the existing globe hover check on the development site and logo check on a built preview.
6. Capture the current homepage, drawer, textile route and form at relevant sizes. Keep the previous results as historical evidence.
7. Register the source/build state to which these results apply.

**Completion evidence** — fresh baseline record, expected-failure or gap list, and file-ownership map. Resolve or explicitly isolate a baseline failure before attributing it to a new task.

### P1 — Freeze copy, categories and interfaces

**Owner files** — src/content.ts. **Dependencies** — P0.

1. Implement the canonical category list and topic copy in sections 3–4.
2. Keep stable IDs, legacy subject values and renderer object-kind values.
3. Record the agreed CategoryId / EnquirySubject union, EnquiryDraft fields and controlled form props for P2.
4. Freeze ProductExplorer's controlled selection and draft props.
5. Freeze the small scene bridge payload and session-control API for P5A/P5B/P6.
6. Assign scene IDs and DOM cursor marker values exactly as specified.
7. Review copy for unsupported claims, repeated explanations and labels too long for tiles.
8. Notify downstream owners of the frozen exports. If an interface later changes, update its consumers deliberately.

**Completion evidence** — reviewed content diff and a short interface table in the handoff. No component owner invents a parallel category list.

### P2 — General enquiry and receipt

**Owner files** — src/components/EnquiryForm.tsx, src/pages/Enquiry.tsx, src/pages/Acknowledgement.tsx, src/pages/Privacy.tsx. **Dependencies** — P1.

1. Replace the textile-only seed with the controlled draft contract. Retain validation, pending, error and unconfigured states.
2. Resolve the direct route's category and show the correct title/hint.
3. Support category changes while preserving answers. Do not reset unrelated fields.
4. Freeze the submission snapshot and protect against a duplicate request or a late route-changing response.
5. Build email subject, payload and receipt from the same selected category.
6. Normalise existing and malformed receipt data safely.
7. Implement the accepted-submission and no-record acknowledgement states.
8. Align privacy text and form recovery instructions with actual storage and sending behavior.
9. Check general, textiles and at least two non-textile categories with intercepted success, rejection, network error and no-key cases.

**Completion evidence** — controlled-form integration compiles, drafts survive category changes, legacy receipts render, failed requests preserve answers and no false success appears. The lead supplies the app-level draft owner in P8. P2 can use a temporary local harness for verification without committing an extra product route.

### P3 — Product explorer

**Owner files** — new ProductExplorer.tsx and products.css. **Dependencies** — P1 and P2.

1. Render the six tabs and a single selected panel from canonical data.
2. Implement manual keyboard activation and native overflow with labelled scroll buttons.
3. Put the textile preview and its two explicit actions in the first panel.
4. Render the shared enquiry form for the remaining categories using the controlled draft.
5. Keep draft state outside the selected panel. Test leaving an enquiry for the textile preview and returning.
6. Wire explicit selection to the category URL contract through the provided callback. Leave scroll and focus at the visitor's location.
7. Add action/select cursor markers. Hover feedback never activates a category.
8. Reserve a stable panel frame where practical, while allowing a tall form to expand naturally. Avoid hidden focusable form copies.
9. Check long labels and 200% text scaling.

**Completion evidence** — each category has a usable destination, tab order works, one form is active and selection can be restored from a URL. Leave final placement in Overview to P8.

### P4 — Textile composition and migration

**Owner files** — src/pages/Textiles.tsx, src/components/useScrollProgress.ts and new TextileSequence.tsx. **Dependencies** — P1 and P2.

1. Extract the current Process markup into the sequence component and connect FABRIC_TOPICS. Align the topic index, rail and object phase. The current hook's rounded index and the renderer's slot phase need a shared boundary rule.
2. Reuse ProcessScene and SingleStageScene without duplicating their geometry.
3. Assemble T1–T5 in the agreed order.
4. Move the region markup and RegionWeave use from the homepage into the textile page.
5. Keep swatch colour names accurate and group the material reading aids by fibre, construction and finish.
6. Add descriptive captions, scene IDs and the shared form with textiles selected.
7. Remove the redundant shuttle vignette and repeated checklists.
8. Prepare desktop/mobile wrappers for the final motion contract. Ensure hidden layout alternatives cannot draw or receive hits.
9. Verify all four topics with the corresponding object, including reverse scrolling and jump navigation.

**Completion evidence** — correct route order, readable static content, one current interactive sequence, no unresolved imports. The lead removes the old home sections in P8 after the migration is confirmed.

### P5A — Gesture foundation and scene events

**Owner files** — src/three/drag.ts, new interaction.ts, the handler adapters in objects.tsx and GlobeScene.tsx. **Dependencies** — P1. P5B takes these shared files only after P5A finishes.

1. Audit all createDrag callers and the actual R3F/DOM event surfaces.
2. Implement primary-pointer ownership, press/drag threshold and capture.
3. Add every end path in section 5. A leave during capture cannot strand or prematurely end a drag.
4. Publish semantic scene transitions through the bridge.
5. Keep the analytic globe raycast and use bounded product envelopes instead of detailed decorative picking.
6. Include explicit active/hidden-slot guards.
7. Test release outside the canvas, Escape, pointercancel, menu opening, context loss and unmount.
8. Keep vertical touch pan and pinch behavior available.

**Completion evidence** — no stuck drag or stale scene event, one active pointer owner and unchanged decorative-raycast rejection. Add a focused regression if the existing checks miss a demonstrated capture/cancel defect.

### P5B — Motion and scene controls

**Owner files** — proposed SceneSession.tsx and SceneControls.tsx, src/three/motion.ts, Stage.tsx, StageCanvas.tsx, ProcessScene.tsx, and the motion portions of objects.tsx / GlobeScene.tsx. **Dependencies** — P5A and P1.

1. Implement session pause state and small command interfaces. Keep per-frame pose in refs.
2. Apply per-shape motion and unify desktop/mobile policy.
3. Preserve pose and phase through pause, resume, manual turning and topic changes.
4. Expose yaw and supported pitch steps plus reset through semantic buttons.
5. Put controls outside illustration semantics.
6. Separate near-loading, visible drawing and hidden-tab suspension.
7. Add demand invalidation for paused scenes and all user-driven updates.
8. Handle runtime reduced-motion change and WebGL failure/focus recovery.
9. Run a full cycle for each mesh. Tune only when the observed pose or readability needs it and record the final value.

**Completion evidence** — state table and observed full-cycle views, consistent controls, no hidden drawing and no resume jump. P5A has finished editing shared renderer files before this work starts.

### P6 — Adaptive cursor

**Owner files** — src/components/Cursor.tsx and new cursor.css. A small pure state/proximity helper is allowed only if it makes the actual resolver easier to check. **Dependencies** — P1 and P5A.

1. Preserve the existing event-driven ring/dot ownership.
2. Add the state resolver, DOM markers and scene-bridge subscription.
3. Add bounded measurement invalidation and target hysteresis.
4. Implement filled menu disc/capsule, transparent Drag/pressed ring and unlabelled approach state.
5. Keep the label unscaled and destination text readable. Clamp the body near viewport edges.
6. Implement native text, hybrid input, keyboard, forced-colour, reduced-motion, exit and failure recovery.
7. Coordinate with startup and menu transitions.
8. Add no listeners or style writes per rendered mesh frame.
9. Compare slow approach, quick reversal, row boundaries and active capture against the state table.

**Completion evidence** — measured state transitions, settled-frame idle behavior and captures on menu/3D surfaces. P8 removes the superseded cursor block from site.css and connects the final stylesheet ordering.

### P7 — Navigation and focus

**Owner files** — src/components/Nav.tsx and any narrowly scoped new navigation feedback stylesheet. **Dependencies** — P1.

1. Set the final destinations and semantic cursor markers on actual links.
2. Keep logo replay and modified clicks.
3. Close the drawer for pathname and same-route anchor activation.
4. Manage initial focus, focus containment, Escape and focus return.
5. Save and restore the prior scroll-lock state.
6. Provide keyboard focus styling independent of the cursor.
7. Prepare label wrappers/bounds for the large-row cursor without adding decorative row numbers.
8. Keep hover feedback stable, avoiding moving text geometry while the cursor fits it.

**Completion evidence** — keyboard and mouse journeys, correct active-link state, drawer closing for Products and no trapped page scroll. Coordinate final global hover-style cleanup through P8.

### P8 — Integrate pages, state and shared styles

**Owner** — lead integrator. **Owner files** — src/App.tsx, src/pages/Overview.tsx, src/components/Footer.tsx, src/main.tsx, src/styles/site.css, index.html. **Dependencies** — P2–P7 complete.

1. Wire the in-memory draft and scene-session owner at the app root.
2. Insert H1–H4 and remove the migrated/duplicated home sections and their stale imports.
3. Connect search-based selection without disturbing scroll/hash behavior.
4. Keep the globe's right-cropped composition and verify the mobile copy-first layout.
5. Consolidate footer content and route-specific metadata.
6. Import the scoped styles once. Remove old cursor and conflicting menu hover rules from site.css.
7. Resolve shared selectors and responsive alternatives. Remove unused state such as the old disconnected engaged flag.
8. Check the startup/cursor transition and menu/scene ownership together.
9. Walk homepage → textile → enquiry → receipt, and homepage → other category → enquiry → failure/retry.
10. Read all visible copy in the actual layout before the final humanizer pass.

**Completion evidence** — one coherent candidate with all agents' changes integrated, shared contracts intact and no hidden duplicate UI.

### P9 — Regression and rendered qualification

**Owner files** — targeted scripts and recorded evidence only. **Dependencies** — P8.

1. Run the canonical checks against the integrated candidate.
2. Reuse globe-raycast.test.mjs, globe-hover.check.cjs and logo-intro.check.cjs.
3. Add only the focused cursor/scene/enquiry checks needed for new states in section 9.
4. Use real browser movement for hover, drag, menu close and scroll checks. Test short-lived semantic states in the same browser task where polling could miss them.
5. Intercept form submission. Assert payload category, frozen snapshot, request count and accepted/rejected outcomes.
6. Capture desktop, compact fine-pointer navigation, mobile, reduced-motion and native/fallback states.
7. Record console errors, source/build identity and any tests that timed out.
8. Return concrete failures to the assigned owner. Recheck the affected gate after a fix, then run final candidate gates.

**Completion evidence** — pass/fail matrix with screenshots, timings and explicit gaps. A browser process timeout supplies no success evidence.

### P10 — Final independent review and handoff

**Owner** — a fresh reviewer later, with lead integration. **Dependencies** — P9.

Read this plan, the final diff and the test record. Inspect the implemented journey as a first-time visitor. Look for repeated copy, missed destinations, clipped labels, cursor ambiguity and state leaks. Report issues with reproduction steps and file locations. The reviewer requests fixes through the lead.

Update VERIFICATION.md with the exact candidate, commands, results and remaining manual gaps. Keep prior evidence identifiable. If making commits, isolate mission-owned changes and preserve the pre-existing owner diff. Publication and real external submissions remain separate actions.

### Worker handoff template

Each later worker should receive this compact assignment.

- Work package ID and the relevant sections of this plan.
- Confirmed base source state and files already modified by the owner.
- Exact writable files and the person holding shared integration files.
- Frozen inputs, exports, data IDs and event contracts.
- Ordered implementation steps from the package.
- Required examples and commands that establish acceptance.
- Return format with changed files, verification results, observed limitations and any interface change needed.

Workers should stop editing a shared interface when a mismatch appears and send it to the lead, while continuing independent work inside their file boundary. They should not launch other workers or expand the task on their own.

## 9. Acceptance matrix and evidence

### 9.1 Commands

- npm test — existing analytic globe regression, plus only purposeful regressions added during the work.
- npm run build — canonical TypeScript and production bundling gate.
- git diff --check — whitespace validation.
- node scripts/globe-hover.check.cjs — development server only, using the running Vite module instance.
- node scripts/logo-intro.check.cjs — built preview through SITE_URL.
- Targeted browser journey checks for the new cursor and product/enquiry behavior.

Use the installed Playwright runtime through PLAYWRIGHT_MODULE when it is not a local dependency. Avoid changing dependencies solely for this planning handoff. Keep evidence outside public assets, keyed to the candidate's source/build hashes.

### 9.2 Required examples

| ID | Scenario | Expected result |
| --- | --- | --- |
| A01 | First homepage visit and logo completion | Startup finishes, globe composition and primary actions appear, no stale cursor label |
| A02 | Keyboard or modified logo activation | Keyboard focus works, modified click retains native navigation and ordinary home click replays |
| A03 | Mouse approaches compact Products, then moves to Textiles | Capsule adapts smoothly, text remains readable, real click chooses the actual link |
| A04 | Fine-pointer drawer row hover and boundary reversal | Filled Explore disc, stable target choice, no label-covering or flicker |
| A05 | Drawer Products link from homepage | Drawer closes, page unlocks, explorer is revealed and focus remains usable |
| A06 | Hero pointer moves over copy, empty space, land, ocean and controls | Correct actual surface state, Drag only on a scene hit, zero decorative picking |
| A07 | Drag globe or product past its edge and release | Capture ends correctly, chosen view settles and holds, no accidental navigation |
| A08 | Cancel by Escape, blur, pointercancel, hidden tab or route removal | Drag and cursor ownership clear, visible controls/native cursor recover |
| A09 | Open drawer while a scene is active | Scene manipulation cancels, menu wins over underlying scene and scrolling returns on close |
| A10 | Touch pan, pinch, then mouse on a hybrid device | Native touch gestures work, custom cursor hides, mouse can re-enable it |
| A11 | Keyboard-only and single-tap scene controls | All supported turns and reset are available, labels expose current pause state |
| A12 | Pause, change textile topic, leave route and return | Pause choice survives within the app session, no phase jump or hidden continuous draw |
| A13 | Toggle reduced motion or forced colours at runtime | Appropriate native/static presentation appears immediately, meaningful controls stay usable |
| A14 | Switch between enquiry categories and textile preview | Same typed answers survive, selected subject and hint agree |
| A15 | Direct valid/invalid category link and Back/Forward | Correct panel/subject, safe general fallback, no scroll jump from search-only changes |
| A16 | Submit, double click, then attempt category change | One frozen request, pending controls communicate the lock, receipt matches the request |
| A17 | Validation, rejection, network failure and unconfigured service | Input retained, correct recovery, acknowledgement only after confirmed acceptance |
| A18 | Legacy, corrupted, missing or unavailable receipt storage | Safe truthful receipt/no-record view |
| A19 | WebGL unavailable, lost or scene chunk fails | Text/fallback readable, no misleading Drag cue, focus recovers if controls disappear |
| A20 | Rapid route, menu and topic changes under pointer | No stale target, accumulated listener, invalid scene owner or lingering overflow lock |
| A21 | 200% text size and long category names | Navigation, tabs, form and controls remain usable without page-wide horizontal overflow |
| A22 | Read full home/textile/enquiry journey | Clear business and category roles, each section adds information, one caption/instruction per context |

### 9.3 Performance review

Keep the original globe proof as a guard. The new cursor must reuse its semantic hit and leave decorative raycast calls at zero. The existing <100ms maximum-event assertion is a coarse regression alarm. It is insufficient to establish fluid motion.

For the integrated candidate, record cursor-enabled and native-pointer traces on the same viewport and scene state. Use a 60-second movement/idle/scroll sequence, including the menu near the globe and an active textile object.

Proposed local targets are p95 cursor work below 2ms per processed frame and p95 combined pointer handling below 8ms on the recorded test machine. Investigate cursor-attributable long tasks over 50ms. Report hardware, browser, renderer, cadence, samples and actual values. A stable 30Hz renderer has a roughly 33ms frame interval, so do not label every interval above 25ms as a failure.

Instrument the cursor to confirm its scheduled writes stop after settling. Confirm hidden/offscreen scenes make no repeated draw calls and asset loads or size changes trigger the necessary single refresh. Check that repeated visits do not grow subscriptions, contexts or disposed geometries. Any later client-side change invalidates the affected visual and performance evidence.

### 9.4 Rendering and manual coverage

Capture around 390px, 768px, 1024px and 1440px widths, plus 320px for overflow. Use actual fine-pointer capability to cover the responsive drawer as well as compact desktop links. Test text scaling and keyboard focus. Capture the filled menu state, hollow Drag state, pressed state and native text input state on each relevant surface.

Headless/browser-emulated checks establish those environments only. Physical touch, Safari, screen readers and real inbox delivery stay recorded as gaps until they are directly exercised. Keep automated passes and manual evidence in separate columns.

## 10. Completion record and limits

For each package record owner, source state, files changed, acceptance IDs exercised, commands with exit status, captures, remaining gaps and the next dependency. The lead approves the integrated candidate against section 1.

The plan and the saved screenshots are the deliverables of the current task. The new cursor, page restructuring, motion values and control system are proposed implementation work. Existing globe and startup results are recorded in VERIFICATION.md.

The existing Three.js chunk warning remains an item for the baseline record. Address a new performance problem at its demonstrated source before changing mesh detail or extending the architecture.

## 11. Supporting guidance

- [R3F events and capture](https://r3f.docs.pmnd.rs/api/events) documents scene event and capture semantics used in P5A.
- [DOM pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) supports continuing a drag beyond its original target.
- [WCAG dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) supports a single-pointer alternative to dragging.
- [WCAG pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) informs the ambient-motion controls.

The reference-to-product and humanizer workflows guide adaptation and prose. Focused UI/UX Pro Max searches confirmed the relevance of hover-versus-touch handling, single-pointer drag alternatives and refs for non-reactive animation values. Its general warning about continuous decorative motion was weighed against the user's explicit rotation request. The chosen policy provides controlled rotation, pause and reduced-motion behavior.
