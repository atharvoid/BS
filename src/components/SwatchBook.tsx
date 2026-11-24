import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_JOURNEY, IMAGE_CAPTION, smallPhoto } from '../content'
import { Arrow } from './Nav'
import { Lightbox, type LightboxImage } from './Lightbox'

/* The swatch book: one undyed cotton strip per category, each with its dye
   showing only at the hem, where a few words say what the category covers.
   Opening a strip dyes the whole cloth and shows what to tell us about that
   category, with a link straight into the enquiry form for it. Plain
   disclosure buttons underneath, so it works with a keyboard, a screen
   reader, and with motion turned off. */

const DYES: Record<string, { token: string; tone: 'dark' | 'light' }> = {
  textiles: { token: 'textiles', tone: 'dark' },
  handicrafts: { token: 'handicrafts', tone: 'dark' },
  'agriculture-food': { token: 'agriculture', tone: 'light' },
  'industrial-materials': { token: 'industrial', tone: 'dark' },
  'organic-sustainable': { token: 'organic', tone: 'dark' },
  general: { token: 'general', tone: 'dark' },
}

const preloaded = new Set<string>()
function preload(src: string) {
  if (preloaded.has(src)) return
  preloaded.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

export function SwatchBook() {
  const [open, setOpen] = React.useState<string | null>(null)
  const [viewing, setViewing] = React.useState<LightboxImage | null>(null)

  return (
    <section className="swatches" id="products" aria-labelledby="swatches-title" data-tone="light">
      <div className="shell">
        <header className="swatches__head">
          <h2 id="swatches-title">What do you want to source?</h2>
          <p>Six areas, each discussed case by case. Open one to see what to put in your first message.</p>
        </header>

        <div className="swatches__book" data-open={open ? 'true' : 'false'}>
          {CATEGORY_JOURNEY.map((item, i) => {
            const dye = DYES[item.id]
            const isOpen = open === item.id
            return (
              <div
                key={item.id}
                className="strip"
                data-open={isOpen}
                data-tone={dye.tone}
                style={{ '--dye': `var(--dye-${dye.token})` } as React.CSSProperties}
                /* Start fetching the strip's photo as the pointer or focus
                   arrives, so it is already there when the strip opens. */
                onPointerEnter={() => preload(smallPhoto(item.image.src))}
                onFocus={() => preload(smallPhoto(item.image.src))}
              >
                <span className="strip__cloth" aria-hidden="true" />
                <h3 className="strip__head">
                  <button
                    type="button"
                    className="strip__toggle"
                    aria-expanded={isOpen}
                    aria-controls={`strip-panel-${item.id}`}
                    id={`strip-${item.id}`}
                    onClick={() => setOpen(isOpen ? null : item.id)}
                  >
                    <span className="strip__num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="strip__label">{item.label}</span>
                    <span className="strip__dye">{item.scope}</span>
                    <span className="strip__marker" aria-hidden="true" />
                  </button>
                </h3>
                <div
                  className="strip__panel"
                  id={`strip-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`strip-${item.id}`}
                  hidden={!isOpen}
                >
                  {/* A sample card pinned to the cloth. Tap for a larger view. */}
                  <button
                    type="button"
                    className="strip__photo"
                    onClick={() => setViewing({ ...item.image, title: item.label, caption: IMAGE_CAPTION })}
                  >
                    <img src={smallPhoto(item.image.src)} srcSet={`${smallPhoto(item.image.src)} 800w, ${item.image.src} 1600w`} sizes="(max-width: 760px) 17rem, 15rem" alt="" loading="lazy" decoding="async" width={800} height={533} />
                    <span className="strip__photo-hint">
                      <span className="visually-hidden">Open a larger picture: {item.image.alt}</span>
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" /></svg>
                    </span>
                  </button>
                  <p>{item.hint}</p>
                  <div className="strip__links">
                    <Link to={`/enquiry?category=${item.id}`} className="strip__link">
                      Enquire about this
                      <Arrow />
                    </Link>
                    {item.to && <Link to={item.to} className="strip__more">More on textiles</Link>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="swatches__note">
          Pictures are representative, not products on offer. Availability and terms are discussed for each enquiry.
        </p>
      </div>
      <Lightbox image={viewing} onClose={() => setViewing(null)} />
    </section>
  )
}
