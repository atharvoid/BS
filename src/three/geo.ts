import { decodeMask } from './mask'
import * as THREE from 'three'

/* ==========================================================================
   Geo: turning real Natural Earth data into something a sphere can draw.

   Two representations, because neither alone is good enough:

   - a coverage mask (land.png) for the solid fill, sampled in the fragment
     shader so the continents stay seamless at every zoom level;
   - coastline loops as real line geometry, so the edge is crisp vector rather
     than a magnified pixel staircase.

   Both come from the same source, so they line up by construction.
   ========================================================================== */

export const DEG = Math.PI / 180

/**
 * Lon/lat degrees to a point on a sphere of radius r.
 *
 * No offset: x = sin(lon), z = cos(lon), which is the plain geographic
 * convention and matches the equirectangular land mask it is drawn against.
 * (three's SphereGeometry happens to lay its own UVs a quarter turn away from
 * this, so the shader compensates when it samples the mask. The vectors stay
 * in honest lon/lat, which keeps every route and marker readable.)
 */
export function llToVec(lon: number, lat: number, r = 1, target = new THREE.Vector3()) {
  const phi = lon * DEG
  const theta = lat * DEG
  return target.set(r * Math.cos(theta) * Math.sin(phi), r * Math.sin(theta), r * Math.cos(theta) * Math.cos(phi))
}

/**
 * Equirectangular UV to a sphere point, matching the mask's pixel layout:
 * u = 0 at 180W, v = 0 at the north pole. This is the same mapping three's
 * SphereGeometry uses, so a plane of vertices can be bent onto the sphere and
 * the coastline lines will not drift relative to the sampled mask.
 */
export function uvToVec(u: number, v: number, r = 1, target = new THREE.Vector3()) {
  const phi = (u - 0.5) * Math.PI * 2
  const theta = (v - 0.5) * Math.PI
  return target.set(
    r * Math.cos(theta) * Math.sin(phi),
    r * Math.sin(theta),
    r * Math.cos(theta) * Math.cos(phi),
  )
}

export type PackedLines = {
  counts: number[]
  data: string
  points: number
}

type GeoFile = {
  meta: { width: number; height: number; quantum: number }
  coast: PackedLines
  border: PackedLines
}

let cached: GeoFile | null = null

/** Fetch the packed geography once, and keep it. */
export async function loadGeo(): Promise<GeoFile> {
  if (cached) return cached
  const res = await fetch(new URL('./geo/land.json', import.meta.url))
  cached = (await res.json()) as GeoFile
  return cached
}

let maskTexture: Promise<THREE.Texture> | null = null

/** Resolve the complete texture before the globe's first visible frame. */
export function getLandMask(): Promise<THREE.Texture> {
  if (!maskTexture) maskTexture = new THREE.TextureLoader()
    .loadAsync(new URL('./geo/land.png', import.meta.url).href)
    .then((tex) => {
      tex.colorSpace = THREE.NoColorSpace
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
      tex.anisotropy = 8
      return tex
    })
  return maskTexture
}

/**
 * Piecewise-linear resampling of a lon/lat ring. The source is already
 * simplified to a sensible point count, so this only removes the long straight
 * chords that a spherical projection turns into visible spikes: every point is
 * pushed out to the sphere exactly, and nothing between two points is guessed.
 */
export function subdivideLL(ring: number[][], maxStep = 0.5): THREE.Vector3[] {
  const out: THREE.Vector3[] = []
  const v = new THREE.Vector3()
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    let dLon = b[0] - a[0]
    // never interpolate across the antimeridian seam
    if (Math.abs(dLon) > 180) {
      out.push(llToVec(a[0], a[1], 1, v).clone())
      continue
    }
    const dLat = b[1] - a[1]
    const steps = Math.min(24, Math.max(1, Math.ceil(Math.max(Math.abs(dLon), Math.abs(dLat)) / maxStep)))
    for (let k = 0; k < steps; k++) {
      const t = k / steps
      out.push(llToVec(a[0] + dLon * t, a[1] + dLat * t, 1, v).clone())
    }
  }
  return out
}

/** Displacement for one vertex: outward where land, inward where sea, with a
 *  smooth ramp so the coastline itself stays exactly on the sphere. */
export function carveVertex(m: number) {
  return 1 + (m - 0.5) * 0.012
}

/** Decode one packed line set into rings of lon/lat degrees. */
export function decodeRings(packed: PackedLines, q: number): number[][][] {
  const bytes = Uint8Array.from(atob(packed.data), (c) => c.charCodeAt(0))
  const rings: number[][][] = []
  let i = 0
  let x = 0
  let y = 0

  const readVarint = () => {
    let shift = 0
    let value = 0
    for (;;) {
      const b = bytes[i++]
      value |= (b & 0x7f) << shift
      if (!(b & 0x80)) break
      shift += 7
    }
    // zig-zag
    return (value >>> 1) ^ -(value & 1)
  }

  for (const count of packed.counts) {
    const ring: number[][] = []
    for (let k = 0; k < count; k++) {
      x += readVarint()
      y += readVarint()
      ring.push([x / q, y / q])
    }
    rings.push(ring)
  }
  return rings
}

/** Sample the coverage mask at a lon/lat, on the CPU, for vertical carving. */
export function sampleMask(mask: Uint8Array, width: number, height: number, lon: number, lat: number) {
  const x = Math.min(width - 1, Math.max(0, Math.round(((lon + 180) / 360) * (width - 1))))
  const y = Math.min(height - 1, Math.max(0, Math.round(((90 - lat) / 180) * (height - 1))))
  return mask[y * width + x] / 255
}

/** Lossless coverage bytes, without image decode or GPU-to-CPU readback. */
export async function loadMaskPixels(): Promise<{ data: Uint8Array; width: number; height: number }> {
  const res = await fetch(new URL('./geo/land.mask', import.meta.url))
  if (!res.ok) throw new Error('Could not load land coverage')
  return decodeMask(await res.arrayBuffer())
}

/**
 * Dot product between a point on the unit sphere and the direction from the
 * globe's centre to the camera expressed in the globe's own frame. Anything at
 * or below zero is on the far side: hidden, it would show through the ocean as
 * a tangle of stray lines, which three has no depth-buffer trick to avoid
 * because the lines sit outside the surface they belong to.
 */
export function facingCamera(
  group: THREE.Object3D,
  camera: THREE.Camera,
  point: THREE.Vector3,
  target = new THREE.Vector3(),
) {
  group.updateWorldMatrix(true, false)
  target.copy(camera.position)
  group.worldToLocal(target)
  return point.dot(target.normalize())
}

/** Merge rings into one LineSegments geometry, skipping antimeridian jumps. */
export function ringsToGeometry(rings: THREE.Vector3[][]) {
  const positions: number[] = []
  for (const ring of rings) {
    for (let i = 0; i + 1 < ring.length; i++) {
      const a = ring[i]
      const b = ring[i + 1]
      // A segment that would cut across the globe is an artefact of the seam.
      if (a.distanceToSquared(b) > 0.64) continue
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geo
}

/* -------------------------------------------------------------------------- */
/* Great circles                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The shortest path across the surface between two lon/lat points, as a list
 * of sphere points. Slerp, so a route from India to Europe arcs north over
 * Iran and Turkey rather than running flat across the map: that is what makes
 * it read as a real trade route instead of a drawn line.
 */
export function greatCircle(
  from: [number, number],
  to: [number, number],
  radius = 1,
  segments = 96,
): THREE.Vector3[] {
  const a = llToVec(from[0], from[1], radius)
  const b = llToVec(to[0], to[1], radius)
  const out: THREE.Vector3[] = []
  const qa = new THREE.Quaternion()
  const qb = new THREE.Quaternion()
  const q = new THREE.Quaternion()
  // slerp through quaternions applied to a reference axis is awkward; use
  // angle interpolation on the vectors directly
  const angle = a.angleTo(b)
  const sin = Math.sin(angle)
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    if (sin < 1e-6) {
      out.push(a.clone())
      continue
    }
    const s0 = Math.sin((1 - t) * angle) / sin
    const s1 = Math.sin(t * angle) / sin
    out.push(
      new THREE.Vector3(
        a.x * s0 + b.x * s1,
        a.y * s0 + b.y * s1,
        a.z * s0 + b.z * s1,
      ).normalize().multiplyScalar(radius),
    )
  }
  void qa
  void qb
  void q
  return out
}
