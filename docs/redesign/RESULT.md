# Redesign result: dye house

Branch `redesign/sourcing-desk`, 6 commits on top of `continuous_globe_about_page`. 37 files changed (+891, -1053).

## What changed

| Area | Before | After |
|---|---|---|
| Ground | Charcoal heroes, parchment body | Undyed cotton everywhere; indigo only for actions, the textiles band, About's closing call and the footer |
| Categories | Six 3D cards, then a six-screen 3D tour repeating them | The swatch book: six cotton strips dipped at the hem in their dye; opening one dyes the cloth and shows the brief |
| Colour | Ink, parchment, amber; the dye tokens defined but barely used | One dye per category, contrast measured, used only where that category is meant |
| Headings | One italic orange word on every heading | Plain headings |
| Labels | Mono uppercase, wide tracking | Sans, sentence case; mono only for numbers |
| Globe | Navy and tan (read as gold), poster images in the old colours | Indigo sea, cotton land; posters re-rendered; copy column given more room |
| Textiles cloth | Verdigris | Indigo, the textiles dye; poster re-rendered |
| Enquiry form | No category signal | A band in the chosen category's dye |
| Cursor | Custom cursor hiding the native one | Native cursor |
| Motion | Hover scaling, looping pulse/marquee/shimmer, blurred pill | Removed; the one motion is the dye rising in the swatch book |
| Copy | About claimed order tracking and lab-dip checks | Both removed (not in place); written terms kept |

Kept as you asked: the globe (refined), the logo intro (now draws in indigo on cotton), all routes, `content.ts` and its no-invented-facts rule, the enquiry logic.

## Checks run

- `tsc --noEmit` and `vite build`: pass after every commit.
- Tell-checker on source CSS: before 3 FAIL / 4 WARN (on built output); after **0 real FAIL**. The three remaining hits are false positives: a print stylesheet's white background, a comment mentioning backdrop-filter, and a CSS `content: '!'` error glyph.
- Contrast (WCAG): every dye measured against cotton. Dark dyes carry cotton text (5.1:1 to 12:1); turmeric and brass carry ink text (6.6:1, 4.8:1). Focus rings inside a dyed strip use the strip's text colour.
- Keyboard: swatch strips are disclosure buttons; Enter opens, Tab reaches the strip's link, `aria-expanded` and `hidden` update.
- Screenshots in a local production preview at desktop (1024 wide) and phone (375 wide): home, swatch book open and closed, textiles, about, enquiry.

## Bundle

| Chunk | Before | After |
|---|---|---|
| App JS (`index-*.js`) | 89.1 kB | 74.5 kB |
| CSS | 90.4 kB | 95.3 kB |
| three.js | 926 kB | 919 kB |

three.js stays because the globe and the textiles cloth stay.

## Not done or not verified

- **No design-critic re-score yet.** That needs the Vercel preview of this branch; it runs after the push.
- **Not tested:** real enquiry delivery (unchanged and still unverified, per the README), Safari/iOS, screen readers, reduced-motion by OS setting (CSS rules are in place, not exercised).
- **Category posters** (`public/posters/<category>*.webp`) are no longer used by any page after the tour was removed. Left in place; delete in a follow-up if wanted.
- **Dead CSS:** `site.css` and `products.css` still contain rules for removed components (wall, sourcing marquee, tiles). Harmless; a cleanup pass would cut the CSS size.
- **Gmail address** for the business is unchanged; that is not a code fix.
