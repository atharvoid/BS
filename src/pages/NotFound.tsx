import { Link } from 'react-router-dom'
import { Arrow } from '../components/Nav'

export default function NotFound() {
  return (
    <section className="notfound on-dark grain">
      <div className="shell notfound__inner">
        <p className="eyebrow">404</p>
        <h1 className="notfound__title">
          Page <em className="display-italic">not found</em>.
        </h1>
        <p className="notfound__lede">
          The page you asked for is not part of this site.
        </p>
        <div className="notfound__actions">
          <Link to="/" className="btn btn--light">
            Back to home
            <Arrow />
          </Link>
          <Link to="/enquiry" className="tlink">
            Start an enquiry
          </Link>
        </div>
      </div>
    </section>
  )
}
