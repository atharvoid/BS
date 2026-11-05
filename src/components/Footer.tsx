import { Link } from 'react-router-dom'
import { BUSINESS } from '../content'
import { Arrow } from './Nav'
import { Mark } from './Logo'

export function Footer() {
  return (
    <footer className="footer on-dark grain">
      <div className="shell">
        <div className="footer__top">
          <div className="footer__invite">
            <p className="eyebrow">Open an enquiry</p>
            <h2 className="footer__head">
              Tell us what you <em className="display-italic">need</em>. A short
              description is enough.
            </h2>
            <div className="footer__cta">
              <Link to="/enquiry" className="btn btn--light">
                Textile enquiry
                <Arrow />
              </Link>
              <a href={`mailto:${BUSINESS.email}`} className="tlink footer__mail">
                {BUSINESS.email}
              </a>
            </div>
          </div>

          <div className="footer__cols">
            <div>
              <p className="footer__label">Pages</p>
              <ul className="footer__list">
                <li><Link to="/">Overview</Link></li>
                <li><Link to="/textiles">Textiles &amp; fabrics</Link></li>
                <li><Link to="/enquiry">Textile enquiry</Link></li>
                <li><Link to="/privacy">Enquiry privacy</Link></li>
              </ul>
            </div>
            <div>
              <p className="footer__label">Initial areas</p>
              <ul className="footer__list footer__list--muted">
                <li>Tamil Nadu</li>
                <li>Gujarat</li>
                <li className="footer__list-note">India-focused sourcing</li>
              </ul>
            </div>
            <div>
              <p className="footer__label">Status</p>
              <ul className="footer__list footer__list--muted">
                <li>Developing business</li>
                <li>Scope set per enquiry</li>
                <li className="footer__list-note">No catalogue of confirmed availability</li>
              </ul>
            </div>
          </div>
        </div>

        {/* The artwork rather than a typographic stand-in. It is a mask, so it
            picks up the footer's own colour. */}
        <div className="footer__wordmark" aria-hidden="true">
          <Mark height={82} />
        </div>

        <div className="footer__base">
          <p className="small">
            © {new Date().getFullYear()} {BUSINESS.name}. Sourcing &amp; trade coordination, India.
          </p>
          <p className="small footer__disclaimer">
            Textile imagery is representative of material families. It is not evidence of supplier
            stock, and it is not a catalogue. Nothing on this site confirms price, minimum quantity,
            lead time or specification.
          </p>
        </div>
      </div>
    </footer>
  )
}
