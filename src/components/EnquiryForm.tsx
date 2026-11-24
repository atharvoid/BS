import { createReceiptStore } from './receipt-store'
import { enquiryAccessKey, enquiryContact } from './enquiry-config'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BUSINESS, ENQUIRY_FIELDS, getCategory, type CategoryId } from '../content'

const ENDPOINT = 'https://api.web3forms.com/submit'
const UNCONFIRMED = 'We couldn’t confirm your submission. Check before sending it again.'
const REJECTED = 'The enquiry service could not accept your request. Please try again later.'

type SubmissionResponse = { success?: boolean; message?: unknown; body?: { message?: unknown } }

function rejectionMessage(status: number, data: SubmissionResponse | null) {
  if (status === 429) return 'Too many requests. Please wait before trying again.'
  const message = [data?.message, data?.body?.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  if (!local) return REJECTED

  // Report known causes without exposing provider messages or echoed form data.
  if (/captcha|turnstile/i.test(message))
    return 'Web3Forms rejected the security check. Check the form’s required CAPTCHA setting in the dashboard.'
  if (/access[_ -]?key|form id/i.test(message))
    return 'The Web3Forms access key was rejected. Check the key and rebuild the preview.'
  return `${REJECTED} (Web3Forms HTTP ${status})`
}

export type EnquirySubject = CategoryId

export type EnquiryDraft = {
  subject: EnquirySubject
  role: string
  requirement: string
  location: string
  name: string
  email: string
  phone: string
}

const EMPTY: EnquiryDraft = {
  subject: 'textiles',
  role: '',
  requirement: '',
  location: '',
  name: '',
  email: '',
  phone: '',
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

const STORE_KEY = 'bs.enquiry.receipt'

/**
 * A single receipt is written to sessionStorage only after a submission has
 * been accepted by the provider — just enough for the acknowledgement page to
 * render. Form entries themselves are never persisted.
 */
type Receipt = { subject: EnquirySubject; role: string; at: string }
const receiptStore = createReceiptStore<Receipt>(STORE_KEY, () => sessionStorage, (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as { subject?: unknown; role?: unknown; at?: unknown }
  if (typeof value.subject !== 'string' || typeof value.role !== 'string' ||
      !ENQUIRY_FIELDS.role.options.some((option) => option.value === value.role) ||
      typeof value.at !== 'string' || !Number.isFinite(Date.parse(value.at))) return null
  return { subject: getCategory(value.subject).id, role: value.role, at: value.at }
})
export const readReceipt = receiptStore.read
const writeReceipt = receiptStore.write

const ROLE_LABEL = Object.fromEntries(
  ENQUIRY_FIELDS.role.options.map((o) => [o.value, o.label]),
) as Record<string, string>

type FormProps = {
  /** The category control, shown as the first field (the enquiry page). */
  categoryField?: React.ReactNode
  title?: string
  intro?: React.ReactNode
}

export function EnquiryForm({ categoryField, title = 'Tell us what you need', intro = 'Every field helps us reply properly. It takes about two minutes.' }: FormProps) {
  const navigate = useNavigate()
  const { draft, setDraft, sending, setSending } = useEnquiryDraft()
  const [errors, setErrors] = React.useState<Errors>({})
  const [submitError, setSubmitError] = React.useState('')
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
    if (!ENQUIRY_FIELDS.role.options.some(option => option.value === d.role))
      e.role = 'Choose the description that fits you best.'
    if (d.requirement.trim().length < 12)
      e.requirement = 'A sentence or two is enough. Twelve characters minimum.'
    if (d.requirement.length > 2000) e.requirement = 'Please keep this under 2,000 characters.'
    if (d.location.trim().length < 2) e.location = 'A city, region or country is fine.'
    if (d.name.trim().length < 2) e.name = 'Please add your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim()))
      e.email = 'Please check the email address. That is where the reply goes.'
    // At least 7 digits; digits, spaces, + ( ) . - only; starts with + or a digit.
    if ((d.phone.match(/\d/g) ?? []).length < 7 || !/^[+\d][\d\s().-]{5,24}$/.test(d.phone.trim()))
      e.phone = 'Please add a phone number with its country code, for example +91 98765 43210.'
    return e
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enquiryAccessKey || request.current || sending) return
    // Only an automated form-filler ticks the hidden trap box; send nothing.
    if (form.current?.querySelector<HTMLInputElement>('input[name="botcheck"]')?.checked) return
    setSubmitError('')
    const found = validate(draft)
    setErrors(found)
    if (Object.keys(found).length) {
      firstInvalid.current = Object.keys(found)[0]
      const field = form.current?.querySelector<HTMLElement>(`[data-field="${firstInvalid.current}"]`)
      const el = field?.querySelector<HTMLElement>('input, textarea, [role="combobox"]') ?? field
      el?.focus()
      el?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      return
    }

    const snapshot = { ...draft }
    const category = getCategory(snapshot.subject)
    const controller = new AbortController()
    request.current = controller
    setSending(true)

    const payload: Record<string, string> = {
      access_key: enquiryAccessKey,
      subject: `[${BUSINESS.name}] ${category.label} enquiry: ${ROLE_LABEL[snapshot.role] ?? snapshot.role}`,
      from_name: BUSINESS.name,
      replyto: snapshot.email.trim(),
      'Visitor type': ROLE_LABEL[snapshot.role] ?? snapshot.role,
      message: snapshot.requirement.trim(),
      'Destination or business location': snapshot.location.trim(),
      name: snapshot.name.trim(),
      email: snapshot.email.trim(),
      Phone: snapshot.phone.trim(),
      'Enquiry subject': category.label,
    }

    const timeout = window.setTimeout(() => controller.abort(), 20_000)
    try {
      const body = new FormData()
      for (const [field, value] of Object.entries(payload)) body.set(field, value)
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body,
        signal: controller.signal,
      })
      const data = await res.json().catch(() => null) as SubmissionResponse | null
      if (request.current !== controller) return
      if (!res.ok || data?.success === false) {
        setSubmitError(rejectionMessage(res.status, data))
        return
      }
      if (data?.success !== true) {
        setSubmitError(UNCONFIRMED)
        return
      }
      writeReceipt({ subject: snapshot.subject, role: snapshot.role, at: new Date().toISOString() })
      setDraft({ ...EMPTY, subject: snapshot.subject })
      navigate('/enquiry/acknowledgement')
    } catch {
      if (request.current === controller) setSubmitError(UNCONFIRMED)
    } finally {
      window.clearTimeout(timeout)
      if (request.current === controller) {
        request.current = null
        setSending(false)
      }
    }
  }

  const category = getCategory(draft.subject)
  const describe = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined

  return (
    <form ref={form} className="form" data-category={category.id} onSubmit={submit} noValidate aria-labelledby="form-title">
      <div className="form__head">
        <h2 className="form__title" id="form-title">{title}</h2>
        <p className="form__intro">{intro}</p>
      </div>

      {!enquiryAccessKey && <p className="notice">Online submission is unavailable. Email <a href={`mailto:${enquiryContact}`}>{enquiryContact}</a> to enquire.</p>}
      <fieldset disabled={sending} className="form__body">
        <p className="form__group" aria-hidden="true">The enquiry</p>

        {categoryField}

        <fieldset className="field field--group" data-field="role">
          <legend className="field__label" id="role-label">{ENQUIRY_FIELDS.role.label}</legend>
          <div className="choice-grid" role="radiogroup" aria-labelledby="role-label" aria-required="true" aria-invalid={!!errors.role} aria-describedby={errors.role ? 'role-error' : undefined}>
            {ENQUIRY_FIELDS.role.options.map((o) => (
              <label key={o.value} className={`choice ${draft.role === o.value ? 'is-checked' : ''}`}>
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

        <div className="field" data-field="requirement">
          <label className="field__label" htmlFor="requirement">{ENQUIRY_FIELDS.requirement.label}</label>
          <p className="field__hint" id="requirement-hint">{category.hint}</p>
          <textarea
            id="requirement"
            aria-required="true"
            rows={4}
            value={draft.requirement}
            onChange={set('requirement')}
            placeholder={ENQUIRY_FIELDS.requirement.placeholder}
            aria-describedby={describe('requirement-hint', errors.requirement && 'requirement-error')}
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

        <div className="field" data-field="location">
          <label className="field__label" htmlFor="location">{ENQUIRY_FIELDS.location.label}</label>
          <p className="field__hint" id="location-hint">{ENQUIRY_FIELDS.location.hint}</p>
          <input
            id="location"
            aria-required="true"
            maxLength={160}
            type="text"
            value={draft.location}
            onChange={set('location')}
            placeholder={ENQUIRY_FIELDS.location.placeholder}
            aria-describedby={describe('location-hint', errors.location && 'location-error')}
            aria-invalid={!!errors.location}
            autoComplete="address-level2"
          />
          {errors.location && <p className="field__error" id="location-error">{errors.location}</p>}
        </div>

        <p className="form__group" aria-hidden="true">Your details</p>

        <div className="form__pair">
          <div className="field" data-field="name">
            <label className="field__label" htmlFor="name">{ENQUIRY_FIELDS.name.label}</label>
            <input
              id="name"
              aria-required="true"
              maxLength={120}
              type="text"
              value={draft.name}
              onChange={set('name')}
              placeholder={ENQUIRY_FIELDS.name.placeholder}
              aria-invalid={!!errors.name}
              aria-describedby={describe(errors.name && 'name-error')}
              autoComplete="name"
            />
            {errors.name && <p className="field__error" id="name-error">{errors.name}</p>}
          </div>

          <div className="field" data-field="email">
            <label className="field__label" htmlFor="email">{ENQUIRY_FIELDS.email.label}</label>
            <input
              id="email"
              aria-required="true"
              maxLength={254}
              type="email"
              value={draft.email}
              onChange={set('email')}
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
              aria-describedby={describe(errors.email && 'email-error')}
              autoComplete="email"
              inputMode="email"
            />
            {errors.email && <p className="field__error" id="email-error">{errors.email}</p>}
          </div>

          <div className="field" data-field="phone">
            <label className="field__label" htmlFor="phone">{ENQUIRY_FIELDS.phone.label}</label>
            <input
              id="phone"
              aria-required="true"
              maxLength={25}
              type="tel"
              value={draft.phone}
              onChange={set('phone')}
              placeholder={ENQUIRY_FIELDS.phone.placeholder}
              aria-invalid={!!errors.phone}
              aria-describedby={describe('phone-hint', errors.phone && 'phone-error')}
              autoComplete="tel"
              inputMode="tel"
            />
            <p className="field__hint field__hint--after" id="phone-hint">{ENQUIRY_FIELDS.phone.hint}</p>
            {errors.phone && <p className="field__error" id="phone-error">{errors.phone}</p>}
          </div>
        </div>

        {/* Spam trap: hidden from people and assistive technology, but a bot
            filling in every field will tick it. Web3Forms knows the name. */}
        <input type="checkbox" name="botcheck" className="visually-hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        <div className="form__submit">
          <button className="btn btn--submit" type="submit" disabled={sending || !enquiryAccessKey}>
            {sending ? 'Sending…' : 'Send enquiry'}
            {!sending && (
              <svg className="btn__arrow" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 12 12 2M5 2h7v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
              </svg>
            )}
          </button>
          <p className="form__note">A person reads every enquiry and replies by email.</p>
        </div>
      </fieldset>
      <div aria-live="polite" className="form__status">
        {submitError && (
          <p className="notice notice--error">
            {submitError}{' '}
            <a href={`mailto:${enquiryContact}`}>Email us</a>
          </p>
        )}
      </div>
    </form>
  )
}
