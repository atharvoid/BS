/**
 * Single source of truth for the words on this site.
 *
 * House rule: nothing here may assert a fact the business has not confirmed.
 * No prices, minimums, lead times, stock levels, certifications, customer
 * counts or shipment history. Imagery is described as representative wherever
 * it appears. Scope is always "discussed per enquiry".
 */

export const BUSINESS = {
  name: 'BS EXIMNEXUS',
  wordmark: 'BS',
  wordmarkRest: 'EXIMNEXUS',
  email: 'bsexim.nexus@gmail.com',
  descriptor: 'Sourcing & trade coordination, India',
  status: 'Developing business',
} as const

export const FOCUS_AREAS = [
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    kicker: 'South India',
    note: 'An initial sourcing area. Handloom and mill-made cotton, silk and blended fabrics are among the material families commonly associated with the region.',
    hint: 'Discussed per enquiry — not a stock list.',
  },
  {
    id: 'gujarat',
    name: 'Gujarat',
    kicker: 'West India',
    note: 'An initial sourcing area. Cotton, printed and dyed fabric traditions and a dense processing base are among the reasons enquiries often reference it.',
    hint: 'Discussed per enquiry — not a stock list.',
  },
] as const

export const STAGES = [
  {
    n: '01',
    title: 'Share the requirement',
    body: 'The buyer or supplier explains what they need or offer, and how it will be used. A finished specification is not required to begin — a short description is enough.',
    field: ['What', 'Intended use', 'Location'],
    object: 'bolt',
    objectLabel: 'Unfolded bolt',
  },
  {
    n: '02',
    title: 'Review material options',
    body: 'The requirement and potential supply options can be assessed together. Materials and samples may be discussed, along with references the two sides already trust.',
    field: ['Composition', 'Construction', 'Samples'],
    object: 'shuttle',
    objectLabel: 'Weaving shuttle',
  },
  {
    n: '03',
    title: 'Agree the details',
    body: 'The parties clarify specifications, quantities, acceptance criteria and commercial terms. What is agreed at this stage is what both sides can hold each other to.',
    field: ['Quantity', 'Acceptance', 'Terms'],
    object: 'spool',
    objectLabel: 'Spun yarn bobbin',
  },
  {
    n: '04',
    title: 'Agree the next steps',
    body: 'The enquiry establishes what sourcing, documentation and logistics coordination can be provided. Every item is confirmed case by case, in writing, before it is relied upon.',
    field: ['Documentation', 'Logistics', 'Coordination'],
    object: 'reed',
    objectLabel: 'Brass reed',
  },
] as const

export const PROCESS_CAVEAT =
  'These stages describe a basis for discussion. They are not a guarantee that every service or supply option is available.'

export const FIRST_MESSAGE = [
  'What you are looking for, or what you supply',
  'How it will be used',
  'A reference you already like, if you have one',
  'The destination, or your business location',
] as const

export const LATER_DISCUSSIONS = [
  {
    t: 'Material',
    d: 'Composition, construction, weight, width and finish.',
  },
  {
    t: 'Evidence',
    d: 'Samples and references.',
  },
  {
    t: 'Volume',
    d: 'Quantity and packing.',
  },
  {
    t: 'Terms',
    d: 'Acceptance criteria and commercial terms.',
  },
] as const

export const BOUNDARIES = [
  {
    t: 'Imagery is representative',
    d: 'Textile photographs on this site are chosen to represent material families. They are not evidence of supplier stock, and they are not photographs of specific products on offer.',
  },
  {
    t: 'Scope is set per enquiry',
    d: 'Specific fabric options and the services that can be provided are discussed case by case. This site does not carry a catalogue of confirmed availability.',
  },
  {
    t: 'No performance claims',
    d: 'No certifications, customer numbers, shipment history, guaranteed quality or shipping performance are claimed here.',
  },
  {
    t: 'Nothing automated',
    d: 'There are no accounts, no payments, and no automatic tracking. A person reads each enquiry and replies from the business inbox.',
  },
] as const

/** The five required answers. Kept in one place so the form and its copy cannot drift. */
export const ENQUIRY_FIELDS = {
  role: {
    label: 'Which best describes you?',
    options: [
      { value: 'overseas-buyer', label: 'Overseas buyer', hint: 'Sourcing from India' },
      { value: 'buyer-in-india', label: 'Buyer in India', hint: 'Looking for materials or products' },
      { value: 'indian-supplier', label: 'Indian supplier', hint: 'Describing what you supply' },
    ],
  },
  requirement: {
    label: 'What are you looking for or offering?',
    hint: 'A short description is enough. Composition, weight, width and finish can follow later.',
    placeholder: 'For example: a mid-weight cotton twill for workwear, or a handloom cotton for shirting.',
  },
  location: {
    label: 'Destination or business location',
    hint: 'Where the material is going, or where your business is based.',
    placeholder: 'For example: Rotterdam, Netherlands — or Coimbatore, Tamil Nadu.',
  },
  name: { label: 'Your name', placeholder: 'Full name' },
  email: { label: 'Email address', hint: 'Replies come from bsexim.nexus@gmail.com.' },
} as const
