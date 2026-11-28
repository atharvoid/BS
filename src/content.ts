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
  location: 'India',
} as const

export const CATEGORIES = [
  { id: 'textiles', label: 'Textiles & fabrics', scope: 'Fabrics, yarns, made-ups', hint: 'Tell us the fabric, intended use and finish. Include a sample reference or approximate quantity if you have one.' },
  { id: 'handicrafts', label: 'Handicrafts & home decor', scope: 'Pottery, woodwork, decor', hint: 'Describe the item, material, dimensions and finish. Mention any reference images you have.' },
  { id: 'agriculture-food', label: 'Agriculture & food', scope: 'Grains, spices, produce', hint: 'Name the crop or food product. Include the grade, quantity and packing if known.' },
  { id: 'industrial-materials', label: 'Industrial materials', scope: 'Metals and components', hint: 'Name the material or component. Include its grade, specification or reference if available.' },
  { id: 'organic-sustainable', label: 'Organic & sustainable products', scope: 'Certified, traceable goods', hint: 'Name the product and any certification or traceability documents you need.' },
  { id: 'general', label: 'Other sourcing requests', scope: 'Anything else you need', hint: 'Tell us what you need or supply, how it will be used and where it is going.' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export function getCategory(id: string | null | undefined) {
  // No category given (or an unknown one): the first in the list.
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0]
}

/**
 * The four answers that make a textile enquiry answerable. Used on /textiles as
 * a written brief, and nowhere else: no illustration is attached to a field,
 * because an object beside a contract term implies a relationship that does not
 * exist.
 */
export const FABRIC_TOPICS = [
  { n: '1', title: 'Fabric and use', body: 'What are you making, and how should the fabric feel?' },
  { n: '2', title: 'Samples', body: 'Is there a sample or reference to match?' },
  { n: '3', title: 'Quantity and packing', body: 'Roughly how much, and how should it be packed?' },
  { n: '4', title: 'Acceptance and terms', body: 'What must be agreed before you order?' },
] as const

export const FOCUS_AREAS = [
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    kicker: 'South India',
    note: 'Handloom and mill-made cotton, silk and blended fabrics.',
  },
  {
    id: 'gujarat',
    name: 'Gujarat',
    kicker: 'West India',
    note: 'Cotton, block-printed and dyed fabrics, with a deep processing base.',
  },
] as const

export const FIRST_MESSAGE = [
  'What you are looking for, or what you supply',
  'How it will be used',
  'A reference you already like, if you have one',
  'The destination, or your business location',
] as const

/** The six required answers. Kept in one place so the form and its copy cannot drift. */
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
    placeholder: 'For example: Rotterdam, or Coimbatore',
  },
  name: { label: 'Your name', placeholder: 'Full name' },
  email: { label: 'Email address', hint: 'Replies come from bsexim.nexus@gmail.com.' },
  phone: {
    label: 'Phone number',
    hint: 'Include the country code, so we can call or message you about the enquiry.',
    placeholder: '+91 98765 43210',
  },
} as const

/** Categories with a page of their own. */
const CATEGORY_PAGES: Partial<Record<CategoryId, string>> = { textiles: '/textiles' }

/**
 * One picture per category, shown on a sample card inside the open swatch
 * strip and in the larger view. To use a real photograph, put the file in
 * public/photos/ and change `src`, `alt` and `kind` here; nothing else needs
 * touching. Every image is captioned as representative, because none of them
 * is a photograph of supplier stock.
 */
/* Most photographs are AI-generated (arena.ai, prompts in docs/redesign/IMAGE-PROMPTS.md).
   Industrial and general are real photographs from Unsplash (free licence;
   credits in docs/redesign/IMAGE-CREDITS.md). All are
   saved at 1600px with an 800px `-small` version beside each. */
/** `focus` is the CSS object-position: which part of the photo stays in view
 * when a vat crops it. Defaults to the centre. */
export const CATEGORY_IMAGES: Record<CategoryId, { src: string; alt: string; kind: 'render' | 'photo'; focus?: string }> = {
  textiles: { src: '/photos/textiles.webp', alt: 'A roll of indigo cotton twill with a folded swatch beside it', kind: 'photo' },
  handicrafts: { src: '/photos/handicrafts.webp', alt: 'A blue-pottery vase painted with indigo flowers, beside a small carved wooden box', kind: 'photo' },
  'agriculture-food': { src: '/photos/agriculture.webp', alt: 'Wheat ears and grain spilling from a jute sack, with turmeric root in a brass bowl', kind: 'photo' },
  'industrial-materials': { src: '/photos/industrial.webp', alt: 'A close coil of bright copper wire filling the frame', kind: 'photo' },
  'organic-sustainable': { src: '/photos/organic.webp', alt: 'Open cotton bolls on a dried stem', kind: 'photo' },
  general: { src: '/photos/general.webp', alt: 'A wall of stacked shipping containers in red, yellow and green', kind: 'photo' },
}

export const REGION_IMAGES = {
  'tamil-nadu': { src: '/photos/region-tamil-nadu.webp', alt: 'Folded indigo handloom cotton with a fine check' },
  gujarat: { src: '/photos/region-gujarat.webp', alt: 'Folded block-printed cotton in bronze and rust' },
} as const

/** The 800px version of a photo saved beside it, for srcset. */
export const smallPhoto = (src: string) => src.replace(/\.webp$/, '-small.webp')

export const IMAGE_CAPTION = 'Representative image, not a photograph of supplier stock.'

export const CATEGORY_JOURNEY = CATEGORIES.map(category => ({
  ...category,
  to: CATEGORY_PAGES[category.id],
  image: CATEGORY_IMAGES[category.id],
}))

/**
 * "Craft, up close": four photographs on the home page of the kind of
 * goods buyers ask about. Taken by the business in Indian retail; they are
 * representative only (each says so), and the titles name kinds of goods,
 * never a material, maker or stock. `width`/`height` are the files' own.
 */
export const CRAFT = {
  title: 'Craft, up close',
  items: [
    { id: 'rugs', src: '/photos/craft-rugs-hd.webp', width: 1600, height: 1200, category: 'textiles', tone: '#b4532a', title: 'Printed rugs and runners', line: 'Palm groves on rust, ikat on deep green: floor pieces in print and weave.', alt: 'Printed rugs hung on a rack: palm trees on rust, and ikat-style motifs on deep green' },
    { id: 'tray', src: '/photos/craft-tray-hd.webp', width: 1330, height: 1182, category: 'handicrafts', tone: '#c23a4a', title: 'Painted and printed trays', line: 'Pichwai cows on madder red, held in a lacquer-blue rim.', alt: 'A round blue-rimmed tray printed with Pichwai-style cows on a red ground' },
    { id: 'vessels', src: '/photos/craft-vessels-hd.webp', width: 1600, height: 1315, category: 'handicrafts', tone: '#6f6a62', title: 'Vessels and vases', line: 'Ribbed clay forms in matte ash and charcoal.', alt: 'Matte grey and black clay-finish jars with ribbed sides' },
    { id: 'tableware', src: '/photos/craft-tableware-hd.webp', width: 1600, height: 1200, category: 'handicrafts', tone: '#2c4a7a', title: 'Printed tableware', line: 'Tumblers and bowls in flower, bird and palm prints, lined in brass.', alt: 'Stacked tumblers and bowls printed with flowers, birds and palms, brass inside, in front of wooden stands holding printed trays' },
  ],
} as const satisfies {
  title: string
  items: readonly { id: string; src: string; width: number; height: number; category: CategoryId; tone: string; title: string; line: string; alt: string }[]
}

export const ABOUT_BUSINESS = {
  eyebrow: 'About',
  title: 'Trade coordination and export sourcing in India',
  lede: 'We connect overseas buyers and buyers in India with Indian suppliers, and help each side agree what is needed before anything is ordered.',
} as const

export const LEADERSHIP = { name: 'Bhupendra Sain', role: 'CEO' } as const

/**
 * The company's vision and goals. Kept to what the business can stand behind:
 * no figures, no track record, no certification claims, terms in writing.
 */
export const ABOUT_VISION = {
  title: 'Our vision',
  statement: 'To make buying from India feel certain.',
  body: 'A buyer anywhere in the world should be able to source from Indian makers with the same confidence as buying from a supplier down the road: clear specifications, honest answers and terms agreed in writing before anything moves.',
  signedBy: LEADERSHIP,
} as const

export const ABOUT_GOALS = {
  title: 'What we are working towards',
  items: [
    {
      title: 'Clarity before commitment',
      body: 'Every enquiry ends in a written specification and written terms before an order is placed, so there are no surprises on either side.',
    },
    {
      title: 'A wider door for Indian makers',
      body: 'Connecting mills, workshops, artisans and growers across India with buyers they could not reach alone. We start with the textile regions of Tamil Nadu and Gujarat, and grow into all six categories.',
    },
    {
      title: 'Trade that can be traced',
      body: 'Where a buyer needs it, we work with suppliers who can document what they make and where it comes from, so organic and sustainable claims rest on paperwork, not words.',
    },
  ],
} as const

export const ABOUT_DESK_FACTS = [
  { label: 'Business name', value: 'BS EXIMNEXUS' },
  { label: 'CEO', value: LEADERSHIP.name },
  { label: 'Operating base', value: 'India' },
  { label: 'Categories', value: 'Textiles and fabrics, handicrafts and home decor, agriculture and food, industrial materials, organic and sustainable products, and other sourcing requests' },
  { label: 'Direct email', value: 'bsexim.nexus@gmail.com' },
  { label: 'Trade terms', value: 'Agreed in writing per enquiry' },
] as const

export const ABOUT_STANDARDS = [
  {
    num: '01',
    title: 'Specifications first',
    body: 'Each enquiry starts with the specifics: what the product is, its grade or composition, the quantity, and where it is going.',
  },
  {
    num: '02',
    title: 'Terms in writing',
    body: 'Prices, minimum quantities, packing and delivery terms are confirmed in writing before anything ships.',
  },
  {
    num: '03',
    title: 'A person replies',
    body: 'Every enquiry is read and answered by a person, by email from the business inbox.',
  },
] as const
