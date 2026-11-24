import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_JOURNEY, IMAGE_CAPTION, smallPhoto } from '../content'
import { Arrow } from './Nav'
import { Lightbox, type LightboxImage } from './Lightbox'
import { playSound } from './click-sound'
import '../styles/sourcing.css'

/* ==========================================================================
   The dye vats: what do you want to source?

   Six tall panels, one per category, side by side like vats in a dye yard.
   Each holds its photograph steeped in that category's dye. Opening a panel
   widens it and lifts the photograph out of the dye in its true colours,
   revealed through a spreading pattern of tie-resist (bandhani) dots, the
   site's signature. The open panel says what the category covers, what to
   put in a first message, and goes straight into the enquiry form with that
   category chosen.

   One panel is always open, so the section is never a row of closed doors.
   On a phone the vats stack and open downwards.

   Behaviour:
   - Each panel's header is a real button (aria-expanded) controlling its
     content, so it works with a keyboard and a screen reader.
   - Arrow keys move between panels, Home and End jump to the ends.
   - With a fine pointer, resting on a panel for a moment opens it.
   - Reduced motion: the panels switch without the widening and the reveal.
   ========================================================================== */

const DYES: Record<string, string> = {
  textiles: 'textiles',
  handicrafts: 'handicrafts',
  'agriculture-food': 'agriculture',
  'industrial-materials': 'industrial',
  'organic-sustainable': 'organic',
  general: 'general',
}

const HOVER_DWELL_MS = 140

/** Photographs fade in once decoded, instead of snapping onto the dye. */
const markLoaded = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.dataset.loaded = 'true'
}

export function SwatchBook() {
  const [open, setOpen] = React.useState<string>(CATEGORY_JOURNEY[0].id)
  const [viewing, setViewing] = React.useState<LightboxImage | null>(null)
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([])
  const dwell = React.useRef<number | undefined>(undefined)
  const finePointer = React.useMemo(() => matchMedia('(hover: hover) and (pointer: fine)').matches, [])

  React.useEffect(() => () => window.clearTimeout(dwell.current), [])

  const choose = (id: string, reveal = false) => {
    setOpen(id)
    /* On a phone the vats stack, so opening one can push it partly off
       screen as the previous one closes. Once the change settles, bring the
       open vat fully into view. */
    if (!reveal || !matchMedia('(max-width: 760px)').matches) return
    window.setTimeout(() => {
      const el = document.getElementById(`vat-panel-${id}`)?.closest('.vat')
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.top < 72 || r.bottom > innerHeight) {
        el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      }
    }, 680)
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = CATEGORY_JOURNEY.length - 1
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown' ? Math.min(last, index + 1)
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? Math.max(0, index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (next === null || next === index) return
    event.preventDefault()
    tabs.current[next]?.focus()
    choose(CATEGORY_JOURNEY[next].id)
    playSound('dip')
  }

  return (
    <section className="vats-section" id="products" aria-labelledby="vats-title">
      <div className="shell">
        <header className="vats-head">
          <div>
            <p className="vats-head__eyebrow">Six areas, one desk</p>
            <h2 id="vats-title" className="vats-head__title">What do you want to source?</h2>
          </div>
          <p className="vats-head__lede">
            Open an area to see what it covers and what to put in your first message. Each enquiry
            is discussed case by case.
          </p>
        </header>

        <ol className="vats" aria-label="Product areas">
          {CATEGORY_JOURNEY.map((item, index) => {
            const active = open === item.id
            const photo = smallPhoto(item.image.src)
            return (
              <li
                key={item.id}
                className="vat"
                data-active={active}
                style={{ '--dye': `var(--dye-${DYES[item.id]})` } as React.CSSProperties}
                onPointerEnter={(event) => {
                  if (!finePointer || event.pointerType !== 'mouse' || active) return
                  window.clearTimeout(dwell.current)
                  dwell.current = window.setTimeout(() => choose(item.id), HOVER_DWELL_MS)
                }}
                onPointerLeave={() => window.clearTimeout(dwell.current)}
              >
                <div className="vat__art" aria-hidden="true">
                  <img className="vat__img vat__img--dyed" onLoad={markLoaded} src={photo} alt="" loading="lazy" decoding="async" width={800} height={533} />
                  <img className="vat__img vat__img--true" onLoad={markLoaded} src={photo} srcSet={`${photo} 800w, ${item.image.src} 1600w`} sizes="(max-width: 760px) 100vw, 46vw" alt="" loading="lazy" decoding="async" width={800} height={533} />
                  <span className="vat__shade" />
                </div>

                <h3 className="vat__head">
                  <button
                    ref={(el) => { tabs.current[index] = el }}
                    type="button"
                    className="vat__tab"
                    id={`vat-${item.id}`}
                    aria-expanded={active}
                    aria-controls={`vat-panel-${item.id}`}
                    onClick={() => choose(item.id, true)}
                    onKeyDown={(event) => onKeyDown(event, index)}
                  >
                    <span className="vat__num">{String(index + 1).padStart(2, '0')}</span>
                    <span className="vat__label">{item.label}</span>
                  </button>
                </h3>

                <div
                  className="vat__panel"
                  id={`vat-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`vat-${item.id}`}
                  hidden={!active}
                >
                  {/* The visible title of the open vat. The button above keeps the
                      accessible name; this copy is for the eye. */}
                  <p className="vat__title" aria-hidden="true">{item.label}</p>
                  <p className="vat__scope">{item.scope}</p>
                  <p className="vat__hint">{item.hint}</p>
                  <div className="vat__actions">
                    <Link to={`/enquiry?category=${item.id}`} className="btn vat__cta">
                      Enquire about this
                      <Arrow />
                    </Link>
                    {item.to && <Link to={item.to} className="vat__more">More on textiles</Link>}
                    <button
                      type="button"
                      className="vat__zoom"
                      onClick={() => setViewing({ ...item.image, title: item.label, caption: IMAGE_CAPTION })}
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" /></svg>
                      <span>View photo</span>
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        <p className="vats-note">
          Photographs are representative, not products on offer. Availability and terms are agreed for each enquiry.
        </p>
      </div>
      <Lightbox image={viewing} onClose={() => setViewing(null)} />
    </section>
  )
}
