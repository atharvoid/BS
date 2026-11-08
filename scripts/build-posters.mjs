import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Recover transparent pixels from two frozen renders over white/black mattes.
// Capture with the asset-authoring build; never use a screenshot of the website.
const root = process.argv[2]
if (!root) throw new Error('Pass the directory containing matching white/black model captures.')
for (const name of ['globe-mobile','globe-desktop','cloth-mobile','textiles','handicrafts','agriculture','industrial','organic','general']) {
  const white = await loadImage(await readFile(path.join(root, `${name}-white.png`)))
  const black = await loadImage(await readFile(path.join(root, `${name}-black.png`)))
  if (white.width !== black.width || white.height !== black.height) throw new Error(`Mismatched capture: ${name}`)
  const canvas = createCanvas(white.width, white.height), ctx = canvas.getContext('2d')
  ctx.drawImage(white, 0, 0)
  const w = ctx.getImageData(0, 0, white.width, white.height)
  ctx.drawImage(black, 0, 0)
  const b = ctx.getImageData(0, 0, white.width, white.height)
  let opaque = 0
  for (let i = 0; i < b.data.length; i += 4) {
    const alpha = Math.max(0, Math.min(1, 1 - ((w.data[i]-b.data[i])+(w.data[i+1]-b.data[i+1])+(w.data[i+2]-b.data[i+2])) / 765))
    for (let c = 0; c < 3; c++) b.data[i+c] = alpha > .02 ? Math.min(255, b.data[i+c] / alpha) : 0
    b.data[i+3] = alpha > .02 ? Math.round(alpha*255) : 0
    if (alpha > .5) opaque++
  }
  if (opaque < white.width * white.height * .01) throw new Error(`Empty capture: ${name}`)
  ctx.putImageData(b,0,0)
  const file = `public/posters/${name.includes('-') ? name : name+'-mobile'}.webp`
  const bytes = canvas.toBuffer('image/webp', 90)
  await writeFile(file, bytes)
  console.log(`${file}: ${white.width}×${white.height}, ${bytes.length} bytes`)
  if (name !== 'globe-desktop') {
    const small = createCanvas(Math.round(white.width / 2), Math.round(white.height / 2))
    small.getContext('2d').drawImage(canvas, 0, 0, small.width, small.height)
    await writeFile(file.replace('.webp', '-small.webp'), small.toBuffer('image/webp', 90))
  }
}
