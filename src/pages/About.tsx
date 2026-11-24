import React from 'react'
import { Link } from 'react-router-dom'
import { useReveal } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import {
  BUSINESS,
  ABOUT_BUSINESS,
  ABOUT_VISION,
  ABOUT_GOALS,
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
          <h1 className="about-hero__title">{ABOUT_BUSINESS.title}</h1>
          <p className="about-hero__lede">{ABOUT_BUSINESS.lede}</p>
        </div>
      </section>

      <section className="about-desk-section" id="desk-coordinates">
        <div className="shell">
          <div className="about-desk-grid">
            <div className="about-glance__intro">
              <h2 className="about-glance__title">At a glance</h2>
              <p className="about-glance__lede">The essentials, in one place. Everything else is agreed per enquiry, in writing.</p>
            </div>
            <div className="about-desk-card reveal">
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
          </div>
        </div>
      </section>

      <section className="about-vision" aria-labelledby="about-vision-title">
        <div className="shell">
          <div className="about-vision__grid">
            <figure className="about-vision__quote reveal">
              <h2 id="about-vision-title" className="about-vision__label">{ABOUT_VISION.title}</h2>
              <blockquote>
                <p className="about-vision__statement">{ABOUT_VISION.statement}</p>
                <p className="about-vision__body">{ABOUT_VISION.body}</p>
              </blockquote>
              <figcaption className="about-vision__sign">
                <span className="about-vision__name">{ABOUT_VISION.signedBy.name}</span>
                <span className="about-vision__role">{ABOUT_VISION.signedBy.role}, {BUSINESS.name}</span>
              </figcaption>
            </figure>

            <div className="about-goals">
              <h3 className="about-goals__title reveal">{ABOUT_GOALS.title}</h3>
              <ol className="about-goals__list">
                {ABOUT_GOALS.items.map((goal, i) => (
                  <li key={goal.title} className="about-goal reveal">
                    <span className="about-process-card__num" aria-hidden="true">{i + 1}</span>
                    <div>
                      <h4 className="about-goal__title">{goal.title}</h4>
                      <p className="about-goal__body">{goal.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="about-process">
        <div className="shell">
          <div className="about-process__head">
            <h2 className="about-process__title reveal">How we work</h2>
          </div>
          <div className="about-process__grid">
            {ABOUT_STANDARDS.map((std) => (
              <div key={std.num} className="about-process-card reveal">
                <span className="about-process-card__num" aria-hidden="true">{Number(std.num)}</span>
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
            <h2 className="about-cta__title">Send your sourcing enquiry</h2>
            <p className="about-cta__lede">
              Tell us the product, any specifications and where it is going. We reply by email.
            </p>
            <div className="about-cta__actions">
              <Link to="/enquiry" className="btn">
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
