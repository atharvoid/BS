import {
  DataTexture, DataUtils, EquirectangularReflectionMapping, HalfFloatType,
  LinearFilter, LinearSRGBColorSpace, RGBAFormat, Vector3,
} from 'three'

export const CATEGORY_KEY = [3.4, 5, 4.2] as const
export const CATEGORY_RIM = [-4.2, 1.4, -2.4] as const
export const CATEGORY_ENVIRONMENT_INTENSITY = 6

/** Offline lighting source. The map baker encodes its radiance as a scaled PNG. */
export function makeCategoryEnvironment() {
  const width = 512, height = 256
  const pixels = new Uint16Array(width * height * 4)
  const panels = [
    { centre: CATEGORY_KEY, span: .28, rise: .38, colour: [4.8, 4.2, 3.55] },
    { centre: CATEGORY_RIM, span: .13, rise: .48, colour: [1.4, 1.75, 2.2] },
    { centre: [-1.1, 1.45, 3.8] as const, span: .24, rise: .26, colour: [.46, .5, .58] },
  ].map(panel => {
    const aim = new Vector3(...panel.centre).normalize()
    const right = new Vector3(0, 1, 0).cross(aim).normalize()
    return { ...panel, aim, right, up: aim.clone().cross(right) }
  })
  const direction = new Vector3()
  const light = [0, 0, 0]
  const half = DataUtils.toHalfFloat
  const softEdge = (distance: number) => {
    const t = Math.min(1, Math.max(0, (1.12 - distance) / .24))
    return t * t * (3 - 2 * t)
  }
  for (let y = 0; y < height; y++) {
    const latitude = ((y + .5) / height - .5) * Math.PI
    const vertical = Math.sin(latitude)
    const radius = Math.cos(latitude)
    const ambient = .045 + .18 * Math.pow(.5 + vertical * .5, 1.6)
    for (let x = 0; x < width; x++) {
      const longitude = ((x + .5) / width - .5) * 2 * Math.PI
      direction.set(Math.cos(longitude) * radius, vertical, Math.sin(longitude) * radius)
      light[0] = ambient * 1.13
      light[1] = ambient
      light[2] = ambient * .88
      for (const { aim, right, up, span, rise, colour } of panels) {
        const facing = direction.dot(aim)
        if (facing <= .75) continue
        const across = Math.abs(direction.dot(right)) / (span * facing)
        const above = Math.abs(direction.dot(up)) / (rise * facing)
        const strength = softEdge(across) * softEdge(above)
        for (let channel = 0; channel < 3; channel++) light[channel] += strength * colour[channel]
      }
      const index = (y * width + x) * 4
      pixels[index] = half(light[0])
      pixels[index + 1] = half(light[1])
      pixels[index + 2] = half(light[2])
      pixels[index + 3] = half(1)
    }
  }
  const texture = new DataTexture(pixels, width, height, RGBAFormat, HalfFloatType)
  texture.mapping = EquirectangularReflectionMapping
  texture.colorSpace = LinearSRGBColorSpace
  texture.minFilter = texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}
