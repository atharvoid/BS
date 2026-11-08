import { Link } from 'react-router-dom'
import { Stage } from '../three/Stage'
import React from 'react'
import { useReveal } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import { FOCUS_AREAS } from '../content'
import { RegionWeave } from '../components/RegionWeave'
import { FabricBrief } from '../components/FabricBrief'
import { EnquiryForm, useEnquiryDraft } from '../components/EnquiryForm'

/* The cloth in the hero and the five woven swatches both need the weave
   generator, which is the expensive part of this page. Loading them here keeps
   the fabric list, the region notes and the enquiry form — the page's actual
   content — independent of it. */
const loadHeroScene = () => import('../three/TextileHeroScene')


function SwatchWall() {
  const swatches = [
    { key: 'indigo' as const, label: 'Indigo', note: 'Blue weave' },
    { key: 'madder' as const, label: 'Madder', note: 'Red weave' },
    { key: 'cotton' as const, label: 'Raw cotton', note: 'Natural colour' },
    { key: 'saffron' as const, label: 'Saffron', note: 'Warm weave' },
    { key: 'verdigris' as const, label: 'Verdigris', note: 'Green weave' },
  ]

  return (
    <div className="wall" role="list">
      {swatches.map((s, i) => (
        <figure
          key={s.key}
          className="wall__item reveal"
          role="listitem"
          style={{ ['--reveal-delay' as string]: `${i * 80}ms` }}
        >
          {/* The weave arrives with the same module as the hero cloth. Until it
              does, the frame holds its own shape rather than collapsing. */}
          <div className="wall__frame"><img src={`/swatches/${s.key}.webp`} alt="" width={840} height={840} loading="lazy" decoding="async" /></div>
          <figcaption>
            <strong>{s.label}</strong>
            <span>{s.note}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

/** A rendered swatch: the same procedural weave used in the 3D scenes, on a flat plane. */
export default function Textiles() {
  useReveal([])
  const { setDraft } = useEnquiryDraft()

  React.useEffect(() => {
    setDraft(draft => draft.subject === 'textiles' ? draft : { ...draft, subject: 'textiles' })
  }, [setDraft])

  return (
    <>
      <section className="page-hero page-hero--textile page-hero--right on-dark grain">
        <div className="page-hero__canvas">
          <Stage
            className="page-hero__stage"
            label="Interactive green textile illustration. Drag to turn it."
            z={6.2}
            fov={36}
            fallback={<img className="cloth-poster" src="/posters/cloth-mobile.webp" srcSet="/posters/cloth-mobile-small.webp 500w, /posters/cloth-mobile.webp 1000w" sizes="(max-width:540px) 100vw, 500px" alt="" width={1000} height={800} />}
            load={loadHeroScene}
          />
        </div>
        <div className="shell page-hero__inner">
          <p className="eyebrow">Textiles &amp; fabrics</p>
          <h1 className="page-hero__title">Textiles and fabrics <em className="display-italic">from India</em>.</h1>
          <p className="page-hero__lede">Explore fabric types and the regions where we’re beginning our sourcing work.</p>
          <a href="#textile-enquiry" className="btn btn--light">Start a textile enquiry <Arrow /></a>
        </div>
      </section>

      <section className="textile-intro">
        <div className="shell">
          <div className="textile-intro__grid">
            <div><p className="eyebrow reveal">Materials</p><h2 className="textile-intro__title reveal">Fabric types</h2></div>
            <div className="textile-intro__body">
              <p className="reveal"><strong>Fibre</strong> describes the material, such as cotton, silk or blends.</p>
              <p className="reveal"><strong>Construction</strong> describes how it is made, such as woven or knitted.</p>
              <p className="reveal"><strong>Finish</strong> describes treatments such as printing or dyeing.</p>
            </div>
          </div>
          <SwatchWall />
          <p className="wall__note reveal">These illustrations show colour and weave. Availability is checked for each enquiry.</p>
        </div>
      </section>

      <section className="areas on-indigo grain" id="areas">
        <div className="shell">
          <div className="areas__head"><p className="eyebrow reveal">Initial sourcing areas</p><h2 className="areas__title reveal">Tamil Nadu and <em className="display-italic">Gujarat</em>.</h2></div>
          <div className="areas__grid">
            {FOCUS_AREAS.map((area, index) => (
              <article className="area reveal" key={area.id}>
                <div className={'area__weave area__weave--' + area.id} aria-hidden="true">
                  <RegionWeave motif={area.id} /><span className="area__grain" />
                </div>
                <div className="area__text">
                  <p className="area__kicker">{area.kicker}</p>
                  <h3 className="area__name">{area.name}</h3>
                  <p className="area__note">{index === 0 ? 'Tamil Nadu is an initial sourcing area for cotton, silk and blended fabric enquiries.' : 'Gujarat is an initial sourcing area for cotton, printed and dyed fabric enquiries.'}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="areas__foot reveal">Suppliers elsewhere in India can also share what they offer.</p>
        </div>
      </section>

      <FabricBrief />

      <section className="enquiry-body" id="textile-enquiry">
        <div className="shell">
          <h2>Enquire about textiles</h2>
          <EnquiryForm />
        </div>
      </section>
    </>
  )
}
