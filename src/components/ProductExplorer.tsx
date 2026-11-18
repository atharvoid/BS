import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CATEGORY_JOURNEY as TILES } from '../content'
import { Arrow } from './Nav'
import { webglAvailable } from '../three/webgl'
import { journeyPose, clamp01, CATEGORY_COUNT, ease } from './category-journey'
import { ProductDirectory } from './ProductDirectory'
import { CategoryPoster } from './CategoryPoster'
import type { CategoryMotif } from '../three/categoryObjects'
import { useDeferred3D } from '../three/render-budget'

const hrefFor = (tile: typeof TILES[number]) => tile.to ?? `/enquiry?category=${tile.id}`
const Gallery = React.lazy(() => import('../three/Gallery').then(m => ({ default: m.Gallery })))
const tourLayout = () => matchMedia('(min-width: 981px) and (min-height: 640px)')
const subscribeTourLayout = (notify: () => void) => {
  const query = tourLayout()
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}

export function ProductExplorer() {
  const { hash } = useLocation()
  const hasRoom = React.useSyncExternalStore(subscribeTourLayout, () => tourLayout().matches, () => false)
  const deferred = useDeferred3D()
  const showTour = hasRoom && !deferred && webglAvailable()
  return <>
    <ProductDirectory directEntry={hash === '#products' || hash === '#category-directory'} />
    {showTour && <DesktopProductTour />}
  </>
}

function DesktopProductTour() {
  const root = React.useRef<HTMLElement>(null)
  const [near, setNear] = React.useState(false)
  const [drawn, setDrawn] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const [hovered, setHovered] = React.useState<CategoryMotif | null>(null)
  const [focused, setFocused] = React.useState<CategoryMotif | null>(null)
  const ready = React.useCallback(() => setDrawn(true), [])
  const preparing = React.useCallback(() => setDrawn(false), [])
  const lost = React.useCallback(() => setFailed(true), [])

  React.useEffect(() => {
    const el = root.current
    if (!el || failed) return
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '320px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [failed])

  React.useLayoutEffect(() => {
    const el = root.current
    if (!el || failed) return
    const runway = el.querySelector<HTMLElement>('.journey__runway')!
    let raf = 0
    const run = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      // WebKit's mobile layout viewport can include the scrollbar gutter.
      // Use the actual fixed surface shared by the artwork and shelf.
      const h = window.innerHeight, w = el.querySelector<HTMLElement>('.journey__visuals')!.clientWidth
      const progress = clamp01(-r.top / Math.max(1, runway.offsetHeight - h)) * CATEGORY_COUNT
      const begun = r.top <= 90 && r.bottom >= h - 1
      el.dataset.begun = String(begun)
      el.style.setProperty('--journey-progress', String(progress / CATEGORY_COUNT))
      el.style.setProperty('--journey-complete', String(ease((progress - 5.9) / 0.1)))
      el.querySelector<HTMLElement>('.journey__complete')!.inert = !begun || progress < 5.99
      const shelf = el.querySelector<HTMLElement>('.journey__shelf')!
      const shelfHeight = shelf.getBoundingClientRect().height
      shelf.inert = !begun
      el.querySelectorAll<HTMLElement>('[data-journey-index]').forEach(anchor => {
        const i = Number(anchor.dataset.journeyIndex)
        const pose = journeyPose(i, progress, w, h, shelfHeight)
        anchor.style.width = `${pose.height}px`
        anchor.style.height = `${pose.height}px`
        anchor.style.transform = `translate3d(${pose.x - pose.height / 2}px,${pose.y - pose.height / 2}px,0)`
        anchor.dataset.active = String(begun && pose.visible)
        anchor.dataset.docked = String(pose.docked >= .999)
        const chapter = el.querySelector<HTMLElement>(`[data-chapter="${i}"]`)!
        chapter.style.opacity = String(pose.title)
        chapter.style.transform = `translate3d(${pose.textX}px,0,0)`
        chapter.style.pointerEvents = pose.title > 0.8 && begun ? 'auto' : 'none'
        chapter.inert = pose.title < 0.8 || !begun
        const detail = chapter.querySelector<HTMLElement>('.journey__detail')!
        detail.style.opacity = String(pose.detail / Math.max(pose.title, 0.001))
        detail.inert = pose.detail < 0.8 || !begun
        const box = el.querySelector<HTMLElement>(`[data-dock="${i}"]`)!
        box.dataset.filled = String(pose.docked > 0.5)
      })
      // One layout read/write batch per scroll frame. The renderer listens after
      // these anchors move; no duplicated models or cross-faded screenshots.
      window.dispatchEvent(new Event('bs:journey-layout'))
    }
    const queue = () => { if (!raf) raf = requestAnimationFrame(run) }
    run()
    const resize = new ResizeObserver(queue)
    resize.observe(el)
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    return () => {
      resize.disconnect()
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      cancelAnimationFrame(raf)
    }
  }, [failed])

  if (failed) return null

  return (
    <section className="sourcing sourcing--journey" id="product-tour" ref={root} data-tone="light" data-drawn={near && drawn} aria-labelledby="journey-title">
      <div className="journey__runway"><div className="journey__sticky" data-text-reveal="off">
        <header className="journey__header shell">
          <h2 id="journey-title">3D product tour</h2>
          <p className="journey__instruction">Scroll to see each product illustration.</p>
        </header>
        <div className="journey__chapters shell">
          {TILES.map((tile, i) => (
            <article className="journey__chapter" key={tile.id} data-chapter={i}>
              <p className="eyebrow">{String(i + 1).padStart(2, '0')} / 06 · {tile.note}</p>
              <h3>{tile.label}</h3>
              <div className="journey__detail"><p>{tile.hint}</p><Link to={hrefFor(tile)} className="tlink">{tile.to ? 'Explore textiles' : 'Start an enquiry'} <Arrow /></Link></div>
            </article>
          ))}
        </div>
        <div className="journey__complete shell"><h3>Tell us what<br /><em className="display-italic">you need.</em></h3><Link to="/enquiry" className="tlink">Start an enquiry <Arrow /></Link></div>
      </div>
      </div>
      <div className="journey__visuals" aria-hidden="true" data-text-reveal="off">
        {TILES.map((tile, i) => <div className="journey__anchor" key={tile.id} data-motif={tile.motif} data-journey-index={i}>
          {near && <CategoryPoster motif={tile.motif} sizes="76vh" />}
        </div>)}
        {near && <JourneyBoundary onError={lost}><React.Suspense fallback={null}><Gallery onReady={ready} onLost={lost} onPreparing={preparing} activeMotif={hovered ?? focused} journey /></React.Suspense></JourneyBoundary>}
      </div>
      <nav className="journey__shelf" data-text-reveal="off" aria-label="Product category shortcuts">
        {TILES.map((tile, i) => <Link className="journey__box" key={tile.id} data-dock={i} to={hrefFor(tile)} aria-label={tile.label}
          onPointerEnter={e => { if (e.pointerType !== 'touch') setHovered(tile.motif) }} onPointerLeave={() => setHovered(null)}
          onFocus={() => setFocused(tile.motif)} onBlur={() => setFocused(null)}
        ><span className="journey__box-label">{tile.label}</span></Link>)}
      </nav>
    </section>
  )
}

class JourneyBoundary extends React.Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}
