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

   750×600 transparent WebP renders. Served from /public rather than
   bundled, so each is a stable URL that can be cached across deploys and can be
   fetched by a page that never loads the three bundle at all.
   ========================================================================== */

const STILLS: Record<CategoryMotif, string> = {
  textiles: '/posters/textiles-mobile.webp',
  handicrafts: '/posters/handicrafts-mobile.webp',
  agriculture: '/posters/agriculture-mobile.webp',
  industrial: '/posters/industrial-mobile.webp',
  organic: '/posters/organic-mobile.webp',
  general: '/posters/general-mobile.webp',
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
      srcSet={`${STILLS[motif].replace('.webp','-small.webp')} 375w, ${STILLS[motif]} 750w`}
      sizes="(max-width:355px) 90vw, (max-width:599px) 44vw, (max-width:980px) 30vw, 300px"
      alt=""
      width={750}
      height={600}
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
