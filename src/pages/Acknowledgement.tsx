import React from 'react'
import { Link } from 'react-router-dom'
import { readReceipt } from '../components/EnquiryForm'
import { BUSINESS, ENQUIRY_FIELDS, getCategory } from '../content'
import { Arrow } from '../components/Nav'

export default function Acknowledgement() {
  const [receipt] = React.useState(readReceipt)
  const role = ENQUIRY_FIELDS.role.options.find((option) => option.value === receipt?.role)

  return (
    <section className="ack on-dark grain">
      <div className="shell ack__inner" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ack__text">
          <p className="eyebrow">Enquiry acknowledgement</p>
          {receipt ? (
            <>
              <h1 className="ack__title">Enquiry <em className="display-italic">submitted.</em></h1>
              <div className="ack__notice">
                Inbox delivery has not been confirmed. If you do not hear back, email{' '}
                <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
              </div>
              <dl className="ack__receipt">
                <div><dt>Subject</dt><dd>{getCategory(receipt.subject).label}</dd></div>
                <div><dt>Filed as</dt><dd>{role?.label ?? receipt.role}</dd></div>
                <div><dt>Submitted</dt><dd>{new Date(receipt.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
              </dl>
            </>
          ) : (
            <>
              <h1 className="ack__title">No enquiry recorded <em className="display-italic">in this tab.</em></h1>
              <p className="ack__no-receipt">Start an enquiry to share your requirement.</p>
            </>
          )}
          <div className="ack__actions">
            <Link to={receipt ? '/' : '/enquiry'} className="btn btn--light">
              {receipt ? 'Back to overview' : 'Start an enquiry'}<Arrow />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
