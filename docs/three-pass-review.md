# Three-pass review — score not certified at 9/10

## Decision

**Overall remains 7/10, provisional. I cannot substantiate 9/10.**

The three passes found and corrected real functional and viewport defects. They
also confirmed unresolved delivery, deployment and device-evidence gaps. A score
must reflect those gaps rather than increase merely because another pass ran.
No speculative redesign, invented business facts, deployment changes or real
form transmission were performed. The approved cursor, dropdown, intro and
textile-page component remain untouched.

These are three separate, adversarial **self-review passes**, not three
independent human/LLM audits. Tests reduce confirmation bias but do not make a
review objectively unbiased. The overall site rating stays constrained by the
same launch blockers after each pass; pass-specific successes are not converted
into an artificial whole-site 9.

## Fixed assessment criteria

For a defensible 9/10 B2B site, at minimum:

1. A buyer can understand the offer and contact the business; accepted and failed
   enquiries must produce truthful status even under environmental failures.
2. Important text and controls remain readable/reachable without being covered
   by navigation or the dock, including narrow/short viewports and keyboard use.
3. Animations do not trap navigation; static rendering is the same retained
   scene, failures expose useful content, and contexts are released on routing.
4. Performance is proven on representative physical devices, not inferred from
   an idle browser or a software renderer. Targets require LCP/INP/CLS evidence.
5. Business evidence, actual inbox delivery and public deployment behaviour are
   verified. Client-side metadata and mocked API acceptance are insufficient.

## Pass 1 — task correctness and failure semantics

**First-principles question:** does the visitor receive truthful confirmation of
what actually happened, independently of optional browser facilities?

- Re-ran unit tests, production build and browser scroll/dock/frozen-frame checks.
- Built a separate fixture with an explicitly fake public form key. All external
  requests were intercepted or blocked; no real message was delivered.
- Reproduced a concrete bug: mocked provider acceptance with sessionStorage
  blocked led to “No enquiry recorded in this tab.” Normal storage produced
  “Enquiry submitted.” A successful outcome depended on optional storage.
- Fixed it by retaining only the accepted receipt in document memory before
  attempting storage. The newest accepted receipt takes priority if storage
  quota leaves an older receipt behind. A new document does not fabricate an
  acceptance. Added accurate privacy wording for this fallback.
- Added five unit regressions for blocked storage, quota/stale data, persistence,
  malformed data and a new-document/no-storage state.
- Browser recheck: accepted, blocked-storage acceptance, HTTP 429 rejection,
  network failure and malformed JSON all produce truthful outcomes. Two
  synchronous submits produce one request, not two. Failed submissions retain
  the entered brief and do not navigate to acknowledgement.
- Added missing invalid-state semantics to the role radio group.

**Review outcome:** confirmed defect corrected; delivery semantics tested with
mocks. Real inbox delivery remains unverified. Whole-site 9/10 gate: **not met**.

## Pass 2 — usability, accessibility and adversarial viewport geometry

**First-principles question:** can a visitor actually read and activate the
current requirement's action, rather than merely finding it in the DOM?

- Checked all six reading chapters, not just the first and final dock, at
  320×568, 390×844, 768×1024, 844×390 and 1440×900.
- Compared actual action/heading rectangles with the sticky header and dock.
- Found a small heading overlap at 320×568. Corrected the existing compact
  spacing; all six reading states now fit without header/CTA obstruction.
- Found all six action links covered by the dock at 844×390. Rather than shrink
  copy, truncate information or redesign the site, viewports under 480px high
  now use the existing ordinary category directory, with six direct links.
  Normal-height portrait/tablet/desktop choreography is unchanged.
- Re-ran the full matrix after the fixes. The 24 normal-height reading states
  pass the geometry checks; the short landscape case has a zero-height runway
  and all six directory links. No horizontal document overflow was found.
- Verified mobile menu opening makes covered main content inert; Escape restores
  it and returns focus to the menu toggle.
- Re-ran axe WCAG 2 A/AA and 2.1 AA scans on six routes at 1440 and 390px: no
  reported violations or page errors. That is automated evidence, not manual
  screen-reader certification or a guarantee that every visual contrast passes.

**Review outcome:** real responsive defects corrected without changing the
normal approved layouts. Physical iPhone/Android, pinch zoom, manual assistive
technology and actual touch ergonomics remain unverified. Whole-site 9/10 gate:
**not met**.

## Pass 3 — performance, lifecycle and operational truth

**First-principles question:** is the site reliable under real loading and
navigation, and is there evidence for its production claims?

Three fresh browser-context home loads, first approximately 14 seconds:

| Run | Intro attribute cleared after navigation | Sum of long-task durations | Maximum long task |
| --- | ---: | ---: | ---: |
| 1 | 3158ms | 1430ms | 680ms |
| 2 | 3166ms | 1109ms | 410ms |
| 3 | 3166ms | 1047ms | 350ms |

These contexts share one Chromium process, so they are **not three cold GPU/OS
starts**. The sum is long-task duration, not Total Blocking Time or INP. The
intro clears approximately three seconds after it starts, but nontrivial shader
startup work remains after it. SwiftShader cannot certify physical-device
performance or justify arbitrary visual degradation to improve a local score.

Lifecycle check, repeated home → textiles → privacy → home three times:

- Once renderers are ready: textiles = 1 active context, privacy = 0, home = 2.
- Counts return to the same values each cycle; no accumulating contexts or page
  errors were observed in these cycles.
- An early version of the test sampled at a fixed delay before textile rendering
  initialized. The test was corrected to wait for the renderer, rather than
  misclassifying asynchronous loading as a missing model. No application change
  was made on the basis of that premature sample.
- Fresh `/privacy` fetches no Three chunk.
- Runtime dependency audit reports zero known vulnerabilities at check time.
  This is not an application/server security certification.
- An unknown URL on Vite preview returns HTTP **200**, even though the app shows
  a 404 page. Actual host rewrite/404/cache/SEO behaviour remains unverified.
  No guessed hosting configuration or unrequested deployment was introduced.

**Review outcome:** lifecycle and entry-bundle checks pass. Remaining loading
work, soft-404 preview behaviour and absent production/device evidence prevent
performance/launch certification. Whole-site 9/10 gate: **not met**.

## What changed in this follow-up

Only targeted changes were made:

- Storage-independent, truth-preserving accepted-receipt state, with regression
  tests and a privacy clarification.
- Radio-group invalid-state semantics.
- Compact heading spacing and a readable existing-directory bypass below 480px
  viewport height.
- Reproducible mocked-delivery and viewport/keyboard browser checks.

No changes to the cursor, custom dropdown, intro animation, textile-page
component, product models, lighting, palettes or normal-height chapter design.
The temporary mock-delivery server was stopped. The normal build uses the normal
configuration, not the fixture's fake key.

## Verification and reproducibility

- `npm test`: **61 passing**, plus R3F stage scope guard.
- `npm run build`: pass; the optional Three chunk-size warning remains disclosed.
- `scripts/category-journey.check.mjs`: scroll/reverse/dock/retained canvas and
  repeated frozen-frame pixel equality passed at the start of this review.
- `scripts/viewport-journey.check.mjs`: new full viewport/keyboard test, rerun
  successfully after fixes against the normal production build.
- `scripts/enquiry-delivery.check.mjs`: five intercepted delivery scenarios,
  including duplicate-submit guard; uses only a separate fixture build.
- `docs/reviews/three-pass-evidence.json`: recorded layout/lifecycle/load evidence.

Browser scripts require a separately installed Playwright package, optional
`BROWSER_EXECUTABLE`, and `SITE_URL`; see their headers. No test-only key, mock
endpoint or customer-facing quality control was added to application code.

## What must happen before claiming 9/10

1. Configure the real submission service and verify an actual test message in
   the authorized business inbox. The existing email fallback is not evidence
   that form delivery works.
2. Supply verified, publication-approved business identity/contact information
   and relevant textile sourcing evidence. Do not invent registrations,
   supplier relationships, certifications, stock, testimonials or shipment
   history.
3. Test physical Android Chrome and iPhone Safari, including touch cancellation,
   pinch zoom, background recovery and field-like performance. Measure actual
   LCP/INP/CLS and trace remaining startup costs on real GPUs.
4. Verify the actual production host's HTTP 404s, rewrites, prerendering/indexing,
   canonical domain, cache/compression/security headers and preview no-index.
5. Obtain a genuinely independent review for any claim of independent sign-off.

Until these are available, the safe action under “if you cannot, don't mess with
the website” is to stop speculative changes, retain the verified fixes, and state
that **9/10 has not been achieved or certified**. No push or deployment implied.
