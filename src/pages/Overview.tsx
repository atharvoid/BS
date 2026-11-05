import React from 'react'
import { Link } from 'react-router-dom'
import { Stage } from '../three/Stage'
import { ProcessScene, SingleStageScene, STAGE_OBJECT_LABELS, type StageKind } from '../three/ProcessScene'
import { useScrollProgress } from '../components/useScrollProgress'
import { GlobeScene } from '../three/GlobeScene'
import { ClothPanel, Draggable, Lights, Studio } from '../three/objects'
import { useReveal, useParallax } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import { RegionWeave } from '../components/RegionWeave'
import { Mark, Wordmark } from '../components/Logo'
import {
  ABOUT,
  AREAS_FOOT,
  BOUNDARIES,
  BUSINESS,
  CLOSING,
  FIRST_MESSAGE,
  FOCUS_AREAS,
  HERO,
  HERO_FACTS,
  LATER_DISCUSSIONS,
  PROCESS_INTRO,
  STAGES,
} from '../content'

/* -------------------------------------------------------------------------- */
/* The hero                                                                    */
/* -------------------------------------------------------------------------- */

function Hero() {
  const ref = React.useRef<HTMLDivElement>(null)
  useParallax(ref, 0.05)

  return (
    <section className="hero on-dark grain" ref={ref}>
      <div className="hero__canvas">
        <Stage
          className="hero__stage"
          label="An interactive globe. Routes leave textile centres in Tamil Nadu and Gujarat for destinations across Asia, the Gulf, Europe, Australia and North America. Drag to turn it."
          z={7.4}
          fov={36}
          fallback={<HeroFallback />}
        >
          <GlobeScene />
        </Stage>
      </div>

      <div className="hero__inner shell">
        <div className="hero__copy">
          <p className="hero__eyebrow">
            <span className="pulse" aria-hidden="true" />
            {HERO.eyebrow}
          </p>

          <h1 className="hero__title">
            <span className="hero__line">{HERO.title[0]}</span>
            <span className="hero__line">{HERO.title[1]}</span>
            <span className="hero__line">
              {HERO.title[2]}
              <em className="display-italic">{HERO.title[3]}</em>.
            </span>
          </h1>

          <p className="hero__lede">{HERO.lede}</p>

          <div className="hero__actions">
            <Link to="/enquiry" className="btn btn--light">
              {HERO.primary}
              <Arrow />
            </Link>
            <a href="#process" className="hero__secondary">
              <span className="hero__secondary-ring" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </span>
              {HERO.secondary}
            </a>
          </div>
        </div>

        <dl className="hero__facts">
          {HERO_FACTS.map((f) => (
            <div key={f.k}>
              <dt>{f.k}</dt>
              <dd>{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span />
      </div>
    </section>
  )
}

/**
 * Shown when WebGL is unavailable. It reads as a plate of the same globe rather
 * than an empty box, so a visitor without it still sees the idea.
 */
function HeroFallback() {
  return (
    <div className="hero-fallback" aria-hidden="true">
      <div className="hero-fallback__cloth" />
      <div className="hero-fallback__ring" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* What this is                                                                */
/* -------------------------------------------------------------------------- */

function About() {
  return (
    <section className="purpose" id="about">
      <div className="shell">
        <div className="purpose__grid">
          <header className="purpose__head">
            <p className="eyebrow reveal">{ABOUT.eyebrow}</p>
            <h2 className="purpose__title reveal" style={{ ['--reveal-delay' as string]: '60ms' }}>
              {ABOUT.title[0]}{' '}
              <em className="display-italic">{ABOUT.title[1]}</em> {ABOUT.title[2]}
            </h2>
          </header>

          <div className="purpose__body">
            {ABOUT.body.map((p, i) => (
              <p
                key={i}
                className={i === 0 ? 'purpose__lead reveal' : 'reveal'}
                style={{ ['--reveal-delay' as string]: `${i * 80}ms` }}
              >
                {p}
              </p>
            ))}
            <p className="purpose__note reveal" style={{ ['--reveal-delay' as string]: '180ms' }}>
              {ABOUT.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* The two states                                                              */
/* -------------------------------------------------------------------------- */

function Areas() {
  return (
    <section className="areas on-navy grain" id="areas">
      <div className="shell">
        <div className="areas__head">
          <p className="eyebrow reveal">Where we source</p>
          <h2 className="areas__title reveal">
            Two states to <em className="display-italic">begin</em> with.
          </h2>
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
              </div>
            </article>
          ))}
        </div>

        <p className="areas__foot reveal">{AREAS_FOOT}</p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* The pinned sequence                                                         */
/* -------------------------------------------------------------------------- */

function Process() {
  const track = React.useRef<HTMLDivElement>(null)
  const { progress, active } = useScrollProgress(track, STAGES.length)

  return (
    <section className="process on-dark grain" id="process">
      <div className="shell">
        <div className="process__head">
          <p className="eyebrow reveal">How it works</p>
          <h2 className="process__title reveal">
            Four stages. <em className="display-italic">Stop at any of them</em>.
          </h2>
          <p className="process__intro reveal">{PROCESS_INTRO}</p>
        </div>
      </div>

      {/* On wide screens the frame pins and the four stages scroll past it. On
          narrow screens there is no pinning: each stage carries its own object,
          directly under its own words. */}
      <div className="sequence" ref={track} style={{ ['--count' as string]: STAGES.length }}>
        <div className="sequence__pin">
          <div className="shell sequence__inner">
            <div className="sequence__visual">
              <div className="sequence__stage">
                <Stage
                  label="Four interactive objects, one per stage: a bolt of cloth, a weaving shuttle, a yarn bobbin and a brass reed. Each swings in as you scroll and can be dragged."
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
              </div>
            </div>

            <ol className="sequence__text">
              {STAGES.map((s, i) => (
                <li key={s.n} className={`seq-step ${i === active ? 'is-active' : ''}`} data-step={i}>
                  <span className="stage__n">{s.n}</span>
                  <h3 className="stage__title">{s.title}</h3>
                  <p className="stage__text">{s.body}</p>
                  <p className="seq-step__object">{STAGE_OBJECT_LABELS[s.object as StageKind]}</p>

                  <div className="seq-step__plate">
                    <Stage
                      label={`Interactive 3D object for stage ${s.n}: ${STAGE_OBJECT_LABELS[s.object as StageKind]}. Drag to turn it.`}
                      z={5}
                      fov={36}
                      dpr={[1, 1.4]}
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
/* The first message                                                           */
/* -------------------------------------------------------------------------- */

function FirstMessage() {
  return (
    <section className="bring" id="first-message">
      <div className="shell">
        <div className="bring__grid">
          <div className="bring__left">
            <p className="eyebrow reveal">{FIRST_MESSAGE.eyebrow}</p>
            <h2 className="bring__title reveal">
              {FIRST_MESSAGE.title[0]}{' '}
              <em className="display-italic">{FIRST_MESSAGE.title[1]}</em>.
            </h2>
            <p className="bring__intro reveal">{FIRST_MESSAGE.body}</p>

            <ul className="checklist">
              {FIRST_MESSAGE.items.map((item, i) => (
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
                Start an enquiry
                <Arrow />
              </Link>
            </div>
          </div>

          <aside className="bring__right reveal">
            <p className="eyebrow eyebrow--bare">Later in the conversation</p>
            <dl className="later">
              {LATER_DISCUSSIONS.map((d) => (
                <div key={d.t} className="later__row">
                  <dt>{d.t}</dt>
                  <dd>{d.d}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* The limits                                                                  */
/* -------------------------------------------------------------------------- */

function Boundaries() {
  return (
    <section className="bounds" id="limits">
      <div className="shell">
        <header className="bounds__head">
          <p className="eyebrow reveal">{BOUNDARIES.eyebrow}</p>
          <h2 className="bounds__title reveal">
            {BOUNDARIES.title[0]}{' '}
            <em className="display-italic">{BOUNDARIES.title[1]}</em>.
          </h2>
        </header>

        <ul className="bounds__list bounds__list--prose">
          {BOUNDARIES.body.map((b, i) => (
            <li
              key={i}
              className="bounds__row reveal"
              style={{ ['--reveal-delay' as string]: `${i * 60}ms` }}
            >
              <span className="bounds__num">{String(i + 1).padStart(2, '0')}</span>
              <p className="bounds__def">{b}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* The closing invitation                                                      */
/* -------------------------------------------------------------------------- */

function CloseEnquiry() {
  return (
    <section className="closing">
      <div className="shell closing__inner">
        <div className="closing__cloth" aria-hidden="true">
          <Stage
            label="A hanging panel of cloth. Drag to turn it."
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
          <p className="eyebrow reveal">{CLOSING.eyebrow}</p>
          <h2 className="closing__title reveal">
            {CLOSING.title[0]} <em className="display-italic">{CLOSING.title[1]}</em>.
          </h2>
          <p className="closing__lede reveal">{CLOSING.body}</p>
          <div className="closing__actions reveal">
            <Link to="/enquiry" className="btn">
              {CLOSING.cta}
              <Arrow />
            </Link>
            <a href={`mailto:${BUSINESS.email}`} className="tlink">
              {BUSINESS.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

/** The running colophon strip. Kept because it names the material families, and
 *  because a page of full-bleed sections needs one quiet horizontal line. */
const RIBBON = ['Cotton', 'Silk', 'Blends', 'Woven', 'Printed', 'Dyed', 'Handloom', 'Mill-made']

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
    </div>
  )
}

export default function Overview() {
  useReveal([])

  return (
    <>
      <Hero />
      <Ribbon />
      <About />
      <Areas />
      <Process />
      <FirstMessage />
      <Boundaries />
      <CloseEnquiry />
    </>
  )
}
