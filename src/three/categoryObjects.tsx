import React from 'react'
import * as THREE from 'three'
import { getTextile, type PaletteKey } from './objects'
import { makeRollEndTexture } from './textures'
import {
  CRATE,
  ROLL,
  bollCalyx,
  bollLobes,
  crateBattens,
  makeCopperCoil,
  makeBollLobe,
  makeRolledCloth,
  clothRestOffset,
  makeSpill,
  makeSackBody,
  makeSackCrown,
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

  /* One surface that starts on the roll and unrolls from it. The alternative —
     a plane laid against the cylinder — puts a third of its vertices inside the
     bolt; see makeRolledCloth. */
  const tail = React.useMemo(() => makeRolledCloth({ radius: R, width: 1.0 }), [R])

  React.useEffect(
    () => () => {
      rolled.map.dispose()
      rolled.bump.dispose()
      tail.dispose()
    },
    [rolled, tail],
  )

  /* The roll and the cloth are built in one frame whose origin is the roll's
     axis, then moved down so the roll rests on the floor line. That single
     translation is why the cloth and the roll can never drift apart. */
  const rest = clothRestOffset(R)

  return (
    <group position={[0, -rest, 0]}>
      {/* the bolt, lying along X, in the frame the cloth was solved in */}
      <group position={[-0.14, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
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
          <mesh key={x} position={[x, 0, 0]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
            <circleGeometry args={[R, 72]} />
            <meshStandardMaterial map={end} roughness={0.74} metalness={0.02} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* the kraft band that holds a bolt closed, clear of the cloth's path */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.42, 0, 0]}>
          <cylinderGeometry args={[R + 0.008, R + 0.008, 0.17, 96, 1, true]} />
          <meshStandardMaterial color="#c9b489" roughness={0.94} metalness={0} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* the cloth, unwound from the roll and lying on the floor */}
      <group position={[-0.14, 0, 0]}>
        <mesh geometry={tail}>
          <meshStandardMaterial
            map={rolled.map}
            bumpMap={rolled.bump}
            bumpScale={2.4}
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
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
  const crown = React.useMemo(() => makeSackCrown(), [])
  const spill = React.useMemo(() => makeSpill(0.19), [])

  /* Sacking is a coarse weave, but a sack is two metres around, so the sheet
     has to repeat: at one repeat the tapes come out the size of shoelaces. */
  const juteFine = React.useMemo(() => {
    const map = jute.clone()
    map.repeat.set(2.2, 1.9)
    map.needsUpdate = true
    return map
  }, [jute])
  const juteBumpFine = React.useMemo(() => {
    const map = juteBump.clone()
    map.repeat.set(2.2, 1.9)
    map.needsUpdate = true
    return map
  }, [juteBump])

  React.useEffect(
    () => () => {
      juteFine.dispose()
      juteBumpFine.dispose()
    },
    [juteFine, juteBumpFine],
  )

  React.useEffect(
    () => () => {
      sack.dispose()
      crown.dispose()
      spill.dispose()
    },
    [sack, crown, spill],
  )

  return (
    /* Tipped a little towards the camera: a sack standing square reads as a
       drum, and the mouth is the whole point of this one. The tilt is inside
       the measured group, so the framing and the shadow follow it. */
    <group rotation={[0.14, 0, 0]}>
      <mesh geometry={sack}>
        <meshStandardMaterial
          map={juteFine}
          bumpMap={juteBumpFine}
          bumpScale={2.8}
          roughness={0.96}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* the neck gathered and tied */}
      <mesh position={[0, 0.575, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.157, 0.022, 10, 48]} />
        <meshStandardMaterial color="#6f5730" roughness={0.94} />
      </mesh>
      {/* the crown of surplus sacking above the tie */}
      <mesh geometry={crown} position={[0, 0.572, 0]}>
        <meshStandardMaterial
          map={juteFine}
          bumpMap={juteBumpFine}
          bumpScale={2.8}
          roughness={0.96}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* the stencil is part of the sheet, so it sits where the print does */}
      {/* grain spilled at the foot of the sack, and a few loose grains */}
      <mesh geometry={spill} position={[0.5, -0.6, 0.2]}>
        <meshStandardMaterial map={grain} bumpMap={grainBump} bumpScale={2.2} roughness={0.88} />
      </mesh>
      <mesh geometry={spill} position={[-0.42, -0.6, -0.16]} scale={0.62}>
        <meshStandardMaterial map={grain} bumpMap={grainBump} bumpScale={2.2} roughness={0.88} />
      </mesh>
      {[
        [0.5, -0.62, 0.24],
        [0.58, -0.62, -0.1],
        [0.38, -0.62, -0.4],
        [-0.52, -0.62, 0.2],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, i, Math.PI / 2]}>
          <capsuleGeometry args={[0.012, 0.036, 3, 6]} />
          <meshStandardMaterial color="#efe2c2" roughness={0.62} />
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
  const wire = React.useMemo(() => makeCopperCoil(), [])

  React.useEffect(() => () => wire.dispose(), [wire])

  return (
    /* tipped so the top turn and the free end are both in view */
    <group rotation={[0.2, 0, 0]}>
      <mesh geometry={wire}>
        <meshStandardMaterial
          color="#b4703f"
          roughnessMap={brushed}
          roughness={0.32}
          metalness={1}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* the cut face of the wire at the free end, so the end reads as copper
          rather than a clipped tube */}
      <mesh position={[0.42, 0.4, 0.06]} rotation={[0.4, 0.2, 1.1]}>
        <cylinderGeometry args={[0.034, 0.034, 0.004, 12]} />
        <meshStandardMaterial color="#d08a52" roughness={0.22} metalness={1} envMapIntensity={1.8} />
      </mesh>
      {/* brass collars holding the coil together for shipping */}
      {[0.24, -0.24].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.43, 0.016, 8, 56]} />
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
  const lobeGeometry = React.useMemo(
    () => lobes.map((_, i) => makeBollLobe(i * 2.1)),
    [lobes],
  )

  React.useEffect(() => () => lobeGeometry.forEach((g) => g.dispose()), [lobeGeometry])

  return (
    <group rotation={[0.2, 0, -0.08]}>
      {lobes.map((lobe, i) => (
        <mesh
          key={i}
          geometry={lobeGeometry[i]}
          position={lobe.position}
          rotation={[0, 0, lobe.rotation]}
          scale={lobe.scale}
        >
          <meshStandardMaterial
            map={lint}
            bumpMap={lint}
            bumpScale={1.6}
            roughness={1}
            metalness={0}
            color="#fffdf8"
          />
        </mesh>
      ))}

      {/* the calyx: five dried sepals under the fibre, with a short stem */}
      {calyx.map((sepal, i) => (
        <mesh
          key={`sepal-${i}`}
          position={sepal.position}
          rotation={[sepal.tilt, 0, sepal.rotation]}
          scale={[0.2, 0.075, 0.012]}
        >
          <sphereGeometry args={[1, 14, 10]} />
          {/* dried bract: brown, curled, matte */}
          <meshStandardMaterial color="#7b663e" roughness={0.98} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* the stem, cut short, going back behind the boll */}
      <mesh position={[0, 0, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.038, 0.34, 10]} />
        <meshStandardMaterial color="#8a7147" roughness={0.97} />
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
    <group rotation={[0.08, 0, 0]}>
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
  textiles: { model: <TextileRoll />, speed: 0.18 },
  handicrafts: { model: <PotteryVase />, speed: 0.18 },
  agriculture: { model: <GrainSack />, speed: 0.18 },
  industrial: { model: <CopperCoil />, speed: 0.18 },
  organic: { model: <CottonBoll />, speed: 0.18 },
  general: { model: <ExportCrate />, speed: 0.18 },
}
