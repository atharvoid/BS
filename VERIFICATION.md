# Verification — Part 2

Recorded 6 November 2026 on branch `arena/e210227c-bs`. Baseline:
`12f8ee2` ("Implement trade homepage and interactive product experience").

## What was run

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | Pass, no diagnostics |
| Production build | `npm run build` | Pass. `three` chunk 918.58 kB (242.74 kB gzip), app chunk 101.86 kB, CSS 68.41 kB |
| Regression tests | `npm test` | 2 Node tests pass (`globe-raycast`, `cursor-state`) |
| Stage scope guard | `node scripts/stage-scope.mjs` | Pass over 36 files; verified it **fails** when `useThree` is reintroduced into a component that renders `<Stage>` |
| Route smoke (jsdom) | six routes rendered through the real app tree | `/`, `/textiles`, `/enquiry`, `/enquiry/acknowledgement`, `/privacy`, `*` all render with **zero** console errors |

### Route smoke detail

`/` renders 3 sections: hero with `Import and export / sourcing in India.`,
the six category tiles in order (Textiles & fabrics · Handicrafts & home decor ·
Agriculture & food · Industrial materials · Organic & sustainable · Something
else), the running category list, **0** scene-control elements, **0** skip
buttons, intro state `idle`, and the cursor mounted.

`/textiles` renders 5 sections and 2.8k characters of copy (up from 2.2k before
the fabric brief replaced the four-object sequence).

## What could not be verified here

- **No real browser.** This sandbox has no Chromium and no route to a browser
  download, so the Playwright checks in `scripts/` (`cursor.check.cjs`,
  `logo-intro.check.cjs`, `globe-hover.check.cjs`, `product-journey.check.cjs`)
  were **updated to the new behaviour but not executed**. They need one run
  against `npm run dev` on a machine with Playwright installed:

  ```bash
  PLAYWRIGHT_MODULE=/path/to/playwright npm run dev &
  node scripts/cursor.check.cjs
  node scripts/logo-intro.check.cjs
  node scripts/globe-hover.check.cjs
  node scripts/product-journey.check.cjs
  ```

  `product-journey.check.cjs` will fail as written: it drives the old tiled
  `tablist`, which no longer exists. It needs rewriting for the category links
  before it is useful again.
- **Frame-rate behaviour of the adaptive system** is unit-reasoned, not
  observed on hardware. The thresholds (33fps / 50fps, two bad windows, six
  good) are a first setting and should be tuned against a real mid-range
  Android.
- **Six live tile canvases on a real GPU.** They are gated to
  `(min-width: 900px) and (any-pointer: fine)` precisely because that is the
  case most likely to run out of WebGL contexts, but the gate is a judgement,
  not a measurement.
- **Touch, Safari, screen readers** — unchanged from the earlier record and
  still unqualified.
- **Real enquiry delivery** through Web3Forms — still unconfirmed. This remains
  the site's only conversion path and the largest operational risk.

## Screenshot-free review of the visual fixes

The globe framing, the Explore disc geometry, the tile row height and the
intro timeline are all checked as *numbers* (see `CHANGES.md` §1, §3, §6), which
is what can be verified without a rendering browser. The judgement of "feels
like the earlier version" still needs a human eye on a real screen — that is the
one thing this record cannot substitute for.
