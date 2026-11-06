import React from 'react'
import * as THREE from 'three'
import { getTextile, type PaletteKey } from './objects'
import { makeRollEndTexture } from './textures'
import {
  CRATE,
  ROLL,
  bollCalyx,
  bollLobes,
  copperTurns,
  crateBattens,
  makeClothTail,
  makeGrainHeap,
  makeSackBody,
  makeVaseBody,
} from './categoryGeometry'
import {
  makeBluePotteryTexture,
  makeCottonTexture,
  makeCopperRoughness,
  makeGrainBump,
  makeGrainTexture,
  makeJuteBump,
  makeJuteTexture,
  makePlankTexture,
  makeStencilTexture,
} from './categoryTextures'

/* ==========================================================================
   The six category objects.

   One real model per product area, built from real geometry and generated
   textures, lit by the same studio environment as the rest of the site. They
   belong to the same visual family as the globe and the textile scenes: warm
   metal, woven and glazed surfaces, a contact shadow underneath, no outlines
   and no flat colour fills.

   Nothing here is interactive. The objects turn on their own; the tile they sit
   in is a link, and the canvas is decoration inside that link.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Shared textures                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The row mounts and unmounts its canvases as it scrolls in and out of range
 * (see Stage's dormancy), so a texture built inside a component would be built
 * again every time the row came back — and a 512px canvas is not free. These
 * are cached by key instead: a handful of surfaces, drawn once, alive for the
 * session. Nothing disposes them, because more than one tile can hold the same
 * one.
 */
const texCache = new Map<string, unknown>()

function useSharedTexture<T>(key: string, make: () => T): T {
  return React.useMemo(() => {
    const hit = texCache.get(key)
    if (hit) return hit as T
    const made = make()
    texCache.set(key, made)
    return made
    // `key` identifies the surface; `make` is the fallback that creates it.
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
}

/* -------------------------------------------------------------------------- */
/* 1 · A roll of handloom cloth (textiles)                                    */
/* -------------------------------------------------------------------------- */

function TextileRoll() {
  const palette: PaletteKey = 'indigo'
  const { radius: R, length: L } = ROLL

  const end = useSharedTexture('roll-end', () => makeRollEndTexture(512))
  const tex = React.useMemo(() => getTextile(palette, 16), [palette])

  /* The weave is scaled to the roll's circumference, so the threads stay the
     size they would be on a real bolt rather than stretching into stripes. */
  const rolled = React.useMemo(() => {
    const map = tex.map.clone()
    const bump = tex.bump.clone()
    map.repeat.set(2.4, 1.15)
    bump.repeat.set(2.4, 1.15)
    map.needsUpdate = true
    bump.needsUpdate = true
    return { map, bump }
  }, [tex])

  const tail = React.useMemo(() => makeClothTail(), [])

  React.useEffect(
    () => () => {
      rolled.map.dispose()
      rolled.bump.dispose()
      tail.dispose()
    },
    [rolled, tail],
  )

  return (
    <group>
      {/* the bolt, lying across the tile */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.14, R, 0]}>
        <cylinderGeometry args={[R, R, L, 96, 1, true]} />
        <meshStandardMaterial
          map={rolled.map}
          bumpMap={rolled.bump}
          bumpScale={3.4}
          roughness={0.88}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* the cut ends, showing the spiral of cloth */}
      {[L / 2, -L / 2].map((x) => (
        <mesh key={x} position={[-0.14 + x, R, 0]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <circleGeometry args={[R, 72]} />
          <meshStandardMaterial map={end} roughness={0.74} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* the kraft band that holds a bolt closed */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.14, R, 0]}>
        <cylinderGeometry args={[R + 0.01, R + 0.01, 0.19, 96, 1, true]} />
        <meshStandardMaterial color="#c9b489" roughness={0.94} metalness={0} side={THREE.DoubleSide} />
      </mesh>

      {/* the tail, unrolling towards the front of the tile */}
      <mesh geometry={tail} position={[0.2, 0.02, 0.4]} rotation={[-1.38, 0.1, 0.04]}>
        <meshStandardMaterial
          map={rolled.map}
          bumpMap={rolled.bump}
          bumpScale={2.4}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/* 2 · Blue pottery vase (handicrafts & home decor)                           */
/* -------------------------------------------------------------------------- */

function PotteryVase() {
  const glaze = useSharedTexture('pottery', () => makeBluePotteryTexture(512))
  const body = React.useMemo(() => makeVaseBody(), [])

  React.useEffect(() => () => body.dispose(), [body])

  return (
    <group>
      <mesh geometry={body}>
        {/* Glazed earthenware: low roughness over a warm body, with the cobalt
            design carried in the colour map and the light glossing off it. */}
        <meshStandardMaterial map={glaze} roughness={0.24} metalness={0.04} envMapIntensity={1.15} />
      </mesh>
      {/* the inside of the mouth, so the opening reads as depth */}
      <mesh position={[0, 0.775, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.205, 48]} />
        <meshStandardMaterial color="#2b2a33" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/* 3 · Jute sack of grain (agriculture & food)                                */
/* -------------------------------------------------------------------------- */

function GrainSack() {
  const jute = useSharedTexture('jute', () => makeJuteTexture(512))
  const juteBump = useSharedTexture('jute-bump', () => makeJuteBump(512))
  const grain = useSharedTexture('grain', () => makeGrainTexture(512))
  const grainBump = useSharedTexture('grain-bump', () => makeGrainBump(512))

  const sack = React.useMemo(() => makeSackBody(), [])
  const heap = React.useMemo(() => makeGrainHeap(), [])

  React.useEffect(
    () => () => {
      sack.dispose()
      heap.dispose()
    },
    [sack, heap],
  )

  return (
    <group>
      <mesh geometry={sack}>
        <meshStandardMaterial
          map={jute}
          bumpMap={juteBump}
          bumpScale={4.2}
          roughness={0.95}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* the tie at the neck */}
      <mesh position={[0, 0.575, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.243, 0.027, 10, 48]} />
        <meshStandardMaterial color="#7c6236" roughness={0.92} />
      </mesh>
      {/* grain standing in the open mouth */}
      <mesh geometry={heap} position={[0, 0.585, 0]}>
        <meshStandardMaterial map={grain} bumpMap={grainBump} bumpScale={2.6} roughness={0.86} />
      </mesh>
      {/* a few grains that have fallen to the floor */}
      {[
        [0.42, -0.655, 0.2],
        [0.5, -0.66, -0.06],
        [0.34, -0.655, -0.34],
        [-0.44, -0.655, 0.16],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, i, Math.PI / 2]}>
          <capsuleGeometry args={[0.012, 0.036, 3, 6]} />
          <meshStandardMaterial color="#f0e5c8" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/* 4 · Copper wire coil (industrial materials)                                */
/* -------------------------------------------------------------------------- */

function CopperCoil() {
  const brushed = useSharedTexture('copper', () => makeCopperRoughness(512))
  const turns = React.useMemo(() => copperTurns(), [])

  return (
    <group rotation={[0.1, 0, 0.04]}>
      {turns.map((turn, i) => (
        <mesh key={i} position={[turn.x, turn.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[turn.r, 0.036, 12, 64]} />
          <meshStandardMaterial
            color="#b4703f"
            roughnessMap={brushed}
            roughness={0.34}
            metalness={1}
            envMapIntensity={1.6}
          />
        </mesh>
      ))}
      {/* the cut end of the wire, lifting off the top turn */}
      <mesh position={[0.3, 0.55, 0.13]} rotation={[0.9, 0.3, -0.5]}>
        <cylinderGeometry args={[0.036, 0.036, 0.4, 12]} />
        <meshStandardMaterial color="#b4703f" roughness={0.3} metalness={1} envMapIntensity={1.6} />
      </mesh>
      {/* brass collars strapping the coil */}
      {[0.3, -0.3].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.448, 0.02, 10, 64]} />
          <meshStandardMaterial color="#c08a4a" roughness={0.24} metalness={1} envMapIntensity={1.8} />
        </mesh>
      ))}
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/* 5 · Cotton boll (organic & sustainable)                                    */
/* -------------------------------------------------------------------------- */

function CottonBoll() {
  const lint = useSharedTexture('cotton', () => makeCottonTexture(512))
  const lobes = React.useMemo(() => bollLobes(), [])
  const calyx = React.useMemo(() => bollCalyx(), [])

  return (
    <group rotation={[0.12, 0, -0.08]}>
      {lobes.map((lobe, i) => (
        <mesh key={i} position={lobe.position} rotation={[0, 0, lobe.rotation]} scale={[0.3, 0.3, 0.26]}>
          <sphereGeometry args={[1, 28, 22]} />
          <meshStandardMaterial
            map={lint}
            bumpMap={lint}
            bumpScale={0.9}
            roughness={1}
            metalness={0}
            color="#fbf7ee"
          />
        </mesh>
      ))}

      {/* the calyx: five dried sepals under the fibre, with a short stem */}
      {calyx.map((sepal, i) => (
        <mesh
          key={`sepal-${i}`}
          position={sepal.position}
          rotation={[Math.PI / 2.1, 0, sepal.rotation]}
          scale={[0.16, 0.1, 0.02]}
        >
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color="#6b5a3a" roughness={0.94} />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.34]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.3, 10]} />
        <meshStandardMaterial color="#7a6440" roughness={0.95} />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/* 6 · Export crate (other sourcing requests)                                 */
/* -------------------------------------------------------------------------- */

function ExportCrate() {
  const planks = useSharedTexture('planks', () => makePlankTexture(512))
  const stencil = useSharedTexture('stencil', () => makeStencilTexture(512, 256))
  const { corners, rails } = React.useMemo(() => crateBattens(), [])

  /* One timber material shared by every board, so the grain lines up around
     the crate the way sawn timber does. */
  const timber = React.useMemo(
    () => new THREE.MeshStandardMaterial({ map: planks, roughness: 0.86, metalness: 0.02 }),
    [planks],
  )

  const stencilMaterial = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: stencil,
        transparent: true,
        roughness: 0.9,
        metalness: 0,
        depthWrite: false,
      }),
    [stencil],
  )

  React.useEffect(
    () => () => {
      timber.dispose()
      stencilMaterial.dispose()
    },
    [timber, stencilMaterial],
  )

  return (
    <group>
      <mesh material={timber}>
        <boxGeometry args={[CRATE.width, CRATE.height, CRATE.depth]} />
      </mesh>

      {/* corner battens, so it reads as a made crate and not a solid block */}
      {corners.map((p, i) => (
        <mesh key={i} material={timber} position={p}>
          <boxGeometry args={[0.06, CRATE.height + 0.03, 0.06]} />
        </mesh>
      ))}
      {rails.map((y) => (
        <mesh key={y} material={timber} position={[0, y, 0]}>
          <boxGeometry args={[CRATE.width + 0.03, 0.055, CRATE.depth + 0.03]} />
        </mesh>
      ))}

      {/* the stencilled marking on the front face */}
      <mesh material={stencilMaterial} position={[0, 0.02, CRATE.depth / 2 + 0.003]}>
        <planeGeometry args={[CRATE.width * 0.86, CRATE.height * 0.44]} />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/* The registry                                                               */
/* -------------------------------------------------------------------------- */

export type CategoryMotif =
  | 'textiles'
  | 'handicrafts'
  | 'agriculture'
  | 'industrial'
  | 'organic'
  | 'general'

/**
 * Each entry is the model and how fast it turns. Framing is not set here: the
 * tile measures the model and scales it to a common apparent size, so a tall
 * vase and a squat crate still read as one row. Only the turn rate differs — a
 * heavy crate turns slower than a cotton boll, which is what weight looks like
 * at this size.
 */
export const CATEGORY_OBJECTS: Record<CategoryMotif, { model: React.ReactNode; speed: number }> = {
  textiles: { model: <TextileRoll />, speed: 0.34 },
  handicrafts: { model: <PotteryVase />, speed: 0.3 },
  agriculture: { model: <GrainSack />, speed: 0.32 },
  industrial: { model: <CopperCoil />, speed: 0.4 },
  organic: { model: <CottonBoll />, speed: 0.36 },
  general: { model: <ExportCrate />, speed: 0.28 },
}
