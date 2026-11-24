import React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { makeCloth } from './geometry'
import { makeStudioEnvironment, makeWeaveBump, makeWeaveTexture } from './textures'
import { createDrag } from './drag'
import { useSceneDrag } from './useSceneDrag'
import { useSceneSession } from './SceneSession'

/* ==========================================================================
   Shared resources
   ========================================================================== */

/** Thread colours for the cloth. The textile hero is indigo. */
const PALETTES = {
  indigo: { warp: '#35456f', weft: '#26314f', sheen: '#7285b8' },
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
  yawLimit?: number
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
  yawLimit,
}: DraggableProps) {
  const group = React.useRef<THREE.Group>(null)
  const drag = React.useMemo(() => createDrag(tilt), [tilt])
  const engaged = React.useRef(false)
  const phase = React.useRef(0)
  /* Continuous rotation lives apart from the drag target, so a visitor's angle
     becomes the new centre of rotation and nothing snaps back on release. */
  const turn = React.useRef(0)
  const scene = useSceneSession()

  const idleSway = (t: number) => Math.sin((t * Math.PI * 2) / 14) * drift

  const bind = useSceneDrag(drag, group, {
    tilt,
    pitchScale: squash,
    resetPhase: () => {
      phase.current = 0
    },
    sync: () => {
      const g = group.current
      if (!g) return
      drag.target.y = drag.current.y = g.rotation.y - idleSway(phase.current) - turn.current
      drag.target.x = drag.current.x = g.rotation.x / squash
    },
  })

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

    const animating = !scene?.still && !drag.dragging
    if (animating) phase.current += d
    if (animating && spin) turn.current += spin * d
    const t = phase.current

    if (yawLimit) drag.target.y = THREE.MathUtils.clamp(drag.target.y, -yawLimit, yawLimit)
    const ty = drag.target.y + turn.current + idleSway(t)
    const tx = drag.target.x

    drag.current.y = THREE.MathUtils.lerp(drag.current.y, ty, 1 - Math.exp(-6.2 * d))
    drag.current.x = THREE.MathUtils.lerp(drag.current.x, tx, 1 - Math.exp(-7.4 * d))

    g.rotation.y = drag.current.y
    g.rotation.x = drag.current.x * squash
    g.rotation.z = Math.sin(t * 0.22) * roll + drag.current.x * -0.18
    g.position.y = Math.sin(t * 0.55) * float

    if (!engaged.current && drag.dragging) {
      engaged.current = true
      onEngage?.()
    }

    if (drag.dragging) drag.idle = 0
    if (scene?.still && (Math.abs(drag.current.y - ty) > 0.001 || Math.abs(drag.current.x - tx) > 0.001)) state.invalidate()
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
