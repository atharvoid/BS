import React from 'react'
import { flushSync } from 'react-dom'

/* Light / dark switch, top right.
 *
 * The theme is set on <html data-theme> by a tiny script in index.html before
 * first paint (stored choice, else the system setting), so there is no flash
 * of the wrong theme. This button only flips it and remembers the choice.
 *
 * The change spreads out as a circle from the button using a view
 * transition; browsers without it, and visitors who prefer reduced motion,
 * get an instant switch. The icon itself morphs: the sun's rays retract and a
 * shadow slides across to leave a crescent.
 *
 * Two things keep the switch from flickering:
 * - While it runs, <html data-theme-switching> turns off every colour fade
 *   on the page (see dyehouse.css). Otherwise buttons, borders and fields
 *   would fade in from the old theme's colours inside the new circle.
 * - A click while the circle is still spreading sends it back to the button
 *   rather than starting a new one. Starting over would make the browser cut
 *   the first circle short, snapping the whole page to the new theme for a
 *   moment before the second circle begins. While a view transition runs the
 *   browser sends every click to <html>, not the button, so those clicks are
 *   caught at the document and matched to the button by position. */

type Theme = 'light' | 'dark'
const KEY = 'bs-theme'

const current = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#14110d' : '#f2ebdd')
}

function remember(theme: Theme) {
  try { localStorage.setItem(KEY, theme) } catch { /* storage blocked */ }
}

/* The switch in progress, if any: the theme it opened and the one the
   visitor now wants, which differ after a click sends the circle back. */
type Swap = { to: Theme; target: Theme; reveal: Animation | null; layers: Animation[] }
let swap: Swap | null = null

const freezeFades = () => { document.documentElement.dataset.themeSwitching = '' }
const releaseFades = () => { delete document.documentElement.dataset.themeSwitching }

/* The circle can be turned round until it has fully opened. */
const turnable = (live: Swap | null): live is Swap =>
  live !== null && live.reveal?.playState !== 'finished'

function turnBack(live: Swap): Theme {
  const next: Theme = live.target === 'dark' ? 'light' : 'dark'
  live.target = next
  for (const layer of live.layers) layer.reverse()
  remember(next)
  return next
}

/* One press of the toggle, however it arrives. */
function press(button: HTMLElement, setTheme: (theme: Theme) => void) {
  // Mid-switch: turn the circle round instead of starting another.
  if (turnable(swap)) { setTheme(turnBack(swap)); return }

  const next: Theme = current() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  remember(next)

  const commit = () => {
    freezeFades()
    applyTheme(next)
    setTheme(next)
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const doc = document as Document & { startViewTransition?: (cb: () => void) => ViewTransition }
  if (reduce || !doc.startViewTransition) {
    commit()
    // Let the new colours land before fades come back.
    requestAnimationFrame(() => requestAnimationFrame(releaseFades))
    return
  }

  const box = button.getBoundingClientRect()
  const x = box.left + box.width / 2
  const y = box.top + box.height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const root = document.documentElement.style
  root.setProperty('--vt-x', `${x}px`)
  root.setProperty('--vt-y', `${y}px`)
  root.setProperty('--vt-r', `${radius}px`)
  /* The reveal works on a still snapshot of the old page, which would freeze
     the turning globe or cloth for the length of the circle. Lifting the 3D
     stage out of the snapshot as its own live layer keeps it moving, but only
     while some of it is on screen.

     A lifted layer is drawn above the whole page, so the fixed nav is lifted
     too: it is the later layer, so it stays on top of the globe instead of the
     globe painting over the menu. It takes the same circle (dyehouse.css). */
  const found = document.querySelector<HTMLElement>('.hero__stage, .page-hero__stage')
  const area = found?.getBoundingClientRect()
  const stage = area && area.bottom > 0 && area.top < innerHeight ? found : null
  const nav = document.querySelector<HTMLElement>('.nav')
  stage?.style.setProperty('view-transition-name', 'theme-stage')
  nav?.style.setProperty('view-transition-name', 'theme-nav')

  const mine: Swap = { to: next, target: next, reveal: null, layers: [] }
  swap = mine
  const transition = doc.startViewTransition(() => flushSync(commit))
  transition.ready.then(() => {
    const circles = document.getAnimations().filter((a) =>
      /^::view-transition-new((root|theme-nav))$/.test((a.effect as KeyframeEffect | null)?.pseudoElement ?? ''))
    const reveal = circles.find((a) => (a.effect as KeyframeEffect).pseudoElement === '::view-transition-new(root)') ?? null
    mine.reveal = reveal
    mine.layers = circles
    if (!reveal) return
    /* When a circle that was sent back closes, put the page back under it.
       The new layer is fully clipped by then, so nothing shows. */
    reveal.addEventListener('finish', () => {
      if (mine.target !== current()) applyTheme(mine.target)
    })
    if (mine.target !== mine.to) for (const layer of circles) layer.reverse()
  }, () => { /* skipped: the page is already in the new theme */ })
  transition.finished.finally(() => {
    if (swap !== mine) return
    swap = null
    if (mine.target !== current()) applyTheme(mine.target)
    stage?.style.removeProperty('view-transition-name')
    nav?.style.removeProperty('view-transition-name')
    releaseFades()
  })
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>(current)
  const button = React.useRef<HTMLButtonElement>(null)

  /* Clicks on the button made mid-switch, or pressed mid-switch and released
     after, arrive at <html> (see above). */
  React.useEffect(() => {
    const onButton = (event: MouseEvent) => {
      const el = button.current
      if (!el) return false
      const r = el.getBoundingClientRect()
      return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom
    }
    const onStrayClick = (event: MouseEvent) => {
      if (event.target !== document.documentElement || !onButton(event)) return
      press(button.current!, setTheme)
    }
    /* Quick repeated presses count as a double or triple click, which would
       select the nearby headline; stop that selection on the button. */
    const onRepeatPress = (event: MouseEvent) => {
      if (event.detail > 1 && onButton(event)) event.preventDefault()
    }
    document.addEventListener('click', onStrayClick)
    document.addEventListener('mousedown', onRepeatPress)
    return () => {
      document.removeEventListener('click', onStrayClick)
      document.removeEventListener('mousedown', onRepeatPress)
    }
  }, [])

  // Follow the system setting until the visitor makes a choice of their own.
  React.useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      let stored: string | null = null
      try { stored = localStorage.getItem(KEY) } catch { /* storage blocked */ }
      if (stored) return
      const next: Theme = query.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => press(event.currentTarget, setTheme)

  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      data-mode={theme}
      ref={button}
      onClick={toggle}
      aria-pressed={dark}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="visually-hidden">Dark mode</span>
      <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
        <mask id="theme-toggle-moon">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle className="theme-toggle__shadow" cx="24" cy="4" r="7" fill="black" />
        </mask>
        <circle className="theme-toggle__body" cx="12" cy="12" r="5" mask="url(#theme-toggle-moon)" />
        <g className="theme-toggle__rays">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="12" y1="2.2" x2="12" y2="4.4" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
      </svg>
    </button>
  )
}
