import { globeYaw, globeUserYaw } from './globe-pose'
import { useSceneDrag } from './useSceneDrag'
import { introActive, onIntroChange } from '../components/intro-state'
import { createGlobeGate } from './globe-gate'
import { useSceneSession } from './SceneSession'
import React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Studio } from './objects'
import { createDrag } from './drag'
import { reducedMotion } from './motion'
import { raycastGlobe } from './globe-raycast'
import {
  carveVertex,
  facingCamera,
  decodeRings,
  getLandMask,
  greatCircle,
  loadGeo,
  llToVec,
  ringsToGeometry,
  loadMaskPixels,
  sampleMask,
  subdivideLL,
} from './geo'

/* ==========================================================================
   GlobeScene — a real Earth, built from real geography.

   Everything here is driven by Natural Earth 1:5-m coastline data: the mask
   gives the land its fill, the vectors give it a crisp edge, and the shader
   carves the continents so they stand proud of the sea. Fixed points are true
   coordinates; routes are true great circles.

   Cost: one sphere, two line meshes, one marker mesh. All animation is
   uniform-driven, so a frame costs a handful of writes.
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
 * the pairs are the routes a sourcing business would actually quote.
 */
export const ROUTES: { to: [number, number]; hue: 'saffron' | 'madder' | 'verdigris' }[] = [
  { to: [78.47, 17.38], hue: 'madder' }, // Hyderabad, inland
  { to: [80.27, 13.08], hue: 'verdigris' }, // Chennai, coast
  { to: [106.66, 10.76], hue: 'saffron' }, // Ho Chi Minh City
  { to: [77.21, 28.61], hue: 'madder' }, // Delhi
  { to: [55.27, 25.2], hue: 'verdigris' }, // Dubai
  { to: [4.9, 52.37], hue: 'saffron' }, // Amsterdam
  { to: [-0.13, 51.51], hue: 'madder' }, // London
  { to: [9.19, 45.46], hue: 'verdigris' }, // Milan
  { to: [79.86, 6.93], hue: 'madder' }, // Colombo
  { to: [90.41, 23.81], hue: 'verdigris' }, // Dhaka
  { to: [103.82, 1.35], hue: 'saffron' }, // Singapore
  { to: [151.21, -33.87], hue: 'verdigris' }, // Sydney
  { to: [-74.0, 40.71], hue: 'saffron' }, // New York
  { to: [72.88, 19.08], hue: 'madder' }, // Mumbai
]

/** Camera direction in the globe's own frame, shared by every line shader. */
function useMemoCam() {
  return React.useMemo(() => ({ uCam: { value: new THREE.Vector3(0, 0, 8) } }), [])
}

/* -------------------------------------------------------------------------- */
/* Shaders                                                                     */
/* -------------------------------------------------------------------------- */

const OCEAN = '#24405f'
const OCEAN_DEEP = '#16283f'
const LAND_LOW = '#a99268'
const LAND_HIGH = '#e6d6b4'
const COAST_LIGHT = '#f0e2c4'

const globeVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const globeFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uMask;
  uniform vec2 uMaskSize;
  /* The mask is an equirectangular image with u = 0 at 180W. three's sphere
     UVs start a quarter turn earlier, so the lookup is shifted rather than
     the whole world being rotated. */
  const float MASK_SHIFT = 0.25;
  uniform vec3 uOcean;
  uniform vec3 uOceanDeep;
  uniform vec3 uLandLow;
  uniform vec3 uLandHigh;
  uniform vec3 uCoast;
  uniform float uTime;
  uniform vec3 uSunDir;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  /* A soft, wide sample of the mask, used as a height field for the bevel. */
  float maskAt(vec2 uv) {
    return texture2D(uMask, vec2(fract(uv.x + MASK_SHIFT), uv.y)).r;
  }

  void main() {
    float land = maskAt(vUv);

    /* Slope of the coverage: zero inland, non-zero only near a coast. That is
       all the information needed to fake a raised plateau without a real
       elevation dataset. */
    vec2 px = 1.0 / uMaskSize;
    float l = maskAt(vUv - vec2(px.x * 2.0, 0.0));
    float r = maskAt(vUv + vec2(px.x * 2.0, 0.0));
    float d = maskAt(vUv - vec2(0.0, px.y * 2.0));
    float u = maskAt(vUv + vec2(0.0, px.y * 2.0));
    vec2 slope = vec2(r - l, u - d);

    /* Bevel: land lifts toward its interior, coasts sit a touch lower. */
    float inland = smoothstep(0.55, 0.92, land);
    float height = land * (0.55 + 0.45 * inland);

    /* Perturb the normal along the slope, so coasts catch the light like a
       carved relief rather than a printed map. */
    vec3 n = normalize(vNormalW);
    vec3 tangentX = normalize(cross(n, vec3(0.0, 1.0, 0.0)) + vec3(1e-5));
    vec3 tangentY = normalize(cross(n, tangentX));
    n = normalize(n - (tangentX * slope.x + tangentY * slope.y) * 0.12 * land);

    float diff = clamp(dot(n, normalize(uSunDir)), 0.0, 1.0);
    float terminator = smoothstep(-0.45, 0.55, dot(normalize(vNormalW), normalize(uSunDir)));
    float rim = 1.0 - clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0);

    /* Sea: two tones and a faint banding so it never reads as flat paint. */
    float seaBand = 0.5 + 0.5 * sin(vUv.y * 90.0 + vUv.x * 26.0);
    vec3 sea = mix(uOceanDeep, uOcean, 0.45 + 0.3 * seaBand);
    /* A faint sheen toward the limb, so the ocean reads as a surface with a
       horizon rather than a flat panel. */
    sea += vec3(0.1, 0.16, 0.24) * pow(rim, 2.0) * 0.5;

    /* Land: elevation ramp, warm in the light, cooler in shadow. */
    vec3 ground = mix(uLandLow, uLandHigh, clamp(height * (0.55 + diff * 0.75), 0.0, 1.0));

    /* A bright hairline where land meets sea, following the mask edge. */
    float edge = smoothstep(0.05, 0.0, abs(land - 0.5));
    ground = mix(ground, uCoast, edge * 0.45);

    vec3 color = mix(sea, ground, smoothstep(0.42, 0.58, land));

    /* Shade: a fixed sun, plus a soft ambient so the night side stays legible
       rather than going black. */
    color *= 0.76 + 0.34 * diff;
    /* Night side stays readable: a cool ambient rather than a black hole. */
    color += vec3(0.055, 0.075, 0.11) * (1.0 - terminator) * 0.85;

    /* Atmosphere: a thin cool halo at the limb. */
    color += vec3(0.32, 0.46, 0.62) * pow(rim, 3.2) * 0.55;

    /* Very slight grain, so large flat areas do not band. */
    float grain = fract(sin(dot(vUv * uMaskSize, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.012;

    gl_FragColor = vec4(color, 1.0);
  }
`

/* -------------------------------------------------------------------------- */
/* Routes: great circles with a travelling comet                               */
/* -------------------------------------------------------------------------- */

const ROUTE_COLORS: Record<string, string> = {
  saffron: '#e0a25e',
  madder: '#c4624c',
  verdigris: '#6fae94',
}

const ROUTE_HEX: Record<string, string> = {
  saffron: '#f0b26a',
  madder: '#e0705a',
  verdigris: '#79c4a8',
}

/**
 * Routes as thin ribbons with a travelling comet.
 *
 * A WebGL line is one pixel wide and cannot be widened, which reads as a
 * hairline sketch. A ribbon is a real strip of geometry, so it can carry a
 * colour, a glow and a gradient along its length: the head of the comet is
 * bright, the tail trails off behind it, and the whole thing fades as it turns
 * away from the camera so nothing shows through the ocean.
 */
function RouteLines({ uniforms }: { uniforms: { uTime: THREE.IUniform<number> } }) {
  const group = React.useRef<THREE.Group>(null)
  const camera = useThree((st) => st.camera)

  const built = React.useMemo(() => {
    const out: { geo: THREE.BufferGeometry; color: THREE.Color; offset: number }[] = []
    let n = 0
    for (const from of ORIGINS) {
      for (const route of ROUTES) {
        const pts = greatCircle([from.lon, from.lat], route.to, 1.006, 140)
        const width = 0.0055
        const positions: number[] = []
        const alongs: number[] = []
        const tangents: THREE.Vector3[] = []
        const normals: THREE.Vector3[] = []

        for (let i = 0; i < pts.length; i++) {
          const prev = pts[Math.max(0, i - 1)]
          const next = pts[Math.min(pts.length - 1, i + 1)]
          const tan = new THREE.Vector3().subVectors(next, prev).normalize()
          const nor = pts[i].clone().normalize()
          const side = new THREE.Vector3().crossVectors(tan, nor).normalize().multiplyScalar(width)
          tangents.push(tan)
          normals.push(nor)
          positions.push(pts[i].x - side.x, pts[i].y - side.y, pts[i].z - side.z)
          positions.push(pts[i].x + side.x, pts[i].y + side.y, pts[i].z + side.z)
          alongs.push(i / (pts.length - 1), i / (pts.length - 1))
        }

        const indices: number[] = []
        for (let i = 0; i + 1 < pts.length; i++) {
          const a = i * 2
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
        }

        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        geo.setAttribute('aAlong', new THREE.Float32BufferAttribute(alongs, 1))
        geo.setAttribute('aNormal', new THREE.Float32BufferAttribute(normals.flatMap((v) => [v.x, v.y, v.z, v.x, v.y, v.z]), 3))
        geo.setIndex(indices)
        geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.3)
        out.push({ geo, color: new THREE.Color(ROUTE_HEX[route.hue]), offset: (n += 0.19) % 1 })
      }
    }
    return out
  }, [])

  const material = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: uniforms.uTime,
          uCam: { value: new THREE.Vector3(0, 0, 8) },
        },
        vertexShader: /* glsl */ `
          attribute float aAlong;
          attribute vec3 aNormal;
          varying float vAlong;
          varying float vFacing;
          uniform vec3 uCam;
          void main() {
            vAlong = aAlong;
            /* Camera direction expressed in the globe's own frame, supplied
               from the CPU so no matrix inverse is needed in the shader. */
            vFacing = dot(normalize(aNormal), normalize(uCam));
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uOffset;
          varying float vAlong;
          varying float vFacing;
          void main() {
            /* The path itself is a hint; the comet is the message. */
            float base = 0.1;

            float head = 0.0;
            for (int i = 0; i < 2; i++) {
              float p = fract(uTime * 0.055 + uOffset + float(i) * 0.5);
              float d = vAlong - p;
              if (d < 0.0) d += 1.0;
              /* sharp head, long fading tail */
              head += exp(-d * 34.0) * 1.1 + exp(-d * 8.0) * 0.28;
            }

            float a = base + head;
            /* Nothing on the far hemisphere. */
            a *= smoothstep(0.015, 0.30, vFacing);
            vec3 c = uColor * (0.55 + head * 1.5);
            gl_FragColor = vec4(c, clamp(a, 0.0, 1.0));
          }
        `,
      }),
    [uniforms.uTime],
  )

  React.useEffect(() => () => {
    material.dispose()
    built.forEach((b) => b.geo.dispose())
  }, [built, material])

  /* One material per colour, cloned so uColor can differ. */
  const perRoute = React.useMemo(
    () => built.map((b) => {
      const m = material.clone()
      m.uniforms = THREE.UniformsUtils.clone(material.uniforms)
      m.uniforms.uTime = uniforms.uTime
      m.uniforms.uColor = { value: b.color }
      m.uniforms.uOffset = { value: b.offset }
      return m
    }),
    [built, material, uniforms.uTime],
  )

  React.useEffect(() => () => perRoute.forEach((m) => m.dispose()), [perRoute])

  useFrame(() => {
    const host = group.current
    if (!host) return
    host.updateWorldMatrix(true, false)
    const cam = camera.position.clone()
    host.worldToLocal(cam)
    for (const m of perRoute) m.uniforms.uCam.value.copy(cam)
  })

  return (
    <group ref={group}>
      {built.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={perRoute[i]} frustumCulled={false} renderOrder={4} />
      ))}
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/* Marker: a precise point on the surface, with a pulse                       */
/* -------------------------------------------------------------------------- */

function OriginMarker({
  lon,
  lat,
  uniforms,
  phase,
}: {
  lon: number
  lat: number
  uniforms: { uTime: THREE.IUniform<number> }
  phase: number
}) {
  const pos = React.useMemo(() => llToVec(lon, lat, 1.006), [lon, lat])
  const mat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: uniforms.uTime, uPhase: { value: phase } },
        vertexShader: /* glsl */ `
          varying vec2 vP;
          void main() {
            vP = position.xy * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime;
          uniform float uPhase;
          varying vec2 vP;
          void main() {
            float d = length(vP);
            float core = smoothstep(0.30, 0.0, d);
            float ring = 0.0;
            for (int i = 0; i < 2; i++) {
              float t = fract(uTime * 0.28 + uPhase + float(i) * 0.5);
              float r = t * 0.92;
              ring += smoothstep(0.06, 0.0, abs(d - r)) * (1.0 - t) * 0.55;
            }
            float a = core * 0.95 + ring;
            vec3 warm = vec3(1.0, 0.82, 0.58);
            gl_FragColor = vec4(warm, clamp(a, 0.0, 1.0));
          }
        `,
      }),
    [uniforms.uTime, phase],
  )

  React.useEffect(() => () => mat.dispose(), [mat])

  return (
    <mesh position={pos} material={mat}>
      <planeGeometry args={[0.058, 0.058]} />
    </mesh>
  )
}

/* -------------------------------------------------------------------------- */

function Earth({ uniforms }: { uniforms: { uTime: THREE.IUniform<number>; uSun: THREE.IUniform<THREE.Vector3> } }) {
  const mask = React.useMemo(() => getLandMask(), [])

  /* Carve the sphere itself: every vertex is displaced by the land coverage,
     so continents are real relief rather than a painted-on patch. 256x160 is
     about 41k vertices, which is nothing, and fine enough that the bevel reads
     at hero size. The same mask drives the shading, so the two agree. */
  const geometry = React.useMemo(() => new THREE.SphereGeometry(1, 256, 160), [])
  React.useEffect(() => {
    let live = true
    // Exact source mask; no canvas readback or rasterisation approximation.
    loadMaskPixels().then((px) => {
      if (!live) return
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const uv = geometry.attributes.uv as THREE.BufferAttribute
      const v = new THREE.Vector3()
      for (let i = 0; i < pos.count; i++) {
        const lon = uv.getX(i) * 360 - 180
        const lat = 90 - uv.getY(i) * 180
        const m = sampleMask(px.data, px.width, px.height, lon, lat)
        const r = carveVertex(m)
        v.fromBufferAttribute(pos, i).normalize().multiplyScalar(r)
        pos.setXYZ(i, v.x, v.y, v.z)
      }
      pos.needsUpdate = true
      geometry.computeVertexNormals()
      geometry.computeBoundingSphere()
    })
    return () => {
      live = false
    }
  }, [geometry])
  React.useEffect(() => () => geometry.dispose(), [geometry])
  const mat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMask: { value: mask },
          uMaskSize: { value: new THREE.Vector2(1024, 512) },
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

  return <mesh material={mat} geometry={geometry} />
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
          uTint: { value: new THREE.Color('#f7eeda') },
        },
        vertexShader: /* glsl */ `
          uniform float uRadius;
          uniform vec3 uCam;
          varying float vFacing;
          void main() {
            vFacing = dot(normalize(normal), normalize(uCam));
            vec3 p = normalize(position) * uRadius;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
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
        `,
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

/* -------------------------------------------------------------------------- */

function Globe() {
  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0 },
      uSun: { value: new THREE.Vector3(-0.62, 0.46, 0.86).normalize() },
    }),
    [],
  )
  /* A static state is decided by the site, not by this scene: a device that
     cannot hold the frame rate is told to hold a still image (performance.ts),
     and reduced motion is honoured the same way. */
  const session = useSceneSession()
  const still = session?.still ?? reducedMotion()
  const drag = React.useMemo(() => createDrag(0.5), [])

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

  /* The globe is held on India until the opening clears.
   *
   * A drift that starts the moment the canvas mounts keeps running behind the
   * three-second curtain, so the visitor's first honest look is of whatever
   * longitude three seconds of spin has produced. The gate holds the angle
   * while the intro is up, rewinds to India when it clears, and rewinds again
   * if the logo replays the intro. The rules live in globe-gate.ts, where they
   * are tested without a browser.
   */
  const gate = React.useMemo(() => createGlobeGate(startY), [startY])

  React.useEffect(() => {
    const rewind = () => {
      gate.rewind()
      drag.target.x = 0
      drag.target.y = startY
      drag.current.x = 0
      drag.current.y = startY
      drag.velocity.x = 0
      drag.velocity.y = 0
      uniforms.uTime.value = 0
    }
    /* A fresh page load always starts facing India, whatever the intro is doing
       at this instant, and whatever angle any earlier mount left behind. */
    gate.intro(introActive())
    rewind()
    return onIntroChange((active) => {
      gate.intro(active)
      if (!active) rewind()
    })
  }, [drag, gate, startY, uniforms])

  useFrame((_, delta) => {
    const d = Math.min(delta, 1 / 30)
    /* The clock advances whenever the globe is animating. A drag changes the
       angle, never the motion: the comets keep running while the visitor pulls
       the surface around, which is the whole point of a globe you can turn. */
    if (still) return
    gate.advance(d, still, drag.dragging)
    if (!gate.held()) uniforms.uTime.value += d
  })

  const root = React.useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    const d = Math.min(delta, 1 / 30)
    const g = root.current
    if (!g) return
    if (!drag.dragging) drag.target.y += drag.velocity.y * d
    const decay = Math.exp(-3.4 * d)
    drag.velocity.y *= decay
    /* The spin is absolute rather than proportional to the visitor's angle, so
       a drag offsets the globe and the drift carries on from where they left
       it instead of stopping dead. */
    const yaw = globeYaw(drag.target.y, gate.drift())
    drag.current.y = THREE.MathUtils.lerp(drag.current.y, yaw, 1 - Math.exp(-5.6 * d))
    g.rotation.y = drag.current.y
    drag.current.x = THREE.MathUtils.lerp(drag.current.x, drag.target.x, 1 - Math.exp(-5.6 * d))
    g.rotation.x = drag.current.x * 0.55
    g.rotation.z = 0.06
  })

  const bind = useSceneDrag(drag, root, { initialYaw: startY, tilt: 0.5, pitchScale: 0.55, resetPhase: () => {},
    sync: () => {
      const g = root.current
      if (!g) return
      // Store only the user offset. The frame loop adds drift exactly once.
      drag.target.y = globeUserYaw(g.rotation.y, gate.drift())
      drag.current.y = g.rotation.y
      drag.current.x = drag.target.x = g.rotation.x / 0.55
      drag.velocity.x = drag.velocity.y = 0
    },
  })

  return (
    <group
      ref={root}
      raycast={raycastGlobe}
      rotation={[0, startY, 0.04]}
      {...bind}
    >
      <Earth uniforms={uniforms} />
      <GeoLines />
      <RouteLines uniforms={uniforms} />
      {ORIGINS.map((o, i) => (
        <OriginMarker key={o.name} lon={o.lon} lat={o.lat} uniforms={uniforms} phase={i * 0.5} />
      ))}
    </group>
  )
}

/**
 * Places the globe in the hero.
 *
 * The composition is the earlier one: the canvas is the full width of the hero,
 * the globe is drawn large, and its right edge runs past the viewport so it is
 * cropped by the hero rather than sitting politely inside it. A narrow
 * right-hand canvas was what had made the globe small — enlarging the sphere
 * inside a 64%-wide canvas could not have fixed that.
 *
 * Three rules, in this order:
 *
 * 1. size. Diameter is a share of the canvas: 72% of its height, capped at 68%
 *    of its width so a short, wide window cannot make it huge.
 * 2. clearance. The copy column is where the headline and the enquiry action
 *    live. The globe's left edge is kept to the right of it — computed, not
 *    guessed, from the copy's own maximum width — even if that means a smaller
 *    globe on a narrow window.
 * 3. crop. The centre is placed 0.8 of a radius from the right edge, so
 *    roughly a fifth of the sphere is off screen at every desktop size.
 *
 * Below 980px the hero stacks and the globe is centred under the words, at most
 * of the stage's width. That breakpoint is the same one the layout and the
 * navigation use, so the globe no longer shrinks on its own between 900 and
 * 980px while everything around it has already gone compact.
 */
const COPY_MAX_PX = 720

function Frame({ children }: { children: React.ReactNode }) {
  const viewport = useThree((s) => s.viewport)
  const size = useThree((s) => s.size)
  /* The same breakpoint as the stylesheet, inclusive: at exactly 980 the CSS
     has already stacked, so the scene must not still be laying out for desktop. */
  const stacked = size.width <= 980

  let radius: number
  let x: number

  if (stacked) {
    /* Centred under the text: most of the stage width, most of its height. */
    radius = Math.min(viewport.height * 0.46, viewport.width * 0.42)
    x = 0
  } else {
    /* The copy column, in world units. The heading is capped at 46rem and the
       gutter sits outside it, so this is the space the globe must not enter. */
    const copyPx = Math.min(COPY_MAX_PX, size.width * 0.5) + 32
    const copyWorld = (copyPx / size.width) * viewport.width
    radius = Math.min(
      viewport.height * 0.36,
      viewport.width * 0.34,
      /* keep the left edge clear of the copy at 1.8 radii from the right edge */
      Math.max(0, (viewport.width - copyWorld) / 1.8),
    )
    radius = Math.max(radius, viewport.height * 0.14)
    x = viewport.width * 0.5 - radius * 0.8
  }

  return (
    <group scale={Math.max(0.4, radius)} position={[x, stacked ? 0 : 0.02, 0]}>
      {children}
    </group>
  )
}

export function GlobeScene() {
  return (
    <>
      <Studio />
      <Frame>
        <Globe />
      </Frame>
    </>
  )
}
