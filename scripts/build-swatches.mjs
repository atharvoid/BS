import fs from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { createCanvas } from '@napi-rs/canvas'
await fs.mkdir('.prerender', { recursive: true })
const source = await fs.readFile('src/three/textures.ts', 'utf8')
await fs.writeFile('.prerender/textures.mjs', stripTypeScriptTypes(source))
globalThis.document = { createElement: () => createCanvas(1, 1) }
const { makeWeaveTexture } = await import('../.prerender/textures.mjs')
const objects = await fs.readFile('src/three/objects.tsx', 'utf8')
const definition = objects.match(
  /export const PALETTES = ([\s\S]*?) as const/,
)[1]
const palettes = Function('return (' + definition + ')')()
await fs.mkdir('public/swatches', { recursive: true })
let index = 0
for (const key of ['indigo', 'madder', 'cotton', 'saffron', 'verdigris']) {
  const texture = makeWeaveTexture({ ...palettes[key], threads: 26, repeat: 1 })
  const out = createCanvas(840, 840),
    ctx = out.getContext('2d')
  ctx.fillStyle = '#1c1813'
  ctx.fillRect(0, 0, 840, 840)
  ctx.save()
  ctx.translate(420, 420)
  ctx.rotate(((index - 2) * 3.1 * Math.PI) / 180)
  ctx.drawImage(texture.image, -420, -420, 840, 840)
  ctx.restore()
  const shade = ctx.createLinearGradient(0, 0, 840, 840)
  shade.addColorStop(0, 'rgba(255,246,226,.20)')
  shade.addColorStop(0.45, 'rgba(255,255,255,0)')
  shade.addColorStop(1, 'rgba(0,0,0,.42)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, 840, 840)
  await fs.writeFile(
    `public/swatches/${key}.webp`,
    out.toBuffer('image/webp', 85),
  )
  texture.dispose()
  index++
}
console.log(
  'Generated five high-resolution swatches from the scene weave generator.',
)
