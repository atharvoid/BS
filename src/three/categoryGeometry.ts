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

/** Where the bolt sits: it lies along X, so the cloth leaves it along Z. */
export const ROLL_CENTRE = [-0.14, ROLL.radius, 0] as [number, number, number]

/**
 * The loose tail, unwound from the roll.
 *
 * This is the same family of surface as a real unrolling bolt: the cloth starts
 * on the roll's outer surface, wraps through an arc, and leaves tangentially to
 * lie on the floor. Modelling it that way is what keeps it out of the roll —
 * the earlier version was a plane laid against the cylinder, and 294 of its 945
 * vertices were inside the bolt.
 *
 * The path is solved here rather than eyeballed, so the attachment is exact:
 *
 * 1. The wrap starts at `theta0` measured from the top of the roll and goes
 *    forward, so the cloth is coming over the roll towards the viewer.
 * 2. It leaves at `tangentAngle`, where the tangent points down-and-forward. A
 *    cloth that leaves before that angle would be heading back into the roll.
 * 3. From there it drops and runs out flat, with the height of the free span
 *    easing from the release point down to the floor.
 *
 * The surface is then generated in (s, t): s runs across the cloth's width,
 * t runs along its length. Its normal is the roll's radial direction while it
 * is in contact, and up once it is lying on the floor, so the weave faces out
 * everywhere.
 */
export function makeRolledCloth({
  radius = ROLL.radius,
  width = 1.0,
  freeLength = 0.95,
  clearance = 0.006,
  segU = 30,
  segV = 64,
}: {
  radius?: number
  width?: number
  /** How much cloth hangs free beyond the roll, before it lies flat. */
  freeLength?: number
  clearance?: number
  segU?: number
  segV?: number
} = {}) {
  /* Degrees from the top of the roll, going forward over it towards the viewer.
     The wrap starts well over the back of the crown, so the unrolling is
     visible from the front, and leaves at 55 on the lower near face, where the
     tangent points down *and forward* — so the free cloth runs out onto the
     floor in front of the roll instead of hanging straight down beside it. */
  const THETA0 = THREE.MathUtils.degToRad(-108)
  const THETA1 = THREE.MathUtils.degToRad(55)
  /* Fraction of the surface spent still in contact with the roll. */
  const CONTACT = 0.62
  const r = radius + clearance

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const point = (s: number, t: number, out: THREE.Vector3) => {
    const x = (s - 0.5) * width
    if (t <= CONTACT) {
      /* In contact: a point on the outside of the roll. */
      const k = t / CONTACT
      const theta = THETA0 + (THETA1 - THETA0) * k
      out.set(x, r * Math.cos(theta), r * Math.sin(theta))
    } else {
      /* Free: the involute of the release point.
       *
       * The cloth leaves the roll along the tangent at THETA1 and hangs from
       * there, so the path starts at the release point and advances along that
       * tangent — which, by construction, points away from the cylinder. The
       * height then eases from the release height down to the floor as the
       * cloth lies flat. Any other rule risks sending the free end back
       * through the roll, which is exactly what the first attempt did. */
      const k = (t - CONTACT) / (1 - CONTACT)
      const startY = r * Math.cos(THETA1)
      const startZ = r * Math.sin(THETA1)
      /* unit tangent at THETA1, pointing forward and down */
      const tY = -Math.sin(THETA1)
      const tZ = Math.cos(THETA1)
      /* How far along the tangent the cloth has run at this t. It accelerates
         away from the roll, so the first part of the free span hugs it closely
         and the rest runs out flat. */
      const run = freeLength * (1 - (1 - k) * (1 - k))
      const ease = k * k * (3 - 2 * k)
      let py = startY + tY * run
      let pz = startZ + tZ * run

      /* The cloth cannot be inside the roll. Wherever the path would cross the
         cylinder wall, push it out along the radial direction — the cloth lies
         against the roll instead of through it. This is a constraint, not a
         fudge: a hanging cloth is resting on the roll at exactly these points. */
      const radial = Math.hypot(py, pz)
      if (radial < r) {
        if (radial > 1e-6) {
          py = (py / radial) * r
          pz = (pz / radial) * r
        } else {
          py = r
        }
      }
      /* The cloth comes to rest on the floor, and meets it smoothly rather than
         hinging on it: a soft minimum against the floor line, so the drape
         curves down into the floor instead of stopping at a kink. */
      const over = py + radius
      const SOFT = 0.05
      py = -radius + (0.5 * (over + Math.sqrt(over * over + SOFT * SOFT)) - SOFT / 2)

      /* The soft floor can dip a couple of centimetres, which near the bottom
         of the roll would put the cloth marginally inside it. The radial
         constraint is re-applied last so it is the invariant that wins. */
      const endRadial = Math.hypot(py, pz)
      if (endRadial < r && endRadial > 1e-6) {
        py = (py / endRadial) * r
        pz = (pz / endRadial) * r
      }
      out.set(x, py, pz)
      /* A soft fold across the width, deepening as the cloth leaves the roll.
         Only outward, so it can never reintroduce a penetration. */
      out.y += Math.abs(Math.sin((x / width) * Math.PI)) * 0.008 * ease
    }
    return out
  }

  const v = new THREE.Vector3()
  for (let j = 0; j <= segV; j++) {
    const t = j / segV
    for (let i = 0; i <= segU; i++) {
      const s = i / segU
      point(s, t, v)
      positions.push(v.x, v.y, v.z)
      /* The weave's u runs across the bolt, so the threads line up between the
         rolled part and the loose part. */
      uvs.push(s * 1.6, t * 2.4)
    }
  }

  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = j * (segU + 1) + i
      const b = a + 1
      const c = a + segU + 1
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/**
 * The floor line, relative to the roll's own centre.
 *
 * Geometry is generated in a frame whose origin is the roll's axis; the caller
 * then moves the whole thing so the roll rests on the floor. Keeping this at 0
 * means "the cloth ends where the roll touches down", and the caller's single
 * translation moves both together.
 */
function floorY(_radius: number) {
  return 0
}

/** How far below the roll's axis the cloth comes to rest, so a caller can drop
 *  the whole object by that much and land the cloth on the floor. */
export function clothRestOffset(radius = ROLL.radius) {
  return -radius - 0.006
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
