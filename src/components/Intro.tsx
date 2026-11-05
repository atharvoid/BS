import React from 'react'
import { preloadLogo } from './Logo'
import { openSceneGate } from '../three/gate'

/* ==========================================================================
   The opening.

   On a first visit in a session, the artwork draws itself and then goes home.

   1. The BS outlines and the ship inside them sweep in from the left.
   2. The wordmark follows, a beat later.
   3. Gold floods up from the keel and fills the letters.
   4. The finished lockup shrinks and travels into the header, and the ink
      curtain lifts off the page behind it.

   Everything here is a transform, an opacity or a clip-path on two masked
   elements. There is no canvas, no SVG filter and no animation library, so the
   whole sequence costs less than the page it is covering, and it can be skipped
   by a click, a key or a scroll without leaving anything behind.

   Safety, in order of what can go wrong:

   - The curtain is React state, so if the script never runs, no curtain exists.
   - If anything throws after it mounts, the cleanup runs and the page is left
     uncovered rather than blank.
   - A hard backstop timer removes it no matter what.
   - It is skipped entirely for reduced motion, for a second visit in the same
     session, and for any route but the homepage, so a visitor going straight to
     the enquiry form never waits for a logo.
   ========================================================================== */

const SESSION_KEY = 'bs.opening.seen'

/** Milliseconds from the first frame. One schedule, in one place. */
const SCHEDULE = [
  { at: 40, step: 1 }, // BS outlines begin to draw
  { at: 560, step: 2 }, // the wordmark follows
  { at: 940, step: 3 }, // gold rises through the letters
  { at: 1560, step: 4 }, // the lockup travels to the header
  { at: 2140, step: 5 }, // the curtain clears
  { at: 2620, step: 6 }, // unmount
] as const

function shouldRun() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (window.location.pathname !== '/') return false
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // Private mode with storage blocked: run once, do not fight it.
  }
  return true
}

export function Intro() {
  /* Decided once, before paint, so the curtain is never visible to a visitor
     who is not going to see the sequence. */
  const [active] = React.useState(shouldRun)
  const [step, setStep] = React.useState(0)
  const lockRef = React.useRef<HTMLDivElement>(null)
  const markRef = React.useRef<HTMLSpanElement>(null)

  /* Point the flight at wherever the header actually is. Measured once, after
     the header has laid out, and written as custom properties so the transform
     is a single compositor-only animation. */
  const aim = React.useCallback(() => {
    const el = lockRef.current
    const mark = markRef.current
    const target = document.querySelector<HTMLElement>('[data-intro-target]')
    if (!el || !mark || !target) return

    const from = mark.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    if (!from.height || !to.height) return

    const s = to.height / from.height
    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)
    el.style.setProperty('--tx', `${dx.toFixed(2)}px`)
    el.style.setProperty('--ty', `${dy.toFixed(2)}px`)
    el.style.setProperty('--ts', s.toFixed(4))
  }, [])

  const finish = React.useCallback(() => {
    setStep(6)
    document.documentElement.classList.remove('opening-lock')
    openSceneGate()
  }, [])

  React.useEffect(() => {
    if (!active) return
    preloadLogo()
    document.documentElement.classList.add('opening-running', 'opening-lock')

    const timers = SCHEDULE.map((s) => window.setTimeout(() => setStep(s.step), s.at))
    /* The flight needs a measured destination, so it is re-aimed just before it
       starts rather than at mount: fonts, a scrollbar or a resize can all move
       the header between the first frame and this one. */
    timers.push(
      window.setTimeout(() => {
        aim()
        setStep(4)
      }, SCHEDULE[3].at),
    )
    /* Backstop: whatever else happens, the page is usable in under three
       seconds. */
    const backstop = window.setTimeout(finish, 3200)

    const skip = () => finish()
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchstart', skip, { passive: true })

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(backstop)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchstart', skip)
      document.documentElement.classList.remove('opening-lock')
    }
  }, [active, aim, finish])

  /* Open the gate the moment the curtain begins to lift, not when the component
     unmounts: the globe needs those milliseconds to build so it is already
     turning as it is revealed, rather than popping in a beat late. */
  React.useEffect(() => {
    if (step >= 5) openSceneGate()
  }, [step])

  React.useEffect(() => {
    if (step < 6) return
    const t = window.setTimeout(() => {
      document.documentElement.classList.remove('opening-running')
    }, 520)
    return () => clearTimeout(t)
  }, [step])

  if (!active) {
    /* No opening on this visit. Nothing else opens the gate, so do it here. */
    openSceneGate()
    return null
  }
  if (step >= 6) return null

  return (
    <div className="opening" data-step={step} aria-hidden="true">
      <div className="opening__curtain" />
      <div className="opening__lock" ref={lockRef}>
        <span className="opening__mark" ref={markRef}>
          <span className="opening__edge opening__edge--mark" />
          <span className="opening__fill opening__fill--mark" />
        </span>
        <span className="opening__word">
          <span className="opening__edge opening__edge--word" />
          <span className="opening__fill opening__fill--word" />
        </span>
      </div>
    </div>
  )
}
