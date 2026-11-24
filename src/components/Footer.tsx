import { Link } from 'react-router-dom'
import { BUSINESS } from '../content'
import { Logo } from './Logo'

/* One row: the mark with what the business is, the links, and how to reach
   it. A thin base line carries the year and the privacy link. */
export function Footer() {
  return (
    <footer className="footer on-dark grain">
      <div className="shell">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" aria-label={`${BUSINESS.name}, overview`}>
              <Logo className="brand-logo footer__logo" />
            </Link>
            <p className="footer__desc">{BUSINESS.descriptor}</p>
          </div>
          <nav aria-label="Footer" className="footer__nav">
            <p className="footer__label">Site</p>
            <ul className="footer__list">
              <li><Link to="/#products">Products</Link></li>
              <li><Link to="/textiles">Textiles</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/enquiry">Start an enquiry</Link></li>
            </ul>
          </nav>
          <div className="footer__contact">
            <p className="footer__label">Contact</p>
            <a className="footer__mail" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            <p className="footer__note">Every enquiry is read and answered by a person.</p>
          </div>
        </div>
        <div className="footer__base">
          <p className="small">© {new Date().getFullYear()} {BUSINESS.name}</p>
          <Link to="/privacy" className="small footer__privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}
