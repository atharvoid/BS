import { Link } from 'react-router-dom'
import { BUSINESS } from '../content'

export function Footer() {
  return (
    <footer className="footer on-dark grain">
      <div className="shell">
        <div className="footer__top">
          <div><p className="eyebrow">BS EXIMNEXUS</p><a className="tlink footer__mail" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></div>
          <nav aria-label="Footer"><ul className="footer__list">
            <li><Link to="/#products">Products</Link></li><li><Link to="/textiles">Textiles</Link></li>
            <li><Link to="/enquiry">Enquire</Link></li><li><Link to="/privacy">Enquiry privacy</Link></li>
          </ul></nav>
        </div>
        <div className="footer__wordmark" aria-hidden="true"><span>BS</span><span className="footer__wordmark-rest">EXIMNEXUS</span></div>
        <div className="footer__base"><p className="small">© {new Date().getFullYear()} {BUSINESS.name}. Sourcing &amp; trade coordination, India.</p></div>
      </div>
    </footer>
  )
}
