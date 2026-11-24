import { Link } from 'react-router-dom'
import { Arrow } from '../components/Nav'

export default function NotFound() {
  return (
    <section className="notfound">
      <div className="shell notfound__inner">
        <p className="eyebrow">404</p>
        <h1 className="notfound__title">
          Page not found
        </h1>
        <p className="notfound__lede">
          This page doesn’t exist, or it has moved.
        </p>
        <div className="notfound__actions">
          <Link to="/" className="btn">
            Back to home
            <Arrow />
          </Link>
          <Link to="/#products" className="tlink">
            See what we source
          </Link>
        </div>
      </div>
    </section>
  )
}
