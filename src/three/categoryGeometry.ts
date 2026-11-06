import * as THREE from 'three'

/* ==========================================================================
   Geometry for the six category objects.

   Kept apart from the components in categoryObjects.tsx for one reason: this
   file has no React and no JSX in it, so the shapes can be built and measured
   in a plain Node process. Proportions that are only ever eyeballed in a
   browser are proportions that drift; these are checked.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* 1 · Textiles: the tail of cloth unrolling off the roll                     */
/* -------------------------------------------------------------------------- */

export const ROLL = { radius: 0.42, length: 1.28 }

/**
 * The loose tail. A plane with a fold running its length and a curl at the far
 * edge, so it lifts off the roll instead of lying flat like a decal.
 */
export function makeClothTail(width = 1.05, height = 1.5) {
  const geo = new THREE.PlaneGeometry(width, height, 26, 34)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const t = (y + height / 2) / height
    const fold = Math.sin(x * 3.1) * 0.05 * (0.35 + t * 0.65)
    const curl = Math.pow(t, 2.2) * 0.34
    pos.setZ(i, fold + curl)
    pos.setY(i, y - Math.pow(t, 2.0) * 0.12)
  }
  geo.computeVertexNormals()
  return geo
}

/* -------------------------------------------------------------------------- */
/* 2 · Handicrafts: the blue pottery vase                                     */
/* -------------------------------------------------------------------------- */

/**
 * A hand-thrown profile, revolved: narrow foot, swelling belly, drawn-in neck,
 * flared lip. Points run bottom to top, which is what LatheGeometry expects.
 */
export const VASE_PROFILE: [number, number][] = [
  [0.02, -0.62],
  [0.28, -0.63],
  [0.31, -0.56],
  [0.3, -0.3],
  [0.46, 0.04],
  [0.5, 0.24],
  [0.44, 0.46],
  [0.3, 0.6],
  [0.24, 0.66],
  [0.25, 0.74],
  [0.31, 0.79],
  [0.3, 0.82],
  [0.24, 0.81],
  [0.2, 0.76],
  [0.19, 0.66],
]

export function makeVaseBody(segments = 96) {
  const geo = new THREE.LatheGeometry(
    VASE_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  )
  geo.computeVertexNormals()
  return geo
}

/* -------------------------------------------------------------------------- */
/* 3 · Agriculture: the jute sack                                             */
/* -------------------------------------------------------------------------- */

export const SACK_PROFILE: [number, number][] = [
  [0.02, -0.66],
  [0.42, -0.66],
  [0.52, -0.6],
  [0.58, -0.42],
  [0.6, -0.16],
  [0.56, 0.12],
  [0.46, 0.34],
  [0.34, 0.48],
  [0.26, 0.56],
  [0.24, 0.62],
]

/** The sack, plus the slump: a full sack set down on a floor is never a solid
 *  of revolution, so the radius is nudged with the height and the angle. */
export function makeSackBody(segments = 72) {
  const geo = new THREE.LatheGeometry(
    SACK_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  )
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const s = 1 + Math.sin(y * 7.1) * 0.016 + Math.cos(Math.atan2(z, x) * 3) * 0.02
    pos.setX(i, x * s)
    pos.setZ(i, z * s)
  }
  geo.computeVertexNormals()
  return geo
}

/** The grain sitting in the open mouth of the sack. */
export function makeGrainHeap(radius = 0.2) {
  const geo = new THREE.SphereGeometry(radius, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2)
  geo.scale(1, 0.42, 1)
  return geo
}

/* -------------------------------------------------------------------------- */
/* 4 · Industrial: the copper coil                                            */
/* -------------------------------------------------------------------------- */

/** Where each turn of wire sits: hand-wound, so it wanders a little. */
export function copperTurns(count = 22) {
  return Array.from({ length: count }, (_, i) => {
    const t = count > 1 ? i / (count - 1) : 0
    const wobble = Math.sin(t * 5.2) * 0.012
    return { y: -0.42 + t * 0.84, r: 0.42 + Math.sin(t * 3.1) * 0.006 + wobble, x: wobble * 0.5 }
  })
}

/* -------------------------------------------------------------------------- */
/* 5 · Organic: the cotton boll                                               */
/* -------------------------------------------------------------------------- */

/** A boll opens into exactly five lobes, pushed out from a common centre. */
export function bollLobes(count = 5) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2
    return {
      position: [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0] as [number, number, number],
      rotation: a,
    }
  })
}

/** The dried sepals under the fibre, one per gap between the lobes. */
export function bollCalyx(count = 5) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + Math.PI / count
    return {
      position: [Math.cos(a) * 0.3, Math.sin(a) * 0.3, -0.14] as [number, number, number],
      rotation: a,
    }
  })
}

/* -------------------------------------------------------------------------- */
/* 6 · Other requests: the export crate                                       */
/* -------------------------------------------------------------------------- */

export const CRATE = { width: 0.99, height: 0.93, depth: 0.84 }

/** The corner battens and the two rails that make a box read as a crate. */
export function crateBattens() {
  const { width, height, depth } = CRATE
  return {
    corners: [
      [-width / 2, 0, -depth / 2],
      [width / 2, 0, -depth / 2],
      [-width / 2, 0, depth / 2],
      [width / 2, 0, depth / 2],
    ].map(([x, y, z]) => [x, y, z] as [number, number, number]),
    rails: [height * 0.36, -height * 0.36],
  }
}
