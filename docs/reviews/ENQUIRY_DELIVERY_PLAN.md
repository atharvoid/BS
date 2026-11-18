# Web3Forms enquiry delivery plan

Update: the customer-facing CAPTCHA was removed after local preview failures and usability feedback. The current flow uses Web3Forms' built-in spam screening. See the README for current setup. The hCaptcha steps below describe the superseded plan.

Date: 2026-11-18

Status: implemented locally. The public form access key and test recovery address are configured in ignored local settings. Dashboard enforcement, live delivery and hosted verification are pending.

Local verification on 2026-11-18: all 91 repository tests passed, the Vite production build succeeded with its large Three.js chunk warning, and eight isolated browser scenarios passed. The real hCaptcha widget loaded on the local form. The live test marker is `BS-ENQUIRY-LIVE-01`.

## Outcome and scope

A visitor submits the existing enquiry form without opening an email application. Web3Forms processes the submission and emails its complete contents to the configured test inbox. The recipient can click Reply to address the visitor. Keep the approved visual design, categories and visitor roles.

The essential services are the existing website, the owner's Web3Forms account, its included hCaptcha integration and the selected Gmail inbox. No Gmail API, SMTP credentials, OAuth application, custom server, database or automation platform is needed. Use the free plan; no paid integration is part of this plan.

Pipeline: existing React form -> browser validation and hCaptcha -> Web3Forms submission API -> Gmail notification and provider dashboard -> manual business follow-up.

## Current implementation and gaps

- `src/components/EnquiryForm.tsx` already posts JSON to Web3Forms, sets Reply-To, checks HTTP status and `success === true`, guards concurrent submits and retains input after failure.
- The primary action becomes `Prepare email` if the access key is absent **or if the reserved CAPTCHA environment setting is populated**. No CAPTCHA widget/token flow currently exists.
- `src/components/receipt-store.ts` provides a minimal accepted-submission receipt with an in-memory fallback when browser storage is blocked. Reuse it.
- `scripts/enquiry-delivery.check.mjs` already exercises mocked acceptance, rejection, network errors, invalid JSON, blocked storage and duplicate in-flight submissions. It deliberately cannot prove real delivery.
- `.env.example` documents the unconnected state. No local `.env.local` or `.vercel` link was found during inspection. `vercel.json` describes a Vite deployment, but the current hosting project and its environment configuration have not been verified.
- Public contact links currently use the company's address from `src/content.ts`. That file and several visual files already have concurrent edits. Preserve them; change only the required lines after checking the current diff.

## Implementation sequence

### 1. Verify the provider configuration

1. Open the existing Web3Forms account associated with the selected Gmail address.
2. Confirm that the supplied key belongs to this form and its destination is exactly the configured test inbox. The key alone cannot prove its recipient.
3. Check the free-plan quota and current usage. Verify access to the form's dashboard/history.
4. Coordinate enabling mandatory hCaptcha in the form's dashboard with the completed widget/token implementation. Record this as pending until observed; adding a widget alone does not enforce CAPTCHA at the provider.

Owner login, email verification or dashboard access may require the owner to act. No email password, recovery code, OAuth token or SMTP app password is required.

### 2. Connect configuration and submission

1. Put the supplied public form key in ignored `.env.local` as `VITE_WEB3FORMS_KEY`. Commit only placeholders and setup instructions.
2. Add one optional enquiry fallback-address override, defaulting to `BUSINESS.email`; set it to the selected test mailbox locally. Use it for form failure/unavailable contact and acknowledgement follow-up. Keep the company's general public contact identity intact.
3. Keep direct browser-to-Web3Forms JSON submission. Do not add a server proxy: the provider documents free usage as client-side.
4. Preserve all existing answers. Send canonical `name`, `email` and `message` fields, the category, visitor role and destination/location, plus `replyto` set to the visitor's trimmed email.
5. Use a stable business sender display name and a subject containing the business, category and visitor role. Do not impersonate the visitor's email as the notification sender.
6. Validate allowed visitor roles and category handling, trimmed required fields and existing length limits. Never record form contents, keys or CAPTCHA tokens in diagnostic logs.

The access key determines the notification recipient. A client-side fallback email setting does not change that recipient.

### 3. Complete spam protection and recovery

1. Use Web3Forms' supported free hCaptcha integration and shared free-plan site key. No separate hCaptcha account is required. Prefer the documented React component for its lifecycle handling; if added, this is the only new runtime dependency needed.
2. Replace the reserved CAPTCHA flag with an actual widget/token lifecycle. Submit a current `h-captcha-response` token; handle expiry, rejection, reset and script-load failure. Missing or expired tokens must not silently downgrade to an unprotected submission.
3. Load CAPTCHA on the enquiry route, clean up on unmount and support route return, keyboard operation and narrow screens.
4. Show `Send enquiry` and `Sending...` in the connected flow. Remove prepared-email UI from the normal submission path. Retain a plain manual email recovery link when online sending is unavailable.
5. Preserve draft contents on failure, prevent a second in-flight request and allow a deliberate retry. Do not automatically retry uncertain requests: a timeout can occur after the provider accepted the message, so a retry can deliver a duplicate.
6. Distinguish validation/CAPTCHA errors, provider rejection or throttling, and an unconfirmed network/timeout outcome. Do not promise exactly-once email delivery.
7. Show acknowledgement only after provider acceptance. Say the enquiry was submitted for review, without promising confirmed inbox arrival or inventing a response deadline. A direct acknowledgement URL without a receipt must not imply submission.

### 4. Align privacy and owner operations

1. Update the enquiry privacy notice for hCaptcha and its processor policy. Review existing blanket cookie/tracking wording against the actual widget behaviour. Continue keeping full drafts out of localStorage, cookies and sessionStorage.
2. Keep the minimal receipt and its existing blocked-storage recovery.
3. After observing a genuine notification, document a narrowly matched Gmail filter for this form's sender and subject prefix, an `BS EXIMNEXUS enquiries` label, and optional phone notifications. Configure mailbox settings through the owner; the website needs no inbox access.
4. Explain dashboard history, quota warnings and how to check Gmail Spam/Promotions if a notification is missing. Keep test data synthetic and avoid retaining buyer information in screenshots or logs.
5. Update the existing README and `.env.example` with setup, verification and handover instructions. Do not claim verified delivery until inbox evidence exists.

### 5. Verify the complete journey

Use the existing commands, then extend the current enquiry browser check rather than building a new testing system:

```text
npm test
npm run build
node scripts/enquiry-delivery.check.mjs
```

The browser command requires its documented isolated fixture build, `SITE_URL`, Playwright path if needed, and the existing mocked key. Build that fixture into a separate ignored output directory so it cannot overwrite a normal build. Intercept the submission endpoint and CAPTCHA in mocked checks; do not use the real key or send test-suite emails. Cover:

- Invalid fields, whitespace and maximum lengths; no request before validation succeeds.
- All visitor roles and category entry points preserve the correct payload.
- Current, missing, expired and rejected CAPTCHA tokens, widget failure and route return.
- Provider acceptance, rejection/429, network failure, timeout and malformed responses.
- Double clicks, preserved drafts after failure, explicit retry and blocked storage.
- Acknowledgement without a receipt, keyboard operation and phone layout.

For actual delivery, use the browser and real CAPTCHA. Submit a small number of clearly labelled synthetic enquiries with unique subjects, spaced to avoid throttling. Confirm all fields arrive in the configured test inbox, then inspect Reply-To using a distinct visitor email. A reply draft can verify its destination; do not send an outbound reply without a separate need. Check dashboard visibility as a secondary record.

Record outcomes separately: automated checks, browser observations, provider acceptance and owner-confirmed Gmail arrival. If mailbox access is unavailable, ask the owner to confirm the unique test subject; do not mark arrival as verified from an API response.

### 6. Hosting configuration and client handover

After local checks and inbox confirmation, identify the actual hosting project and configure the appropriate preview environment with the same key and fallback address. Vite variables are embedded at build time, so changing a key requires a new build/deployment. Verify delivery on the actual hosted origin because provider domain restrictions can differ from localhost.

Keep deployment as an explicit release step after implementation review. Before production is relied on, repeat the hosted submission/inbox check and confirm which mailbox is intentionally receiving enquiries.

For handover, the client creates/owns their Web3Forms form, verifies their business mailbox and enables equivalent CAPTCHA enforcement. Replace the form key and fallback override, rebuild/deploy, verify arrival and Reply-To again, then retire the developer's test configuration. Prior developer test submissions do not automatically transfer to the client's account.

## Acceptance and cost boundary

Complete means: a valid enquiry from the actual intended origin passes enforced CAPTCHA, is accepted once for a single in-flight submission, reaches the selected Gmail inbox with every answer, and exposes the visitor as Reply-To. Failure leaves the visitor's text available with truthful recovery guidance. Existing visual work remains intact.

The published free plan currently includes 250 submissions per month and 30 days of dashboard history. Above the quota, new submissions stop until reset or upgrade. This plan adds no backend hosting bill; existing site/domain costs remain separate. Attachments, customer email autoresponders, paid CAPTCHA alternatives, webhooks, WhatsApp alerts, Sheets automation and a custom CRM are outside this first implementation.

## Primary references checked 2026-11-18

- [Web3Forms pricing, quota behaviour and dashboard history](https://web3forms.com/pricing)
- [API: browser submission, fields and responses](https://docs.web3forms.com/getting-started/api-reference)
- [hCaptcha: shared free key, React integration and mandatory dashboard setting](https://docs.web3forms.com/getting-started/customizations/spam-protection/hcaptcha)
- [Reply-To behaviour](https://docs.web3forms.com/getting-started/customizations/custom-reply-to)
- [Delivery, Gmail filtering, domain and rate-limit troubleshooting](https://docs.web3forms.com/getting-started/troubleshooting)
