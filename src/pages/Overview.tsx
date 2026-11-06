import React from 'react'
import { Link } from 'react-router-dom'
import { Stage } from '../three/Stage'
import { GlobeScene } from '../three/GlobeScene'
import { useReveal, useParallax } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import { ProductExplorer } from '../components/ProductExplorer'

function Hero() {
  const [engaged, setEngaged] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useParallax(ref, 0.06)

  return (
    <section className="hero on-dark grain" ref={ref}>
      <div className="hero__canvas" aria-hidden="false" onPointerDown={() => setEngaged(true)}>
        <Stage
          className="hero__stage"
          label="Interactive globe with illustrative trade routes from India. Drag to turn it."
          z={7.4}
          fov={36}
          fallback={<HeroFallback />}
        >
          <GlobeScene />
        </Stage>
        <p className={`drag-hint ${engaged ? 'is-done' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 11V6.5a1.5 1.5 0 0 1 3 0V11m0-2.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v5.2A4.8 4.8 0 0 1 13.2 20h-1.1a4 4 0 0 1-3.2-1.6L5.4 13.7a1.6 1.6 0 0 1 2.4-2l1.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Drag to turn
        </p>
      </div>

      <div className="hero__inner shell">
        <div className="hero__copy">
          <h1 className="hero__title">
            <span className="hero__line">Import and export </span>{' '}
            <span className="hero__line">sourcing in <em className="display-italic">India</em>.</span>
          </h1>

          <p className="hero__lede">
            BS EXIMNEXUS is developing a sourcing business for overseas buyers, buyers in India
            and Indian suppliers.
          </p>

          <div className="hero__actions">
            <Link to="/enquiry" className="btn btn--light">
              Start an enquiry
              <Arrow />
            </Link>
            <a href="#products" className="hero__secondary">
              <span className="hero__secondary-ring" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </span>
              Explore products
            </a>
          </div>
        </div>


      </div>
    </section>
  )
}

function HeroFallback() {
  return (
    <div className="hero-fallback" aria-hidden="true">
      <div className="hero-fallback__cloth" />
      <div className="hero-fallback__ring" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export default function Overview() {
  useReveal([])

  return (
    <>
      <Hero />
      <ProductExplorer />
      <section className="purpose" id="process"><div className="shell purpose__grid">
        <header className="purpose__head"><p className="eyebrow">The conversation</p><h2 className="purpose__title">How sourcing enquiries <em className="display-italic">work</em>.</h2></header>
        <div className="purpose__body"><p className="purpose__lead">Tell us what you need or supply, and where the goods are going.</p><p>The first discussion covers the product and any specifications you have. Availability, quantities and terms are agreed for each enquiry.</p></div>
      </div></section>
    </>
  )
}
