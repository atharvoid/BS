import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_JOURNEY } from '../content'
import { CategoryPoster } from './CategoryPoster'
import { webglAvailable } from '../three/webgl'
import { useDeferred3D } from '../three/render-budget'
import { Arrow } from './Nav'

const Gallery = React.lazy(() => import('../three/Gallery').then(m => ({ default: m.Gallery })))

export function ProductDirectory({ directEntry }: { directEntry: boolean }) {
  const host = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)
  const [drawn, setDrawn] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const deferred = useDeferred3D()
  const ready = React.useCallback(() => setDrawn(true), [])
  const preparing = React.useCallback(() => setDrawn(false), [])
  const lost = React.useCallback(() => { setFailed(true); setDrawn(false) }, [])
  const liveCards = !deferred && !failed && webglAvailable()
  React.useEffect(() => {
    const el = host.current
    if (!liveCards) { setDrawn(false); return }
    if (!el || mounted) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setMounted(true) }, { rootMargin: '0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [liveCards, mounted])
  return <section className="product-directory shell" id="products" aria-labelledby="category-directory" data-tone="light" data-text-reveal="off">
    <header className="product-directory__head">
      <h2 id="category-directory">What are you looking to <em className="display-italic">source?</em></h2>
      <p>We focus first on textiles and fabrics. We discuss other products case by case.</p>
    </header>
    <div className="product-directory__grid" ref={host} data-drawn={liveCards && drawn}>
      {CATEGORY_JOURNEY.map(item => <Link className="product-card" key={item.id} to={item.to ?? `/enquiry?category=${item.id}`}
        aria-labelledby={`product-name-${item.id} product-action-${item.id}`}>
        <div className="product-card__stage" data-motif={item.motif}>
          <CategoryPoster motif={item.motif} eager={directEntry} />
        </div>
        <div className="product-card__copy">
          <h3 id={`product-name-${item.id}`}>{item.label}</h3>
          <p>{item.hint}</p>
          <span className="product-card__action" id={`product-action-${item.id}`}>{item.to ? 'Explore textiles' : 'Start an enquiry'} <Arrow /></span>
        </div>
      </Link>)}
      {mounted && liveCards ? <GalleryBoundary onError={lost}><React.Suspense fallback={null}><Gallery onReady={ready} onLost={lost} onPreparing={preparing} /></React.Suspense></GalleryBoundary> : null}
    </div>
    <p className="product-directory__note">The images are illustrative. We check availability and discuss terms for each enquiry.</p>
  </section>
}

class GalleryBoundary extends React.Component<{children: React.ReactNode; onError: () => void}, {failed: boolean}> {
  state = {failed:false}
  static getDerivedStateFromError() { return {failed:true} }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}
