import * as THREE from 'three'

/* ==========================================================================
   Geometry built in code: the draped cloth on the textiles page. No imported
   models, so nothing to 404 and nothing large to download.
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

/** The wound yarn sleeve that sits on the bobbin barrel. */

/** Brass ring with a flattened, slightly lipped profile. */

/**
 * Weaving shuttle: a lofted hull, pointed at both ends, widest at the belly.
 * Cross-sections are half-ellipses so the underside stays flat and it reads as
 * a boat rather than a lozenge.
 */

/** Thin metal ferrule capping a shuttle tip. */
