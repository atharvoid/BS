import React from 'react'
import { Link } from 'react-router-dom'
import { Stage } from '../three/Stage'
import { ProcessScene, SingleStageScene, STAGE_OBJECT_LABELS, type StageKind } from '../three/ProcessScene'
import { useScrollProgress } from '../components/useScrollProgress'
import { GlobeScene } from '../three/GlobeScene'
import {
  BobbinObject,
  BoltObject,
  ClothPanel,
  Draggable,
  Ground,
  Lights,
  ReedObject,
  ShuttleObject,
  Studio,
} from '../three/objects'
import { useReveal, useParallax } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import { RegionWeave } from '../components/RegionWeave'
import {
  BOUNDARIES,
  BUSINESS,
  FIRST_MESSAGE,
  FOCUS_AREAS,
  LATER_DISCUSSIONS,
  PROCESS_CAVEAT,
  STAGES,
} from '../content'

/* -------------------------------------------------------------------------- */

function Hero() {
  const [engaged, setEngaged] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useParallax(ref, 0.06)

  return (
    <section className="hero on-dark grain" ref={ref}>
      <div className="hero__canvas" aria-hidden="false">
        <Stage
          className="hero__stage"
          label="An interactive globe of the Earth. Routes arc out from textile centres in Tamil Nadu and Gujarat to destinations across Asia, the Gulf, Europe, Australia and North America. Drag to turn it."
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
          <p className="hero__eyebrow">
            <span className="pulse" aria-hidden="true" />
            {BUSINESS.status}
            <span className="hero__eyebrow-sep" aria-hidden="true">/</span>
            India-focused sourcing
          </p>

          <h1 className="hero__title">
            <span className="hero__line">Sourcing from</span>
            <span className="hero__line">India, beginning</span>
            <span className="hero__line">
              with <em className="display-italic">textiles</em>.
            </span>
          </h1>

          <p className="hero__lede">
            A developing sourcing and trade coordination business. Start with a short description of
            the fabric you need or supply. A finished specification is not required for a first
            contact.
          </p>

          <div className="hero__actions">
            <Link to="/enquiry" className="btn btn--light">
              Start an enquiry
              <Arrow />
            </Link>
            <a href="#process" className="hero__secondary">
              <span className="hero__secondary-ring" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </span>
              How the conversation works
            </a>
          </div>
        </div>

        <dl className="hero__facts">
          <div>
            <dt>Initial sourcing areas</dt>
            <dd>Tamil Nadu<span aria-hidden="true"> · </span>Gujarat</dd>
          </div>
          <div>
            <dt>Who this is for</dt>
            <dd>Overseas buyers, buyers in India, Indian suppliers</dd>
          </div>
          <div>
            <dt>Direct contact</dt>
            <dd>
              <a href={`mailto:${BUSINESS.email}`} className="u-link">
                {BUSINESS.email}
              </a>
            </dd>
          </div>
        </dl>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span />
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

const RIBBON = [
  'Cotton',
  'Silk',
  'Blends',
  'Woven',
  'Printed',
  'Dyed',
  'Handloom',
  'Mill-made',
]

function Ribbon() {
  return (
    <div className="ribbon" aria-hidden="true">
      <div className="ribbon__track">
        {[0, 1].map((copy) => (
          <div className="ribbon__group" key={copy}>
            {RIBBON.map((w) => (
              <span key={w} className="ribbon__word">
                {w}
                <span className="ribbon__dot" />
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="ribbon__note">
        Material families, representative only. Not a catalogue of available stock.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Purpose() {
  return (
    <section className="purpose" id="purpose">
      <div className="shell">
        <div className="purpose__grid">
          <header className="purpose__head">
            <p className="eyebrow reveal">What this is</p>
            <h2 className="purpose__title reveal" style={{ ['--reveal-delay' as string]: '60ms' }}>
              A sourcing conversation, <em className="display-italic">not a shop</em>.
            </h2>
          </header>

          <div className="purpose__body">
            <p className="purpose__lead reveal">
              {BUSINESS.name} is a developing, India-focused sourcing and trade coordination
              business. The initial focus is textiles and fabrics.
            </p>
            <p className="reveal" style={{ ['--reveal-delay' as string]: '80ms' }}>
              There is no fixed catalogue here, and no promise that particular products are
              available. Product scope and the services that can be provided are established through
              each enquiry, one requirement at a time, with the buyer or supplier involved at every
              step.
            </p>
            <p className="reveal" style={{ ['--reveal-delay' as string]: '140ms' }}>
              This is deliberately a slow opening. A useful answer about Indian fabric usually
              depends on how a material will be used, not on a list of what happens to exist today.
            </p>
          </div>
        </div>

        <ul className="audience">
          {[
            {
              k: 'Overseas buyers',
              d: 'Looking to source from India, and wanting a clearly explained first step rather than a catalogue.',
              n: 'A',
            },
            {
              k: 'Buyers in India',
              d: 'Looking for materials or products, with local knowledge but a specific need to place.',
              n: 'B',
            },
            {
              k: 'Indian suppliers',
              d: 'Wanting to describe what they supply, and how it might fit a buyer requirement.',
              n: 'C',
            },
          ].map((a, i) => (
            <li
              key={a.k}
              className="audience__item reveal"
              style={{ ['--reveal-delay' as string]: `${i * 90}ms` }}
            >
              <span className="audience__mark" aria-hidden="true">{a.n}</span>
              <h3>{a.k}</h3>
              <p>{a.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function Areas() {
  return (
    <section className="areas on-indigo grain" id="areas">
      <div className="shell">
        <div className="areas__head">
          <p className="eyebrow reveal">Initial sourcing areas</p>
          <h2 className="areas__title reveal">
            Two states to begin the <em className="display-italic">map</em>.
          </h2>
          <p className="areas__intro reveal">
            Tamil Nadu and Gujarat are the initial sourcing areas. They are a starting point for
            enquiries, not a limit on what can be discussed, and not a claim about what is held in
            stock.
          </p>
        </div>

        <div className="areas__grid">
          {FOCUS_AREAS.map((a, i) => (
            <article
              key={a.id}
              className="area reveal"
              style={{ ['--reveal-delay' as string]: `${i * 110}ms` }}
            >
              <div className={`area__weave area__weave--${a.id}`} aria-hidden="true">
                <RegionWeave motif={a.id} />
                <span className="area__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="area__grain" />
              </div>
              <div className="area__text">
                <p className="area__kicker">{a.kicker}</p>
                <h3 className="area__name">{a.name}</h3>
                <p className="area__note">{a.note}</p>
                <p className="area__hint">{a.hint}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="areas__foot reveal">
          Supplying from elsewhere in India? Say where you are. The conversation is not restricted
          to these two states.
        </p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function Process() {
  const track = React.useRef<HTMLDivElement>(null)
  const { progress, active } = useScrollProgress(track, STAGES.length)

  return (
    <section className="process on-dark grain" id="process">
      <div className="shell">
        <div className="process__head">
          <p className="eyebrow reveal">How the sourcing conversation works</p>
          <h2 className="process__title reveal">
            Four stages, <em className="display-italic">each one optional</em> to stop at.
          </h2>
          <p className="process__intro reveal">{PROCESS_CAVEAT}</p>
        </div>
      </div>

      {/* On wide screens the frame pins and the four stages scroll past it.
          On narrow screens there is no pinning and no shared canvas: each
          stage carries its own object, so a phone never scrolls a paragraph
          past a picture of a different stage. */}
      <div className="sequence" ref={track} style={{ ['--count' as string]: STAGES.length }}>
        <div className="sequence__pin">
          <div className="shell sequence__inner">
            <div className="sequence__visual">
              <div className="sequence__stage">
                <Stage
                  label="Four interactive 3D objects, one per stage: an unfolded bolt of cloth, a weaving shuttle, a spun yarn bobbin and a brass reed. Each swings in as you scroll and can be dragged to turn it."
                  z={5.1}
                  fov={36}
                  fallback={<div className="sequence__fallback" aria-hidden="true" />}
                >
                  <ProcessScene progress={progress} />
                </Stage>

                <ol className="sequence__rail" aria-hidden="true">
                  {STAGES.map((s, i) => (
                    <li key={s.n} className={i === active ? 'is-active' : i < active ? 'is-done' : ''}>
                      <span className="sequence__rail-n">{s.n}</span>
                      <span className="sequence__rail-dot" />
                    </li>
                  ))}
                </ol>

                <div className="sequence__progress" aria-hidden="true">
                  <span style={{ ['--p' as string]: active / Math.max(1, STAGES.length - 1) }} />
                </div>
              </div>
            </div>

            <ol className="sequence__text">
              {STAGES.map((s, i) => (
                <li key={s.n} className={`seq-step ${i === active ? 'is-active' : ''}`}>
                  <div className="stage__meta">
                    <span className="stage__n">{s.n}</span>
                    <span className="stage__rule" aria-hidden="true" />
                    <span className="stage__field">{s.field.join(' / ')}</span>
                  </div>
                  <h3 className="stage__title">{s.title}</h3>
                  <p className="stage__text">{s.body}</p>
                  <p className="seq-step__object">{STAGE_OBJECT_LABELS[s.object as StageKind]}</p>

                  {/* Narrow screens get a plate per step, directly under its own
                      words. Hidden on wide screens, where the pinned frame
                      above already shows the same object. */}
                  <div className="seq-step__plate">
                    <Stage
                      label={`Interactive 3D object for stage ${s.n}: ${STAGE_OBJECT_LABELS[s.object as StageKind]}. Drag to turn it.`}
                      z={5}
                      fov={36}
                      fallback={<div className="sequence__fallback" aria-hidden="true" />}
                    >
                      <SingleStageScene kind={s.object as StageKind} />
                    </Stage>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function Bring() {
  return (
    <section className="bring" id="bring">
      <div className="shell">
        <div className="bring__grid">
          <div className="bring__left">
            <p className="eyebrow reveal">A useful first message</p>
            <h2 className="bring__title reveal">
              You do not need a <em className="display-italic">spec sheet</em>.
            </h2>
            <p className="bring__intro reveal">
              Visitors can begin with a short description of the fabric they need or supply, its
              intended use, and the relevant location. That is enough to start.
            </p>

            <ul className="checklist">
              {FIRST_MESSAGE.map((item, i) => (
                <li
                  key={item}
                  className="checklist__item reveal"
                  style={{ ['--reveal-delay' as string]: `${i * 70}ms` }}
                >
                  <span className="checklist__box" aria-hidden="true">
                    <svg viewBox="0 0 12 12" fill="none">
                      <path d="M1.5 6.4 4.4 9.3 10.5 2.9" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="bring__cta reveal">
              <Link to="/enquiry" className="btn">
                Write that message
                <Arrow />
              </Link>
            </div>
          </div>

          <aside className="bring__right reveal">
            <p className="eyebrow eyebrow--bare">Later in the conversation</p>
            <p className="bring__aside-note">
              Further discussions may cover the following. None of it is fixed in advance.
            </p>
            <dl className="later">
              {LATER_DISCUSSIONS.map((d) => (
                <div key={d.t} className="later__row">
                  <dt>{d.t}</dt>
                  <dd>{d.d}</dd>
                </div>
              ))}
            </dl>
            <p className="bring__aside-foot">
              The site does not state fixed minimum quantities, prices, lead times, available stock
              or guaranteed specifications.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function Boundaries() {
  return (
    <section className="bounds" id="boundaries">
      <div className="shell">
        <header className="bounds__head">
          <p className="eyebrow reveal">What this site does not claim</p>
          <h2 className="bounds__title reveal">
            The difference between <em className="display-italic">developing</em> and confirmed.
          </h2>
        </header>

        <ul className="bounds__list">
          {BOUNDARIES.map((b, i) => (
            <li
              key={b.t}
              className="bounds__row reveal"
              style={{ ['--reveal-delay' as string]: `${i * 60}ms` }}
            >
              <span className="bounds__num">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="bounds__term">{b.t}</h3>
              <p className="bounds__def">{b.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function Introduction() {
  return (
    <section className="intro" id="company">
      <div className="shell">
        <div className="intro__grid">
          <div className="intro__plate reveal" aria-hidden="true">
            <div className="intro__plate-inner">
              <span className="intro__plate-kicker">Textile sourcing</span>
              <span className="intro__plate-bs">BS</span>
              <span className="intro__plate-rest">EXIMNEXUS</span>
              <span className="intro__plate-line" />
              <dl className="intro__plate-meta">
                <div>
                  <dt>Initial areas</dt>
                  <dd>Tamil Nadu · Gujarat</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>Developing business</dd>
                </div>
              </dl>
            </div>
            <span className="intro__plate-selvedge" />
          </div>

          <div className="intro__text">
            <p className="eyebrow reveal">The business</p>
            <h2 className="intro__title reveal">
              A person reads every enquiry and <em className="display-italic">replies</em>.
            </h2>
            <p className="reveal">
              {BUSINESS.name} is in development. That word matters here: the business is being
              built openly, beginning with textiles and fabrics, and it would rather tell you what
              is not yet confirmed than imply more than it can hold to.
            </p>
            <p className="reveal" style={{ ['--reveal-delay' as string]: '80ms' }}>
              Enquiries arrive in the business inbox and are answered from it. There are no accounts,
              no payments and no automatic tracking. Each reply deals with the requirement in front
              of it.
            </p>
            <div className="intro__links reveal">
              <a href={`mailto:${BUSINESS.email}`} className="tlink">
                {BUSINESS.email}
              </a>
              <Link to="/textiles" className="tlink">
                Read about the textile focus
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function CloseEnquiry() {
  return (
    <section className="closing">
      <div className="shell closing__inner">
        <div className="closing__cloth" aria-hidden="true">
          <Stage
            label="Interactive 3D cloth panel. Drag to turn it."
            z={5.2}
            fov={38}
            fallback={<div className="closing__cloth-fallback" aria-hidden="true" />}
          >
            <Studio />
            <Lights intensity={1} />
            <Draggable drift={0.16} tilt={0.38} float={0.025}>
              <ClothPanel palette="gold" width={2.1} height={2.5} folds={3.2} seed={2.4} threads={18} />
            </Draggable>
          </Stage>
        </div>

        <div className="closing__text">
          <p className="eyebrow reveal">Start here</p>
          <h2 className="closing__title reveal">
            Five answers are <em className="display-italic">enough</em> to begin.
          </h2>
          <p className="closing__lede reveal">
            The enquiry is short on purpose. Attachments are not accepted and a finished
            specification is not expected. The reply will tell you what would be useful next.
          </p>
          <div className="closing__actions reveal">
            <Link to="/enquiry" className="btn">
              Textile enquiry
              <Arrow />
            </Link>
            <Link to="/privacy" className="tlink">
              How enquiry information is used
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
      <Ribbon />
      <Purpose />
      <Areas />
      <Process />
      <Bring />
      <Boundaries />
      <Introduction />
      <CloseEnquiry />
    </>
  )
}
