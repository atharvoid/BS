import React from 'react'
import { Link } from 'react-router-dom'
import { Stage } from '../three/Stage'
import { useReveal, useParallax } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import { SwatchBook } from '../components/SwatchBook'
import { GlobePoster } from '../components/GlobePoster'
import { FIRST_MESSAGE } from '../content'

/* The globe is the largest scene on the site. Loading it through the stage
   boundary keeps it off the path of the hero's own text: the headline, the lede
   and both buttons are static markup and paint without waiting for it. */
const loadGlobe = () => import('../three/HeroScene')

function Hero() {
  const [engaged, setEngaged] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useParallax(ref, 0.06)

  return (
    <section className="hero" ref={ref} data-tone="light">
      <div className="hero__canvas" onPointerDown={() => setEngaged(true)}>
        <Stage
          className="hero__stage"
          label="Globe centred on India"
          z={7.4}
          fov={36}
          fallback={<GlobePoster />}
          stableVisual
          continuous
          load={loadGlobe}
        />
        <p className={`drag-hint ${engaged ? 'is-done' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 11V6.5a1.5 1.5 0 0 1 3 0V11m0-2.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v5.2A4.8 4.8 0 0 1 13.2 20h-1.1a4 4 0 0 1-3.2-1.6L5.4 13.7a1.6 1.6 0 0 1 2.4-2l1.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Drag
        </p>
      </div>

      <div className="hero__inner shell">
        <div className="hero__copy">
          <p className="hero__eyebrow-line">Import and export sourcing, India</p>
          <h1 className="hero__title">
            <span className="hero__line">India’s makers,</span>
            <span className="hero__line hero__line--accent"><em>within reach.</em></span>
          </h1>

          <p className="hero__lede">
            A sourcing and trade coordination desk for overseas buyers, buyers in India and
            Indian suppliers: textiles, handicrafts, food, industrial materials and more.
          </p>

          <div className="hero__actions">
            <Link to="/enquiry" className="btn">
              Start an enquiry
              <Arrow />
            </Link>
            <Link to="/#products" className="hero__secondary">
              <span className="hero__secondary-ring" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </span>
              See what we source
            </Link>
          </div>

          <ul className="hero__facts" aria-label="How we work">
            <li>Six product areas</li>
            <li>A person replies to every enquiry</li>
            <li>Terms agreed in writing</li>
          </ul>
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
      <SwatchBook />
      {/* One section for how it works: three steps, then what a first
          message needs, then the action. (Was two sections saying much the
          same thing twice.) */}
      <section className="process" id="process" aria-labelledby="process-title">
        <div className="shell">
          <h2 className="process__title" id="process-title">How an enquiry works</h2>
          <ol className="process__steps">
            <li>
              <span className="process__n" aria-hidden="true">1</span>
              <h3>Share your requirement</h3>
              <p>What you need or supply, any specifications you have, and where the goods are going.</p>
            </li>
            <li>
              <span className="process__n" aria-hidden="true">2</span>
              <h3>We review the details</h3>
              <p>A person replies by email to discuss the product and anything missing.</p>
            </li>
            <li>
              <span className="process__n" aria-hidden="true">3</span>
              <h3>Agree availability and terms</h3>
              <p>Quantities, samples and commercial terms are agreed case by case, in writing.</p>
            </li>
          </ol>
          <div className="process__first">
            <div>
              <h3 className="process__first-title">Your first message only needs</h3>
              <ul className="process__list">
                {FIRST_MESSAGE.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="process__cta">
              <p>A finished specification is not required to begin.</p>
              <Link to="/enquiry" className="btn">Start an enquiry <Arrow /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
