import React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Draggable, Lights, Studio, getTextile } from './objects'
import { makeWindingTexture } from './textures'
import { makeCloth } from './geometry'
import { reducedMotion } from './motion'
import {
  makeClothMaterial,
  makeStrandMaterial,
  makeStrandSheet,
  makeWeaveUniforms,
} from './weave'

/* ==========================================================================
   Hero: yarn becoming cloth.

   The sequence runs on its own the moment the stage is on screen — nothing is
   required of the visitor. Scrolling inside the hero nudges it forward, so the
   motion is tied to the page as well as to time.

      0.0  a yarn package, wound, strands loose
      0.3  the strands unwind and level into a warp sheet
      1.1  the shuttle crosses; the cloth fills upward from the hem
      4.4  the finished cloth hangs and breathes; drag to turn it
      9.6  the loop resets and begins again
   ========================================================================== */

const CYCLE = 9.6

/** Hero scroll nudge, updated by a passive listener and read once per frame. */
const scrollNudge = { value: 0 }
let scrollBound = false

function bindScroll() {
  if (scrollBound || typeof window === 'undefined') return
  scrollBound = true
  let raf = 0
  const read = () => {
    raf = 0
    scrollNudge.value = Math.min(1, window.scrollY / Math.max(1, window.innerHeight))
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!raf) raf = requestAnimationFrame(read)
    },
    { passive: true },
  )
}

type Phase = { strand: number; weave: number; heat: number }

function timeline(time: number, scroll: number): Phase {
  const t = time + scroll * 0.9
  return {
    strand: THREE.MathUtils.smoothstep(t, 0.3, 1.9),
    weave: THREE.MathUtils.smoothstep(t, 1.15, 4.4),
    heat: Math.max(0, Math.min(1, Math.min((t - 0.9) / 0.5, (4.9 - t) / 0.9))),
  }
}

function Frame({ children }: { children: React.ReactNode }) {
  const viewport = useThree((s) => s.viewport)
  // Framed against the canvas it is actually drawn into, so a stacked mobile
  // stage (nearly square) centres the composition instead of pushing it aside.
  const narrow = viewport.aspect < 1.2
  const scale = narrow ? 0.86 : Math.min(1.06, 0.58 + viewport.aspect * 0.2)
  const x = narrow ? 0 : Math.min(1.85, viewport.width * 0.19)
  const y = narrow ? 0.06 : 0

  return (
    <group scale={scale} position={[x, y, 0]}>
      {children}
    </group>
  )
}

/**
 * The yarn cone — the shape yarn actually ships in. Same silhouette the shader
 * winds its loose strands around, so the loose and wound states agree.
 */
function YarnCone({ uniforms }: { uniforms: ReturnType<typeof makeWeaveUniforms> }) {
  const geo = React.useMemo(() => {
    const pts: THREE.Vector2[] = []
    const steps = 24
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      // slightly bowed profile, tapering to a narrow nose
      const r = (0.295 * (1 - t) + 0.075 * t) * (1 + Math.sin(t * Math.PI) * 0.035)
      pts.push(new THREE.Vector2(r, t * 0.62))
    }
    const g = new THREE.LatheGeometry(pts, 48)
    g.computeVertexNormals()
    return g
  }, [])

  const base = React.useMemo(() => new THREE.CylinderGeometry(0.3, 0.31, 0.05, 40), [])
  const wind = React.useMemo(
    () => makeWindingTexture(512, 1, ['#d7c1a1', '#e8d6bb', '#c6ae8c']),
    [],
  )
  const g = React.useRef<THREE.Group>(null)
  const yarn = React.useRef<THREE.MeshStandardMaterial>(null)
  const baseMat = React.useRef<THREE.MeshStandardMaterial>(null)

  React.useEffect(
    () => () => {
      geo.dispose()
      base.dispose()
    },
    [geo, base],
  )

  useFrame(() => {
    // The cone stays while it feeds the warp, thins as the yarn runs out, then
    // sinks away once the cloth is complete — the cloth is the subject.
    const w = uniforms.uWeave.value
    const fade = 1 - THREE.MathUtils.smoothstep(w, 0.42, 0.86)
    if (g.current) {
      const shrink = 1 - uniforms.uStrand.value * 0.2
      g.current.scale.set(shrink, 1 - uniforms.uWeave.value * 0.16, shrink)
      g.current.position.y = -1.01 - THREE.MathUtils.smoothstep(w, 0.4, 0.95) * 0.5
    }
    if (yarn.current) yarn.current.opacity = fade
    if (baseMat.current) baseMat.current.opacity = fade
  })

  return (
    <group ref={g} position={[0, -1.01, 0]}>
      <mesh geometry={geo}>
        <meshStandardMaterial
          ref={yarn}
          map={wind}
          bumpMap={wind}
          bumpScale={2}
          color="#e6d5ba"
          roughness={0.94}
          metalness={0}
          transparent
          opacity={1}
        />
      </mesh>
      {/* timber base the cone stands on */}
      <mesh geometry={base} position={[0, 0.024, 0]}>
        <meshStandardMaterial ref={baseMat} color="#6d4c30" roughness={0.6} metalness={0.05} transparent opacity={1} />
      </mesh>
    </group>
  )
}

/** The cloth, revealed upward from its hem. */
function WovenPanel({ uniforms }: { uniforms: ReturnType<typeof makeWeaveUniforms> }) {
  const geo = React.useMemo(
    () =>
      makeCloth({
        width: 2.02,
        height: 2.48,
        folds: 2.5,
        seed: 2.4,
        foldDepth: 0.05,
        sway: 0.032,
        curl: 0.09,
      }),
    [],
  )
  const tex = React.useMemo(() => getTextile('indigo', 18), [])
  const mat = React.useMemo(() => makeClothMaterial(uniforms, tex, 2.48), [uniforms, tex])
  React.useEffect(() => () => geo.dispose(), [geo])

  return <mesh geometry={geo} material={mat} position={[0, 0.03, 0.08]} rotation={[0, -0.06, 0]} />
}

/** A shuttle crossing the warp, laying one band of weft per pass. */
function PassingShuttle({ uniforms }: { uniforms: ReturnType<typeof makeWeaveUniforms> }) {
  const g = React.useRef<THREE.Group>(null)
  const hull = React.useMemo(() => {
    const geo = new THREE.CapsuleGeometry(0.085, 0.46, 5, 12)
    geo.rotateZ(Math.PI / 2)
    geo.scale(1, 0.6, 0.5)
    return geo
  }, [])
  const wood = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6f4a2b', roughness: 0.44, metalness: 0.05 }),
    [],
  )
  const brass = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c08a4a', roughness: 0.3, metalness: 1, envMapIntensity: 1.4 }),
    [],
  )
  React.useEffect(
    () => () => {
      hull.dispose()
      wood.dispose()
      brass.dispose()
    },
    [hull, wood, brass],
  )

  useFrame(() => {
    const node = g.current
    if (!node) return
    const w = uniforms.uWeave.value
    const live = w > 0.015 && w < 0.985
    node.visible = live
    if (!live) return
    // one traverse per band of cloth, so passes stay legible
    const bands = Math.max(1, Math.round(w * 9))
    const sweep = bands % 2 === 0 ? (w % 1) * 4 : 1 - (w % 1) * 4
    const s = THREE.MathUtils.clamp(sweep, 0, 1)
    // rides the fill line, just in front of the cloth
    node.position.set(-0.86 + s * 1.72, -1.02 + w * 2.32, 0.18)
    node.rotation.z = (s - 0.5) * 0.08
  })

  return (
    <group ref={g} visible={false}>
      <mesh geometry={hull} material={wood} />
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} material={brass} position={[x, 0, 0]}>
          <sphereGeometry args={[0.035, 12, 10]} />
        </mesh>
      ))}
    </group>
  )
}

/** Loose yarn unwinding into a warp sheet — one draw call, animated in GLSL. */
function Strands({ uniforms }: { uniforms: ReturnType<typeof makeWeaveUniforms> }) {
  const geo = React.useMemo(() => makeStrandSheet(56, 5, 20), [])
  const mat = React.useMemo(() => makeStrandMaterial(uniforms), [uniforms])
  React.useEffect(() => () => geo.dispose(), [geo])
  return <mesh geometry={geo} material={mat} position={[0, 0.06, -0.03]} />
}

export function HeroScene({ onEngage, replaySignal = 0 }: { onEngage?: () => void; replaySignal?: number }) {
  const uniforms = React.useMemo(() => makeWeaveUniforms(), [])
  const still = React.useMemo(() => reducedMotion(), [])
  const t = React.useRef(still ? 6 : 0)

  React.useEffect(() => bindScroll(), [])

  // A replay restarts the sequence from the yarn cone.
  React.useEffect(() => {
    t.current = still ? 6 : 0
  }, [replaySignal, still])

  useFrame((_, delta) => {
    const d = Math.min(delta, 1 / 30)
    if (!still) {
      t.current += d
      if (t.current > CYCLE) t.current = 0
    }

    uniforms.uTime.value = t.current
    const p = timeline(t.current, scrollNudge.value)
    uniforms.uStrand.value = p.strand
    uniforms.uWeave.value = p.weave
    uniforms.uHeat.value = p.heat
  })

  return (
    <>
      <Studio />
      <Lights intensity={1.02} />
      <Frame>
        <Draggable
          drift={still ? 0 : 0.17}
          tilt={0.32}
          float={still ? 0 : 0.024}
          onEngage={onEngage}
        >
          <group rotation={[0.02, -0.12, 0]}>
            <Strands uniforms={uniforms} />
            <WovenPanel uniforms={uniforms} />
            <YarnCone uniforms={uniforms} />
            <PassingShuttle uniforms={uniforms} />
          </group>
        </Draggable>

        {/* the brass rail the cloth is woven onto */}
        <group position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 2.46, 12]} />
            <meshStandardMaterial color="#bb8a48" roughness={0.3} metalness={1} envMapIntensity={1.5} />
          </mesh>
        </group>
        {[-1.22, 1.22].map((x) => (
          <mesh key={x} position={[x, 1.3, 0]}>
            <sphereGeometry args={[0.036, 16, 12]} />
            <meshStandardMaterial color="#d6a55f" roughness={0.22} metalness={1} />
          </mesh>
        ))}
      </Frame>
    </>
  )
}
