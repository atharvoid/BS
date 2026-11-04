import * as THREE from 'three'

/* ==========================================================================
   Geometry built in code: drapeing cloth, lathed bobbins, brass rings and a
   lofted weaving shuttle. No imported models, so nothing to 404 and the whole
   3D layer stays under a few hundred KB of JavaScript.
   ========================================================================== */

type Surface = (u: number, v: number, out: THREE.Vector3) => void

/** Build an indexed parametric surface with normals and UVs. */
export function parametricSurface(
  segU: number,
  segV: number,
  fn: Surface,
  uvScale: [number, number] = [1, 1],
) {
  const cols = segU + 1
  const rows = segV + 1
  const positions = new Float32Array(cols * rows * 3)
  const uvs = new Float32Array(cols * rows * 2)
  const indices: number[] = []
  const p = new THREE.Vector3()

  for (let iv = 0; iv < rows; iv++) {
    const v = iv / segV
    for (let iu = 0; iu < cols; iu++) {
      const u = iu / segU
      fn(u, v, p)
      const i = iv * cols + iu
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
      uvs[i * 2] = u * uvScale[0]
      uvs[i * 2 + 1] = v * uvScale[1]
    }
  }

  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * cols + iu
      const b = a + 1
      const c = a + cols
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/**
 * Guarantees a lofted surface faces outward. Lofting in code makes triangle
 * winding easy to get backwards, which reads as an invisible, backface-culled
 * object — so instead of hand-deriving the order, check a known extreme vertex
 * and flip if needed.
 */
export function orientOutward(geo: THREE.BufferGeometry, dir = new THREE.Vector3(0, 1, 0)) {
  const pos = geo.getAttribute('position')
  if (!geo.getAttribute('normal')) geo.computeVertexNormals()
  const nrm = geo.getAttribute('normal')
  const v = new THREE.Vector3()
  let best = 0
  let bestVal = -Infinity
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const d = v.dot(dir)
    if (d > bestVal) {
      bestVal = d
      best = i
    }
  }
  if (nrm.getY(best) < 0) {
    const index = geo.getIndex()
    if (index) {
      const arr = index.array as unknown as number[]
      for (let i = 0; i < arr.length; i += 3) {
        const t = arr[i + 1]
        arr[i + 1] = arr[i + 2]
        arr[i + 2] = t
      }
      index.needsUpdate = true
    }
    geo.computeVertexNormals()
  }
  return geo
}

export type ClothOptions = {
  width?: number
  height?: number
  segU?: number
  segV?: number
  /** Number of vertical folds across the width. */
  folds?: number
  /** Fold depth as a fraction of the width. */
  foldDepth?: number
  /** Side-to-side drift down the length. */
  sway?: number
  /** Rounds the panel into a soft curl. */
  curl?: number
  /** Narrows the hem. */
  taper?: number
  /** Random-ish ripple so it never looks machine-perfect. */
  irregularity?: number
  seed?: number
}

/** A hanging panel of cloth: vertical folds, a drifting sway and a soft curl. */
export function makeCloth(options: ClothOptions = {}) {
  const {
    width = 2,
    height = 2.6,
    segU = 96,
    segV = 128,
    folds = 3.1,
    foldDepth = 0.085,
    sway = 0.09,
    curl = 0.22,
    taper = 0.08,
    irregularity = 0.35,
    seed = 1.7,
  } = options

  return parametricSurface(
    segU,
    segV,
    (u, v, out) => {
      const cu = u - 0.5
      const phase = u * Math.PI * 2 * folds
      const fold =
        Math.sin(phase) * width * foldDepth * (0.25 + v * 0.95) +
        Math.sin(phase * 2.17 + seed) * width * foldDepth * irregularity * 0.34 * v

      const sideTaper = 1 - taper * v
      const x = cu * width * sideTaper + Math.sin(v * 2.3 + seed) * sway * v
      const y = (0.5 - v) * height
      const z =
        fold +
        Math.cos(cu * Math.PI) * curl * (0.35 + v * 0.65) +
        Math.sin(v * 5.1 + seed * 0.5) * 0.012

      out.set(x, y, z)
    },
    [7, 9],
  )
}

/** Yarn bobbin: two flanges and a wound barrel, lathed from a profile. */
export function makeBobbinGeometry(height = 1.25, flange = 0.52, barrel = 0.34) {
  const pts: THREE.Vector2[] = []
  const h = height / 2
  const push = (r: number, y: number) => pts.push(new THREE.Vector2(r, y))

  push(0.0001, -h)
  push(flange * 0.94, -h)
  push(flange, -h + 0.035)
  push(flange * 0.93, -h + 0.075)
  push(barrel * 1.04, -h + 0.115)
  push(barrel, -h + 0.2)
  push(barrel * 1.05, -h * 0.28)
  push(barrel, 0)
  push(barrel * 1.05, h * 0.28)
  push(barrel, h - 0.2)
  push(barrel * 1.04, h - 0.115)
  push(flange * 0.93, h - 0.075)
  push(flange, h - 0.035)
  push(flange * 0.94, h)
  push(0.0001, h)

  const geo = new THREE.LatheGeometry(pts, 96)
  geo.computeVertexNormals()
  return geo
}

/** The wound yarn sleeve that sits on the bobbin barrel. */
export function makeYarnGeometry(height = 1.25, barrel = 0.34) {
  const pts: THREE.Vector2[] = []
  const h = height / 2
  const steps = 26
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = -h + 0.16 + t * (height - 0.32)
    // yarn bulges slightly in the middle of the wind
    const r = barrel * (1.02 + Math.sin(t * Math.PI) * 0.13)
    pts.push(new THREE.Vector2(r, y))
  }
  const geo = new THREE.LatheGeometry(pts, 96)
  geo.computeVertexNormals()
  return geo
}

/** Brass ring with a flattened, slightly lipped profile. */
export function makeRingGeometry(radius = 0.72, thickness = 0.15) {
  const pts: THREE.Vector2[] = []
  const r = thickness / 2
  const steps = 22
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    // squashed cross-section with a small step, like a cast brass ring
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r * 1.36
    pts.push(new THREE.Vector2(radius + x, y))
  }
  const geo = new THREE.LatheGeometry(pts, 128)
  geo.computeVertexNormals()
  return geo
}

/**
 * Weaving shuttle: a lofted hull, pointed at both ends, widest at the belly.
 * Cross-sections are half-ellipses so the underside stays flat and it reads as
 * a boat rather than a lozenge.
 */
export function makeShuttleGeometry(length = 1.9, beam = 0.42, depth = 0.36, seg = 72) {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const ring = 34

  const section = (t: number) => {
    // t: 0..1 along the shuttle
    const tip = Math.sin(Math.PI * t) ** 0.9
    const w = beam * tip
    const d = depth * (0.4 + 0.6 * tip)
    // the belly sits slightly aft of centre, like a real shuttle
    const yOff = Math.sin(Math.PI * t) * depth * 0.05
    return { w, d, yOff }
  }

  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    const { w, d, yOff } = section(t)
    const x = (t - 0.5) * length
    for (let j = 0; j <= ring; j++) {
      // full ellipse around the long axis, so the hull is a closed solid
      const a = (j / ring) * Math.PI * 2
      const y = Math.cos(a) * d * 0.5 + yOff
      const z = Math.sin(a) * w * 0.5
      positions.push(x, y, z)
      uvs.push(t * 2.4, j / ring)
    }
  }
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * (ring + 1) + j
      const b = a + ring + 1
      indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return orientOutward(geo)
}

/** Thin metal ferrule capping a shuttle tip. */
export function makeFerruleGeometry(radius = 0.19, height = 0.22) {
  const pts: THREE.Vector2[] = []
  const steps = 14
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = (t - 0.5) * height
    const r = radius * (1.05 - 0.55 * t)
    pts.push(new THREE.Vector2(Math.max(0.001, r), y))
  }
  return new THREE.LatheGeometry(pts, 48)
}
