import * as THREE from 'three'

/* ==========================================================================
   Framing for the six category objects.

   Six models of quite different shapes share one row of tiles, so none of them
   can be framed by a hand-picked number: a vase would tower and a crate would
   shrink. The rule here is the one a shop shelf uses — every object is scaled
   to stand the same height, and a model that is wider than it is tall is
   scaled down until its width fits, so nothing spills out of its tile.

   The turning object also has to fit at every angle, so the sweep constraint
   uses the model's footprint diagonal: that is the widest it can ever be once
   it has rotated in place.

   No React here, so the maths is testable in a plain Node process.
   ========================================================================== */

/** How tall a framed model stands, in world units. The tile camera sees about
 *  2.8 units of height, so this leaves a margin above and below. */
export const FIT_HEIGHT = 1.5

/** How wide a framed model may be, and how wide it may be at any angle while
 *  turning. The camera sees 3.74 units across a tile at its widest. */
export const FIT_WIDTH = 1.9
export const FIT_SWEEP = 3.1

export type Framing = {
  scale: number
  /** Offset that puts the model's centre on the spin axis. */
  position: [number, number, number]
  /** Height of the model's lowest point relative to the spin centre. */
  base: number
  /** Width of the model's footprint, for the contact shadow under it. */
  footprint: number
}

/**
 * `null` when the model has no measurable extent — an empty group, or geometry
 * that has not been built yet. Callers keep their last good framing.
 */
export function frameModel(box: THREE.Box3): Framing | null {
  if (box.isEmpty()) return null
  const size = box.getSize(new THREE.Vector3())
  if (!(size.y > 0) || !(size.x > 0) || !(size.z > 0)) return null

  const centre = box.getCenter(new THREE.Vector3())
  const diagonal = Math.hypot(size.x, size.z)

  const scale = Math.min(
    FIT_HEIGHT / size.y,
    FIT_WIDTH / Math.max(size.x, size.z),
    FIT_SWEEP / diagonal,
  )
  if (!Number.isFinite(scale) || scale <= 0) return null

  return {
    scale,
    position: [-centre.x * scale, -centre.y * scale, -centre.z * scale],
    base: -size.y * 0.5 * scale,
    footprint: Math.max(size.x, size.z) * scale,
  }
}
