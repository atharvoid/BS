import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/** Actual production geometry, shared by components, framing and clearance tests. */
export const FABRIC_SAMPLE = { thickness: .012, foldRadius: .045, spacing: .132, width: 1.38 }
export const FABRIC_COLOURS = ['#536685', '#d5c5a4', '#657b93'] as const
export const COMMODITY_COLOURS = ['#eee2bc', '#b76b37', '#c49a46'] as const

/** A continuous U-fold, not a padded cuboid. Points trace the lower leaf, the
 * small rear return, then the upper leaf. Only the final sample opens upward. */
export function fabricPath(open: boolean): THREE.Vector2[] {
  const path: THREE.Vector2[] = [] // (z,y)
  for (let i = 0; i <= 8; i++) path.push(new THREE.Vector2(.43 - .78 * i / 8, 0))
  for (let i = 1; i <= 10; i++) {
    const a = Math.PI * i / 10
    path.push(new THREE.Vector2(-.35 - FABRIC_SAMPLE.foldRadius * Math.sin(a), FABRIC_SAMPLE.foldRadius * (1 - Math.cos(a))))
  }
  for (let i = 1; i <= 16; i++) {
    const t = i / 16
    const rise = open ? .29 * Math.sin(t * Math.PI * .68) ** 2 : 0
    path.push(new THREE.Vector2(-.35 + .72 * t, .09 + rise))
  }
  return path
}

/** Closed thin volume with thickness measured normal to the fold path. */
export function makeFoldedLength(width: number, open = false) {
  const path = fabricPath(open), n = path.length, across = 6
  const positions: number[] = [], uv: number[] = [], colours: number[] = [], indices: number[] = []
  for (let side = 0; side < 2; side++) for (let v = 0; v < n; v++) {
    const before = path[Math.max(0, v - 1)], after = path[Math.min(n - 1, v + 1)]
    const tangent = after.clone().sub(before).normalize()
    for (let u = 0; u <= across; u++) {
      const s = u / across, sign = side ? -1 : 1
      const offset = FABRIC_SAMPLE.thickness / 2 * sign
      const ripple = .0015 * Math.sin(s * Math.PI * 4) * Math.sin(v / (n - 1) * Math.PI)
      const opened = open && v > 18 ? (v - 18) / (n - 19) : 0
      const twist = .045 * (s - .5) * Math.sin(opened * Math.PI * .8)
      positions.push((s - .5) * width, path[v].y + tangent.x * offset + ripple + twist, path[v].x - tangent.y * offset + .008 * Math.sin(s * Math.PI * 2) * opened ** 2)
      uv.push(s, v / (n - 1) * 1.8)
      // A narrow selvedge at the cut sides; no thick piping or cushion seams.
      const tone = u === 0 || u === across ? .79 : 1
      colours.push(tone, tone, tone)
    }
  }
  const row = across + 1, layer = row * n
  for (let v = 0; v < n - 1; v++) for (let u = 0; u < across; u++) {
    const a = v * row + u, b = a + row
    indices.push(a, a + 1, b, a + 1, b + 1, b)
    indices.push(a + layer, b + layer, a + 1 + layer, a + 1 + layer, b + layer, b + 1 + layer)
  }
  // Close both selvedges and the two cut ends.
  const wall = (a: number, b: number) => indices.push(a, b, a + layer, b, b + layer, a + layer)
  for (let v = 0; v < n - 1; v++) { wall(v * row, (v + 1) * row); wall((v + 1) * row + across, v * row + across) }
  for (let u = 0; u < across; u++) { wall(u + 1, u); wall((n - 1) * row + u, (n - 1) * row + u + 1) }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  // The first shell follows the outward path normal; winding must agree.
  for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]]
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingBox()
  return geometry
}

export function makeFabricSamples(materials?: THREE.Material[]) {
  const group = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const mat = materials?.[i] ?? new THREE.MeshStandardMaterial({ color: FABRIC_COLOURS[i], roughness: .92, vertexColors: true })
    const leaf = new THREE.Mesh(makeFoldedLength([1.38, 1.30, 1.34][i], i === 2), mat)
    leaf.name = `folded-length-${i}`
    leaf.position.set([-.025, .045, 0][i], i * FABRIC_SAMPLE.spacing, [0, -.015, .025][i])
    group.add(leaf)
  }
  return group
}

export type HolderVariant = 'shallow' | 'stepped'
export function commodityLevels(variant: HolderVariant) { return variant === 'stepped' ? [.05, .25, .45] : [.05, .05, .05] }

/** Grain coordinates are deterministic. The same matrices feed tests and the
 * InstancedMeshes; instance count alone is not treated as a performance claim. */
export function commodityGrains(kind: number, variant: HolderVariant) {
  const level = commodityLevels(variant)[kind]
  const grains: { position: [number, number, number]; scale: [number, number, number]; yaw: number }[] = []
  for (let row = 0; row < 6; row++) for (let col = 0; col < 8; col++) {
    const seed = Math.sin((row * 8 + col + 1) * (kind + 7) * 12.9898) * 43758.5453
    const jitter = seed - Math.floor(seed)
    const x = (col - 3.5) * .041 + (jitter - .5) * .009
    const z = (row - 2.5) * .077 + Math.sin(col * 7 + row) * .005
    const dome = Math.sqrt(Math.max(0, 1 - (x / .185) ** 2 - (z / .26) ** 2))
    const mound = variant === 'stepped' ? .09 : .025
    const y = level + (variant === 'stepped' ? .07 : .025) + mound * dome + .007
    grains.push({ position: [x + (kind - 1) * .49, y, z], scale: kind === 0 ? [.013, .008, .031] : kind === 1 ? [.022, .009, .020] : [.016, .011, .025], yaw: jitter * Math.PI })
  }
  return grains
}

export function makeCommoditySamples(variant: HolderVariant = 'stepped') {
  const group = new THREE.Group(), levels = commodityLevels(variant)
  const pieces: THREE.BufferGeometry[] = []
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    pieces.push(new THREE.BoxGeometry(w, h, d).translate(x, y, z))
  }
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * .49, y = levels[i]
    // Solid plinth under each sampling compartment, with a low retaining rim.
    box(.46, y + .04, .64, x, (y - .04) / 2, 0)
    const rim = variant === 'stepped' ? .07 : .085
    box(.46, rim, .025, x, y + rim / 2, .3075)
    box(.46, rim, .025, x, y + rim / 2, -.3075)
    box(.025, rim, .59, x - .2175, y + rim / 2, 0)
    box(.025, rim, .59, x + .2175, y + rim / 2, 0)
  }
  const holder = new THREE.Mesh(mergeGeometries(pieces), new THREE.MeshStandardMaterial({ color: '#b69a73', roughness: .84 }))
  holder.name = `sample-holder-${variant}`; group.add(holder); pieces.forEach(g => g.dispose())
  const grainGeometry = new THREE.SphereGeometry(1, 6, 3)
  const moundGeometry = new THREE.SphereGeometry(1, 10, 5)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < 3; i++) {
    const material = new THREE.MeshStandardMaterial({ color: COMMODITY_COLOURS[i], roughness: .86 })
    const mound = new THREE.Mesh(moundGeometry, material)
    mound.name = `sample-bed-${i}`
    mound.position.set((i - 1) * .49, levels[i] + (variant === 'stepped' ? .07 : .025), 0)
    mound.scale.set(.185, variant === 'stepped' ? .09 : .025, .26)
    group.add(mound)
    const grains = commodityGrains(i, variant)
    const mesh = new THREE.InstancedMesh(grainGeometry, material, grains.length)
    mesh.name = `sample-grains-${i}`
    grains.forEach((grain, j) => {
      dummy.position.set(...grain.position); dummy.scale.set(...grain.scale); dummy.rotation.set(.12, grain.yaw, 0); dummy.updateMatrix()
      mesh.setMatrixAt(j, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingBox(); mesh.computeBoundingSphere()
    group.add(mesh)
  }
  return group
}

/** Components own these per-model resources; shared geometries/materials within
 * a model are disposed exactly once, never the shared studio environment. */
export function disposeSampleModel(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
  group.traverse(obj => { const mesh = obj as THREE.Mesh; if (mesh.isMesh) { geometries.add(mesh.geometry); for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(m) } })
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
}
