import React from 'react'
import { Link } from 'react-router-dom'
import { Stage } from '../three/Stage'
import { useReveal, useParallax } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import { ProductExplorer } from '../components/ProductExplorer'

/* The globe is the largest scene on the site. Loading it through the stage
   boundary keeps it off the path of the hero's own text: the headline, the lede
   and both buttons are static markup and paint without waiting for it. */
const loadGlobe = () => import('../three/HeroScene')

function Hero() {
  const [engaged, setEngaged] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useParallax(ref, 0.06)

  return (
    <section className="hero on-dark grain" ref={ref}>
      <div className="hero__canvas" onPointerDown={() => setEngaged(true)}>
        <Stage
          className="hero__stage"
          label="Globe centred on India"
          z={7.4}
          fov={36}
          fallback={<picture><source media="(max-width:980px), (max-height:479px)" srcSet="/posters/globe-mobile-small.webp 500w, /posters/globe-mobile.webp 1000w" sizes="(max-width:540px) 100vw, 500px" /><img className="globe-poster" src="/posters/globe-desktop.webp" alt="" width={1280} height={800} fetchPriority="high" /></picture>}
          stableVisual
          finiteMotion
          load={loadGlobe}
        />
        <p className={`drag-hint ${engaged ? 'is-done' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 11V6.5a1.5 1.5 0 0 1 3 0V11m0-2.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v5.2A4.8 4.8 0 0 1 13.2 20h-1.1a4 4 0 0 1-3.2-1.6L5.4 13.7a1.6 1.6 0 0 1 2.4-2l1.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Drag to turn
        </p>
        <p className="hero__map-caption">Illustrative trade routes</p>
      </div>

      <div className="hero__inner shell">
        <div className="hero__copy">
          <h1 className="hero__title">
            <span className="hero__line">Import and export</span>
            <span className="hero__line">
              sourcing in <em className="display-italic">India</em>.
            </span>
          </h1>

          <p className="hero__lede">
            We’re building a sourcing business for overseas buyers, buyers in India and Indian
            suppliers, starting with textiles and fabrics.
          </p>

          <div className="hero__actions">
            <Link to="/enquiry" className="btn btn--light">
              Start an enquiry
              <Arrow />
            </Link>
            <Link to="/#products" className="hero__secondary">
              <span className="hero__secondary-ring" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </span>
              Explore products
            </Link>
          </div>
        </div>


      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

export default function Overview() {
  useReveal([])

  return (
    <>
      <Hero />
      <ProductExplorer />
      <section className="purpose" id="process">
        <div className="shell purpose__grid">
          <h2 className="purpose__title">How sourcing enquiries <em className="display-italic">work</em>.</h2>
          <div className="purpose__body">
            <ol className="purpose__steps">
              <li><strong>Share your requirement.</strong> Tell us what you need or supply, any specifications you have, and where the goods are going.</li>
              <li><strong>We review the details.</strong> We’ll reply from our business inbox to discuss the product and any missing information.</li>
              <li><strong>Discuss availability and terms.</strong> Quantities, samples and commercial terms depend on the enquiry.</li>
            </ol>
            <Link to="/enquiry" className="btn">Start an enquiry <Arrow /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
