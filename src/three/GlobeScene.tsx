import React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Studio } from './objects'
import { createDrag } from './drag'
import { reducedMotion } from './motion'
import {
  decodeRings,
  getLandMask,
  greatCircle,
  loadGeo,
  llToVec,
  ringsToGeometry,
  subdivideLL,
} from './geo'

/* ==========================================================================
   GlobeScene — a real Earth, built from real geography.

   Everything here is driven by Natural Earth 1:50m coastline data: the mask
   gives the land its fill, the vectors give it a crisp edge, and the vertex
   shader carves the continents so they stand proud of the sea. Fixed points
   are true coordinates; routes are true great circles.

   Cost. There is exactly one draw per route, two for the coastline, and one for
   the sphere. Nothing is rebuilt per frame, the camera direction is pushed as
   a single uniform, and the scene runs on demand: it goes flat while the
   visitor is dragging, so the pointer gets the whole frame budget, and it
   settles back to a slow drift afterwards. Frame rate itself is capped by the
   parent (see Stage), which is what keeps scrolling over the hero smooth.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Geography the business actually cares about                                 */
/* -------------------------------------------------------------------------- */

/** Textile centres in the two initial sourcing areas. Exact coordinates. */
export const ORIGINS = [
  { name: 'Tamil Nadu', lon: 77.34, lat: 11.1 },
  { name: 'Gujarat', lon: 72.57, lat: 23.02 },
] as const

/**
 * Where material goes. Each is a real destination market, not decoration, and
 * the set is the spread a sourcing business would actually quote.
 */
export const ROUTES: { to: [number, number]; hue: 'light' | 'gold' | 'deep' }[] = [
  { to: [77.21, 28.61], hue: 'light' }, // Delhi
  { to: [72.88, 19.08], hue: 'light' }, // Mumbai
  { to: [78.47, 17.38], hue: 'light' }, // Hyderabad
  { to: [80.27, 13.08], hue: 'gold' }, // Chennai
  { to: [79.86, 6.93], hue: 'gold' }, // Colombo
  { to: [55.27, 25.2], hue: 'deep' }, // Dubai
  { to: [103.82, 1.35], hue: 'deep' }, // Singapore
  { to: [106.66, 10.76], hue: 'deep' }, // Ho Chi Minh City
  { to: [90.41, 23.81], hue: 'gold' }, // Dhaka
  { to: [4.9, 52.37], hue: 'gold' }, // Amsterdam
  { to: [-0.13, 51.51], hue: 'gold' }, // London
  { to: [9.19, 45.46], hue: 'gold' }, // Milan
  { to: [151.21, -33.87], hue: 'deep' }, // Sydney
  { to: [-74.0, 40.71], hue: 'light' }, // New York
]

/** Camera direction in the globe's own frame, shared by every line shader. */
function useMemoCam() {
  return React.useMemo(() => ({ uCam: { value: new THREE.Vector3(0, 0, 8) } }), [])
}

/* -------------------------------------------------------------------------- */
/* Shaders                                                                     */
/* -------------------------------------------------------------------------- */

/* Gold land on navy water. The separation between the two is what makes the
   continents readable at a glance, so it is kept deliberately wide: one is the
   brightest thing on the object and the other the darkest. */
const OCEAN = '#1b2744'
const OCEAN_DEEP = '#0e1526'
const LAND_LOW = '#8a7440'
const LAND_HIGH = '#dabc72'
const COAST_LIGHT = '#f0dca8'

/*
 * The continents are carved here, on the GPU, rather than by displacing every
 * sphere vertex on the CPU at startup. Forty thousand mask lookups used to
 * happen before the first frame, which is exactly the kind of stall a visitor
 * reads as "the site is heavy". Now the vertex shader samples the mask, so the
 * mesh can be denser at no startup cost and the silhouette is smoother.
 */
const globeVert = /* glsl */ `
  precision highp float;
  uniform sampler2D uMask;
  uniform float uCarve;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  const float MASK_SHIFT_V = 0.25;

  float landAt(vec2 uv) {
    return texture2D(uMask, vec2(fract(uv.x + MASK_SHIFT_V), uv.y)).r;
  }

  void main() {
    vUv = uv;

    /* Land stands proud of the sea by a fraction of the radius. Enough to catch
       a rim light on every coast, small enough to keep the sphere a sphere. */
    float land = landAt(uv);
    float lift = mix(0.5, 1.0, smoothstep(0.35, 0.8, land));
    vec3 carved = position * (1.0 + (lift - 0.5) * uCarve);

    vec4 world = modelMatrix * vec4(carved, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const globeFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uMask;
  /* The mask is an equirectangular image with u = 0 at 180W. three's sphere
     UVs start a quarter turn earlier, so the lookup is shifted rather than
     the whole world being rotated. */
  const float MASK_SHIFT = 0.25;
  uniform vec3 uOcean;
  uniform vec3 uOceanDeep;
  uniform vec3 uLandLow;
  uniform vec3 uLandHigh;
  uniform vec3 uCoast;
  uniform vec3 uSunDir;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  float maskAt(vec2 uv) {
    return texture2D(uMask, vec2(fract(uv.x + MASK_SHIFT), uv.y)).r;
  }

  void main() {
    float land = maskAt(vUv);

    /* Bevel: land lifts toward its interior, coasts sit a touch lower. The
       relief itself is in the vertex shader, so this only needs the coverage
       gradient for shading. */
    float inland = smoothstep(0.55, 0.92, land);
    float height = land * (0.55 + 0.45 * inland);

    /* Shade from the surface normal alone. The carve already tilts the normal
       at every coast, so a flat map look is impossible without extra taps. */
    vec3 n = normalize(vNormalW);

    float diff = clamp(dot(n, normalize(uSunDir)), 0.0, 1.0);
    float terminator = smoothstep(-0.45, 0.55, diff);
    float rim = 1.0 - clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0);

    /* Sea: two tones and a faint banding so it never reads as flat paint. */
    float seaBand = 0.5 + 0.5 * sin(vUv.y * 90.0 + vUv.x * 26.0);
    vec3 sea = mix(uOceanDeep, uOcean, 0.45 + 0.3 * seaBand);
    sea += vec3(0.08, 0.12, 0.19) * pow(rim, 2.0) * 0.5;

    /* Land: elevation ramp, warm in the light, cooler in shadow. */
    vec3 ground = mix(uLandLow, uLandHigh, clamp(height * (0.55 + diff * 0.75), 0.0, 1.0));

    /* A bright hairline where land meets sea, following the mask edge. */
    float edge = smoothstep(0.05, 0.0, abs(land - 0.5));
    ground = mix(ground, uCoast, edge * 0.45);

    vec3 color = mix(sea, ground, smoothstep(0.42, 0.58, land));

    /* Shade: a fixed sun, plus a soft ambient so the night side stays legible
       rather than going black. */
    color *= 0.76 + 0.34 * diff;
    color += vec3(0.05, 0.065, 0.1) * (1.0 - terminator) * 0.85;

    /* Atmosphere: a thin cool halo at the limb. */
    color += vec3(0.26, 0.36, 0.5) * pow(rim, 3.2) * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`

/* -------------------------------------------------------------------------- */
/* Routes: great circles with a travelling comet                               */
/* -------------------------------------------------------------------------- */

/* Three weights of one colour. The routes have to be distinguishable from each
   other without introducing a second hue, so they differ in brightness rather
   than in colour. */
const ROUTE_COLORS: Record<string, string> = {
  light: '#f0dca8',
  gold: '#dabc72',
  deep: '#a8873f',
}

const ROUTE_HEX: Record<string, string> = {
  light: '#fbf0d2',
  gold: '#e8ce8e',
  deep: '#c2a05a',
}

/**
 * Routes as thin ribbons with a travelling comet.
 *
 * Two hacks worth explaining. A WebGL line is one device pixel wide and cannot
 * carry per-vertex brightness, so a comet drawn as a line has nothing to vary.
 * Each route is therefore a two-vertex-wide triangle strip with an `aAlong`
 * attribute, which lets the fragment shader place the comet anywhere on it.
 *
 * And the far hemisphere has to be hidden by hand. A line floating outside a
 * sphere is not occluded by it, so every fragment compares its own surface
 * normal against the camera direction and fades out before the limb. The
 * camera is pushed in from the CPU because this material has no `inverse()`.
 */
function RouteLines() {
  const built = React.useMemo(() => {
    const out: {
      geo: THREE.BufferGeometry
      color: THREE.Color
      offset: number
    }[] = []
    let n = 0
    for (const origin of ORIGINS) {
      for (const route of ROUTES) {
        const geo = ribbonFor(origin, route.to)
        if (!geo) continue
        out.push({ geo, color: new THREE.Color(ROUTE_HEX[route.hue]), offset: (n += 0.19) % 1 })
      }
    }
    return out
  }, [])

  const materials = React.useMemo(
    () =>
      built.map(
        (b) =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            /* The strip is built along a path, so its winding depends on the
               direction of travel. Drawing both faces is cheaper than sorting
               that out per ribbon, and it means a route is never invisible
               because it happens to run the other way round the sphere. */
            side: THREE.DoubleSide,
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: b.color },
              uOffset: { value: b.offset },
              uCam: { value: new THREE.Vector3(0, 0, 8) },
            },
            vertexShader: routeVert,
            fragmentShader: routeFrag,
          }),
      ),
    [built],
  )
  React.useEffect(
    () => () => {
      built.forEach((b) => b.geo.dispose())
      materials.forEach((m) => m.dispose())
    },
    [built, materials],
  )

  const group = React.useRef<THREE.Group>(null)
  const camera = useThree((st) => st.camera)

  useFrame((state) => {
    const host = group.current
    if (!host) return
    /* One matrix read and one uniform per route. The camera is re-expressed in
       the globe's own frame so the shader can compare it with local normals. */
    host.updateWorldMatrix(true, false)
    const cam = camera.position.clone()
    host.worldToLocal(cam)
    const t = state.clock.elapsedTime
    for (let i = 0; i < materials.length; i++) {
      const u = materials[i].uniforms
      u.uTime.value = t
      u.uCam.value.copy(cam)
    }
  })

  return (
    <group ref={group}>
      {built.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={materials[i]} frustumCulled={false} renderOrder={4} />
      ))}
    </group>
  )
}

const routeVert = /* glsl */ `
  attribute float aAlong;
  attribute float aNormal;
  attribute vec3 aUp;
  varying float vAlong;
  varying float vFacing;
  varying float vNormal;
  uniform vec3 uCam;
  void main() {
    vAlong = aAlong;
    vNormal = aNormal;
    // aUp is the outward surface direction, kept in its own attribute so it is
    // never confused with three's shading normal.
    vFacing = dot(normalize(aUp), normalize(uCam));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const routeFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOffset;
  varying float vAlong;
  varying float vFacing;
  varying float vNormal;
  void main() {
    /* A faint permanent path, so even a still frame shows the network. */
    float a = 0.1;
    float head = 0.0;
    for (int i = 0; i < 2; i++) {
      float p = fract(uTime * 0.055 + uOffset + float(i) * 0.5);
      float d = abs(vAlong - p);
      head += exp(-d * 34.0) * 1.1 + exp(-d * 8.0) * 0.28;
    }
    a = (a + head) * smoothstep(0.015, 0.30, vFacing);
    /* Taper the ribbon at its edges so it reads as a stroke, not a band. */
    a *= smoothstep(0.0, 0.35, 1.0 - abs(vNormal));
    gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0));
  }
`

function ribbonFor(from: { lon: number; lat: number }, to: [number, number]) {
  const pts = greatCircle([from.lon, from.lat], to, 1.006, 140)
  if (pts.length < 2) return null
  const positions = new Float32Array(pts.length * 2 * 3)
  const up = new Float32Array(pts.length * 2 * 3)
  const along = new Float32Array(pts.length * 2)
  const across = new Float32Array(pts.length * 2)
  const index: number[] = []
  const R = 1.006
  const HALF = 0.0055
  const v = new THREE.Vector3()
  const prev = new THREE.Vector3()
  const next = new THREE.Vector3()
  const nrm = new THREE.Vector3()
  const side = new THREE.Vector3()

  for (let i = 0; i < pts.length; i++) {
    v.copy(pts[i]).normalize()
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    prev.copy(a).normalize()
    next.copy(b).normalize()
    nrm.copy(v)
    side.copy(next).sub(prev).normalize().cross(nrm).normalize()
    const t = i / (pts.length - 1)
    for (let s = 0; s < 2; s++) {
      const k = i * 2 + s
      const sign = s === 0 ? -1 : 1
      const px = v.x * R + side.x * HALF * sign
      const py = v.y * R + side.y * HALF * sign
      const pz = v.z * R + side.z * HALF * sign
      positions[k * 3] = px
      positions[k * 3 + 1] = py
      positions[k * 3 + 2] = pz
      up[k * 3] = nrm.x
      up[k * 3 + 1] = nrm.y
      up[k * 3 + 2] = nrm.z
      along[k] = t
      across[k] = sign
    }
    if (i < pts.length - 1) {
      const a0 = i * 2
      const a1 = i * 2 + 1
      const b0 = (i + 1) * 2
      const b1 = (i + 1) * 2 + 1
      index.push(a0, b0, a1, a1, b0, b1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aUp', new THREE.BufferAttribute(up, 3))
  geo.setAttribute('aAlong', new THREE.BufferAttribute(along, 1))
  geo.setAttribute('aNormal', new THREE.BufferAttribute(across, 1))
  geo.setIndex(index)
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2)
  return geo
}

/* -------------------------------------------------------------------------- */
/* Marker: a precise point on the surface, with a pulse                        */
/* -------------------------------------------------------------------------- */

function OriginMarker({ lon, lat, phase }: { lon: number; lat: number; phase: number }) {
  const pos = React.useMemo(() => llToVec(lon, lat, 1.006), [lon, lat])
  const mat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uPhase: { value: phase } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime;
          uniform float uPhase;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv - 0.5;
            float r = length(p) * 2.0;
            /* Concentric rings travelling outward, plus a solid core. */
            float wave = fract(r - uTime * 0.28 + uPhase);
            float ring = smoothstep(0.85, 1.0, wave) * smoothstep(1.0, 0.93, r);
            float core = smoothstep(0.30, 0.0, r);
            float a = ring * 0.55 + core * 0.95;
            vec3 gold = vec3(0.96, 0.87, 0.66);
            gl_FragColor = vec4(gold, clamp(a, 0.0, 1.0));
          }
        `,
      }),
    [phase],
  )
  React.useEffect(() => () => mat.dispose(), [mat])
  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh position={pos} material={mat} renderOrder={5}>
      <planeGeometry args={[0.058, 0.058]} />
    </mesh>
  )
}

/* -------------------------------------------------------------------------- */

function Earth({ uniforms }: { uniforms: { uTime: THREE.IUniform<number>; uSun: THREE.IUniform<THREE.Vector3> } }) {
  const mask = React.useMemo(() => getLandMask(), [])
  const viewport = useThree((s) => s.viewport)

  /* A denser sphere than before, because the displacement is no longer done in
     JavaScript: the vertex shader samples the mask, so 320x180 costs nothing at
     startup and the coasts are smoother than the old 256x160. A phone draws the
     globe at a third of the width, where the extra tessellation is invisible,
     so it gets a lighter mesh. */
  const segments = viewport.aspect < 1.15 ? ([220, 124] as const) : ([320, 180] as const)
  const geometry = React.useMemo(() => {
    const g = new THREE.SphereGeometry(1, segments[0], segments[1])
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.05)
    return g
  }, [segments])
  React.useEffect(() => () => geometry.dispose(), [geometry])

  const mat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMask: { value: mask },
          uMaskSize: { value: new THREE.Vector2(2048, 1024) },
          uCarve: { value: 0.012 },
          uOcean: { value: new THREE.Color(OCEAN) },
          uOceanDeep: { value: new THREE.Color(OCEAN_DEEP) },
          uLandLow: { value: new THREE.Color(LAND_LOW) },
          uLandHigh: { value: new THREE.Color(LAND_HIGH) },
          uCoast: { value: new THREE.Color(COAST_LIGHT) },
          uTime: uniforms.uTime,
          uSunDir: uniforms.uSun,
        },
        vertexShader: globeVert,
        fragmentShader: globeFrag,
      }),
    [mask, uniforms.uTime, uniforms.uSun],
  )
  React.useEffect(() => () => mat.dispose(), [mat])

  return <mesh geometry={geometry} material={mat} />
}

/**
 * Vector coastlines and borders.
 *
 * Built once, then never touched. Occlusion is decided per fragment instead:
 * each vertex carries its own surface normal, the vertex shader dots that
 * against the camera direction expressed in the globe's own frame, and
 * anything pointing away is discarded. A line drawn outside the sphere is
 * never occluded by it, so this is the only way to keep the far hemisphere's
 * coastlines from showing through the ocean, and it costs nothing per frame.
 */
function GeoLines() {
  const [state, setState] = React.useState<{
    coast: THREE.BufferGeometry
    border: THREE.BufferGeometry
  } | null>(null)

  React.useEffect(() => {
    let live = true
    loadGeo().then((geo) => {
      if (!live) return
      const coast = ringsToGeometry(
        decodeRings(geo.coast, geo.meta.quantum).map((r) => subdivideLL(r, 0.45)),
      )
      const border = ringsToGeometry(
        decodeRings(geo.border, geo.meta.quantum).map((r) => subdivideLL(r, 0.3)),
      )
      // Normals are just the normalised position: it is a sphere.
      for (const g of [coast, border]) {
        const p = g.getAttribute('position')
        const n = new Float32Array(p.count * 3)
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i)
          const y = p.getY(i)
          const z = p.getZ(i)
          const l = Math.hypot(x, y, z) || 1
          n[i * 3] = x / l
          n[i * 3 + 1] = y / l
          n[i * 3 + 2] = z / l
        }
        g.setAttribute('normal', new THREE.BufferAttribute(n, 3))
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2)
      }
      setState({ coast, border })
    })
    return () => {
      live = false
    }
  }, [])

  React.useEffect(
    () => () => {
      state?.coast.dispose()
      state?.border.dispose()
    },
    [state],
  )

  const uniforms = useMemoCam()

  const mat = React.useCallback(
    (radius: number, opacity: number) =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uCam: uniforms.uCam,
          uRadius: { value: radius },
          uOpacity: { value: opacity },
          uTint: { value: new THREE.Color('#f0dca8') },
        },
        vertexShader: lineVert,
        fragmentShader: lineFrag,
      }),
    [uniforms.uCam],
  )

  const coastMat = React.useMemo(() => mat(1.0105, 0.85), [mat])
  const borderMat = React.useMemo(() => mat(1.0102, 0.2), [mat])
  React.useEffect(
    () => () => {
      coastMat.dispose()
      borderMat.dispose()
    },
    [coastMat, borderMat],
  )

  const group = React.useRef<THREE.Group>(null)
  const camera = useThree((st) => st.camera)

  useFrame(() => {
    // The camera direction has to be re-expressed every frame: the globe turns.
    const host = group.current
    if (!host) return
    host.updateWorldMatrix(true, false)
    const cam = camera.position.clone()
    host.worldToLocal(cam)
    uniforms.uCam.value.copy(cam)
  })

  if (!state) return null

  return (
    <group ref={group}>
      <lineSegments geometry={state.coast} material={coastMat} frustumCulled={false} renderOrder={3} />
      <lineSegments geometry={state.border} material={borderMat} frustumCulled={false} renderOrder={3} />
    </group>
  )
}

const lineVert = /* glsl */ `
  uniform float uRadius;
  uniform vec3 uCam;
  varying float vFacing;
  void main() {
    vFacing = dot(normalize(normal), normalize(uCam));
    vec3 p = normalize(position) * uRadius;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const lineFrag = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  uniform vec3 uTint;
  varying float vFacing;
  void main() {
    if (vFacing < 0.015) discard;
    /* Fade in over the limb so the outline does not end abruptly. */
    float a = uOpacity * smoothstep(0.015, 0.22, vFacing);
    gl_FragColor = vec4(uTint, a);
  }
`

/* -------------------------------------------------------------------------- */

function Globe() {
  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0 },
      uSun: { value: new THREE.Vector3(-0.62, 0.46, 0.86).normalize() },
    }),
    [],
  )
  const still = React.useMemo(() => reducedMotion(), [])
  const drag = React.useMemo(() => createDrag(0.5), [])
  const spin = React.useRef(0)

  /* Frame the globe on India from the first frame. This has to seed the drag
     state rather than the JSX rotation, because the per-frame loop owns the
     rotation and would overwrite a prop immediately. */
  const startY = React.useMemo(() => {
    // Aim the requested longitude at the camera by asking where it actually
    // lands, rather than assuming a sign. Robust to any convention change.
    const v = llToVec(78, 20, 1)
    // Turn a little past due-east so the origin sits left of the disc's centre,
    // away from the copy, with the routes fanning into open space.
    return -Math.atan2(v.x, v.z) - 0.16
  }, [])
  React.useMemo(() => {
    drag.current.y = startY
    drag.target.y = startY
    return null
  }, [drag, startY])

  const root = React.useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const d = Math.min(delta, 1 / 30)
    const g = root.current
    if (!g) return

    /* The clock only advances the comet shader; the globe's own rotation is
       integrated below so a dropped frame cannot make it jump. */
    uniforms.uTime.value += d

    if (!still && !drag.touched && !drag.dragging) spin.current += d * 0.045

    if (!drag.dragging) drag.target.y += drag.velocity.y * d
    const decay = Math.exp(-3.4 * d)
    drag.velocity.y *= decay
    drag.current.y = THREE.MathUtils.lerp(drag.current.y, drag.target.y + spin.current, 1 - Math.exp(-5.6 * d))
    g.rotation.y = drag.current.y
    g.rotation.x = THREE.MathUtils.lerp(drag.current.x, drag.target.x, 1 - Math.exp(-5.6 * d)) * 0.55
    g.rotation.z = 0.06
  })

  const bind = drag.bind()

  return (
    <group
      ref={root}
      rotation={[0, startY, 0.04]}
      onPointerDown={(e) => {
        e.stopPropagation()
        bind.onPointerDown(e as unknown as React.PointerEvent)
      }}
      onPointerMove={(e) => bind.onPointerMove(e as unknown as React.PointerEvent)}
      onPointerUp={(e) => bind.onPointerUp(e as unknown as React.PointerEvent)}
      onPointerLeave={(e) => bind.onPointerLeave(e as unknown as React.PointerEvent)}
    >
      <Earth uniforms={uniforms} />
      <GeoLines />
      <RouteLines />
      <OriginMarker lon={ORIGINS[0].lon} lat={ORIGINS[0].lat} phase={0} />
      <OriginMarker lon={ORIGINS[1].lon} lat={ORIGINS[1].lat} phase={0.5} />
    </group>
  )
}

/**
 * The hero scene.
 *
 * `onScreen` comes from the Stage's observer rather than being guessed here, so
 * the globe stops costing anything the moment the hero leaves the viewport. A
 * visitor scrolling to the enquiry form is not paying for a sphere they cannot
 * see, which used to be the single largest cost on the site.
 */
export function GlobeScene({ onScreen }: { onScreen?: boolean }) {
  const still = React.useMemo(() => reducedMotion(), [])

  return (
    <>
      <Studio />
      <ambientLight intensity={0.4} />
      <FrameMotion onScreen={onScreen} still={still}>
        <Globe />
      </FrameMotion>
    </>
  )
}

/** Keeps the globe framed on the copy side of the hero, at any aspect. */
function FrameMotion({
  children,
  onScreen,
  still,
}: {
  children: React.ReactNode
  onScreen?: boolean
  still: boolean
}) {
  const { viewport } = useThree()
  const narrow = viewport.aspect < 1.15
  const scale = narrow ? 0.92 : 1.06
  /* A parallax nudge with the pointer, written through a group transform, so
     moving the mouse over the hero does not cost a React render. It is off on
     every narrow screen, where there is no pointer to follow and the motion
     would only fight the finger. */
  const group = React.useRef<THREE.Group>(null)
  const pointer = React.useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    if (still || !onScreen) return
    const d = Math.min(delta, 1 / 30)
    const tx = narrow ? 0 : state.pointer.x * 0.06
    const ty = narrow ? 0 : state.pointer.y * 0.04
    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, tx, 1 - Math.exp(-3 * d))
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, ty, 1 - Math.exp(-3 * d))
    g.rotation.y = pointer.current.x
    g.rotation.x = -pointer.current.y
  })

  return (
    <group ref={group} scale={scale} position={narrow ? [0, 0.16, 0] : [0.06, 0.02, 0]}>
      {children}
    </group>
  )
}
