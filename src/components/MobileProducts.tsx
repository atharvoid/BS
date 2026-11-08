import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_JOURNEY } from '../content'
import { CategoryPoster } from './CategoryPoster'
import { webglAvailable } from '../three/webgl'
import { useDeferred3D } from '../three/render-budget'
import { useQuality } from '../three/performance'

const Gallery = React.lazy(() => import('../three/Gallery').then(m => ({ default: m.Gallery })))

export function MobileProducts() {
  const host = React.useRef<HTMLDivElement>(null)
  const [near, setNear] = React.useState(false)
  const [drawn, setDrawn] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const quality = useQuality()
  const deferred = useDeferred3D()
  const ready = React.useCallback(() => setDrawn(true), [])
  const preparing = React.useCallback(() => setDrawn(false), [])
  const lost = React.useCallback(() => { setFailed(true); setDrawn(false) }, [])
  React.useEffect(() => {
    const el = host.current
    if (deferred) { setNear(false); setDrawn(false); return }
    if (!el || !webglAvailable()) return
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
    if (nav.connection?.saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [deferred])
  return <section className="mobile-products shell" id="products" aria-labelledby="mobile-products-title" data-tone="light" data-text-reveal="off">
    <span id="category-directory" className="mobile-products__anchor" />
    <header><p className="eyebrow">Product areas</p><h2 id="mobile-products-title">What are you looking<br />to source?</h2><p>Textiles and fabrics are our primary focus. Other requirements are discussed case by case.</p></header>
    <div className="mobile-products__grid" ref={host} data-drawn={drawn && near && !failed}>
      {CATEGORY_JOURNEY.map((item, index) => <Link className="product-card" key={item.id} to={item.to ?? `/enquiry?category=${item.id}`}>
        <div className="product-card__stage" data-motif={item.motif}><CategoryPoster motif={item.motif} /></div>
        <div className="product-card__copy">{index === 0 && <span className="product-card__focus">Primary focus</span>}<h3>{item.label}</h3><p>{item.body}</p></div>
      </Link>)}
      {near && !failed ? <GalleryBoundary onError={lost}><React.Suspense fallback={null}><Gallery onReady={ready} onLost={lost} onPreparing={preparing} /></React.Suspense></GalleryBoundary> : null}
    </div>
    <p className="mobile-products__note">Representative illustrations. Availability and terms are confirmed for each enquiry.</p>
    {quality === 'still' && <span className="visually-hidden">Product information and enquiry links are available without animation.</span>}
  </section>
}

class GalleryBoundary extends React.Component<{children: React.ReactNode; onError: () => void}, {failed: boolean}> {
  state = {failed:false}
  static getDerivedStateFromError() { return {failed:true} }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}
