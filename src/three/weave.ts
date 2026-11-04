import * as THREE from 'three'

/* ==========================================================================
   Weave — the hero's yarn-to-cloth sequence.

   One idea, carried by two draw calls:

     1. `makeStrandSheet` builds a bundle of loose strands wound into a yarn
        package. A single uniform, `uStrand`, unwinds them: each strand eases
        from its coil position to its place in a flat warp sheet, staggered so
        the unwind travels up the bundle instead of everything melting at once.
     2. `makeClothMaterial` reveals a woven panel from the hem upward on
        `uWeave`, with a saffron heat line at the selvage that is being woven.

   Both transforms live in the vertex shader, so the animation costs two
   uniform writes per frame — no per-vertex work on the CPU, no allocations.
   ========================================================================== */

export type WeaveUniforms = {
  uWeave: { value: number }
  uStrand: { value: number }
  uHeat: { value: number }
  uTime: { value: number }
}

export function makeWeaveUniforms(): WeaveUniforms {
  return {
    uWeave: { value: 0 },
    uStrand: { value: 0 },
    uHeat: { value: 0 },
    uTime: { value: 0 },
  }
}

/* -------------------------------------------------------------------------- */

const STRAND_VERT_PARS = /* glsl */ `
attribute float aStrand;
uniform float uStrand;
uniform float uTime;
varying float vStrandT;
`

const STRAND_VERT_BODY = /* glsl */ `
  float t = position.y + 0.5;
  float h = fract(aStrand * 0.6180339887498949);

  /* How far this strand has left the package. Staggered by its hash so the
     bundle unwinds progressively rather than all at once, and once more along
     the strand so the motion travels upward. */
  float per = clamp((uStrand * 1.42 - h * 0.42), 0.0, 1.0);
  float ease = per * per * (3.0 - 2.0 * per);
  float along = clamp((ease * 1.55 - (1.0 - t) * 0.55), 0.0, 1.0);
  along = along * along * (3.0 - 2.0 * along);

  /* Loose state: yarn wound on a mill cone, sitting at the foot of the frame.
     The strand leaves the cone at the top, which is why points near t = 1
     switch to the warp sheet first. */
  float ang = h * 6.2831853 * 2.4 + t * 4.2;
  float coneR = mix(0.295, 0.075, t) * 1.07;
  float shed = smoothstep(0.55, 1.0, t) * 0.1;
  vec3 loose = vec3(cos(ang) * coneR * (1.0 + shed), -1.01 + t * 0.62, sin(ang) * coneR * (1.0 + shed));

  /* Woven state: this strand's fixed place in the warp sheet, running from
     just above the cone up to the rail at the top of the frame. */
  float axisX = (h - 0.5) * 1.98;
  float sway = sin(t * 3.1 + h * 6.2831853) * 0.014;
  vec3 sheet = vec3(axisX + sway * ease, -0.36 + t * 1.63, -0.035 * ease);

  /* Tube thickness, oriented along the local radial direction. */
  vec3 thick = vec3(position.x, 0.0, position.z) * mix(0.0115, 0.0042, ease);

  vec3 p = mix(loose, sheet, along) + thick;

  /* A last shiver of slack as it leaves the coil. */
  p.x += sin(uTime * 1.7 + h * 20.0 + t * 4.0) * 0.018 * (1.0 - along) * along;
  p.z += cos(uTime * 1.3 + h * 9.0) * 0.012 * (1.0 - along);

  vStrandT = along;
  vShade = ease;
  transformed = p;
`

/**
 * A bundle of strands as one geometry: N unit tubes with a per-vertex strand
 * index. Thin on purpose — six sides is plenty at this scale.
 */
export function makeStrandSheet(count = 38, sides = 6, steps = 16) {
  const positions: number[] = []
  const normals: number[] = []
  const ids: number[] = []
  const indices: number[] = []

  let base = 0
  for (let s = 0; s < count; s++) {
    for (let y = 0; y <= steps; y++) {
      const t = y / steps
      for (let a = 0; a < sides; a++) {
        const ang = (a / sides) * Math.PI * 2
        positions.push(Math.cos(ang), t - 0.5, Math.sin(ang))
        normals.push(Math.cos(ang), 0, Math.sin(ang))
        ids.push(s)
      }
    }
    for (let y = 0; y < steps; y++) {
      for (let a = 0; a < sides; a++) {
        const a0 = base + y * sides + a
        const a1 = base + y * sides + ((a + 1) % sides)
        const b0 = a0 + sides
        const b1 = a1 + sides
        indices.push(a0, b0, a1, a1, b0, b1)
      }
    }
    base += (steps + 1) * sides
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('aStrand', new THREE.Float32BufferAttribute(ids, 1))
  geo.setIndex(indices)
  geo.computeBoundingSphere()
  if (geo.boundingSphere) geo.boundingSphere.radius *= 3
  return geo
}

/* -------------------------------------------------------------------------- */

const CLOTH_PARS = /* glsl */ `
uniform float uWeave;
uniform float uHeat;
uniform float uHeight;
varying vec2 vWov;
`

const CLOTH_BODY = /* glsl */ `
  /* The cloth rises from the hem toward the top, with a slightly ragged
     filling edge so the front is not a ruler-straight line. */
  float wEdge = uWeave
    + (sin(vWov.x * 43.0) * 0.5 + sin(vWov.x * 97.0 + 1.3) * 0.5) * 0.0075;
  /* Everything below the fill line is cloth; the warp above it is still loose. */
  float wA = smoothstep(wEdge + 0.016, wEdge - 0.01, vWov.y);
  if (wA < 0.004) discard;
  diffuseColor.a *= wA;

  /* A short warm line of fresh weft at the edge being woven. */
  float wGlow = exp(-pow((vWov.y - wEdge) / 0.045, 2.0)) * uHeat;
  outgoingLight += vec3(0.86, 0.52, 0.20) * wGlow * 0.3;

  /* The newly woven band sits a touch brighter, as if still warm. */
  float fresh = smoothstep(0.16, 0.0, abs(vWov.y - wEdge + 0.07));
  outgoingLight += vec3(0.42, 0.30, 0.18) * fresh * uHeat * 0.1;
`

const STRAND_PARS_VERT = /* glsl */ `
attribute float aStrand;
uniform float uStrand;
uniform float uTime;
varying float vStrandT;
varying float vShade;
`

const STRAND_PARS_FRAG = /* glsl */ `
uniform float uWeave;
varying float vStrandT;
varying float vShade;
`

const STRAND_BODY_FRAG = /* glsl */ `
  /* Loose yarn is paler than the cloth it becomes; and it slips out of sight
     once the cloth has covered it. */
  diffuseColor.rgb = mix(vec3(0.62, 0.53, 0.42), diffuseColor.rgb, vShade);
  diffuseColor.a *= (1.0 - smoothstep(0.88, 1.0, uWeave)) * (0.62 + 0.38 * vStrandT);
`

function injectCloth(
  shader: THREE.WebGLProgramParametersWithUniforms,
  uniforms: Record<string, THREE.IUniform>,
) {
  Object.assign(shader.uniforms, uniforms)
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${CLOTH_PARS}`)
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n  vWov = vec2(uv.x * 0.143, clamp(transformed.y / uHeight + 0.5, 0.0, 1.0));`,
    )
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${CLOTH_PARS.replace(/uniform float uHeight;\n/, '')}`)
    .replace('#include <opaque_fragment>', `${CLOTH_BODY}\n#include <opaque_fragment>`)
}

function injectStrand(
  shader: THREE.WebGLProgramParametersWithUniforms,
  uniforms: Record<string, THREE.IUniform>,
) {
  Object.assign(shader.uniforms, uniforms)
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${STRAND_PARS_VERT}`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>\n${STRAND_VERT_BODY}`)
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${STRAND_PARS_FRAG}`)
    .replace('#include <opaque_fragment>', `${STRAND_BODY_FRAG}\n#include <opaque_fragment>`)
}

/** Loose yarn, unwinding into a warp sheet. */
export function makeStrandMaterial(uniforms: WeaveUniforms) {
  const mat = new THREE.MeshStandardMaterial({
    color: '#b08f68',
    roughness: 0.94,
    metalness: 0,
    transparent: true,
    depthWrite: true,
    envMapIntensity: 0.3,
  })
  mat.onBeforeCompile = (shader) =>
    injectStrand(shader, {
      uStrand: uniforms.uStrand,
      uWeave: uniforms.uWeave,
      uTime: uniforms.uTime,
    })
  mat.customProgramCacheKey = () => 'bs-strand'
  return mat
}

/** Woven cloth that fills upward from its hem. */
export function makeClothMaterial(
  uniforms: WeaveUniforms,
  tex: { map: THREE.Texture; bump: THREE.Texture },
  height: number,
) {
  const mat = new THREE.MeshStandardMaterial({
    map: tex.map,
    bumpMap: tex.bump,
    bumpScale: 2.4,
    roughness: 0.88,
    metalness: 0.02,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: true,
    envMapIntensity: 0.35,
  })
  mat.onBeforeCompile = (shader) =>
    injectCloth(shader, {
      uWeave: uniforms.uWeave,
      uHeat: uniforms.uHeat,
      uHeight: { value: height },
    })
  mat.customProgramCacheKey = () => 'bs-cloth-weave'
  return mat
}
