import { Link } from 'react-router-dom'
import { EnquiryForm } from '../components/EnquiryForm'
import { useReveal } from '../components/useReveal'
import { BUSINESS } from '../content'

export default function Enquiry() {
  useReveal([])

  return (
    <>
      <section className="enquiry-hero on-dark grain">
        <div className="shell">
          <div className="enquiry-hero__grid">
            <div>
              <p className="eyebrow">Textile enquiry</p>
              <h1 className="enquiry-hero__title">
                Say what the fabric <em className="display-italic">has to do</em>.
              </h1>
              <p className="enquiry-hero__lede">
                This form is filed as a textiles and fabrics enquiry. Five answers are required, and
                a finished specification is not one of them.
              </p>
            </div>
            <div className="enquiry-hero__aside">
              <p className="enquiry-hero__aside-label">Prefer email?</p>
              <a href={`mailto:${BUSINESS.email}`} className="enquiry-hero__mail">
                {BUSINESS.email}
              </a>
              <ul className="enquiry-hero__facts">
                <li>Filed as textiles and fabrics</li>
                <li>Attachments not accepted</li>
                <li>Replies come from the business inbox</li>
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
                    A person reads it and replies from the business inbox.
                  </li>
                  <li>
                    <span>02</span>
                    The reply usually asks one or two clarifying questions.
                  </li>
                  <li>
                    <span>03</span>
                    Material options and samples may then be discussed.
                  </li>
                </ol>
                <p className="side-card__note">
                  The acknowledgement page that follows this form confirms the page was reached. It
                  does not confirm that the message arrived in the inbox.
                </p>
              </div>

              <div className="side-card side-card--quiet reveal">
                <p className="eyebrow eyebrow--bare">Please do not send</p>
                <p className="side-card__warn">
                  Passwords, payment details, or sensitive personal documents. Share relevant
                  business information only.
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
