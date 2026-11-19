import { Link } from 'react-router-dom'
import { Stage } from '../three/Stage'
import React from 'react'
import { useReveal } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import { FOCUS_AREAS } from '../content'
import { RegionWeave } from '../components/RegionWeave'
import { FabricBrief } from '../components/FabricBrief'
import { EnquiryForm, useEnquiryDraft } from '../components/EnquiryForm'

/* The cloth in the hero needs the weave generator. Loading it here keeps
   the region notes and enquiry form independent of it. */
const loadHeroScene = () => import('../three/TextileHeroScene')

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
            label="Green woven cloth illustration"
            z={6.2}
            fov={36}
            fallback={<img className="cloth-poster" src="/posters/cloth-mobile.webp" srcSet="/posters/cloth-mobile-small.webp 500w, /posters/cloth-mobile.webp 1000w" sizes="(max-width:540px) 100vw, 500px" alt="" width={1000} height={800} />}
            load={loadHeroScene}
            finiteMotion
          />
          <p className="drag-hint" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 11V6.5a1.5 1.5 0 0 1 3 0V11m0-2.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v5.2A4.8 4.8 0 0 1 13.2 20h-1.1a4 4 0 0 1-3.2-1.6L5.4 13.7a1.6 1.6 0 0 1 2.4-2l1.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Drag
          </p>
        </div>
        <div className="shell page-hero__inner">
          <p className="eyebrow">Textiles &amp; fabrics</p>
          <h1 className="page-hero__title">Textiles and fabrics <em className="display-italic">from India</em>.</h1>
          <p className="page-hero__lede">Explore the regions where we’re beginning our sourcing work.</p>
          <Link to="/textiles#textile-enquiry" className="btn btn--light">Start a textile enquiry <Arrow /></Link>
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
          <div className="enquiry-body__textiles">
            <h2>Enquire about textiles</h2>
            <p>Use the <Link to="/textiles#fabric-details">example fabric brief</Link> to check what to include.</p>
            <EnquiryForm />
          </div>
        </div>
      </section>
    </>
  )
}
