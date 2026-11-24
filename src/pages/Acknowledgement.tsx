import React from 'react'
import { Link } from 'react-router-dom'
import { readReceipt } from '../components/EnquiryForm'
import { ENQUIRY_FIELDS, getCategory } from '../content'
import { enquiryContact } from '../components/enquiry-config'
import { Arrow } from '../components/Nav'

export default function Acknowledgement() {
  const [receipt] = React.useState(readReceipt)
  const role = ENQUIRY_FIELDS.role.options.find((option) => option.value === receipt?.role)

  return (
    <section className="ack">
      <div className="shell ack__inner" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ack__text">
          {receipt ? (
            <>
              <h1 className="ack__title">Thank you, your enquiry is with us</h1>
              <div className="ack__notice">
                A person will read it and reply by email. If you do not hear back, write to{' '}
                <a href={`mailto:${enquiryContact}`}>{enquiryContact}</a>.
              </div>
              <dl className="ack__receipt">
                <div><dt>Category</dt><dd>{getCategory(receipt.subject).label}</dd></div>
                <div><dt>You are</dt><dd>{role?.label ?? receipt.role}</dd></div>
                <div><dt>Submitted</dt><dd>{new Date(receipt.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
              </dl>
            </>
          ) : (
            <>
              <h1 className="ack__title">No enquiry recorded in this tab</h1>
              <p className="ack__no-receipt">Start an enquiry to share your requirement.</p>
            </>
          )}
          <div className="ack__actions">
            <Link to={receipt ? '/' : '/enquiry'} className="btn">
              {receipt ? 'Back to the home page' : 'Start an enquiry'}<Arrow />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
