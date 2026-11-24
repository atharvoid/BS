import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BUSINESS } from '../content'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { SoundToggle } from './SoundToggle'
import { useCompactLayout } from './useCompactLayout'

const LINKS = [
  { to: '/#products', label: 'Products' },
  { to: '/textiles', label: 'Textiles' },
  { to: '/about', label: 'About' },
]

export function Nav() {
  const [open, setOpen] = React.useState(false)
  const [lifted, setLifted] = React.useState(false)
  const toggle = React.useRef<HTMLButtonElement>(null)
  const drawer = React.useRef<HTMLDivElement>(null)
  const { pathname, hash } = useLocation()
  const compact = useCompactLayout()
  const current = (to: string): 'page' | 'location' | undefined => {
    if (to === pathname) return 'page'
    if (to === '/#products' && pathname === '/' &&
      ['#products', '#category-directory', '#product-tour'].includes(hash)) return 'location'
    return undefined
  }
  const closeMenu = () => {
    setOpen(false)
    toggle.current?.focus({ preventScroll: true })
  }

  React.useEffect(() => setOpen(false), [pathname, hash])
  React.useEffect(() => {
    if (compact) return
    setOpen(false)
    if (drawer.current?.contains(document.activeElement)) document.querySelector<HTMLElement>('.nav__links a')?.focus({preventScroll:true})
  }, [compact])

  React.useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setLifted(window.scrollY > 24)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  React.useLayoutEffect(() => {
    if (!open) return
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    // The mobile drawer already traps keyboard focus. Also keep the covered
    // main/footer out of the accessibility tree while it is open.
    const background = [...document.querySelectorAll<HTMLElement>('main,footer')]
    const previousInert = background.map(el => el.inert)
    background.forEach(el => { el.inert = true })
    const frame = requestAnimationFrame(() => drawer.current?.querySelector<HTMLElement>('a,button')?.focus())
    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.style.overflow = previous
      background.forEach((el, i) => { el.inert = previousInert[i] })
    }
  }, [open])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); return }
      if (e.key !== 'Tab') return
      const items = [toggle.current, ...Array.from(drawer.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])].filter((el): el is HTMLElement => !!el)
      if (!items.length) return
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus() }
      else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <div className="progress" aria-hidden="true" />
      {/* The header sits over the dark hero, so the pointer's disc is the
          warm-white one here whatever section is scrolled underneath. */}
      <header className={`nav ${lifted ? 'nav--lifted' : ''} ${open ? 'nav--open' : ''}`} data-tone="dark">
        <div className="nav__inner shell">
          <Link to="/" className="brand" aria-label={`${BUSINESS.name}, overview`}>
            <Logo />
          </Link>

          <nav className="nav__links" aria-label="Primary">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                aria-current={current(l.to)}
                data-cursor="menu"
                data-cursor-size="compact"
                className="nav__link"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="nav__actions">
            <Link to="/enquiry" className="btn btn--small" aria-current={current('/enquiry')}>
              Start an enquiry
              <Arrow />
            </Link>
          </div>

          <div className="nav__theme">
            <SoundToggle />
            <ThemeToggle />
          </div>

          <button
            ref={toggle}
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="nav-drawer"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
            <span className="nav__toggle-bar nav__toggle-bar--a" aria-hidden="true" />
            <span className="nav__toggle-bar nav__toggle-bar--b" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div ref={drawer} id="nav-drawer" className={`drawer ${open ? 'drawer--open' : ''}`} data-tone="dark" hidden={!open}>
        <nav className="drawer__links" aria-label="Mobile">
          {LINKS.map((l, i) => (
            <Link
              key={l.to}
              to={l.to}
              aria-current={current(l.to)}
              data-cursor="menu"
              data-cursor-size="row"
              onClick={closeMenu}
              style={{ transitionDelay: open ? `${80 + i * 55}ms` : '0ms' }}
              className="drawer__link"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="drawer__foot">
          <Link to="/enquiry" className="btn drawer__cta" aria-current={current('/enquiry')} onClick={closeMenu}>
            Start an enquiry
            <Arrow />
          </Link>
          <a href={`mailto:${BUSINESS.email}`} className="tlink drawer__mail">
            {BUSINESS.email}
          </a>
          <p className="small drawer__desc">{BUSINESS.descriptor}</p>
        </div>
      </div>
    </>
  )
}

export function Arrow({ className = 'btn__arrow' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 12 12 2M5 2h7v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  )
}
