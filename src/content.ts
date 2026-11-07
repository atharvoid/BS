import type { CategoryMotif } from './three/categoryObjects'

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

export const CATEGORIES = [
  { id: 'textiles', label: 'Textiles & fabrics', hint: 'Explore fabric types and the sourcing areas of Tamil Nadu and Gujarat.' },
  { id: 'handicrafts', label: 'Handicrafts & home decor', hint: 'Describe the item, its material and how it will be used.' },
  { id: 'agriculture-food', label: 'Agriculture & food', hint: 'Which crop, ingredient or food product are you interested in?' },
  { id: 'industrial-materials', label: 'Industrial materials', hint: 'Name the material or manufacturing input. Include the grade if you know it.' },
  { id: 'organic-sustainable', label: 'Organic & sustainable products', hint: 'Describe the product and any certification you require.' },
  { id: 'general', label: 'Other sourcing requests', hint: 'What would you like to source or supply?' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export function getCategory(id: string | null | undefined) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

/**
 * The four answers that make a textile enquiry answerable. Used on /textiles as
 * a written brief, and nowhere else: no illustration is attached to a field,
 * because an object beside a contract term implies a relationship that does not
 * exist.
 */
export const FABRIC_TOPICS = [
  { n: '01', title: 'Fabric and use', body: 'What are you making, and how should the fabric feel?', field: ['Fabric', 'Use'] },
  { n: '02', title: 'Samples', body: 'Mention a sample or reference you would like to match.', field: ['Samples', 'Reference'] },
  { n: '03', title: 'Quantity and packing', body: 'Include an approximate quantity if you have one.', field: ['Quantity', 'Packing'] },
  { n: '04', title: 'Acceptance and terms', body: 'Which details need agreement before you can place an order?', field: ['Acceptance', 'Terms'] },
] as const

export const FOCUS_AREAS = [
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    kicker: 'South India',
    note: 'An initial sourcing area. Handloom and mill-made cotton, silk and blended fabrics are among the material families commonly associated with the region.',
    hint: 'Discussed per enquiry. Not a stock list.',
  },
  {
    id: 'gujarat',
    name: 'Gujarat',
    kicker: 'West India',
    note: 'An initial sourcing area. Cotton, printed and dyed fabric traditions and a dense processing base are among the reasons enquiries often reference it.',
    hint: 'Discussed per enquiry. Not a stock list.',
  },
] as const

export const STAGES = [
  {
    n: '01',
    title: 'Share the requirement',
    body: 'The buyer or supplier explains what they need or offer, and how it will be used. A finished specification is not required to begin. A short description is enough.',
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
    label: 'What do you need or supply?',
    hint: 'A short description is enough.',
    placeholder: 'Describe what you need or supply.',
  },
  location: {
    label: 'Destination or business location',
    hint: 'Where the goods are going, or where your business is based.',
    placeholder: 'For example: Rotterdam, Netherlands. Or Coimbatore, Tamil Nadu.',
  },
  name: { label: 'Your name', placeholder: 'Full name' },
  email: { label: 'Email address', hint: 'Replies come from bsexim.nexus@gmail.com.' },
} as const

/** Copy for the scroll-led category introduction; no availability claims. */
export const CATEGORY_JOURNEY: { id: CategoryId; motif: CategoryMotif; label: string; note: string; body: string; to?: string }[] = [
  { id: 'textiles', motif: 'textiles', label: 'Textiles & fabrics', note: 'Our primary product line', body: 'Start with the fabric, its intended use and the finish you have in mind. Explore material families and sourcing areas in India, then share your quantity, destination and sample requirements.', to: '/textiles' },
  { id: 'handicrafts', motif: 'handicrafts', label: 'Handicrafts & home decor', note: 'Material. Craft. Intended use.', body: 'Tell us about the item, material, dimensions and finish. Share a reference and the intended use so sourcing discussions begin with a clear brief.' },
  { id: 'agriculture-food', motif: 'agriculture', label: 'Agriculture & food', note: 'A specification-led enquiry', body: 'Name the crop, ingredient or food product. Include the grade, packing, approximate quantity and destination requirements you would like to discuss.' },
  { id: 'industrial-materials', motif: 'industrial', label: 'Industrial materials', note: 'Inputs and components', body: 'Describe the material or manufacturing input. A grade, technical specification or reference helps establish what needs to be confirmed with potential suppliers.' },
  { id: 'organic-sustainable', motif: 'organic', label: 'Organic & sustainable', note: 'Evidence, not assumptions', body: 'Describe the product and any certification or traceability evidence you require. Claims and supporting documents must be checked for the specific product and supplier.' },
  { id: 'general', motif: 'general', label: 'Other sourcing requests', note: 'Begin with the requirement', body: 'If your product does not fit the categories above, tell us what you need or supply. Include its use, a reference and the destination. Scope and availability are discussed per enquiry.' },
]
