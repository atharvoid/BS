import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BUSINESS, ENQUIRY_FIELDS, getCategory, type CategoryId } from '../content'

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

export type EnquirySubject = CategoryId

export type EnquiryDraft = {
  subject: EnquirySubject
  role: string
  requirement: string
  location: string
  name: string
  email: string
}

const EMPTY: EnquiryDraft = {
  subject: 'general',
  role: '',
  requirement: '',
  location: '',
  name: '',
  email: '',
}

type EnquiryContextValue = {
  draft: EnquiryDraft
  setDraft: React.Dispatch<React.SetStateAction<EnquiryDraft>>
  sending: boolean
  setSending: React.Dispatch<React.SetStateAction<boolean>>
}

const EnquiryContext = React.createContext<EnquiryContextValue | null>(null)

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = React.useState<EnquiryDraft>(EMPTY)
  const [sending, setSending] = React.useState(false)
  return <EnquiryContext.Provider value={{ draft, setDraft, sending, setSending }}>{children}</EnquiryContext.Provider>
}

export function useEnquiryDraft() {
  const context = React.useContext(EnquiryContext)
  if (!context) throw new Error('EnquiryProvider is required')
  return context
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
    if (!raw) return null
    const value = JSON.parse(raw) as { subject?: unknown; role?: unknown; at?: unknown }
    if (typeof value.subject !== 'string' || typeof value.role !== 'string' ||
        !ENQUIRY_FIELDS.role.options.some((option) => option.value === value.role) ||
        typeof value.at !== 'string' || !Number.isFinite(Date.parse(value.at))) return null
    return { subject: getCategory(value.subject).id, role: value.role, at: value.at }
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

export function EnquiryForm() {
  const navigate = useNavigate()
  const { draft, setDraft, sending, setSending } = useEnquiryDraft()
  const [errors, setErrors] = React.useState<Errors>({})
  const [status, setStatus] = React.useState<Status>('idle')
  const request = React.useRef<AbortController | null>(null)
  const form = React.useRef<HTMLFormElement>(null)
  const firstInvalid = React.useRef<string | null>(null)

  React.useEffect(() => () => {
    request.current?.abort()
    request.current = null
    setSending(false)
  }, [setSending])

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
      e.requirement = 'A sentence or two is enough. Twelve characters minimum.'
    if (d.requirement.length > 2000) e.requirement = 'Please keep this under 2,000 characters.'
    if (d.location.trim().length < 2) e.location = 'A city, region or country is fine.'
    if (d.name.trim().length < 2) e.name = 'Please add your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim()))
      e.email = 'Please check the email address. That is where the reply goes.'
    return e
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (request.current || sending) return
    const found = validate(draft)
    setErrors(found)
    if (Object.keys(found).length) {
      firstInvalid.current = Object.keys(found)[0]
      const field = form.current?.querySelector<HTMLElement>(`[data-field="${firstInvalid.current}"]`)
      const el = field?.querySelector<HTMLElement>('input, textarea, select') ?? field
      el?.focus()
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }

    if (!ACCESS_KEY) {
      // No key configured: never show a false confirmation.
      setStatus('unconfigured')
      return
    }

    const snapshot = { ...draft }
    const category = getCategory(snapshot.subject)
    const controller = new AbortController()
    request.current = controller
    setSending(true)
    setStatus('sending')

    const payload: Record<string, string> = {
      access_key: ACCESS_KEY,
      subject: `[${BUSINESS.name}] ${category.label} enquiry: ${ROLE_LABEL[snapshot.role] ?? snapshot.role}`,
      from_name: snapshot.name,
      replyto: snapshot.email.trim(),
      'Visitor type': ROLE_LABEL[snapshot.role] ?? snapshot.role,
      'Requirement or offer': snapshot.requirement,
      'Destination or business location': snapshot.location,
      Name: snapshot.name,
      Email: snapshot.email.trim(),
      'Enquiry subject': category.label,
    }
    if (HCAPTCHA_SITEKEY) payload['h-captcha-response'] = ''

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!res.ok || data.success !== true) {
        throw new Error(data.message || `The provider answered ${res.status}.`)
      }
      if (request.current !== controller) return
      writeReceipt({ subject: snapshot.subject, role: snapshot.role, at: new Date().toISOString() })
      setStatus('sent')
      navigate('/enquiry/acknowledgement')
    } catch {
      if (request.current === controller) setStatus('error')
    } finally {
      if (request.current === controller) {
        request.current = null
        setSending(false)
      }
    }
  }

  return (
    <form ref={form} className="form" onSubmit={submit} noValidate>
      <div className="form__head">
        <p className="eyebrow eyebrow--index">{getCategory(draft.subject).label}</p>
        <h2 className="form__title">
          Tell us what <em className="display-italic">you need.</em>
        </h2>
      </div>

      <fieldset disabled={sending} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
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
        <p className="field__hint" id="requirement-hint">{getCategory(draft.subject).hint}</p>
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

      </fieldset>
      <div aria-live="polite" className="form__status">
        {status === 'error' && (
          <p className="notice notice--error">
            We couldn’t send your enquiry. Try again, or email{' '}
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
          </p>
        )}
        {status === 'unconfigured' && (
          <p className="notice notice--warn">
            To send your enquiry, email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
          </p>
        )}
      </div>
    </form>
  )
}
