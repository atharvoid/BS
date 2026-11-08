import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, CATEGORY_JOURNEY as TILES } from '../content'
import { Arrow } from './Nav'
import { webglAvailable } from '../three/webgl'
import { introActive, onIntroChange } from './intro-state'
import { journeyPose, clamp01, CATEGORY_COUNT, ease } from './category-journey'
import { useCompactLayout } from './useCompactLayout'
import { MobileProducts } from './MobileProducts'

const hrefFor = (tile: typeof TILES[number]) => tile.to ?? `/enquiry?category=${tile.id}`
const Gallery = React.lazy(() => import('../three/Gallery').then(m => ({ default: m.Gallery })))

export function ProductExplorer() {
  const compact = useCompactLayout()
  return compact ? <MobileProducts /> : <DesktopProductExplorer />
}

function DesktopProductExplorer() {
  const root = React.useRef<HTMLElement>(null)
  const [live, setLive] = React.useState(false)
  const [drawn, setDrawn] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const ready = React.useCallback(() => setDrawn(true), [])
  const lost = React.useCallback(() => setFailed(true), [])

  React.useEffect(() => {
    const el = root.current
    if (!el) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const capable = webglAvailable()
    el.dataset.fallback = String(!capable || failed)
    let raf = 0
    const prepare = () => {
      if (!introActive() && webglAvailable()) setLive(true)
    }
    const unsubscribe = onIntroChange(active => { if (!active) prepare() })
    const near = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) prepare() }, { rootMargin: '800px 0px' })
    near.observe(el)
    const run = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const h = window.innerHeight, w = window.innerWidth
      // A pinned chapter cannot honestly fit between navigation and dock in
      // a very short viewport. Prefer the existing readable directory rather
      // than concealing actions or reducing text below a useful size.
      const compactViewport = h < 480
      el.dataset.compact = String(compactViewport)
      const reducedMotion = reduced.matches || !capable || failed || compactViewport
      const progress = reducedMotion ? CATEGORY_COUNT : clamp01(-r.top / Math.max(1, el.querySelector<HTMLElement>('.journey__runway')!.offsetHeight - h)) * CATEGORY_COUNT
      const begun = (reducedMotion ? r.top < h * .6 : r.top <= 90) && r.bottom > 0
      el.dataset.begun = String(begun)
      el.dataset.reduced = String(reducedMotion)
      el.style.setProperty('--journey-progress', String(progress / CATEGORY_COUNT))
      el.style.setProperty('--journey-complete', String(ease((progress - 5.9) / 0.1)))
      el.querySelector<HTMLElement>('.journey__complete')!.inert = progress < 5.99
      const shelf = el.querySelector<HTMLElement>('.journey__shelf')!
      const shelfHeight = shelf.getBoundingClientRect().height
      shelf.inert = !begun || !capable || failed
      el.querySelectorAll<HTMLElement>('[data-journey-index]').forEach(anchor => {
        const i = Number(anchor.dataset.journeyIndex)
        const pose = journeyPose(i, progress, w, h, shelfHeight)
        anchor.style.width = `${pose.height}px`
        anchor.style.height = `${pose.height}px`
        anchor.style.transform = `translate3d(${pose.x - pose.height / 2}px,${pose.y - pose.height / 2}px,0)`
        anchor.dataset.active = String(begun && pose.visible)
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
        box.style.setProperty('--docked', String(pose.docked))
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
    reduced.addEventListener('change', queue)
    return () => {
      unsubscribe(); near.disconnect(); resize.disconnect()
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      reduced.removeEventListener('change', queue)
      cancelAnimationFrame(raf)
    }
  }, [failed])

  return (
    <section className="sourcing sourcing--journey" id="products" ref={root} data-tone="light" data-drawn={drawn} data-failed={failed} aria-labelledby="journey-title">
      <div className="journey__runway"><div className="journey__sticky" data-text-reveal="off">
        <header className="journey__header shell">
          <div><p className="eyebrow">Product areas · textile-led sourcing</p><h2 id="journey-title">A requirement. <em className="display-italic">A starting point.</em></h2></div>
          <a className="journey__skip tlink" href="#category-directory">Skip to all categories ↓</a>
        </header>
        <div className="journey__chapters shell">
          {TILES.map((tile, i) => (
            <article className="journey__chapter" key={tile.id} data-chapter={i}>
              <p className="eyebrow">{String(i + 1).padStart(2, '0')} / 06 · {tile.note}</p>
              <h3>{tile.label}</h3>
              <div className="journey__detail"><p>{tile.body}</p><Link to={hrefFor(tile)} className="tlink">{i === 0 ? 'Explore textiles' : 'Discuss this requirement'} <Arrow /></Link><p className="journey__caveat">Representative model. Availability and terms confirmed per enquiry.</p></div>
            </article>
          ))}
        </div>
        <div className="journey__complete shell"><p className="eyebrow">Six starting points. One conversation.</p><h3>Tell us what you<br /><em className="display-italic">have in mind.</em></h3><a href="#category-directory" className="tlink">View all categories ↓</a></div>
        <p className="journey__scroll">Scroll to explore <span aria-hidden="true">↓</span></p>
      </div>
      </div>
      <div className="journey__visuals" aria-hidden="true" data-text-reveal="off">
        {TILES.map((tile, i) => <div className="journey__anchor" key={tile.id} data-motif={tile.motif} data-journey-index={i} />)}
        {live && !failed ? <JourneyBoundary onError={lost}><React.Suspense fallback={null}><Gallery onReady={ready} onLost={lost} journey /></React.Suspense></JourneyBoundary> : null}
      </div>
      <nav className="journey__shelf" data-text-reveal="off" aria-label="Product category shortcuts">
        {TILES.map((tile, i) => <Link className="journey__box" key={tile.id} data-dock={i} to={hrefFor(tile)} aria-label={tile.label}><span className="journey__box-index">{String(i + 1).padStart(2, '0')}</span><span className="journey__box-label"><span className="journey__label-full">{tile.label}</span><span className="journey__label-short">{["Textiles", "Crafts", "Food", "Materials", "Organic", "Other"][i]}</span></span></Link>)}
      </nav>
      <div className="journey__directory shell" id="category-directory">
        <p className="eyebrow">All product areas</p>
        <h2>Choose your <em className="display-italic">starting point.</em></h2>
        <p>Textiles and fabrics are our primary focus. Other requirements are discussed case by case.</p>
        <ul>{TILES.map(tile => <li key={tile.id}><Link to={hrefFor(tile)}>{tile.label}<Arrow /></Link><p>{CATEGORIES.find(c => c.id === tile.id)?.hint}</p></li>)}</ul>
        {!live || failed ? <p className="journey__availability">Category details and enquiry links are available even when 3D previews cannot be displayed.</p> : null}
      </div>
    </section>
  )
}

class JourneyBoundary extends React.Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}
