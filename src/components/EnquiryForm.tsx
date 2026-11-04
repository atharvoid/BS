import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BUSINESS, ENQUIRY_FIELDS } from '../content'

/* ==========================================================================
   Enquiry logic.

   The provider is Web3Forms, with hCaptcha optional. Both are configured from
   environment variables, and the form refuses to pretend: if no access key is
   present it shows the visitor an honest fallback instead of a fake success.
   Account setup and real delivery still need to be verified against the live
   inbox before this form is relied upon.
   ========================================================================== */

const ENDPOINT = 'https://api.web3forms.com/submit'
const ACCESS_KEY = (import.meta.env.VITE_WEB3FORMS_KEY as string | undefined) ?? ''
const HCAPTCHA_SITEKEY = (import.meta.env.VITE_HCAPTCHA_SITEKEY as string | undefined) ?? ''

export type EnquirySubject = 'textiles' | 'general'

export type EnquiryDraft = {
  subject: EnquirySubject
  role: string
  requirement: string
  location: string
  name: string
  email: string
}

const EMPTY: EnquiryDraft = {
  subject: 'textiles',
  role: '',
  requirement: '',
  location: '',
  name: '',
  email: '',
}

type Errors = Partial<Record<keyof EnquiryDraft, string>>
type Status = 'idle' | 'sending' | 'sent' | 'error' | 'unconfigured'

const STORE_KEY = 'bs.enquiry.receipt'

/**
 * A single receipt is written to sessionStorage only after a submission has
 * been accepted by the provider — just enough for the acknowledgement page to
 * render. Form entries themselves are never persisted.
 */
export function readReceipt() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as { subject: EnquirySubject; role: string; at: string }) : null
  } catch {
    return null
  }
}

function writeReceipt(value: { subject: EnquirySubject; role: string; at: string }) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(value))
  } catch {
    /* private browsing — the acknowledgement still works without it */
  }
}

const ROLE_LABEL = Object.fromEntries(
  ENQUIRY_FIELDS.role.options.map((o) => [o.value, o.label]),
) as Record<string, string>

export function EnquiryForm({ subject = 'textiles' }: { subject?: EnquirySubject }) {
  const navigate = useNavigate()
  const [draft, setDraft] = React.useState<EnquiryDraft>({ ...EMPTY, subject })
  const [errors, setErrors] = React.useState<Errors>({})
  const [status, setStatus] = React.useState<Status>('idle')
  const [serverError, setServerError] = React.useState('')
  const firstInvalid = React.useRef<string | null>(null)

  const set = (k: keyof EnquiryDraft) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setDraft((d) => ({ ...d, [k]: e.target.value }))
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev))
  }

  const validate = (d: EnquiryDraft): Errors => {
    const e: Errors = {}
    if (!d.role) e.role = 'Choose the description that fits you best.'
    if (d.requirement.trim().length < 12)
      e.requirement = 'A sentence or two is enough — twelve characters minimum.'
    if (d.requirement.length > 2000) e.requirement = 'Please keep this under 2,000 characters.'
    if (d.location.trim().length < 2) e.location = 'A city, region or country is fine.'
    if (d.name.trim().length < 2) e.name = 'Please add your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim()))
      e.email = 'Please check the email address — that is where the reply goes.'
    return e
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const found = validate(draft)
    setErrors(found)
    if (Object.keys(found).length) {
      firstInvalid.current = Object.keys(found)[0]
      const el = document.querySelector<HTMLElement>(`[data-field="${firstInvalid.current}"]`)
      el?.focus()
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }

    setStatus('sending')
    setServerError('')

    if (!ACCESS_KEY) {
      // No key configured: never show a false confirmation.
      setStatus('unconfigured')
      return
    }

    const payload: Record<string, string> = {
      access_key: ACCESS_KEY,
      subject: `[${BUSINESS.name}] ${draft.subject === 'textiles' ? 'Textile' : 'General'} enquiry — ${ROLE_LABEL[draft.role] ?? draft.role}`,
      from_name: draft.name,
      replyto: draft.email.trim(),
      'Visitor type': ROLE_LABEL[draft.role] ?? draft.role,
      'Requirement or offer': draft.requirement,
      'Destination or business location': draft.location,
      Name: draft.name,
      Email: draft.email.trim(),
      'Enquiry subject': draft.subject === 'textiles' ? 'Textiles and fabrics' : 'General',
    }
    if (HCAPTCHA_SITEKEY) payload['h-captcha-response'] = ''

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `The provider answered ${res.status}.`)
      }
      writeReceipt({ subject: draft.subject, role: draft.role, at: new Date().toISOString() })
      setStatus('sent')
      navigate('/enquiry/acknowledgement')
    } catch (err) {
      setStatus('error')
      setServerError(
        err instanceof Error ? err.message : 'The submission could not be completed.',
      )
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form__head">
        <p className="eyebrow eyebrow--index">Textile enquiry / form</p>
        <h2 className="form__title">
          Five answers. <em className="display-italic">No specification needed.</em>
        </h2>
        <p className="form__intro">
          This enquiry is filed as a textiles and fabrics enquiry. Attachments are not accepted — if
          a sample or document matters, say so here and arrangements can be discussed in the reply.
        </p>
      </div>

      {/* 1 — role */}
      <fieldset className="field field--group" data-field="role">
        <legend className="field__label">
          <span className="field__num">01</span>
          {ENQUIRY_FIELDS.role.label}
          <span className="field__req" aria-hidden="true">required</span>
        </legend>
        <div className="choice-grid" role="radiogroup" aria-describedby="role-error">
          {ENQUIRY_FIELDS.role.options.map((o) => (
            <label
              key={o.value}
              className={`choice ${draft.role === o.value ? 'is-checked' : ''}`}
            >
              <input
                type="radio"
                name="role"
                value={o.value}
                checked={draft.role === o.value}
                onChange={() => {
                  setDraft((d) => ({ ...d, role: o.value }))
                  setErrors((p) => ({ ...p, role: undefined }))
                }}
              />
              <span className="choice__dot" aria-hidden="true" />
              <span className="choice__text">
                <strong>{o.label}</strong>
                <span>{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.role && <p className="field__error" id="role-error">{errors.role}</p>}
      </fieldset>

      {/* 2 — requirement */}
      <div className="field" data-field="requirement">
        <label className="field__label" htmlFor="requirement">
          <span className="field__num">02</span>
          {ENQUIRY_FIELDS.requirement.label}
          <span className="field__req" aria-hidden="true">required</span>
        </label>
        <p className="field__hint" id="requirement-hint">{ENQUIRY_FIELDS.requirement.hint}</p>
        <textarea
          id="requirement"
          rows={4}
          value={draft.requirement}
          onChange={set('requirement')}
          placeholder={ENQUIRY_FIELDS.requirement.placeholder}
          aria-describedby={`requirement-hint ${errors.requirement ? 'requirement-error' : ''}`}
          aria-invalid={!!errors.requirement}
          maxLength={2000}
        />
        <div className="field__foot">
          {errors.requirement ? (
            <p className="field__error" id="requirement-error">{errors.requirement}</p>
          ) : (
            <span className="field__counter">{draft.requirement.length} / 2000</span>
          )}
        </div>
      </div>

      {/* 3 — location */}
      <div className="field" data-field="location">
        <label className="field__label" htmlFor="location">
          <span className="field__num">03</span>
          {ENQUIRY_FIELDS.location.label}
          <span className="field__req" aria-hidden="true">required</span>
        </label>
        <p className="field__hint" id="location-hint">{ENQUIRY_FIELDS.location.hint}</p>
        <input
          id="location"
          type="text"
          value={draft.location}
          onChange={set('location')}
          placeholder={ENQUIRY_FIELDS.location.placeholder}
          aria-describedby={`location-hint ${errors.location ? 'location-error' : ''}`}
          aria-invalid={!!errors.location}
          autoComplete="address-level2"
        />
        {errors.location && <p className="field__error" id="location-error">{errors.location}</p>}
      </div>

      <div className="form__pair">
        {/* 4 — name */}
        <div className="field" data-field="name">
          <label className="field__label" htmlFor="name">
            <span className="field__num">04</span>
            {ENQUIRY_FIELDS.name.label}
            <span className="field__req" aria-hidden="true">required</span>
          </label>
          <input
            id="name"
            type="text"
            value={draft.name}
            onChange={set('name')}
            placeholder={ENQUIRY_FIELDS.name.placeholder}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            autoComplete="name"
          />
          {errors.name && <p className="field__error" id="name-error">{errors.name}</p>}
        </div>

        {/* 5 — email */}
        <div className="field" data-field="email">
          <label className="field__label" htmlFor="email">
            <span className="field__num">05</span>
            {ENQUIRY_FIELDS.email.label}
            <span className="field__req" aria-hidden="true">required</span>
          </label>
          <input
            id="email"
            type="email"
            value={draft.email}
            onChange={set('email')}
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            autoComplete="email"
            inputMode="email"
          />
          {errors.email && <p className="field__error" id="email-error">{errors.email}</p>}
        </div>
      </div>

      <div className="form__submit">
        <button className="btn btn--submit" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send the enquiry'}
          {status !== 'sending' && (
            <svg className="btn__arrow" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12 12 2M5 2h7v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
            </svg>
          )}
        </button>
        <p className="form__note">
          No attachments. No passwords, payment details or sensitive personal documents, please.
          {HCAPTCHA_SITEKEY ? ' This form is protected by hCaptcha.' : ''}
        </p>
      </div>

      <div aria-live="polite" className="form__status">
        {status === 'error' && (
          <p className="notice notice--error">
            <strong>The enquiry did not go through.</strong> {serverError} Nothing was lost — please
            try again, or write directly to{' '}
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
          </p>
        )}
        {status === 'unconfigured' && (
          <p className="notice notice--warn">
            <strong>This form is not connected yet.</strong> The delivery provider has no access key
            configured, so nothing was sent and no confirmation has been recorded. In the meantime,
            email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> directly with the same
            five answers.
          </p>
        )}
      </div>
    </form>
  )
}
