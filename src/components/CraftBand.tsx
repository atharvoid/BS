import React from 'react'
import { Link } from 'react-router-dom'
import { CRAFT, getCategory, smallPhoto } from '../content'
import { Arrow } from './Nav'
import '../styles/craft.css'

/* ==========================================================================
   Colour, clay and cloth

   A scroll-driven sequence. The section pins to the screen while the page
   scrolls past it, and each photograph in turn unrolls upward into its frame,
   with its words rising beside it, then rolls away as the next arrives. The
   ground takes on a trace of each piece's colour.

   The scroll position is turned into two numbers per plate, written as CSS
   variables: --r (how far it has unrolled in) and --x (how far it has rolled
   away). CSS does the drawing; nothing is animated on a timer. Without
   script, or with reduced motion, the plates are a plain list in the page.
   ========================================================================== */

const N = CRAFT.items.length
/** How much of each plate's viewport of scroll is spent unrolling it. */
const ENTER = 0.62
const half = (n: number) => Math.round(n / 2)
const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function CraftBand() {
  const track = React.useRef<HTMLDivElement>(null)
  const [sequenced, setSequenced] = React.useState(false)
  const [active, setActive] = React.useState(0)

  React.useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setSequenced(!motion.matches)
    sync()
    motion.addEventListener('change', sync)
    return () => motion.removeEventListener('change', sync)
  }, [])

  React.useEffect(() => {
    const el = track.current
    if (!sequenced || !el) return
    const plates = Array.from(el.querySelectorAll<HTMLElement>('.craft__plate'))
    const last = new Array<string>(N).fill('')
    let raf = 0
    let current = -1

    const update = () => {
      raf = 0
      const vh = window.innerHeight
      // Viewports scrolled since the top of the track reached the bottom of
      // the screen. The stage pins at s = 1 and plate i owns s in [i, i + 1).
      const s = (vh - el.getBoundingClientRect().top) / vh
      let best = 0
      plates.forEach((plate, i) => {
        const r = clamp((s - i - (1 - ENTER)) / ENTER)
        const x = i === N - 1 ? 0 : clamp((s - (i + 1) - (1 - ENTER)) / ENTER)
        const key = `${r.toFixed(4)}|${x.toFixed(4)}`
        if (key !== last[i]) {
          last[i] = key
          plate.style.setProperty('--r', r.toFixed(4))
          plate.style.setProperty('--x', x.toFixed(4))
        }
        if (r > 0.5 && x < 0.5) best = i
      })
      if (best !== current) {
        current = best
        setActive(best)
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [sequenced])

  /* A keyboard user tabbing to a plate's link scrolls that plate into view. */
  const bringIntoView = (i: number) => {
    const el = track.current
    if (!sequenced || !el || i === active) return
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + (i + 0.02) * window.innerHeight, behavior: 'instant' })
  }

  const tone = CRAFT.items[active].tone

  return (
    <section
      className={`craft${sequenced ? ' craft--seq' : ''}`}
      aria-labelledby="craft-title"
      style={{ '--n': N, '--tone': tone } as React.CSSProperties}
    >
      <div className="craft__track" ref={track}>
        <div className="craft__stage">
          <div className="shell craft__bar">
            <h2 className="craft__title" id="craft-title">{CRAFT.title}</h2>
            <p className="craft__count" aria-hidden="true">
              <span className="craft__count-now">{String(active + 1).padStart(2, '0')}</span>
              <span className="craft__rail">
                {CRAFT.items.map((item, i) => (
                  <span key={item.id} className={i <= active ? 'is-on' : undefined} />
                ))}
              </span>
              <span>{String(N).padStart(2, '0')}</span>
            </p>
          </div>

          <ol className="craft__plates shell">
            {CRAFT.items.map((item, i) => {
              const small = smallPhoto(item.src)
              const category = getCategory(item.category)
              return (
                <li
                  key={item.id}
                  className={`craft__plate craft__plate--${item.id}${i % 2 ? ' craft__plate--flip' : ''}${i === active ? ' is-active' : i < active ? ' is-past' : ''}`}
                  style={{ '--ratio': item.width / item.height } as React.CSSProperties}
                >
                  <figure className="craft__frame">
                    <img
                      className="craft__img"
                      src={small}
                      srcSet={`${small} ${half(item.width)}w, ${item.src} ${item.width}w`}
                      sizes="(max-width: 900px) 100vw, 60vw"
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      loading="lazy"
                      decoding="async"
                    />
                  </figure>
                  <div className="craft__words">
                    <span className="craft__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <p className="craft__cat"><span>{category.label}</span></p>
                    <h3 className="craft__name"><span>{item.title}</span></h3>
                    <p className="craft__line"><span>{item.line}</span></p>
                    <p className="craft__cta">
                      <span>
                        <Link to={`/enquiry?category=${item.category}`} className="craft__link" onFocus={() => bringIntoView(i)}>
                          Enquire about {item.category === 'textiles' ? 'textiles' : 'homeware'}
                          <Arrow />
                        </Link>
                      </span>
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
