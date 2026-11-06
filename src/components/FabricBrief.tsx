import React from 'react'
import { Link } from 'react-router-dom'
import { BUSINESS, FABRIC_TOPICS } from '../content'
import { Arrow } from './Nav'
import '../styles/products.css'

/* ==========================================================================
   What to tell us about your fabric.

   This replaced the four objects that used to swing in on arcs. The reasoning
   is in CHANGES.md, and it comes down to this: those objects illustrated
   nothing. A buyer needs to know which four things make an enquiry answerable,
   and a cloth bolt flying across a plate does not say that. A written brief
   does, and it is the part of the page a buyer would screenshot and take to a
   colleague.

   So the section is now an example brief: four fields, each with the question
   it answers and an answer written the way a buyer would actually write it.
   Nothing here needs a frame budget, so it is smooth on every device by
   construction, and it stays fully readable with images, WebGL and JavaScript
   unavailable.
   ========================================================================== */

/** How an answer reads when it is useful. Illustrative, not a template
 *  commitment: the wording of a real enquiry is the buyer's own. */
const EXAMPLES = [
  'A mid-weight cotton twill for workwear, in natural or undyed shades.',
  'The last order was matched to a swatch we can post, or a photo on screen.',
  'Roughly 4,000 metres, rolled and bale-packed for sea freight.',
  'Shade tolerance, a pre-shipment sample, and the terms to be agreed before an order.',
]

export function FabricBrief() {
  const track = React.useRef<HTMLOListElement>(null)
  const [active, setActive] = React.useState(0)

  /* A quiet reading aid, not an animation: the row being read picks up a rule
     and a little weight. One observer, no scroll listener, no per-frame work. */
  React.useEffect(() => {
    const list = track.current
    if (!list || !('IntersectionObserver' in window)) return
    const rows = [...list.querySelectorAll<HTMLElement>('.brief__row')]
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const index = rows.indexOf(visible.target as HTMLElement)
        if (index >= 0) setActive(index)
      },
      { rootMargin: '-38% 0px -42% 0px', threshold: [0.2, 0.6] },
    )
    rows.forEach((row) => io.observe(row))
    return () => io.disconnect()
  }, [])

  return (
    <section className="brief" id="fabric-details">
      <div className="shell">
        <div className="brief__grid">
          <div className="brief__intro">
            <p className="eyebrow reveal">Before you write</p>
            <h2 className="brief__title reveal">
              What to tell us about your <em className="display-italic">fabric</em>.
            </h2>
            <p className="brief__lede reveal">
              Four answers make an enquiry answerable. Anything you do not know yet can be left
              out; it can be settled in the reply.
            </p>
            <div className="brief__actions reveal">
              <Link to="/enquiry?category=textiles" className="btn">
                Start a textile enquiry
                <Arrow />
              </Link>
              <a href={`mailto:${BUSINESS.email}`} className="tlink brief__mail">
                {BUSINESS.email}
              </a>
            </div>
          </div>

          <div className="brief__sheet reveal">
            <div className="brief__sheet-head">
              <span className="brief__sheet-label">Enquiry brief</span>
              <span className="brief__sheet-rule" aria-hidden="true" />
              <span className="brief__sheet-meta">Four fields</span>
            </div>

            <ol className="brief__rows" ref={track}>
              {FABRIC_TOPICS.map((topic, index) => (
                <li
                  key={topic.n}
                  className={`brief__row ${index === active ? 'is-active' : ''}`}
                  aria-current={index === active ? 'true' : undefined}
                >
                  <div className="brief__row-head">
                    <span className="brief__num">{topic.n}</span>
                    <h3 className="brief__field">{topic.title}</h3>
                    <span className="brief__tag">{topic.field.join(' · ')}</span>
                  </div>
                  <p className="brief__ask">{topic.body}</p>
                  <p className="brief__example">
                    <span className="brief__example-label">For example</span>
                    {EXAMPLES[index]}
                  </p>
                </li>
              ))}
            </ol>

            <div className="brief__sheet-foot">
              <p>
                A photograph or a swatch reference helps, but it is not required. Attachments are
                not accepted on the form; mention what you have and we will say how to send it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
