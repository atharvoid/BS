import { Link } from 'react-router-dom'
import { Stage } from '../three/Stage'
import React from 'react'
import { Arrow } from '../components/Nav'
import { FOCUS_AREAS, REGION_IMAGES, smallPhoto } from '../content'
import { FabricBrief } from '../components/FabricBrief'
import { EnquiryForm, useEnquiryDraft } from '../components/EnquiryForm'

/* The cloth in the hero needs the weave generator. Loading it here keeps
   the region notes and enquiry form independent of it. */
const loadHeroScene = () => import('../three/TextileHeroScene')

export default function Textiles() {
  const { setDraft } = useEnquiryDraft()

  React.useEffect(() => {
    setDraft(draft => draft.subject === 'textiles' ? draft : { ...draft, subject: 'textiles' })
  }, [setDraft])

  return (
    <>
      <section className="page-hero page-hero--textile page-hero--right">
        <div className="page-hero__canvas">
          <Stage
            className="page-hero__stage"
            label="Indigo woven cloth illustration"
            z={6.2}
            fov={36}
            fallback={<img className="cloth-poster" src="/posters/cloth-mobile.webp" srcSet="/posters/cloth-mobile-small.webp 500w, /posters/cloth-mobile.webp 1000w" sizes="(max-width:540px) 100vw, 500px" alt="" width={1000} height={800} />}
            load={loadHeroScene}
            finiteMotion
            posterWhileLoading={false}
          />
          <p className="drag-hint" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 11V6.5a1.5 1.5 0 0 1 3 0V11m0-2.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v5.2A4.8 4.8 0 0 1 13.2 20h-1.1a4 4 0 0 1-3.2-1.6L5.4 13.7a1.6 1.6 0 0 1 2.4-2l1.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Drag
          </p>
        </div>
        <div className="shell page-hero__inner">
          <h1 className="page-hero__title">Textiles and fabrics from India</h1>
          <p className="page-hero__lede">Cotton, silk and blended fabrics, starting with two of India’s textile regions. Tell us what you are making and we will take it from there.</p>
          <div className="page-hero__actions">
            <Link to="/textiles#textile-enquiry" className="btn">Start a textile enquiry <Arrow /></Link>
          </div>
        </div>
      </section>

      <section className="areas on-indigo grain" id="areas">
        <div className="shell">
          <div className="areas__head"><p className="eyebrow reveal">Initial sourcing areas</p><h2 className="areas__title reveal">Tamil Nadu and Gujarat</h2></div>
          <div className="areas__grid">
            {FOCUS_AREAS.map((area) => (
              <article className="area reveal" key={area.id}>
                <div className={'area__weave area__weave--' + area.id} aria-hidden="true">
                  <img className="area__photo" onLoad={(e) => { e.currentTarget.dataset.loaded = 'true' }} src={smallPhoto(REGION_IMAGES[area.id].src)} srcSet={`${smallPhoto(REGION_IMAGES[area.id].src)} 800w, ${REGION_IMAGES[area.id].src} 1600w`} sizes="(max-width: 760px) 100vw, 50vw" alt={REGION_IMAGES[area.id].alt} loading="lazy" decoding="async" width={800} height={533} />
                </div>
                <div className="area__text">
                  <p className="area__kicker">{area.kicker}</p>
                  <h3 className="area__name">{area.name}</h3>
                  <p className="area__note">{area.note}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="areas__foot reveal">Supplying from elsewhere in India? <Link to="/enquiry">Tell us what you offer</Link>.</p>
        </div>
      </section>

      <FabricBrief />

      <section className="enquiry-body" id="textile-enquiry">
        <div className="shell">
          <div className="enquiry-body__textiles">
            <EnquiryForm
              title="Enquire about textiles"
              intro={<>Not sure what to include? See <Link to="/textiles#fabric-details">what to tell us about your fabric</Link>.</>}
            />
          </div>
        </div>
      </section>
    </>
  )
}
