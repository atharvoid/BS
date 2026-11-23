# AI photo prompts (for arena.ai)

All images are labelled on the site as "Representative image, not a photograph of supplier stock". No brand names, no text, no people's faces, no watermarks.

Shared style line (append to every prompt):
> Realistic product photograph, natural soft daylight from the left, shallow depth of field, plain warm off-white linen backdrop (#F2EBDD), subtle real texture, no text, no logos, no watermark, 3:2 landscape, high detail, true-to-life colour.

| File (public/photos/) | Used for | Prompt |
|---|---|---|
| `textiles.webp` | Swatch: Textiles & fabrics | A neatly rolled bolt of deep indigo cotton twill fabric lying on its side, the loose end unrolled across the surface, visible woven texture and fine slubs, a folded swatch of the same fabric beside it. |
| `handicrafts.webp` | Swatch: Handicrafts & home decor | A hand-thrown ceramic vase painted with indigo floral motifs in the Indian blue-pottery style, beside a small carved wooden box, real glaze reflections and tool marks. |
| `agriculture.webp` | Swatch: Agriculture & food | A few ripe golden wheat ears and loose wheat grains spilling from a small jute sack, plus a small brass bowl of turmeric root pieces, real husk detail. |
| `industrial.webp` | Swatch: Industrial materials | A coil of copper wire, a few steel fasteners and a short length of aluminium extrusion arranged on the surface, realistic metal reflections, clean industrial look. |
| `organic.webp` | Swatch: Organic & sustainable products | A close-up of a natural open cotton boll on its dried brown stem, soft white fibres with visible strands, two more bolls behind slightly out of focus. |
| `crate.webp` | Swatch: Other sourcing requests | A plain new pine-wood export shipping crate photographed straight-on, front face square to the camera, smooth unmarked front panel (the logo is added afterwards in code), rope handle on the side. |
| `region-tamil-nadu.webp` | Textiles page: Tamil Nadu card | Close-up of handloom cotton fabric in indigo blue with fine woven checks and a thin contrasting border, folded in soft layers, real thread texture (Tamil Nadu handloom style). |
| `region-gujarat.webp` | Textiles page: Gujarat card | Close-up of block-printed cotton fabric in warm bronze and rust tones with small repeating motifs (Gujarat block-print style), folded in soft layers, real thread texture. |

## The crate logo
AI image tools cannot reproduce the exact BS EXIMNEXUS mark. The crate is generated with a blank front face, and the real logo (`src/components/Logo.tsx`, gold) is printed onto that face as a stencil in code, so it is sharp and correct. "Made in India" is not added.

## After generation
1. Save each image to `public/photos/` with the file name above (webp, about 1600px wide).
2. In `src/content.ts`, change each `CATEGORY_IMAGES` entry's `src` to `/photos/<file>` and `kind` to `'photo'`.
3. In `src/pages/Textiles.tsx`, the region cards use the two region images.
