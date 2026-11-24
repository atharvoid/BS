import { Link } from 'react-router-dom'
import { FABRIC_TOPICS } from '../content'
import { Arrow } from './Nav'

/* ==========================================================================
   What to tell us about your fabric

   Four things make a textile enquiry answerable. Each is a small card: the
   question, and one example of a useful answer. Two by two on a wide
   screen, one column on a phone, so the whole brief is read at a glance
   instead of scrolled through.
   ========================================================================== */

/** How an answer reads when it is useful. Illustrative only: the wording of
 *  a real enquiry is the buyer's own. */
const EXAMPLES = [
  'Mid-weight cotton twill for workwear, natural or undyed.',
  'We can post a swatch from our last order.',
  'About 4,000 metres, rolled and bale-packed for sea freight.',
  'Shade tolerance and a pre-shipment sample.',
]

export function FabricBrief() {
  return (
    <section className="fbrief" id="fabric-details" aria-labelledby="fbrief-title">
      <div className="shell fbrief__grid">
        <div className="fbrief__intro">
          <h2 className="fbrief__title" id="fbrief-title">What to tell us about your fabric</h2>
          <p className="fbrief__lede">
            Four answers make an enquiry easy to act on. Anything you do not know yet can be
            settled in the reply.
          </p>
          <Link to="/textiles#textile-enquiry" className="btn">
            Start a textile enquiry
            <Arrow />
          </Link>
        </div>

        <ol className="fbrief__cards">
          {FABRIC_TOPICS.map((topic, index) => (
            <li key={topic.n} className="fbrief__card">
              <span className="fbrief__num" aria-hidden="true">{topic.n}</span>
              <h3 className="fbrief__field">{topic.title}</h3>
              <p className="fbrief__ask">{topic.body}</p>
              <p className="fbrief__example"><span>For example</span> {EXAMPLES[index]}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
