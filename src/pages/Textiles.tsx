import { Link } from 'react-router-dom'
import { useThree } from '@react-three/fiber'
import { Stage } from '../three/Stage'
import {
  ClothPanel,
  Draggable,
  Ground,
  Lights,
  Studio,
  getTextile,
} from '../three/objects'
import React from 'react'
import { useReveal } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import { FOCUS_AREAS } from '../content'
import { RegionWeave } from '../components/RegionWeave'
import { FabricBrief } from '../components/FabricBrief'
import { EnquiryForm, useEnquiryDraft } from '../components/EnquiryForm'

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
          <SwatchPlane palette={s.key} index={i} />
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
function SwatchPlane({ palette, index }: { palette: 'indigo' | 'madder' | 'cotton' | 'saffron' | 'verdigris'; index: number }) {
  const host = React.useRef<HTMLDivElement>(null)
  const [src, setSrc] = React.useState<string | null>(null)

  React.useEffect(() => {
    const tex = getTextile(palette, 26)
    const img = tex.map.image as HTMLCanvasElement
    // Draw a tilted, lit crop so the swatch reads as a physical sample.
    const size = 420
    const out = document.createElement('canvas')
    out.width = size
    out.height = size
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#1c1813'
    ctx.fillRect(0, 0, size, size)
    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.rotate(((index - 2) * 3.1 * Math.PI) / 180)
    ctx.drawImage(img, -size / 2, -size / 2, size, size)
    ctx.restore()
    const shade = ctx.createLinearGradient(0, 0, size, size)
    shade.addColorStop(0, 'rgba(255,246,226,0.20)')
    shade.addColorStop(0.45, 'rgba(255,255,255,0)')
    shade.addColorStop(1, 'rgba(0,0,0,0.42)')
    ctx.fillStyle = shade
    ctx.fillRect(0, 0, size, size)
    setSrc(out.toDataURL('image/jpeg', 0.86))
  }, [palette, index])

  return (
    <div className="wall__frame" ref={host}>
      {src ? <img src={src} alt="" width={420} height={420} loading="lazy" decoding="async" /> : <div className="wall__placeholder" />}
    </div>
  )
}

/** The textile hero: one cloth, framed into whichever half of the hero it owns. */
function TextileObject({ aside = false }: { aside?: boolean }) {
  const viewport = useThree((s) => s.viewport)
  const narrow = viewport.aspect < 1.2
  // The page-hero canvas only occupies the right-hand column on wide screens,
  // so the object is centred in its own canvas rather than the page.
  const scale = narrow ? 0.82 : Math.min(1, 0.66 + viewport.aspect * 0.16)
  const x = narrow || !aside ? 0 : -Math.min(0.5, viewport.width * 0.04)

  return (
    <>
      <Studio />
      <Lights intensity={1.02} />
      <Ground y={-1.35} scale={4} opacity={0.4} />
      {/* Spinning slowly on its own so the cloth reads as material in motion;
          a drag adds to that angle instead of stopping it. */}
      <Draggable drift={0.18} tilt={0.4} float={0.03} spin={Math.PI * 2 / 52}>
        <group scale={scale} position={[x, 0, 0]}>
          <ClothPanel palette="verdigris" width={2.15} height={2.7} folds={3.4} seed={3.8} threads={16} />
        </group>
      </Draggable>
    </>
  )
}

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
          <Stage className="page-hero__stage" label="Interactive green textile illustration. Drag to turn it." z={6.2} fov={36} fallback={<div className="page-hero__fallback" aria-hidden="true" />}>
            <TextileObject aside />
          </Stage>
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
