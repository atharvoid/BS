import { Link } from 'react-router-dom'
import { useThree } from '@react-three/fiber'
import { Stage } from '../three/Stage'
import {
  ClothPanel,
  Draggable,
  Ground,
  Lights,
  ShuttleObject,
  Studio,
  getTextile,
} from '../three/objects'
import * as THREE from 'three'
import React from 'react'
import { useReveal } from '../components/useReveal'
import { Arrow } from '../components/Nav'
import { BOUNDARIES, FIRST_MESSAGE, LATER_DISCUSSIONS } from '../content'

function SwatchWall() {
  const swatches = [
    { key: 'indigo' as const, label: 'Indigo', note: 'A dyed cotton family' },
    { key: 'madder' as const, label: 'Madder', note: 'A root-dyed red family' },
    { key: 'cotton' as const, label: 'Raw cotton', note: 'Undyed, unbleached' },
    { key: 'saffron' as const, label: 'Saffron', note: 'A warm dyed family' },
    { key: 'verdigris' as const, label: 'Verdigris', note: 'A green dyed family' },
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
      <Draggable drift={0.18} tilt={0.4} float={0.03}>
        <group scale={scale} position={[x, 0, 0]}>
          <ClothPanel palette="verdigris" width={2.15} height={2.7} folds={3.4} seed={3.8} threads={16} />
        </group>
      </Draggable>
    </>
  )
}

function ShuttleVignette() {
  return (
    <>
      <Studio />
      <Lights intensity={1} />
      <Ground y={-1.05} scale={4} opacity={0.4} />
      <Draggable drift={0.24} tilt={0.46} float={0.05}>
        <group rotation={[-0.12, 0, 0.2]} position={[0, 0.08, 0]}>
          <ShuttleObject scale={0.95} />
        </group>
      </Draggable>
    </>
  )
}

export default function Textiles() {
  useReveal([])

  return (
    <>
      <section className="page-hero page-hero--textile page-hero--right on-dark grain">
        <div className="page-hero__canvas" aria-hidden="false">
          <Stage
            className="page-hero__stage"
            label="Interactive 3D cloth panel in a green dyed weave. Drag to turn it."
            z={6.2}
            fov={36}
            fallback={<div className="page-hero__fallback" aria-hidden="true" />}
          >
            <TextileObject aside />
          </Stage>
        </div>
        <div className="shell page-hero__inner">
          <p className="eyebrow">Textiles &amp; fabrics</p>
          <h1 className="page-hero__title">
            The initial focus is <em className="display-italic">cloth</em> from India.
          </h1>
          <p className="page-hero__lede">
            Composition, construction, weight, width and finish are the questions that shape a
            sourcing conversation. None of them need an answer before the first message.
          </p>
        </div>
      </section>

      <section className="textile-intro">
        <div className="shell">
          <div className="textile-intro__grid">
            <div>
              <p className="eyebrow reveal">Why textiles first</p>
              <h2 className="textile-intro__title reveal">
                A category broad enough to be honest about.
              </h2>
            </div>
            <div className="textile-intro__body">
              <p className="reveal">
                Textiles and fabrics are the first category because Indian supply is varied enough
                that a general promise would be meaningless. A single enquiry is specific: this
                fabric, for this use, from this area.
              </p>
              <p className="reveal" style={{ ['--reveal-delay' as string]: '80ms' }}>
                The site therefore does not present a fabric list. What follows are the dimensions
                a conversation tends to move through, in roughly the order they become useful.
              </p>
            </div>
          </div>

          <SwatchWall />
          <p className="wall__note reveal">
            These swatches are representative of material families — generated weaves, not
            photographs of stock. They are not an offer, and they do not indicate availability.
          </p>
        </div>
      </section>

      <section className="dimensions on-indigo grain">
        <div className="shell">
          <header className="dimensions__head">
            <p className="eyebrow reveal">What further discussions may cover</p>
            <h2 className="dimensions__title reveal">
              Four dimensions of a <em className="display-italic">fabric</em>.
            </h2>
          </header>
          <dl className="dimensions__list">
            {LATER_DISCUSSIONS.map((d, i) => (
              <div key={d.t} className="dimensions__row reveal" style={{ ['--reveal-delay' as string]: `${i * 70}ms` }}>
                <dt>
                  <span className="dimensions__num">{String(i + 1).padStart(2, '0')}</span>
                  {d.t}
                </dt>
                <dd>{d.d}</dd>
              </div>
            ))}
          </dl>
          <p className="dimensions__caveat reveal">
            These are conversation topics, not a service list. Nothing here confirms that a given
            specification, quantity or term can be met.
          </p>
        </div>
      </section>

      <section className="useful">
        <div className="shell">
          <div className="useful__grid">
            <div className="useful__left">
              <p className="eyebrow reveal">What is useful in an enquiry</p>
              <h2 className="useful__title reveal">
                Four lines, in <em className="display-italic">any</em> order.
              </h2>
              <ul className="checklist checklist--dark">
                {FIRST_MESSAGE.map((item, i) => (
                  <li key={item} className="checklist__item reveal" style={{ ['--reveal-delay' as string]: `${i * 70}ms` }}>
                    <span className="checklist__box" aria-hidden="true">
                      <svg viewBox="0 0 12 12" fill="none">
                        <path d="M1.5 6.4 4.4 9.3 10.5 2.9" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="useful__note reveal">
                A reference image you already like is often more useful than any of this. Say so in
                the message; arrangements for sharing can follow in the reply.
              </p>
              <div className="useful__cta reveal">
                <Link to="/enquiry" className="btn">
                  Textile enquiry
                  <Arrow />
                </Link>
              </div>
            </div>

            <aside className="useful__right">
              <div className="useful__canvas">
                <Stage
                  label="Interactive 3D weaving shuttle. Drag to turn it."
                  z={5.2}
                  fov={36}
                  fallback={<div className="useful__canvas-fallback" aria-hidden="true" />}
                >
                  <ShuttleVignette />
                </Stage>
              </div>
              <p className="useful__caption">
                A weaving shuttle. Representative of the craft, not of any supplier or product.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bounds bounds--tight">
        <div className="shell">
          <header className="bounds__head">
            <p className="eyebrow reveal">Read this alongside the focus</p>
            <h2 className="bounds__title reveal">
              What the textile focus <em className="display-italic">does not</em> mean.
            </h2>
          </header>
          <ul className="bounds__list">
            {BOUNDARIES.map((b, i) => (
              <li key={b.t} className="bounds__row reveal" style={{ ['--reveal-delay' as string]: `${i * 60}ms` }}>
                <span className="bounds__num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="bounds__term">{b.t}</h3>
                <p className="bounds__def">{b.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
