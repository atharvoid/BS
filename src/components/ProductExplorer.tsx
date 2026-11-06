import React from 'react'
import { Link } from 'react-router-dom'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CATEGORIES, type CategoryId } from '../content'
import { Stage } from '../three/Stage'
import { useSceneSession } from '../three/SceneSession'
import { Lights, Studio, getShadowTexture } from '../three/objects'
import { CATEGORY_OBJECTS, type CategoryMotif } from '../three/categoryObjects'
import { frameModel, type Framing } from '../three/framing'
import { Arrow } from './Nav'

/* ==========================================================================
   What are you looking to source?

   One row of category tiles, each with a live object turning inside it, and a
   running marquee under the row that names every product area. It is the first
   thing after the hero, so it is kept to one screen: the tiles are the
   navigation, the marquee is the inventory of what the business covers.

   Each tile runs its own tiny canvas, and each of those is a real WebGL
   context, so they are mounted only while the row is on screen. The objects are
   the same family as the globe and the textile scenes — real models, generated
   textures, the shared studio environment and a soft ground shadow — and they
   turn on their own. Nothing in the row is draggable and there are no controls
   on the objects: the tile is a link and the object inside it is decoration,
   so a click anywhere in the tile always does the same thing.
   ========================================================================== */


/**
 * Whether this screen gets the live objects.
 *
 * Six tiles means six WebGL contexts, and a browser caps how many it will keep
 * alive — typically eight, fewer on some Android builds. The hero globe holds
 * one of them already. So the live row is reserved for a wide screen with a
 * fine pointer, where there is room and context headroom; phones and tablets
 * get a drawn swatch instead, which is the same information at no cost.
 */
function useLiveTiles() {
  const query = '(min-width: 900px) and (any-pointer: fine)'
  const [live, setLive] = React.useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  )
  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(query)
    const update = () => setLive(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return live
}

type Tile = {
  id: CategoryId
  label: string
  note: string
  motif: CategoryMotif
  /** Where this tile goes. Textiles has its own page; the rest open an enquiry. */
  to?: string
}

/** The marquee is the full product list, in the same order as the tiles. */
const TILES: Tile[] = [
  { id: 'textiles', label: 'Textiles & fabrics', note: 'Woven, printed, dyed', motif: 'textiles', to: '/textiles' },
  { id: 'handicrafts', label: 'Handicrafts & home decor', note: 'Made by hand', motif: 'handicrafts' },
  { id: 'agriculture-food', label: 'Agriculture & food', note: 'Crop and ingredient', motif: 'agriculture' },
  { id: 'industrial-materials', label: 'Industrial materials', note: 'Inputs and components', motif: 'industrial' },
  { id: 'organic-sustainable', label: 'Organic & sustainable', note: 'Evidence per product', motif: 'organic' },
  { id: 'general', label: 'Something else', note: 'Describe the need', motif: 'general' },
]

const hrefFor = (tile: Tile) => tile.to ?? `/enquiry?category=${tile.id}`

const RIBBON = CATEGORIES.map((category) => category.label)

/* -------------------------------------------------------------------------- */
/* One turning tile                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Continuous rotation, and nothing else.
 *
 * The object turns by itself for as long as the tile is on screen. There is no
 * drag, no button, no pause: the tile is a link, so every pointer press has to
 * mean "open the category" and nothing may swallow it. The rig lives inside the
 * canvas because that is where a frame loop is available.
 *
 * Framing is measured rather than guessed (see frameModel): six models of
 * different shape are scaled to one shelf height, centred on the spin axis,
 * and given a contact shadow under their own footprint.
 */
function TurningRig({ children, speed }: { children: React.ReactNode; speed: number }) {
  const spin = React.useRef<THREE.Group>(null)
  const body = React.useRef<THREE.Group>(null)
  const [frame, setFrame] = React.useState<Framing | null>(null)
  const scene = useSceneSession()
  const invalidate = scene?.invalidate

  React.useLayoutEffect(() => {
    const g = body.current
    if (!g) return
    g.scale.setScalar(1)
    g.position.set(0, 0, 0)
    g.updateMatrixWorld(true)
    const next = frameModel(new THREE.Box3().setFromObject(g))
    if (!next) return
    setFrame(next)
    /* A still device draws on demand, so the measured frame has to be asked
       for explicitly or the tile would show an unmeasured model forever. */
    invalidate?.current?.()
  }, [invalidate])

  useFrame((_, delta) => {
    const g = spin.current
    if (!g) return
    const d = Math.min(delta, 1 / 30)
    if (!scene?.still) g.rotation.y += d * speed
  })

  return (
    <group ref={spin} rotation={[0.05, 0.7, 0]}>
      <group ref={body} scale={frame?.scale ?? 1} position={frame?.position ?? [0, 0, 0]}>
        {children}
      </group>
      {frame ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, frame.base + 0.015, 0]}
          scale={frame.footprint * 1.7}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={getShadowTexture()}
            transparent
            opacity={0.4}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  )
}

function Turning({
  children,
  speed,
  live,
}: {
  children: React.ReactNode
  speed: number
  live: boolean
}) {
  return (
    <div className="tile__stage" aria-hidden="true">
      {live ? (
        <Stage label="" z={4.6} fov={34} fallback={<WovenSwatch />}>
          <Studio />
          <Lights intensity={1.05} />
          <TurningRig speed={speed}>{children}</TurningRig>
        </Stage>
      ) : (
        <WovenSwatch />
      )}
    </div>
  )
}

/** What a tile shows when it has no canvas: a woven swatch in the tile's own
 *  colour, so the row still reads as material rather than as empty boxes. */
function WovenSwatch() {
  return <span className="tile__static" aria-hidden="true" />
}

/* -------------------------------------------------------------------------- */
/* The section                                                                 */
/* -------------------------------------------------------------------------- */

export function ProductExplorer() {
  const strip = React.useRef<HTMLUListElement>(null)
  const live = useLiveTiles()

  const nudge = (direction: 1 | -1) => {
    strip.current?.scrollBy({ left: direction * 280, behavior: 'smooth' })
  }

  return (
    <section className="sourcing" id="products">
      <div className="shell">
        <div className="sourcing__head">
          <div>
            <p className="eyebrow">Product areas</p>
            <h2 className="sourcing__title">
              What are you looking to <em className="display-italic">source?</em>
            </h2>
          </div>
          <div className="sourcing__tools">
            <p className="sourcing__hint">Choose a category to start an enquiry.</p>
            <div className="sourcing__arrows">
              <button type="button" aria-label="Scroll categories left" onClick={() => nudge(-1)}>←</button>
              <button type="button" aria-label="Scroll categories right" onClick={() => nudge(1)}>→</button>
            </div>
          </div>
        </div>

        <ul className="tiles" ref={strip}>
          {TILES.map((tile, index) => {
            const object = CATEGORY_OBJECTS[tile.motif]
            return (
              <li key={tile.id} className="tile" style={{ ['--i' as string]: index }}>
                <Link to={hrefFor(tile)} className="tile__link" aria-label={`${tile.label} — ${tile.note}`}>
                  <Turning speed={object.speed} live={live}>
                    {object.model}
                  </Turning>
                  <span className="tile__index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="tile__label">{tile.label}</span>
                  <span className="tile__note">{tile.note}</span>
                  <span className="tile__go" aria-hidden="true"><Arrow /></span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="sourcing__ribbon" aria-hidden="true">
        <div className="sourcing__track">
          {[0, 1].map((copy) => (
            <div className="sourcing__group" key={copy}>
              {RIBBON.map((word) => (
                <span key={`${copy}-${word}`} className="sourcing__word">
                  {word}
                  <span className="sourcing__dot" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
