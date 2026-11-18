import type { CategoryMotif } from '../three/categoryObjects'
import React from 'react'
import { CATEGORY_MATERIALS_VERSION, WHEAT_PRESENTATION, TEXTILE_PRESENTATION, WHEAT_VERSION, TEXTILE_VERSION, type PresentationStore } from '../three/category-presentation'

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
  textiles: `/posters/textiles-mobile.webp?v=${TEXTILE_VERSION}`,
  handicrafts: `/posters/handicrafts-mobile.webp?v=${CATEGORY_MATERIALS_VERSION}`,
  agriculture: `/posters/agriculture-mobile.webp?v=${WHEAT_VERSION}`,
  industrial: `/posters/industrial-mobile.webp?v=${CATEGORY_MATERIALS_VERSION}`,
  organic: `/posters/organic-mobile.webp?v=${CATEGORY_MATERIALS_VERSION}`,
  general: `/posters/general-mobile.webp?v=${CATEGORY_MATERIALS_VERSION}`,
}

type Props = { motif: CategoryMotif; className?: string; sizes?: string; eager?: boolean }

/**
 * The still for one category.
 *
 * Decorative in every use: the tile's own label and link carry the meaning, so
 * it is hidden from assistive technology and given no alt text to announce.
 *
 * Width and height are declared so the row reserves the right space before the
 * image decodes — the tile must not grow under the pointer.
 */
export function CategoryPoster({ motif, className, sizes, eager }: Props) {
  const presentation = motif === 'agriculture' ? WHEAT_PRESENTATION : motif === 'textiles' ? TEXTILE_PRESENTATION : null
  if (presentation) return <RetainedPoster motif={motif} presentation={presentation} className={className} sizes={sizes} eager={eager} />
  return <PosterImage motif={motif} className={className} sizes={sizes} eager={eager} />
}

function RetainedPoster({ motif, presentation, className, sizes, eager }: Props & { presentation: PresentationStore }) {
  const image = React.useRef<HTMLImageElement>(null)
  const pair = React.useSyncExternalStore(presentation.subscribe, presentation.get, () => null)
  const [height, setHeight] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = image.current
    if (!el) return
    const read = () => setHeight(el.getBoundingClientRect().height)
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const retained = presentation.valid(pair, height, window.devicePixelRatio, false) ? pair.image : undefined
  // Fine wheat husks need the full source on high-DPR two-column cards;
  // low-DPR/static cards still select the small asset from the same srcset.
  const imageSizes = sizes ?? (motif === 'agriculture' ? '(max-width:980px) 90vw, 300px' : undefined)
  return <PosterImage motif={motif} className={className} sizes={imageSizes} eager={eager} retained={retained} imageRef={image} />
}

function PosterImage({ motif, className, sizes, eager, retained, imageRef }: Props & { retained?: string; imageRef?: React.Ref<HTMLImageElement> }) {
  return (
    <img
      ref={imageRef}
      className={className ? `poster ${className}` : 'poster'}
      src={retained ?? STILLS[motif]}
      srcSet={retained ? undefined : `${STILLS[motif].replace('.webp','-small.webp')} 375w, ${STILLS[motif]} 750w`}
      sizes={sizes ?? '(max-width:355px) 90vw, (max-width:599px) 44vw, (max-width:980px) 30vw, 300px'}
      alt=""
      width={750}
      height={600}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'auto' : 'low'}
      decoding="async"
      draggable={false}
      aria-hidden="true"
    />
  )
}
