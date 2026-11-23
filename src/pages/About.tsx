import React from 'react'
import { Link } from 'react-router-dom'
import { useReveal } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import {
  BUSINESS,
  ABOUT_BUSINESS,
  ABOUT_OWNER,
  ABOUT_STANDARDS,
  ABOUT_DESK_FACTS,
} from '../content'

export default function About() {
  useReveal([])

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="shell about-hero__inner">
          <p className="eyebrow eyebrow--bare">{ABOUT_BUSINESS.eyebrow}</p>
          <h1 className="about-hero__title">
            Trade coordination and export sourcing in India
          </h1>
          <p className="about-hero__lede">{ABOUT_BUSINESS.lede}</p>
        </div>
      </section>

      <section className="about-desk-section" id="desk-coordinates">
        <div className="shell">
          <div className="about-desk-grid">
            <div className="about-desk-card reveal">
              <div className="about-desk-card__head">
                <span className="about-desk-card__eyebrow">Desk coordinates</span>
                <span className="about-desk-card__contact">Direct contact</span>
              </div>
              <table className="about-desk-table">
                <tbody>
                  {ABOUT_DESK_FACTS.map((fact) => (
                    <tr key={fact.label} className="about-desk-row">
                      <th scope="row" className="about-desk-key">{fact.label}</th>
                      <td className="about-desk-val">
                        {fact.label === 'Direct email' ? (
                          <a href={`mailto:${fact.value}`}>{fact.value}</a>
                        ) : (
                          fact.value
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="about-founder-card reveal">
              <span className="about-founder-card__badge">Founder</span>
              <h2 className="about-founder-card__name">{ABOUT_OWNER.name}</h2>
              <p className="about-founder-card__role">{ABOUT_OWNER.title}</p>
              <div className="about-founder-card__bio">
                {ABOUT_OWNER.summary.map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-process">
        <div className="shell">
          <div className="about-process__head">
            <p className="eyebrow eyebrow--bare reveal">Working method</p>
            <h2 className="about-process__title reveal">
              How enquiries are handled
            </h2>
          </div>
          <div className="about-process__grid">
            {ABOUT_STANDARDS.map((std) => (
              <div key={std.num} className="about-process-card reveal">
                <span className="about-process-card__num">{std.num}</span>
                <h3 className="about-process-card__title">{std.title}</h3>
                <p className="about-process-card__body">{std.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta on-indigo" id="enquiry">
        <div className="shell">
          <div className="about-cta__inner">
            <p className="eyebrow eyebrow--bare">Enquiry</p>
            <h2 className="about-cta__title">
              Send your sourcing enquiry
            </h2>
            <p className="about-cta__lede">
              Send your required materials, specifications, and delivery destination. Bhupendra Sain reviews each enquiry and replies directly by email.
            </p>
            <div className="about-cta__actions">
              <Link to="/enquiry" className="btn btn--light">
                Start an enquiry
                <Arrow />
              </Link>
              <a href={`mailto:${BUSINESS.email}`} className="btn btn--ghost">
                Email directly
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
