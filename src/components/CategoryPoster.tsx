import type { CategoryMotif } from '../three/categoryObjects'

/* ==========================================================================
   Stills of the six objects.

   These are renders of the actual models — same geometry, same generated
   textures, same light, same three-quarter angle — captured once and shipped as
   images. They are what the row shows before the scene has drawn, on a device
   that should not animate, and if WebGL is unavailable.

   A render rather than a drawing: an illustration in the same palette still
   reads as a different object, and the row's whole point is that the tile shows
   what the category contains. A render matches the live tile exactly, so the
   switch from still to 3D is invisible.

   Kept small: 384×270 WebP, 21 KB for all six. Served from /public rather than
   bundled, so each is a stable URL that can be cached across deploys and can be
   fetched by a page that never loads the three bundle at all.
   ========================================================================== */

const STILLS: Record<CategoryMotif, string> = {
  textiles: '/posters/textiles.webp',
  handicrafts: '/posters/handicrafts.webp',
  agriculture: '/posters/agriculture.webp',
  industrial: '/posters/industrial.webp',
  organic: '/posters/organic.webp',
  general: '/posters/general.webp',
}

type Props = { motif: CategoryMotif; className?: string }

/**
 * The still for one category.
 *
 * Decorative in every use: the tile's own label and link carry the meaning, so
 * it is hidden from assistive technology and given no alt text to announce.
 *
 * Width and height are declared so the row reserves the right space before the
 * image decodes — the tile must not grow under the pointer.
 */
export function CategoryPoster({ motif, className }: Props) {
  return (
    <img
      className={className ? `poster ${className}` : 'poster'}
      src={STILLS[motif]}
      alt=""
      width={384}
      height={270}
      /* Below the fold until the row is scrolled to; the live scene covers it
         long before a visitor gets there. */
      loading="lazy"
      fetchPriority="low"
      decoding="async"
      draggable={false}
      aria-hidden="true"
    />
  )
}
