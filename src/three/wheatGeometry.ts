import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// A plump, keeled husk. Its thick middle catches the studio light and its
// upper third tapers to a point, leaving a notch between adjacent spikelets.
function makeHusk() {
  const rings = [
    // height, half-width, depth, distance out from the stalk
    [0.00, 0.018, 0.014, 0.005],
    [0.14, 0.086, 0.060, 0.030],
    [0.38, 0.125, 0.091, 0.108],
    [0.62, 0.117, 0.077, 0.184],
    [0.81, 0.070, 0.042, 0.257],
    [0.95, 0.022, 0.014, 0.307],
  ]
  const sides = 8
  const positions: number[] = []
  const faces: number[] = []
  for (const [height, width, depth, radial] of rings) {
    for (let side = 0; side < sides; side++) {
      const angle = 2 * Math.PI * side / sides
      const ridge = side === 0 ? 1.26 : 1
      positions.push(Math.sin(angle) * width, height * .52, radial + Math.cos(angle) * depth * ridge)
    }
  }
  for (let ring = 1; ring < rings.length; ring++) {
    for (let side = 0; side < sides; side++) {
      const lower = (ring - 1) * sides
      const a = lower + side, b = lower + (side + 1) % sides
      faces.push(a, b, b + sides, a, b + sides, a + sides)
    }
  }
  const tip = positions.length / 3
  positions.push(0, .52, .327, 0, 0, .005)
  const last = (rings.length - 1) * sides
  for (let side = 0; side < sides; side++) {
    const next = (side + 1) % sides
    faces.push(last + side, last + next, tip, next, side, tip + 1)
  }
  const husk = new THREE.BufferGeometry()
  husk.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  husk.setIndex(faces)
  husk.computeVertexNormals()
  // Colour in source-part coordinates, before the stagger and baked lean.
  const colours: number[] = []
  const base = new THREE.Color('#C99B49')
  const ridge = new THREE.Color('#DDB96F')
  const root = new THREE.Color('#9D783C')
  for (let i = 0; i < positions.length / 3; i++) {
    const ring = Math.floor(i / sides)
    const side = i % sides
    const colour = base.clone()
    if (ring < 2) colour.lerp(root, (2 - ring) / 6)
    else if (side === 0 || side === 1 || side === 7) colour.lerp(ridge, Math.min(1 / 3, (ring - 1) / 12))
    colours.push(colour.r, colour.g, colour.b)
  }
  husk.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  return husk
}

function taperedStem(start: THREE.Vector3, end: THREE.Vector3, base: number, tip: number) {
  const direction = end.clone().sub(start)
  const geometry = new THREE.CylinderGeometry(tip, base, direction.length(), 8)
  geometry.deleteAttribute('uv')
  const colour = new THREE.Color(base > .02 ? '#B79453' : '#CDA958')
  const colours = new Float32Array(geometry.getAttribute('position').count * 3)
  for (let i = 0; i < colours.length; i += 3) colours.set([colour.r, colour.g, colour.b], i)
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()))
  const centre = start.clone().lerp(end, .5)
  return geometry.translate(centre.x, centre.y, centre.z)
}

export function makeWheatHead() {
  const profile = makeHusk()
  const parts: THREE.BufferGeometry[] = [taperedStem(new THREE.Vector3(0, -.42, 0), new THREE.Vector3(0, 1.14, 0), .038, .014)]
  // Two staggered ranks of spikelets. Each holds two husks that open away
  // from each other, keeping a broad face visible on the side views as well.
  const fullness = [.79, .97, 1.09, 1.11, 1.04, .89, .67]
  for (const [level, width] of fullness.entries()) {
    for (const side of [0, 1]) {
      for (const flank of [-1, 1]) {
        const angle = side * Math.PI + flank * .66 + .12 * Math.sin(level * 1.7)
        const height = level * .16 + side * .075 + flank * .02
        const length = (.84 + .16 * width) * (flank === 1 ? 1 : .94)
        const husk = profile.clone().scale(width, length, width)
        husk.rotateY(angle).translate(0, height, 0)
        parts.push(husk)
        if (level >= 4 && flank === (level % 2 === 0 ? 1 : -1)) {
          const root = new THREE.Vector3(0, height + .52 * length - .015, .316 * width)
          const end = root.clone().add(new THREE.Vector3(.014 * flank, .15 + .029 * (level - 4), .05))
          parts.push(taperedStem(root, end, .012, .002).rotateY(angle))
        }
      }
    }
  }
  const merged = mergeGeometries(parts)!
  merged.rotateZ(-.36)
  for (const part of parts) part.dispose()
  profile.dispose()
  return merged
}
