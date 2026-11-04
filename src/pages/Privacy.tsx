import { Link } from 'react-router-dom'
import { useReveal } from '../components/useReveal'
import { BUSINESS } from '../content'

const SECTIONS = [
  {
    id: 'collected',
    t: 'What information is collected',
    d: [
      'The enquiry form asks for five things: which description fits you (overseas buyer, buyer in India, or Indian supplier), what you are looking for or offering, the destination or business location, your name, and your email address.',
      'A textile enquiry also records that it concerns textiles. Attachments are not accepted, so no documents are collected through the form.',
    ],
  },
  {
    id: 'why',
    t: 'How it is processed',
    d: [
      'Enquiry information is used to assess and respond to the business enquiry. That is its purpose. It is not used for advertising, and it is not sold.',
      'Web3Forms processes form submissions on behalf of this site and may retain them under its own privacy policy. Correspondence is kept in the business inbox, and private exports may be retained for records.',
    ],
  },
  {
    id: 'storage',
    t: 'What is kept in your browser',
    d: [
      'The site does not save form entries in browser storage. Nothing you type into the enquiry is written to localStorage or cookies.',
      'After a submission is accepted, a small receipt — the enquiry subject, the visitor type and the time — is held in sessionStorage so the acknowledgement page can show what was handed over. It is cleared when the browser session ends, and it can be removed by closing the tab.',
    ],
  },
  {
    id: 'care',
    t: 'What not to send',
    d: [
      'Please share relevant business information only. Do not send passwords, payment details, or sensitive personal documents through the enquiry form.',
    ],
  },
  {
    id: 'rights',
    t: 'Corrections and questions',
    d: [
      'To request a correction to enquiry information, or to ask a question about how it is handled, write to the address below. Include enough detail to identify the enquiry — the email address it was sent from and roughly when.',
    ],
  },
]

export default function Privacy() {
  useReveal([])

  return (
    <>
      <section className="page-hero page-hero--plain on-dark grain">
        <div className="shell page-hero__inner">
          <p className="eyebrow">Enquiry privacy</p>
          <h1 className="page-hero__title">
            What happens to an <em className="display-italic">enquiry</em>.
          </h1>
          <p className="page-hero__lede">
            A short, specific notice. It covers only the enquiry form on this site — there are no
            accounts, no payments and no tracking on this website.
          </p>
        </div>
      </section>

      <section className="privacy">
        <div className="shell">
          <div className="privacy__grid">
            <nav className="privacy__toc reveal" aria-label="On this page">
              <p className="eyebrow eyebrow--bare">On this page</p>
              <ol>
                {SECTIONS.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      {s.t}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#contact">
                    <span>{String(SECTIONS.length + 1).padStart(2, '0')}</span>
                    Contact
                  </a>
                </li>
              </ol>
            </nav>

            <div className="privacy__body">
              {SECTIONS.map((s, i) => (
                <article key={s.id} id={s.id} className="privacy__section reveal" style={{ ['--reveal-delay' as string]: `${i * 50}ms` }}>
                  <h2>
                    <span className="privacy__num">{String(i + 1).padStart(2, '0')}</span>
                    {s.t}
                  </h2>
                  {s.d.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </article>
              ))}

              <article id="contact" className="privacy__section privacy__section--contact reveal">
                <h2>
                  <span className="privacy__num">{String(SECTIONS.length + 1).padStart(2, '0')}</span>
                  Contact
                </h2>
                <p>Write to the business directly for anything relating to an enquiry:</p>
                <a href={`mailto:${BUSINESS.email}`} className="privacy__mail">
                  {BUSINESS.email}
                </a>
                <p className="small">
                  This notice describes current practice for this site. Where a third-party processor
                  is involved, its own privacy policy also applies to the data it handles.
                </p>
              </article>

              <div className="privacy__foot reveal">
                <Link to="/enquiry" className="tlink">
                  Return to the textile enquiry
                </Link>
                <Link to="/" className="tlink">
                  Back to the overview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
