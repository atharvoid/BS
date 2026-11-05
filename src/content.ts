/**
 * Every word the site shows a visitor.
 *
 * Two rules, in this order.
 *
 * 1. Nothing here may assert a fact the business has not confirmed. No prices,
 *    minimum quantities, lead times, stock levels, certifications, customer
 *    counts or shipment history. Scope is always "discussed per enquiry", and
 *    imagery is described as representative wherever it appears.
 *
 * 2. It has to read like one person being straight with another. Short
 *    sentences. Concrete nouns. The point first. No dashes, no triads assembled
 *    by rule, no closing line that restates the paragraph above it, no word
 *    doing work that a fact should do.
 *
 * Voice is the business: small, Indian, careful, still developing. It says so
 * plainly, because that is also the most useful thing a buyer can be told.
 */

export const BUSINESS = {
  name: 'BS EXIMNEXUS',
  email: 'bsexim.nexus@gmail.com',
  descriptor: 'Sourcing and trade coordination, India',
} as const

/** The hero. Four short lines, then the door. */
export const HERO = {
  eyebrow: 'Textile sourcing, India',
  /** Split so each line can break on its own. */
  title: ['Sourcing from', 'India, starting', 'with ', 'textiles'],
  lede: 'Tell us what you need or what you supply. A paragraph is enough to begin.',
  primary: 'Start an enquiry',
  secondary: 'How it works',
} as const

export const HERO_FACTS = [
  { k: 'Where we source', v: 'Tamil Nadu and Gujarat' },
  { k: 'Who writes in', v: 'Buyers abroad, buyers in India, Indian mills' },
  { k: 'Replies from', v: 'One person, one inbox' },
] as const

/** What the business is, without the pitch. */
export const ABOUT = {
  eyebrow: 'What this is',
  title: ['A small sourcing office', 'in India, working', 'in textiles'],
  body: [
    'BS EXIMNEXUS is new. We find fabric and we coordinate the trade around it: who makes it, what it costs to move, what paperwork it needs.',
    'The focus is textiles because that is where the relationships are. Tamil Nadu and Gujarat first, and elsewhere in India when the requirement calls for it.',
  ],
  note: 'No catalogue, no cart. Each enquiry is answered on its own terms.',
} as const

export const FOCUS_AREAS = [
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    kicker: 'South India',
    note: 'Handloom and mill cotton, silk, and blends. Spinning and processing are close together here, which shortens a sample round.',
  },
  {
    id: 'gujarat',
    name: 'Gujarat',
    kicker: 'West India',
    note: 'Cotton, printing and dyeing at volume. Useful when a requirement needs a long run rather than a small one.',
  },
] as const

export const AREAS_FOOT = 'Elsewhere in India is not ruled out. Say where you are and we will tell you honestly whether we can help.'

/** Four stages. One sentence each, and a label for the object beside it. */
export const STAGES = [
  {
    n: '01',
    title: 'What do you need',
    body: 'A description of the fabric and what it is for. Composition, weight and width can come later.',
    object: 'bolt',
    objectLabel: 'Bolt of cloth',
  },
  {
    n: '02',
    title: 'What can be made',
    body: 'We take the requirement to the mills we know and come back with what is actually available.',
    object: 'shuttle',
    objectLabel: 'Weaving shuttle',
  },
  {
    n: '03',
    title: 'What it costs',
    body: 'Price, quantity, packing and terms, in writing, before anything is committed.',
    object: 'spool',
    objectLabel: 'Bobbin of yarn',
  },
  {
    n: '04',
    title: 'What happens next',
    body: 'Who ships, who clears, who signs. We stay on the thread until the goods land.',
    object: 'reed',
    objectLabel: 'Brass reed',
  },
] as const

export const PROCESS_INTRO = 'Four stages. You can stop at any of them.'

/** The first message. Plain instructions, not a checklist of our needs. */
export const FIRST_MESSAGE = {
  eyebrow: 'The first message',
  title: ['Nothing needs to be', 'specified yet'],
  body: 'Four lines is plenty. Anything you do not know yet can be worked out in the reply.',
  items: [
    'The fabric, or what it has to do',
    'Roughly how much',
    'Where it is going',
    'Who you are',
  ],
} as const

export const LATER_DISCUSSIONS = [
  { t: 'The cloth', d: 'Composition, construction, weight, width, finish.' },
  { t: 'The proof', d: 'Samples, swatches, references.' },
  { t: 'The volume', d: 'Quantity, packing, shipping.' },
  { t: 'The terms', d: 'Price, acceptance, payment.' },
] as const

/** Where the honesty lives. Three sentences, not a grid of four warnings. */
export const BOUNDARIES = {
  eyebrow: 'Where the limits are',
  title: ['What this site', 'does not claim'],
  body: [
    'The textile images are representative of material families. They are not photographs of stock we hold.',
    'Nothing here confirms a price, a minimum quantity, a lead time or a certification. Those come from the enquiry, in writing.',
    'There are no accounts, no payments and no tracking. One person reads each message and replies from the business inbox.',
  ],
} as const

/** The closing invitation. */
export const CLOSING = {
  eyebrow: 'Start here',
  title: ['Tell us what', 'you are looking for'],
  body: 'If you are a mill or a supplier rather than a buyer, write in the same way. Tell us what you make.',
  cta: 'Write to us',
} as const

export const FOOTER = {
  invite: ['Tell us what you', 'need'],
  body: 'A short message is enough to start.',
  cta: 'Start an enquiry',
  note: 'Textile imagery is representative of material families. Nothing on this site confirms price, availability or specification.',
} as const

/** The five required answers. One place, so the form and its words cannot drift. */
export const ENQUIRY_FIELDS = {
  role: {
    label: 'Which describes you?',
    options: [
      { value: 'overseas-buyer', label: 'Buying from abroad', hint: 'Sourcing out of India' },
      { value: 'buyer-in-india', label: 'Buying in India', hint: 'Looking for material' },
      { value: 'indian-supplier', label: 'Supplying in India', hint: 'A mill, a unit, an agent' },
    ],
  },
  requirement: {
    label: 'What do you need or supply?',
    hint: 'Composition, weight, width and finish can follow later.',
    placeholder: 'A mid-weight cotton twill for workwear, or a handloom cotton for shirting.',
  },
  location: {
    label: 'Where is it going, or where are you?',
    hint: 'The destination, or your own base.',
    placeholder: 'Rotterdam. Or Coimbatore, Tamil Nadu.',
  },
  name: { label: 'Your name', placeholder: 'Full name' },
  email: { label: 'Where the reply should go', placeholder: 'you@company.com' },
} as const

/** Page copy that lives outside the overview. */
export const ENQUIRY_PAGE = {
  eyebrow: 'Textile enquiry',
  title: ['Tell us what', 'you need'],
  lede: 'Five questions. A short answer to each is enough.',
  aside: [
    'A person reads this, not a queue. Expect a reply from the business inbox.',
    'If the form fails, write to the address below and it will get there.',
  ],
} as const

export const ACKNOWLEDGEMENT = {
  eyebrow: 'Received',
  title: ['Your message', 'is in'],
  body: 'It has reached the business inbox. A person will read it and reply to the address you gave.',
  fallback: 'No record of a message was found in this browser session. If you have just arrived here from a link, there may be nothing to confirm.',
  cta: 'Back to the overview',
  secondary: 'Read about the textile focus',
} as const

export const TEXTILES_PAGE = {
  eyebrow: 'Textiles and fabrics',
  title: ['What we work with,', 'and what we do not'],
  lede: 'Cotton, silk and blends, in the forms India actually produces them. Anything beyond that is a conversation, not a promise.',
  families: [
    { key: 'cotton' as const, label: 'Greige', note: 'Woven, unbleached' },
    { key: 'gold' as const, label: 'Gold', note: 'Dyed or union' },
    { key: 'indigo' as const, label: 'Indigo', note: 'Vat dyed cotton' },
    { key: 'ink' as const, label: 'Deep dye', note: 'Heavy, saturated' },
  ],
  familiesNote: 'Material families, shown as representative samples. Not a stock list.',
} as const

export const NOTFOUND = {
  eyebrow: '404',
  title: ['There is nothing', 'at this address'],
  body: 'The page may have moved. The overview is the shortest way back.',
  cta: 'Back to the overview',
  secondary: 'Start an enquiry',
} as const
