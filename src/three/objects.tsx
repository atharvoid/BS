import React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import {
  makeBobbinGeometry,
  makeCloth,
  makeFerruleGeometry,
  makeRingGeometry,
  makeShuttleGeometry,
  makeYarnGeometry,
} from './geometry'
import {
  makeRollEndTexture,
  makeShadowTexture,
  makeStudioEnvironment,
  makeTimberTexture,
  makeWeaveBump,
  makeWeaveTexture,
  makeWindingBump,
  makeWindingTexture,
} from './textures'
import { createDrag } from './drag'
import { useSceneDrag } from './useSceneDrag'
import { useSceneSession } from './SceneSession'

/* ==========================================================================
   Shared resources
   ========================================================================== */

export const PALETTES = {
  cotton: { warp: '#d5c2a0', weft: '#bda781', sheen: '#fbf3e0' },
  indigo: { warp: '#35456f', weft: '#26314f', sheen: '#7285b8' },
  madder: { warp: '#943f2e', weft: '#78322a', sheen: '#c07a5e' },
  saffron: { warp: '#c08a3a', weft: '#a06f23', sheen: '#ecc681' },
  verdigris: { warp: '#4c7b68', weft: '#3a6353', sheen: '#88b7a2' },
} as const

export type PaletteKey = keyof typeof PALETTES

type Textile = { map: THREE.Texture; bump: THREE.Texture }

const textileCache = new Map<string, Textile>()

export function getTextile(key: PaletteKey, threads = 14): Textile {
  const id = `${key}-${threads}`
  const hit = textileCache.get(id)
  if (hit) return hit
  const p = PALETTES[key]
  const made = {
    map: makeWeaveTexture({ warp: p.warp, weft: p.weft, sheen: p.sheen, threads, repeat: 1 }),
    bump: makeWeaveBump({ threads, repeat: 1 }),
  }
  textileCache.set(id, made)
  return made
}

let shadowTex: THREE.Texture | null = null
export function getShadowTexture() {
  if (!shadowTex) shadowTex = makeShadowTexture()
  return shadowTex
}

let studioEnv: THREE.Texture | null = null
function getStudioEnv() {
  if (!studioEnv) studioEnv = makeStudioEnvironment()
  return studioEnv
}

/** Reflections for the brass — generated locally, so no HDR download. */
export function Studio() {
  const { scene } = useThree()
  React.useEffect(() => {
    const tex = getStudioEnv()
    scene.environment = tex
    return () => {
      scene.environment = null
    }
  }, [scene])
  return null
}

export function Lights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.55 * intensity} color="#f4e7d2" />
      <directionalLight position={[3.4, 5, 4.2]} intensity={1.9 * intensity} color="#fff1d8" />
      <directionalLight position={[-4.2, 1.4, -2.4]} intensity={0.85 * intensity} color="#8fa5cc" />
      <pointLight position={[0, -2.6, 2.4]} intensity={1.5 * intensity} color="#c9784a" />
    </>
  )
}

export function Ground({ y = -1.55, scale = 3.4, opacity = 0.5 }: { y?: number; scale?: number; opacity?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={getShadowTexture()}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ==========================================================================
   Drag wrapper: rotation lives on the object, never on the camera.
   ========================================================================== */

type DraggableProps = {
  children: React.ReactNode
  tilt?: number
  drift?: number
  spin?: number
  float?: number
  squash?: number
  /** Idle roll amplitude, radians. Flat objects want almost none. */
  roll?: number
  onEngage?: () => void
}

export function Draggable({
  children,
  tilt = 0.42,
  drift = 0.18,
  spin = 0,
  float = 0.035,
  squash = 1,
  roll = 0.035,
  onEngage,
}: DraggableProps) {
  const group = React.useRef<THREE.Group>(null)
  const drag = React.useMemo(() => createDrag(tilt), [tilt])
  const engaged = React.useRef(false)
  const phase = React.useRef(0)
  const scene = useSceneSession()
  const bind = useSceneDrag(drag, group, { tilt, pitchScale: squash, resetPhase: () => { phase.current = 0 } })

  React.useLayoutEffect(() => {
    const object = group.current
    if (!object) return
    object.updateWorldMatrix(true, true)
    const bounds = new THREE.Box3().setFromObject(object)
    const sphere = bounds.getBoundingSphere(new THREE.Sphere())
    const scale = object.getWorldScale(new THREE.Vector3())
    object.worldToLocal(sphere.center)
    sphere.radius /= Math.max(scale.x, scale.y, scale.z)
    const inverse = new THREE.Matrix4()
    const ray = new THREE.Ray()
    const point = new THREE.Vector3()
    object.raycast = (caster, hits) => {
      for (let parent: THREE.Object3D | null = object; parent; parent = parent.parent) if (!parent.visible) return false
      ray.copy(caster.ray).applyMatrix4(inverse.copy(object.matrixWorld).invert())
      if (ray.intersectSphere(sphere, point)) {
        point.applyMatrix4(object.matrixWorld)
        const distance = caster.ray.origin.distanceTo(point)
        if (distance >= caster.near && distance <= caster.far) hits.push({ distance, point: point.clone(), object })
      }
      return false
    }
  }, [])

  useFrame((state, delta) => {
    const d = Math.min(delta, 1 / 30)
    const g = group.current
    if (!g) return

    if (!drag.dragging) {
      drag.target.y += drag.velocity.y * d
      drag.target.x = THREE.MathUtils.clamp(drag.target.x + drag.velocity.x * d, -tilt, tilt)
      const decay = Math.exp(-3.1 * d)
      drag.velocity.y *= decay
      drag.velocity.x *= decay
      drag.idle += d
    }

    if (!scene?.paused && !scene?.reduced && !drag.dragging) phase.current += d
    const t = phase.current
    // Idle motion only until the visitor takes over, so their angle is respected.
    const idleY = Math.sin(t * Math.PI * 2 / 14) * drift + spin * t
    const ty = drag.target.y + idleY

    drag.current.y = THREE.MathUtils.lerp(drag.current.y, ty, 1 - Math.exp(-6.2 * d))
    drag.current.x = THREE.MathUtils.lerp(drag.current.x, drag.target.x, 1 - Math.exp(-7.4 * d))

    g.rotation.y = drag.current.y
    g.rotation.x = drag.current.x * squash
    g.rotation.z = Math.sin(t * 0.22) * roll + drag.current.x * -0.18
    g.position.y = Math.sin(t * 0.55) * float

    if (!engaged.current && drag.dragging) {
      engaged.current = true
      onEngage?.()
    }

    if (drag.dragging) drag.idle = 0
    if ((scene?.paused || scene?.reduced) && (Math.abs(drag.current.y - ty) > 0.001 || Math.abs(drag.current.x - drag.target.x) > 0.001)) state.invalidate()
  })

  // R3F group gets the pointer handlers directly: dragging anywhere on the
  // object turns it, while a vertical swipe still scrolls the page thanks to
  // touch-action: pan-y on the canvas.
  return (
    <group
      ref={group}
      {...bind}
    >
      {children}
    </group>
  )
}

/* ==========================================================================
   Cloth panel — the hero's moving material
   ========================================================================== */

type ClothProps = {
  palette: PaletteKey
  width?: number
  height?: number
  folds?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  seed?: number
  threads?: number
  opacity?: number
}

export function ClothPanel({
  palette,
  width = 2,
  height = 2.6,
  folds = 3.1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  seed = 1.4,
  threads = 14,
  opacity = 1,
}: ClothProps) {
  const geo = React.useMemo(
    () => makeCloth({ width, height, folds, seed, foldDepth: 0.088, sway: 0.075, curl: 0.2 }),
    [width, height, folds, seed],
  )
  const tex = React.useMemo(() => getTextile(palette, threads), [palette, threads])

  React.useEffect(() => () => geo.dispose(), [geo])

  return (
    <mesh geometry={geo} position={position} rotation={rotation} castShadow={false}>
      <meshStandardMaterial
        map={tex.map}
        bumpMap={tex.bump}
        bumpScale={2.4}
        roughness={0.86}
        metalness={0.02}
        side={THREE.DoubleSide}
        transparent={opacity < 1}
        opacity={opacity}
        envMapIntensity={0.35}
      />
    </mesh>
  )
}

/* ==========================================================================
   Object 01 — the bolt of cloth
   ========================================================================== */

export function BoltObject({ palette = 'cotton' as PaletteKey, scale = 1 }) {
  const R = 0.44
  const L = 2.1

  const end = React.useMemo(() => makeRollEndTexture(), [])
  const tex = React.useMemo(() => getTextile(palette, 16), [palette])

  // Cloned so the weave can be scaled to the roll without touching the shared copy.
  const rolled = React.useMemo(() => {
    const map = tex.map.clone()
    const bump = tex.bump.clone()
    map.repeat.set(2.6, 1.3)
    bump.repeat.set(2.6, 1.3)
    map.needsUpdate = true
    bump.needsUpdate = true
    return { map, bump }
  }, [tex])

  const tail = React.useMemo(
    () =>
      makeCloth({
        width: 1.75,
        height: 1.15,
        folds: 1.1,
        foldDepth: 0.028,
        sway: 0.02,
        curl: 0.035,
        taper: 0.04,
        irregularity: 0.5,
        seed: 3.2,
        segU: 40,
        segV: 40,
      }),
    [],
  )

  React.useEffect(
    () => () => {
      end.dispose()
      rolled.map.dispose()
      rolled.bump.dispose()
      tail.dispose()
    },
    [end, rolled, tail],
  )

  return (
    <group scale={scale}>
      {/* the roll itself, lying along X */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, R, 0]}>
        <cylinderGeometry args={[R, R, L, 72, 1, true]} />
        <meshStandardMaterial
          map={rolled.map}
          bumpMap={rolled.bump}
          bumpScale={3}
          roughness={0.9}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* the cut ends, showing the spiral of cloth */}
      {[L / 2, -L / 2].map((x) => (
        <mesh
          key={x}
          position={[x, R, 0]}
          rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
        >
          <circleGeometry args={[R, 72]} />
          <meshStandardMaterial
            map={end}
            roughness={0.76}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* the loose tail unrolling onto the floor */}
      <mesh geometry={tail} position={[0.02, 0.015, 0.56]} rotation={[-1.5, 0.04, 0.06]}>
        <meshStandardMaterial
          map={rolled.map}
          bumpMap={rolled.bump}
          bumpScale={2.2}
          roughness={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>

    </group>
  )
}

/* ==========================================================================
   Object 02 — the weaving shuttle
   ========================================================================== */

export function ShuttleObject({ scale = 1 }) {
  const hull = React.useMemo(() => makeShuttleGeometry(2.35, 0.5, 0.44), [])
  const timber = React.useMemo(() => makeTimberTexture(512, 1), [])
  const ferrule = React.useMemo(() => makeFerruleGeometry(0.2, 0.24), [])
  const weft = React.useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.3, 0.22, 0.02),
      new THREE.Vector3(0.62, 0.42, 0.16),
      new THREE.Vector3(1.02, 0.34, 0.02),
      new THREE.Vector3(1.34, 0.62, -0.12),
    ])
    return new THREE.TubeGeometry(curve, 40, 0.0075, 5, false)
  }, [])

  React.useEffect(
    () => () => {
      hull.dispose()
      ferrule.dispose()
      weft.dispose()
    },
    [hull, ferrule, weft],
  )

  return (
    <group scale={scale} rotation={[0.06, 0, 0]}>
      <mesh geometry={hull}>
        <meshStandardMaterial
          map={timber}
          roughness={0.4}
          metalness={0.05}
          envMapIntensity={0.8}
        />
      </mesh>
      {/* the eye / slot the weft runs through */}
      <mesh position={[0.4, 0.2, 0]} rotation={[0, 0, 0.03]}>
        <boxGeometry args={[0.46, 0.05, 0.1]} />
        <meshStandardMaterial color="#160d05" roughness={0.95} metalness={0} />
      </mesh>
      {/* weft thread lifting away from the eye */}
      <mesh geometry={weft}>
        <meshStandardMaterial color="#b9503a" roughness={0.88} />
      </mesh>
      {/* brass ferrules capping both tips */}
      <mesh geometry={ferrule} position={[1.05, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <meshStandardMaterial color="#c08a4a" roughness={0.26} metalness={1} envMapIntensity={1.5} />
      </mesh>
      <mesh geometry={ferrule} position={[-1.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#c08a4a" roughness={0.26} metalness={1} envMapIntensity={1.5} />
      </mesh>
    </group>
  )
}

/* ==========================================================================
   Object 03 — the yarn bobbin
   ========================================================================== */

export function BobbinObject({ scale = 1 }) {
  const bobbin = React.useMemo(() => makeBobbinGeometry(1.55, 0.56, 0.36), [])
  const yarn = React.useMemo(() => makeYarnGeometry(1.55, 0.36), [])
  const wind = React.useMemo(() => makeWindingTexture(512, 1, ['#7d4a3f', '#96604d', '#6b3f36']), [])
  const windBump = React.useMemo(() => makeWindingBump(512, 1), [])

  return (
    <group scale={scale}>
      <mesh geometry={bobbin}>
        <meshStandardMaterial color="#8a6a44" roughness={0.5} metalness={0.08} envMapIntensity={0.6} />
      </mesh>
      <mesh geometry={yarn}>
        <meshStandardMaterial
          map={wind}
          bumpMap={windBump}
          bumpScale={3}
          roughness={0.92}
          metalness={0}
        />
      </mesh>
      {/* a loose thread lifting off the bobbin */}
      <mesh position={[0.36, 0.52, 0.08]} rotation={[0.1, 0.2, -0.5]}>
        <torusGeometry args={[0.34, 0.007, 6, 64, Math.PI * 1.1]} />
        <meshStandardMaterial color="#9c6a58" roughness={0.85} />
      </mesh>
    </group>
  )
}

/* ==========================================================================
   Object 04 — brass weft ring with a warp stretched across it
   ========================================================================== */

/* ==========================================================================
   Object 04 — the brass reed: the comb that spaces warp threads on a loom
   ========================================================================== */

export function ReedObject({ scale = 1, wires = 30 }) {
  const slats = React.useMemo(
    () => Array.from({ length: wires }, (_, i) => {
      const t = i / (wires - 1)
      return { x: (t - 0.5) * 2.02, h: 1.12 + Math.sin(t * Math.PI) * 0.1, lean: (t - 0.5) * 0.012 }
    }),
    [wires],
  )

  return (
    <group scale={scale} rotation={[0.05, 0, 0]}>
      {/* dark brass rails top and bottom */}
      {[0.62, -0.62].map((y, i) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 2.34, 20]} />
          <meshStandardMaterial
            color={i ? '#8a6634' : '#9c7539'}
            roughness={0.42}
            metalness={1}
            envMapIntensity={1.2}
          />
        </mesh>
      ))}
      {/* end posts */}
      {[-1.17, 1.17].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.055, 1.34, 0.075]} />
          <meshStandardMaterial color="#7c5a2d" roughness={0.46} metalness={1} envMapIntensity={1.1} />
        </mesh>
      ))}
      {/* the fine reed wires — thin and bright, so the comb reads as metal */}
      {slats.map((s, i) => (
        <mesh key={i} position={[s.x, 0, 0]} rotation={[0, 0, s.lean]}>
          <cylinderGeometry args={[0.0065, 0.0065, s.h, 5]} />
          <meshStandardMaterial
            color={i % 5 === 0 ? '#eccb92' : '#d7af6c'}
            roughness={0.24}
            metalness={1}
            envMapIntensity={1.8}
          />
        </mesh>
      ))}
      {/* a warp thread still threaded through the reed */}
      <mesh position={[0, 0.06, 0.03]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0032, 0.0032, 2.0, 5]} />
        <meshStandardMaterial color="#efe3c9" roughness={0.95} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

export function RingObject({ scale = 1 }) {
  const ring = React.useMemo(() => makeRingGeometry(0.78, 0.16), [])

  const threads = React.useMemo(() => {
    const arr: { z: number; r: number; tilt: number }[] = []
    for (let i = 0; i < 9; i++) {
      arr.push({
        z: (i / 8 - 0.5) * 0.94,
        r: 0.78 * Math.cos(((i / 8 - 0.5) * 0.94) / 0.78),
        tilt: (i / 8 - 0.5) * 0.34,
      })
    }
    return arr
  }, [])

  return (
    <group scale={scale} rotation={[-0.22, 0.1, 0]}>
      <mesh geometry={ring}>
        <meshStandardMaterial
          color="#bd8b47"
          roughness={0.26}
          metalness={1}
          envMapIntensity={1.6}
        />
      </mesh>
      {threads.map((t, i) => (
        <mesh key={i} position={[0, 0, t.z]} rotation={[0, 0, t.tilt]}>
          <cylinderGeometry args={[0.0065, 0.0065, t.r * 2.02, 6]} />
          <meshStandardMaterial color={i % 2 ? '#e8dcc4' : '#d3c1a0'} roughness={0.95} />
        </mesh>
      ))}
      {/* a second ring set back for depth */}
      <mesh geometry={ring} position={[0.18, -0.1, -0.55]} scale={0.62} rotation={[0.2, 0.3, 0]}>
        <meshStandardMaterial color="#9c7136" roughness={0.42} metalness={1} envMapIntensity={1.1} />
      </mesh>
    </group>
  )
}
