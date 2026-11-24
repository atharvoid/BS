import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EnquiryForm, useEnquiryDraft } from '../components/EnquiryForm'
import { CustomSelect } from '../components/CustomSelect'
import { BUSINESS, CATEGORIES, getCategory } from '../content'

export default function Enquiry() {
  const [params, setParams] = useSearchParams()
  const { draft, setDraft, sending } = useEnquiryDraft()
  /* A link from a category opens with that category chosen; a plain
     "Start an enquiry" opens on the first one. */
  const category = getCategory(params.get('category'))

  React.useEffect(() => {
    setDraft((current) => ({ ...current, subject: category.id }))
  }, [category.id, setDraft])

  /* A themed listbox rather than a <select>: the native control is drawn by
     the operating system, and the operating system does not have this
     site's arrow. */
  const categoryField = (
    <div className="field" data-field="subject">
      <p className="field__label" id="enquiry-category-label">Product category</p>
      <CustomSelect
        id="enquiry-category"
        label="Product category"
        value={draft.subject}
        disabled={sending}
        choices={CATEGORIES.map((item) => ({ value: item.id, label: item.label }))}
        onChange={(next) => {
          setDraft((current) => ({ ...current, subject: getCategory(next).id }))
          setParams({ category: getCategory(next).id }, { replace: true, preventScrollReset: true })
        }}
      />
    </div>
  )

  return (
    <>
      <section className="enquiry-hero">
        <div className="shell">
          <h1 className="enquiry-hero__title">Start an enquiry</h1>
          <p className="enquiry-hero__lede">Tell us what you need or supply, and where the goods are going.</p>
        </div>
      </section>
      <section className="enquiry-body">
        <div className="shell">
          <div className="enquiry-body__grid">
            <div className="enquiry-body__form">
              <EnquiryForm categoryField={categoryField} />
            </div>
            <aside className="enquiry-body__side" aria-label="About this enquiry">
              <div className="side-card">
                <h2 className="side-card__title">What happens next</h2>
                <ol className="side-steps">
                  <li><span>1</span>A person reads your requirement.</li>
                  <li><span>2</span>We reply by email to discuss details and anything missing.</li>
                  <li><span>3</span>Availability, samples and terms are agreed case by case, in writing.</li>
                </ol>
                <div className="side-card__alt">
                  <p className="side-card__label">Prefer email?</p>
                  <a href={`mailto:${BUSINESS.email}`} className="side-card__mail">{BUSINESS.email}</a>
                </div>
                <Link to="/privacy" className="tlink">How we handle your details</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
