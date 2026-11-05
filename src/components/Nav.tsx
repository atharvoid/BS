import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BUSINESS } from '../content'

const LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/textiles', label: 'Textiles & fabrics' },
  { to: '/enquiry', label: 'Textile enquiry' },
  { to: '/privacy', label: 'Privacy' },
]

export function Nav() {
  const [open, setOpen] = React.useState(false)
  const [lifted, setLifted] = React.useState(false)
  const { pathname } = useLocation()

  React.useEffect(() => setOpen(false), [pathname])

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

  React.useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <div className="progress" aria-hidden="true" />
      <header className={`nav ${lifted ? 'nav--lifted' : ''} ${open ? 'nav--open' : ''}`}>
        <div className="nav__inner shell">
          <Link to="/" className="brand" aria-label={`${BUSINESS.name}, overview`}>
            <span className="brand__mark" aria-hidden="true">
              <span />
            </span>
            <span className="brand__type">
              <strong>{BUSINESS.wordmark}</strong>
              <span className="brand__rule" aria-hidden="true" />
              <span>{BUSINESS.wordmarkRest}</span>
            </span>
          </Link>

          <nav className="nav__links" aria-label="Primary">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav__actions">
            <a className="nav__mail" href={`mailto:${BUSINESS.email}`}>
              {BUSINESS.email}
            </a>
            <Link to="/enquiry" className="btn btn--small">
              Start an enquiry
              <Arrow />
            </Link>
          </div>

          <button
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

      <div id="nav-drawer" className={`drawer ${open ? 'drawer--open' : ''}`} hidden={!open}>
        <nav className="drawer__links" aria-label="Mobile">
          {LINKS.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={{ transitionDelay: open ? `${80 + i * 55}ms` : '0ms' }}
              className={({ isActive }) => `drawer__link ${isActive ? 'is-active' : ''}`}
            >
              <span className="drawer__num">{String(i + 1).padStart(2, '0')}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="drawer__foot">
          <Link to="/enquiry" className="btn btn--light drawer__cta">
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
