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
 * shadow slides across to leave a crescent. */

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

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>(current)

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

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const commit = () => {
      applyTheme(next)
      setTheme(next)
      try { localStorage.setItem(KEY, next) } catch { /* storage blocked */ }
    }

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (reduce || !doc.startViewTransition) { commit(); return }

    const box = event.currentTarget.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const root = document.documentElement.style
    root.setProperty('--vt-x', `${x}px`)
    root.setProperty('--vt-y', `${y}px`)
    root.setProperty('--vt-r', `${radius}px`)
    /* The reveal works on a still snapshot of the old page, which would freeze
       the turning globe for the length of the circle. Lifting the globe out
       of the snapshot as its own live layer keeps it turning throughout. */
    const globe = document.querySelector<HTMLElement>('.hero__stage')
    if (globe) globe.style.setProperty('view-transition-name', 'hero-globe')
    const transition = doc.startViewTransition(() => flushSync(commit)) as { finished?: Promise<void> } | undefined
    const release = () => globe?.style.removeProperty('view-transition-name')
    if (transition?.finished) transition.finished.finally(release)
    else release()
  }

  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      data-mode={theme}
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
