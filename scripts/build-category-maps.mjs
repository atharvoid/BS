import { createCanvas } from '@napi-rs/canvas'
import { mkdir, writeFile } from 'node:fs/promises'
import { CanvasTexture, DataUtils } from 'three'
import { CATEGORY_ENVIRONMENT_INTENSITY, makeCategoryEnvironment } from '../src/three/category-environment.ts'
import { makeBluePotteryTexture, makeCategoryShadow, makeCategorySurface, makeCottonTexture, makeHuskPigment, makePlankTexture, makeStencilTexture } from '../src/three/categoryTextures.ts'
import { makeTextileWeave, makeWoundEndTexture } from '../src/three/textileTextures.ts'

globalThis.document = { createElement: () => createCanvas(1, 1) }
const { map: weave, bump } = makeTextileWeave()
const studio = makeCategoryEnvironment()
const { width, height, data } = studio.image
const radiance = createCanvas(width, height)
const ctx = radiance.getContext('2d')
const light = ctx.createImageData(width, height)
for (let i = 0; i < data.length; i += 4) {
  for (let c = 0; c < 3; c++) {
    const linear = DataUtils.fromHalfFloat(data[i + c]) / CATEGORY_ENVIRONMENT_INTENSITY
    const srgb = linear <= .0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - .055
    light.data[i + c] = Math.round(255 * srgb)
  }
  light.data[i + 3] = 255
}
ctx.putImageData(light, 0, 0)
studio.dispose()
const textures = {
  'studio.png': new CanvasTexture(radiance),
  'husk.webp': makeHuskPigment(),
  'weave.webp': weave,
  'weave-height.png': bump,
  'wound-end.webp': makeWoundEndTexture(),
  'pottery.webp': makeBluePotteryTexture(),
  'lint.webp': makeCottonTexture(256),
  'planks.webp': makePlankTexture(),
  'stencil.webp': makeStencilTexture(256, 128),
  'contact.webp': makeCategoryShadow(),
}
for (const surface of ['glaze', 'wheat', 'copper', 'cotton', 'pine']) {
  textures[`${surface}-surface.png`] = makeCategorySurface(surface)
}

const output = new URL('../src/three/maps/', import.meta.url)
await mkdir(output, { recursive: true })
for (const [name, texture] of Object.entries(textures)) {
  const canvas = texture.image
  const bytes = name.endsWith('.png') ? canvas.toBuffer('image/png') : canvas.toBuffer('image/webp', 88)
  await writeFile(new URL(name, output), bytes)
  console.log(`${name}  ${canvas.width}×${canvas.height}  ${bytes.length} bytes`)
  texture.dispose()
}
