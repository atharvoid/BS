import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EnquiryForm, useEnquiryDraft } from '../components/EnquiryForm'
import { BUSINESS, CATEGORIES, getCategory } from '../content'

export default function Enquiry() {
  const [params, setParams] = useSearchParams()
  const { draft, setDraft, sending } = useEnquiryDraft()
  const category = getCategory(params.get('category'))

  React.useEffect(() => {
    setDraft((current) => ({ ...current, subject: category.id }))
  }, [category.id, setDraft])

  return (
    <>
      <section className="enquiry-hero on-dark grain">
        <div className="shell">
          <div className="enquiry-hero__grid">
            <div>
              <h1 className="enquiry-hero__title">Start an <em className="display-italic">enquiry.</em></h1>
              <p className="enquiry-hero__lede">Tell us what you need or supply, and where the goods are going.</p>
            </div>
            <div className="enquiry-hero__aside">
              <p className="enquiry-hero__aside-label">Prefer email?</p>
              <a href={`mailto:${BUSINESS.email}`} className="enquiry-hero__mail">{BUSINESS.email}</a>
            </div>
          </div>
        </div>
      </section>
      <section className="enquiry-body">
        <div className="shell">
          <div className="enquiry-body__grid">
            <div className="enquiry-body__form">
              <div className="field">
                <label className="field__label" htmlFor="enquiry-category">Product category</label>
                <select id="enquiry-category" value={draft.subject} disabled={sending} onChange={(event) => {
                  const next = getCategory(event.target.value).id
                  setDraft((current) => ({ ...current, subject: next }))
                  setParams({ category: next })
                }}>
                  {CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </div>
              <EnquiryForm />
            </div>
            <aside className="enquiry-body__side">
              <div className="side-card">
                <p className="eyebrow eyebrow--bare">What happens next</p>
                <p>A person reviews your requirement and replies from the business inbox.</p>
                <Link to="/privacy" className="tlink">Enquiry privacy</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
