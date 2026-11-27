import React from 'react'
import { Link } from 'react-router-dom'
import { CRAFT, IMAGE_CAPTION, getCategory, smallPhoto } from '../content'
import { Arrow } from './Nav'
import { Lightbox, type LightboxImage } from './Lightbox'
import '../styles/craft.css'

/* ==========================================================================
   Colour, clay and cloth

   Between choosing a product area and reading how an enquiry works, the home
   page shows what the work looks like: four photographs of the kind of goods
   buyers ask about. A mosaic on wide screens, two columns on a phone. Each
   tile opens the larger view; the note under it keeps the site's rule that
   imagery is representative.
   ========================================================================== */

/** Pixels of each photo's -small copy, which is exactly half the original. */
const half = (n: number) => Math.round(n / 2)

export function CraftBand() {
  const [viewing, setViewing] = React.useState<LightboxImage | null>(null)

  return (
    <section className="craft" aria-labelledby="craft-title">
      <div className="shell">
        <header className="craft__head">
          <h2 className="craft__title" id="craft-title">{CRAFT.title}</h2>
          <p className="craft__lede">{CRAFT.lede}</p>
        </header>

        <ul className="craft__grid">
          {CRAFT.items.map((item) => {
            const small = smallPhoto(item.src)
            return (
              <li key={item.id} className={`craft__item craft__item--${item.id}`}>
                <button
                  type="button"
                  className="craft__open"
                  aria-label={`View larger: ${item.title}`}
                  onClick={() => setViewing({ src: item.src, alt: item.alt, title: item.title, caption: IMAGE_CAPTION })}
                >
                  <img
                    className="craft__img"
                    src={small}
                    srcSet={`${small} ${half(item.width)}w, ${item.src} ${item.width}w`}
                    sizes="(max-width: 900px) 100vw, 60vw"
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    loading="lazy"
                    decoding="async"
                    onLoad={(event) => { event.currentTarget.dataset.loaded = 'true' }}
                  />
                  <span className="craft__cap" aria-hidden="true">
                    <span className="craft__cat">{getCategory(item.category).label}</span>
                    <span className="craft__name">{item.title}</span>
                  </span>
                  <span className="craft__zoom" aria-hidden="true">
                    <svg viewBox="0 0 16 16"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" /></svg>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="craft__foot">
          <p className="craft__note">{CRAFT.note}</p>
          <Link to="/enquiry?category=handicrafts" className="craft__link">
            Ask about homeware and decor
            <Arrow />
          </Link>
        </div>
      </div>
      <Lightbox image={viewing} onClose={() => setViewing(null)} />
    </section>
  )
}
