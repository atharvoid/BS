import React from 'react'
import { Link } from 'react-router-dom'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CATEGORIES, type CategoryId } from '../content'
import { Stage } from '../three/Stage'
import { useSceneSession } from '../three/SceneSession'
import {
  BobbinObject,
  BoltObject,
  Ground,
  Lights,
  ReedObject,
  ShuttleObject,
  Studio,
  getTextile,
  type PaletteKey,
} from '../three/objects'
import { Arrow } from './Nav'

/* ==========================================================================
   What are you looking to source?

   One row of category tiles, each with a live object turning inside it, and a
   running marquee under the row that names every product area. It is the first
   thing after the hero, so it is kept to one screen: the tiles are the
   navigation, the marquee is the inventory of what the business covers.

   Each tile runs its own tiny canvas, and each of those is a real WebGL
   context, so they are mounted only while the row is on screen and each one
   draws a low-poly, unlit object. Seven contexts is the practical ceiling in
   most browsers; this row is well under it, and the row is dormant the moment
   it scrolls away.
   ========================================================================== */

type Motif = 'bolt' | 'shuttle' | 'bobbin' | 'reed' | 'cloth' | 'ring' | 'basket'

type Tile = {
  id: CategoryId
  label: string
  note: string
  motif: Motif
  palette: PaletteKey
}

/** The marquee is the full product list, in the same order as the tiles. */
const TILES: Tile[] = [
  { id: 'textiles', label: 'Textiles & fabrics', note: 'Woven, printed, dyed', motif: 'bolt', palette: 'indigo' },
  { id: 'handicrafts', label: 'Handicrafts & home decor', note: 'Made by hand', motif: 'basket', palette: 'saffron' },
  { id: 'agriculture-food', label: 'Agriculture & food', note: 'Crop and ingredient', motif: 'ring', palette: 'cotton' },
  { id: 'industrial-materials', label: 'Industrial materials', note: 'Inputs and components', motif: 'shuttle', palette: 'verdigris' },
  { id: 'organic-sustainable', label: 'Organic & sustainable', note: 'Evidence per product', motif: 'bobbin', palette: 'madder' },
  { id: 'general', label: 'Something else', note: 'Describe the need', motif: 'cloth', palette: 'cotton' },
]

const RIBBON = CATEGORIES.map((category) => category.label)

/* -------------------------------------------------------------------------- */
/* The objects                                                                 */
/* -------------------------------------------------------------------------- */

/** A coil of cord: the plainest way to draw "made by hand" without a photo. */
function BasketObject({ palette }: { palette: PaletteKey }) {
  const tex = React.useMemo(() => getTextile(palette, 22), [palette])
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.14, i * 0.5, 0]} position={[0, (i - 2) * 0.17, 0]}>
          <torusGeometry args={[0.62 - i * 0.06, 0.075, 8, 40]} />
          <meshStandardMaterial map={tex.map} bumpMap={tex.bump} bumpScale={1.2} roughness={0.9} metalness={0.02} />
        </mesh>
      ))}
    </group>
  )
}

/** A seed ring: a torus of matte grain, for the agriculture tile. */
function RingObject({ palette }: { palette: PaletteKey }) {
  const tex = React.useMemo(() => getTextile(palette, 18), [palette])
  return (
    <group rotation={[0.5, 0, 0.2]}>
      <mesh>
        <torusGeometry args={[0.68, 0.26, 18, 46]} />
        <meshStandardMaterial map={tex.map} bumpMap={tex.bump} bumpScale={1.8} roughness={0.94} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[0.24, 1]} />
        <meshStandardMaterial color="#8a7440" roughness={0.95} />
      </mesh>
    </group>
  )
}

function MotifObject({ motif, palette }: { motif: Motif; palette: PaletteKey }) {
  switch (motif) {
    case 'bolt':
      return <BoltObject palette={palette} />
    case 'bobbin':
      return <BobbinObject />
    case 'reed':
      return <ReedObject wires={22} />
    case 'basket':
      return <BasketObject palette={palette} />
    case 'ring':
      return <RingObject palette={palette} />
    case 'shuttle':
      return <ShuttleObject />
    case 'cloth':
    default:
      return <TextilePlate palette={palette} />
  }
}

/** A flat, softly folded swatch, for the catch-all tile. */
function TextilePlate({ palette }: { palette: PaletteKey }) {
  const tex = React.useMemo(() => getTextile(palette, 20), [palette])
  return (
    <mesh rotation={[0.42, -0.5, 0.1]}>
      <planeGeometry args={[1.5, 1.9, 24, 30]} />
      <meshStandardMaterial
        map={tex.map}
        bumpMap={tex.bump}
        bumpScale={2}
        roughness={0.88}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/* -------------------------------------------------------------------------- */
/* One turning tile                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Continuous rotation that never stops for anything.
 *
 * The visitor can drag a tile, and the drag adds to the angle rather than
 * replacing it, so the object keeps turning from wherever the hand left it.
 * There is no pause state and no control: motion is the default, and the only
 * things that interrupt it are the tab being hidden and the site deciding this
 * device needs a still frame.
 *
 * The rig itself lives inside the canvas, because that is where a frame loop
 * is available; the pointer handlers live on the plain wrapper outside it.
 */
function TurningRig({
  children,
  angle,
  speed,
}: {
  children: React.ReactNode
  angle: React.RefObject<{ yaw: number; pitch: number }>
  speed: number
}) {
  const group = React.useRef<THREE.Group>(null)
  const scene = useSceneSession()

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    const d = Math.min(delta, 1 / 30)
    const a = angle.current
    if (!a) return
    if (!scene?.still) a.yaw += d * speed
    /* Pitch always eases back to level, so a drag can tilt a tile but can
       never leave it side-on. */
    a.pitch = THREE.MathUtils.lerp(a.pitch, 0.14, 1 - Math.exp(-2.6 * d))
    g.rotation.y = a.yaw
    g.rotation.x = a.pitch
  })

  return (
    <group ref={group} scale={0.9}>
      {children}
    </group>
  )
}

function Turning({
  children,
  speed,
  tilt = 0.5,
}: {
  children: React.ReactNode
  speed: number
  tilt?: number
}) {
  const angle = React.useRef({ yaw: Math.random() * Math.PI * 2, pitch: 0.14 })
  const drag = React.useRef({ active: false, moved: 0, x: 0, y: 0, lastX: 0, lastY: 0 })

  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    drag.current.active = false
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  return (
    <div
      className="tile__stage"
      role="presentation"
      onPointerDown={(event) => {
        if (event.button !== 0) return
        drag.current = {
          active: true,
          moved: 0,
          x: angle.current.yaw,
          y: angle.current.pitch,
          lastX: event.clientX,
          lastY: event.clientY,
        }
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }}
      onPointerMove={(event) => {
        const state = drag.current
        if (!state.active) return
        const dx = event.clientX - state.lastX
        const dy = event.clientY - state.lastY
        state.moved += Math.abs(dx) + Math.abs(dy)
        angle.current.yaw = state.x + dx * 0.012
        angle.current.pitch = THREE.MathUtils.clamp(state.y + dy * 0.004, -tilt, tilt)
      }}
      /* Turning an object inside a link must not also open the link. */
      onClickCapture={(event) => {
        if (drag.current.moved > 6) {
          event.preventDefault()
          event.stopPropagation()
        }
        drag.current.moved = 0
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <Stage label="" z={4.6} fov={34} fallback={<span className="tile__static" aria-hidden="true" />}>
        <Studio />
        <Lights intensity={1.05} />
        <Ground y={-1.15} scale={3.4} opacity={0.34} />
        <TurningRig angle={angle} speed={speed}>{children}</TurningRig>
      </Stage>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* The section                                                                 */
/* -------------------------------------------------------------------------- */

export function ProductExplorer() {
  const strip = React.useRef<HTMLUListElement>(null)

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
          {TILES.map((tile, index) => (
            <li key={tile.id} className="tile" style={{ ['--i' as string]: index }}>
              <Link
                to={`/enquiry?category=${tile.id}`}
                className="tile__link"
                data-cursor="menu"
                aria-label={`Enquire about ${tile.label}`}
              >
                <Turning speed={tile.id === 'textiles' ? 0.5 : 0.34 + index * 0.04}>
                  <MotifObject motif={tile.motif} palette={tile.palette} />
                </Turning>
                <span className="tile__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="tile__label">{tile.label}</span>
                <span className="tile__note">{tile.note}</span>
                <span className="tile__go" aria-hidden="true"><Arrow /></span>
              </Link>
            </li>
          ))}
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
