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

/* A 50 kg jute sack that has been stood up and let go: heavy and wide at the
   base, shoulders slumping in, a short neck gathered by the tie. An upright
   cylinder with a pinch reads as a pinecone at this size, so the width matters
   as much as the profile. */
export const SACK_PROFILE: [number, number][] = [
  [0.02, -0.62],
  [0.34, -0.62],
  [0.45, -0.57],
  [0.53, -0.41],
  [0.565, -0.12],
  [0.55, 0.14],
  [0.48, 0.36],
  [0.36, 0.5],
  [0.25, 0.57],
  [0.17, 0.6],
]

/** The gathered crown above the tie: what a full sack does above its neck. */
export function makeSackCrown(radius = 0.16) {
  const geo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.62)
  geo.scale(1, 0.72, 1)
  /* folded fabric, not a dome: a few creases pulled towards the tie */
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const a = Math.atan2(pos.getZ(i), pos.getX(i))
    const k = 1 + Math.cos(a * 5) * 0.06
    pos.setX(i, pos.getX(i) * k)
    pos.setZ(i, pos.getZ(i) * k)
    pos.setY(i, pos.getY(i) * (1 + Math.sin(a * 5) * 0.05))
  }
  geo.computeVertexNormals()
  return geo
}

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
    /* the slump is strongest low down, where the weight is */
    const slack = 0.55 + 0.45 * (1 - Math.min(1, Math.max(0, (y + 0.6) / 1.15)))
    const s = 1 + (Math.sin(y * 6.3) * 0.022 + Math.cos(Math.atan2(z, x) * 3) * 0.03) * slack
    pos.setX(i, x * s)
    pos.setZ(i, z * s)
  }
  geo.computeVertexNormals()
  return geo
}

/** A little grain spilled at the foot of the sack: a flattened dome with an
 *  uneven edge, which is what a spilled heap looks like from a metre away. */
export function makeSpill(radius = 0.17) {
  const geo = new THREE.SphereGeometry(radius, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  geo.scale(1, 0.34, 1)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const a = Math.atan2(pos.getZ(i), pos.getX(i))
    const k = 1 + Math.sin(a * 4.3) * 0.11
    pos.setX(i, pos.getX(i) * k)
    pos.setZ(i, pos.getZ(i) * k)
    pos.setY(i, pos.getY(i) * (0.85 + Math.cos(a * 3) * 0.15))
  }
  geo.computeVertexNormals()
  return geo
}

/** The grain standing in the open mouth of the sack, mounded over the neck. */
export function makeGrainHeap(radius = 0.17) {
  const geo = new THREE.SphereGeometry(radius, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2)
  geo.scale(1, 0.5, 1)
  /* a heap is not a dome: nudge it so the rim is uneven */
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const a = Math.atan2(pos.getZ(i), pos.getX(i))
    pos.setY(i, pos.getY(i) * (0.9 + Math.sin(a * 3.1) * 0.12))
  }
  geo.computeVertexNormals()
  return geo
}

/* -------------------------------------------------------------------------- */
/* 4 · Industrial: the copper coil                                            */
/* -------------------------------------------------------------------------- */

/**
 * The wire as one continuous helix rather than a stack of rings.
 *
 * A stack of tori reads as a spool: the turns line up exactly, the top is a
 * flat disc and the eye sees a cylinder with a spiral drawn on it. Real wire
 * leaves a coil at an angle, so the path climbs as it turns, wanders a little,
 * and the open end lifts off the top turn.
 */
export function makeCopperCoil(turns = 15, radius = 0.4, height = 0.8, wire = 0.034) {
  const count = turns * 28
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const angle = t * turns * Math.PI * 2
    /* hand-wound: the radius breathes and the stack leans very slightly */
    const r = radius + Math.sin(t * 7.3) * 0.012 + t * 0.02
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * r + Math.sin(t * 2.1) * 0.008,
        -height / 2 + t * height,
        Math.sin(angle) * r,
      ),
    )
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), count, wire, 9, false)
}

/* -------------------------------------------------------------------------- */
/* 5 · Organic: the cotton boll                                               */
/* -------------------------------------------------------------------------- */

/** A boll opens into exactly five lobes, pushed out from a common centre. */
export function bollLobes(count = 5) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2
    /* a boll does not open into five identical balls: some lobes burst fuller
       than others, which is most of what stops it reading as a golf ball */
    const swell = 1 + Math.sin(i * 2.4 + 0.7) * 0.14
    const out = 0.2 + Math.sin(i * 1.7) * 0.022
    return {
      position: [Math.cos(a) * out, Math.sin(a) * out, Math.sin(i * 3.1) * 0.03] as [
        number,
        number,
        number,
      ],
      rotation: a + Math.sin(i * 1.3) * 0.25,
      scale: [0.29 * swell, 0.29 * swell, 0.25 * swell] as [number, number, number],
    }
  })
}

/**
 * One lock of cotton: a sphere pushed around by two overlapping sine fields so
 * the surface is lumpy at the scale of a few centimetres, which is the size of
 * the clumps lint actually forms. A smooth sphere reads as dough; this reads as
 * fibre with air in it.
 */
export function makeBollLobe(seed = 0, detail = 28) {
  const geo = new THREE.SphereGeometry(1, detail, Math.round(detail * 0.75))
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const theta = Math.atan2(z, x)
    const phi = Math.acos(Math.max(-1, Math.min(1, y)))
    const lump =
      1 +
      0.085 * Math.sin(theta * 5 + seed) * Math.cos(phi * 4 - seed) +
      0.05 * Math.cos(theta * 9 - seed * 2) * Math.sin(phi * 7 + seed) +
      0.03 * Math.sin(theta * 17 + phi * 11)
    pos.setXYZ(i, x * lump, y * lump, z * lump)
  }
  geo.computeVertexNormals()
  return geo
}

/** The dried sepals under the fibre, one per gap between the lobes. */
export function bollCalyx(count = 5) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + Math.PI / count
    /* the sepals splay back from the stem, away from the lint */
    return {
      position: [Math.cos(a) * 0.26, Math.sin(a) * 0.26, -0.2] as [number, number, number],
      rotation: a,
      tilt: 0.9 + (i % 2) * 0.12,
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
