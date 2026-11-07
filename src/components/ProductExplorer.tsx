import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, type CategoryId } from '../content'
import type { CategoryMotif } from '../three/categoryObjects'
import { Arrow } from './Nav'
import { CategoryPoster } from './CategoryPoster'
import { introActive, onIntroChange } from './intro-state'

/* ==========================================================================
   What are you looking to source?

   One row of category tiles, each with a live object turning inside it, and a
   running marquee under the row that names every product area. It is the first
   thing after the hero, so it is kept to one screen: the tiles are the
   navigation, the marquee is the inventory of what the business covers.

   The six objects are drawn by one shared canvas behind the row (see
   Gallery), not by six: a browser caps live WebGL contexts at about eight, the
   hero holds one, and that cap is what previously kept phones on swatches.
   With one context the row costs the same on a phone as on a desktop, so there
   is no longer a desktop-only gate.

   Every tile also holds a still of its own object. The still is what shows
   before the scene has drawn, on a device that should not animate, and if WebGL
   is unavailable — so the row is never empty and never a coloured block.

   Nothing in the row is draggable and there are no controls on the objects: the
   tile is a link and the object inside it is decoration, so a tap anywhere in
   the tile always does the same thing.
   ========================================================================== */


type Tile = {
  id: CategoryId
  label: string
  note: string
  motif: CategoryMotif
  /** Where this tile goes. Textiles has its own page; the rest open an enquiry. */
  to?: string
}

/** The marquee is the full product list, in the same order as the tiles. */
const TILES: Tile[] = [
  { id: 'textiles', label: 'Textiles & fabrics', note: 'Woven, printed, dyed', motif: 'textiles', to: '/textiles' },
  { id: 'handicrafts', label: 'Handicrafts & home decor', note: 'Made by hand', motif: 'handicrafts' },
  { id: 'agriculture-food', label: 'Agriculture & food', note: 'Crop and ingredient', motif: 'agriculture' },
  { id: 'industrial-materials', label: 'Industrial materials', note: 'Inputs and components', motif: 'industrial' },
  { id: 'organic-sustainable', label: 'Organic & sustainable', note: 'Evidence per product', motif: 'organic' },
  { id: 'general', label: 'Something else', note: 'Describe the need', motif: 'general' },
]

const hrefFor = (tile: Tile) => tile.to ?? `/enquiry?category=${tile.id}`

const RIBBON = CATEGORIES.map((category) => category.label)

/* -------------------------------------------------------------------------- */
/* The section                                                                 */
/* -------------------------------------------------------------------------- */

/* Whether the browser can give us a WebGL context at all. Resolved once, before
   the row mounts, so a device without WebGL shows the stills from the first
   paint and never downloads the three bundle. */
const canRender3D = () =>
  typeof window !== 'undefined' &&
  typeof window.WebGLRenderingContext !== 'undefined' &&
  (() => {
    try {
      const probe = document.createElement('canvas')
      const gl = probe.getContext('webgl2') || probe.getContext('webgl')
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      return !!gl
    } catch {
      return false
    }
  })()

export function ProductExplorer() {
  const strip = React.useRef<HTMLUListElement>(null)
  /* `live` mounts the shared canvas; `drawn` says it has put pixels on screen.
     The stills are only covered by `drawn`, so the row is never empty while the
     three bundle loads or while a lost context recovers. */
  const [live, setLive] = React.useState(false)
  const [drawn, setDrawn] = React.useState(false)
  /* The opening holds the page for three seconds. The row's objects are the
     first thing below the fold, so they would otherwise be compiling their
     shaders and generating six sets of textures at the same moment the globe
     is — behind a curtain nobody can see through. Waiting for the curtain to
     lift costs nothing the visitor can perceive and keeps the first frames
     after it smooth. */
  const [introDone, setIntroDone] = React.useState(() => !introActive())

  const nudge = (direction: 1 | -1) => {
    strip.current?.scrollBy({ left: direction * 280, behavior: 'smooth' })
  }

  /* The gallery is loaded only when the row is close to the viewport: the three
     bundle is the largest thing the site ships, and the row is below the fold.
     Until it arrives, and if it never does, the stills carry the row. */
  React.useEffect(() => onIntroChange((active) => setIntroDone(!active)), [])

  React.useEffect(() => {
    const el = strip.current
    if (!el || !canRender3D() || !introDone) return
    if (!('IntersectionObserver' in window)) {
      setLive(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true)
          io.disconnect()
        }
      },
      /* A screen of slack: the row is below the fold, and by the time it is
         scrolled to the first frame should already be there. */
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [introDone])

  return (
    <section className="sourcing" id="products">
      <div className="shell">
        <div className="sourcing__head">
          <div>
            <p className="eyebrow">Product areas</p>
            <h2 className="sourcing__title">
              What are you looking to <em className="display-italic">source?</em>
            </h2>
          </div>
          <div className="sourcing__tools">
            <p className="sourcing__hint">Choose a category to start an enquiry.</p>
            <div className="sourcing__arrows">
              <button type="button" aria-label="Scroll categories left" onClick={() => nudge(-1)}>←</button>
              <button type="button" aria-label="Scroll categories right" onClick={() => nudge(1)}>→</button>
            </div>
          </div>
        </div>

        <div className="tiles">
          <ul className="tiles__list" ref={strip}>
            {TILES.map((tile, index) => (
              <li key={tile.id} className="tile" style={{ ['--i' as string]: index }}>
                <Link
                  to={hrefFor(tile)}
                  className="tile__link"
                  aria-label={`${tile.label} — ${tile.note}`}
                >
                  {/* The anchor the shared canvas measures to place this
                      tile's object, and the still that stands in for it. */}
                  <span className="tile__stage" data-motif={tile.motif} aria-hidden="true">
                    <span className="tile__poster" data-covered={drawn ? 'true' : 'false'}>
                      <CategoryPoster motif={tile.motif} />
                    </span>
                  </span>
                  <span className="tile__index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="tile__label">{tile.label}</span>
                  <span className="tile__note">{tile.note}</span>
                  <span className="tile__go" aria-hidden="true"><Arrow /></span>
                </Link>
              </li>
            ))}
          </ul>
          {live ? <GalleryMount onReady={() => setDrawn(true)} onLost={() => setDrawn(false)} /> : null}
        </div>
      </div>

      <div className="sourcing__ribbon" aria-hidden="true">
        <div className="sourcing__track">
          {[0, 1].map((copy) => (
            <div className="sourcing__group" key={copy}>
              {RIBBON.map((word) => (
                <span key={`${copy}-${word}`} className="sourcing__word">
                  {word}
                  <span className="sourcing__dot" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** The shared canvas, imported on demand so the bundle stays out of the way of
 *  the first paint. */
const Gallery = React.lazy(() => import('../three/Gallery').then((m) => ({ default: m.Gallery })))

function GalleryMount({ onReady, onLost }: { onReady: () => void; onLost: () => void }) {
  return (
    <React.Suspense fallback={null}>
      <Gallery onReady={onReady} onLost={onLost} />
    </React.Suspense>
  )
}
