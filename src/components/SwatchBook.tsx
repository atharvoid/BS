import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_JOURNEY } from '../content'
import { Arrow } from './Nav'

/* The swatch book: one undyed cotton strip per category, each with its dye
   showing only at the hem. Opening a strip dyes the whole cloth and shows what
   to tell us about that category. Plain disclosure buttons underneath, so it
   works with a keyboard, a screen reader, and with motion turned off. */

const DYES: Record<string, { token: string; name: string; tone: 'dark' | 'light' }> = {
  textiles: { token: 'textiles', name: 'Indigo', tone: 'dark' },
  handicrafts: { token: 'handicrafts', name: 'Madder', tone: 'dark' },
  'agriculture-food': { token: 'agriculture', name: 'Turmeric', tone: 'light' },
  'industrial-materials': { token: 'industrial', name: 'Iron', tone: 'dark' },
  'organic-sustainable': { token: 'organic', name: 'Verdigris', tone: 'dark' },
  general: { token: 'general', name: 'Brass', tone: 'light' },
}

export function SwatchBook() {
  const [open, setOpen] = React.useState<string | null>(null)

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
            const href = item.to ?? `/enquiry?category=${item.id}`
            return (
              <div
                key={item.id}
                className="strip"
                data-open={isOpen}
                data-tone={dye.tone}
                style={{ '--dye': `var(--dye-${dye.token})` } as React.CSSProperties}
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
                    <span className="strip__dye">{dye.name}</span>
                  </button>
                </h3>
                <div
                  className="strip__panel"
                  id={`strip-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`strip-${item.id}`}
                  hidden={!isOpen}
                >
                  <p>{item.hint}</p>
                  <Link to={href} className="strip__link">
                    {item.to ? 'Read about textiles' : 'Start this enquiry'}
                    <Arrow />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <p className="swatches__note">
          The colours are dyes, not products. Availability and terms are discussed for each enquiry.
        </p>
      </div>
    </section>
  )
}
