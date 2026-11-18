import { BUSINESS } from '../content'

export const enquiryAccessKey = (import.meta.env.VITE_WEB3FORMS_KEY as string | undefined)?.trim() || ''
export const enquiryContact = (import.meta.env.VITE_ENQUIRY_CONTACT_EMAIL as string | undefined)?.trim() || BUSINESS.email
