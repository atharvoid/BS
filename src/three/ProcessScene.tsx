import React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { reducedMotion } from './motion'
import {
  BobbinObject,
  BoltObject,
  Draggable,
  Ground,
  Lights,
  ReedObject,
  ShuttleObject,
  Studio,
} from './objects'

/* ==========================================================================
   ProcessScene — the four stage objects, sharing one canvas.

   The section pins; the text scrolls past on the right. Each object swings in
   along a circular arc from below, settles level, and idles there until the
   next one arrives. Nothing here depends on the visitor doing anything, and
   dragging still works on whichever object is in front.

   Cost control: only one object is rendered at a time, so this scene costs
   about the same as the single-stage canvases it replaces — in one WebGL
   context instead of four.
   ========================================================================== */

const KINDS = ['bolt', 'shuttle', 'spool', 'reed'] as const
export type StageKind = (typeof KINDS)[number]

export const STAGE_OBJECT_LABELS: Record<StageKind, string> = {
  bolt: 'Unfolded bolt',
  shuttle: 'Weaving shuttle',
  spool: 'Spun yarn bobbin',
  reed: 'Brass reed',
}

const ARC = { radius: 1.15, startAngle: -0.8, startY: -3.0, exitY: 2.9 }

/**
 * Presentation per object. The bolt and bundle are tall, so they sit lower and
 * turn more slowly; the shuttle is long, so it wants a shallow angle; the reed
 * is a flat comb and looks like a picture frame if it spins, so it only rocks
 * a few degrees and is deliberately not perfectly level — a level comb would
 * read as a sloped layout.
 */
/*
 * Idle presentation. `spin` is deliberately never used here: it adds an
 * unbounded `spin * t` to the Y rotation, so an object left on screen for a
 * minute ends up side-on. A bounded sine drift keeps every stage readable no
 * matter how long a visitor stays on it.
 */
const LOOK: Record<StageKind, { drift: number; roll: number }> = {
  bolt: { drift: 0.16, roll: 0.026 },
  shuttle: { drift: 0.22, roll: 0.038 },
  spool: { drift: 0.18, roll: 0.028 },
  reed: { drift: 0.07, roll: 0.008 },
}
const ENTER = 0.11 // fraction of a stage's slice spent flying in
const EXIT = 0.9

function ObjectBody({ kind }: { kind: StageKind }) {
  switch (kind) {
    case 'bolt':
      return (
        <group position={[0, -0.62, 0]} scale={0.86}>
          <BoltObject palette="cotton" />
        </group>
      )
    case 'shuttle':
      return (
        <group rotation={[-0.1, 0, 0.16]} position={[0, 0.02, 0]} scale={1.02}>
          <ShuttleObject />
        </group>
      )
    case 'spool':
      return (
        <group position={[0, 0.02, 0]} rotation={[0.04, 0, 0.04]} scale={0.84}>
          <BobbinObject />
        </group>
      )
    case 'reed':
    default:
      return (
        <group rotation={[0.2, 0, 0.02]} scale={1.04}>
          <ReedObject />
        </group>
      )
  }
}

const GROUND_Y: Record<StageKind, number> = { bolt: -0.78, shuttle: -0.78, spool: -1.0, reed: -0.9 }

/**
 * One stage slot. Its own progress `p` is 0 the moment its slice begins and 1
 * when the next slice begins. The arc lives on a group outside the drag group,
 * so flying in never fights the visitor's own rotation.
 */
function Slot({
  kind,
  index,
  progress,
  isLast,
}: {
  kind: StageKind
  index: number
  progress: React.RefObject<number>
  isLast: boolean
}) {
  const arc = React.useRef<THREE.Group>(null)
  const shown = React.useRef(false)
  const still = React.useMemo(() => reducedMotion(), [])
  /* Damped copy of the section's scroll progress. Raw scroll arrives in
     jumps, so driving the arc straight from it makes the object stutter and
     then snap while the paragraph cross-fades over 600ms. This carries the
     motion through with weight, and both sides of the pair now ease on the
     same curve. */
  const smooth = React.useRef(-1)

  useFrame((_, delta) => {
    const node = arc.current
    if (!node) return

    const raw = progress.current * KINDS.length - index
    const d = Math.min(delta, 1 / 30)

    if (smooth.current < -0.5) smooth.current = raw
    else {
      const k = 1 - Math.exp(-14 * d)
      smooth.current += (raw - smooth.current) * k
    }
    const p = smooth.current

    // Only the stage in front of the visitor exists, so neighbours wait far
    // outside the frame and nothing else is ever visible behind it.
    const live = isLast ? p > -0.06 : p > -0.06 && p < 1.06
    if (live !== shown.current) {
      shown.current = live
      node.visible = live
    }
    if (!live) return

    const enter = THREE.MathUtils.smoothstep(p, -0.04, ENTER * 1.6)
    /* The outgoing object drifts up and away rather than snapping out, except
       for the last one: the sequence must not end on an empty plate while the
       section is still pinned. */
    const leave = isLast ? 0 : THREE.MathUtils.smoothstep(p, EXIT, 1.02)

    const angle = ARC.startAngle * (1 - enter)
    node.position.set(
      Math.sin(angle) * ARC.radius,
      ARC.startY * (1 - enter) + leave * ARC.exitY,
      0,
    )
    node.rotation.z = angle * 0.5 + leave * 0.4
    node.rotation.x = -angle * 0.1
    node.scale.setScalar((0.84 + enter * 0.16) * (1 - leave * 0.35))
  })

  return (
    <group ref={arc} visible={false}>
      <Draggable
        drift={still ? 0 : LOOK[kind].drift}
        tilt={0.34}
        float={0.028}
        spin={0}
        roll={still ? 0 : LOOK[kind].roll}
      >
        <ObjectBody kind={kind} />
      </Draggable>
      <Ground y={GROUND_Y[kind]} scale={4.2} opacity={0.32} />
    </group>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  const viewport = useThree((s) => s.viewport)
  const narrow = viewport.aspect < 1.15
  return (
    <group scale={narrow ? 0.98 : 1.18} position={[0, 0.14, 0]}>
      {children}
    </group>
  )
}

export function ProcessScene({ progress }: { progress: React.RefObject<number> }) {
  return (
    <>
      <Studio />
      <Lights intensity={1.02} />
      <Frame>
        {KINDS.map((kind, i) => (
          <Slot key={kind} kind={kind} index={i} progress={progress} isLast={i === KINDS.length - 1} />
        ))}
      </Frame>
    </>
  )
}

/**
 * One stage on its own, for the stacked mobile layout where there is no pinned
 * frame to share. Same object, same drag behaviour, no arc — the step simply
 * reveals with the text it belongs to.
 */
export function SingleStageScene({ kind }: { kind: StageKind }) {
  return (
    <>
      <Studio />
      <Lights intensity={1.02} />
      <Frame>
        <Draggable drift={0.22} tilt={0.36} float={0.03} spin={0.07}>
          <ObjectBody kind={kind} />
        </Draggable>
        <Ground y={GROUND_Y[kind]} scale={4.2} opacity={0.34} />
      </Frame>
    </>
  )
}
