# Baseline (before redesign), 2026-11-24

Branch: continuous_globe_about_page @ c2a8a75

## Bundle (vite build)
```
dist/assets/index-CzI7gKpT.css                                 90.39 kB │ gzip:  17.99 kB
dist/assets/rolldown-runtime-XKyaHtl9.js                        0.72 kB │ gzip:   0.42 kB
dist/assets/TextileHeroScene-BzZUN-fV.js                        0.84 kB │ gzip:   0.53 kB
dist/assets/FrameReporting-C2sKncM_.js                          1.43 kB │ gzip:   0.73 kB
dist/assets/StageCanvas-DCMxVMQ4.js                             1.59 kB │ gzip:   0.90 kB
dist/assets/objects-BXysXFRl.js                                11.24 kB │ gzip:   4.78 kB
dist/assets/HeroScene-DQzDsWaS.js                              17.55 kB │ gzip:   6.80 kB
dist/assets/Gallery-zf4u8mEb.js                                24.58 kB │ gzip:  10.17 kB
dist/assets/index-BycptDJO.js                                  89.05 kB │ gzip:  27.58 kB
dist/assets/react-DmxiwTkv.js                                 257.23 kB │ gzip:  81.63 kB
dist/assets/three-BXCk2_RY.js                                 926.42 kB │ gzip: 245.15 kB
```

## Tell-checker on built CSS + JS
```
FAIL no-direction         No design direction comment (Product, World, Moment)
FAIL hover-scale          Hover scale on elements
FAIL pure-white-page      Pure white page background
FAIL emoji-ui             Emoji in visible text
WARN backdrop-blur        Backdrop blur / glassmorphism
WARN infinite-anim        Infinite/pulse/bounce animation
WARN dashed               Dashed/dotted borders
WARN exclamations         Exclamation marks in copy

8 findings, 4 FAIL. Grep only: now render at 1440/820/390 and look.
```

Design review scores (Codex + Claude, desktop and mobile): Distinctiveness 2, Coherence 3, Hierarchy 3, Craft 2, Usability 2, Restraint 2. Full review: design-ecosystem/reviews/bs-eximnexus.md
