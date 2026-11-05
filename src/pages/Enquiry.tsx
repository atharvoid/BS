import { Link } from 'react-router-dom'
import { EnquiryForm } from '../components/EnquiryForm'
import { useReveal } from '../components/useReveal'
import { BUSINESS, ENQUIRY_PAGE } from '../content'

export default function Enquiry() {
  useReveal([])

  return (
    <>
      <section className="enquiry-hero on-dark grain">
        <div className="shell">
          <div className="enquiry-hero__grid">
            <div>
              <p className="eyebrow">{ENQUIRY_PAGE.eyebrow}</p>
              <h1 className="enquiry-hero__title">
                Tell us what the cloth <em className="display-italic">has to do</em>.
              </h1>
              <p className="enquiry-hero__lede">{ENQUIRY_PAGE.lede}</p>
            </div>
            <div className="enquiry-hero__aside">
              <p className="enquiry-hero__aside-label">Prefer email?</p>
              <a href={`mailto:${BUSINESS.email}`} className="enquiry-hero__mail">
                {BUSINESS.email}
              </a>
              <ul className="enquiry-hero__facts">
                <li>No attachments needed</li>
                <li>A person reads each one</li>
                <li>Reply comes from the inbox above</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="enquiry-body">
        <div className="shell">
          <div className="enquiry-body__grid">
            <div className="enquiry-body__form">
              <EnquiryForm subject="textiles" />
            </div>

            <aside className="enquiry-body__side">
              <div className="side-card reveal">
                <p className="eyebrow eyebrow--bare">What happens next</p>
                <ol className="side-steps">
                  <li>
                    <span>01</span>
                    Someone reads it and replies from the inbox.
                  </li>
                  <li>
                    <span>02</span>
                    The reply usually asks a question or two.
                  </li>
                  <li>
                    <span>03</span>
                    Samples and options follow from there.
                  </li>
                </ol>
                <p className="side-card__note">
                  {ENQUIRY_PAGE.aside[0]} If nothing arrives, write to the address above.
                </p>
              </div>

              <div className="side-card side-card--quiet reveal">
                <p className="eyebrow eyebrow--bare">Please do not send</p>
                <p className="side-card__warn">
                  Passwords, payment details or personal documents. Business information is enough.
                </p>
                <Link to="/privacy" className="tlink">
                  Enquiry privacy
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
