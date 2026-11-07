import React from 'react'
import { useThree } from '@react-three/fiber'
import { StageScene } from './Stage'
import { ClothPanel, Draggable, Ground, Lights, Studio, getTextile } from './objects'

/* ==========================================================================
   The textiles page's 3D, on its own.

   Two things live here: the cloth in the page hero, and the five woven swatches
   in the wall below it. Both used to be imported by the page itself, which put
   the three bundle on the critical path of a page whose headings, fabric
   descriptions and enquiry form are all static text.

   The swatches are not 3D at all — they are a lit crop of the generated weave
   drawn once into a JPEG — but they need the weave generator, so they belong on
   this side of the boundary. Until it arrives, each frame shows a flat
   placeholder of the right size, so nothing reflows.
   ========================================================================== */

export function SwatchPlane({ palette, index }: { palette: 'indigo' | 'madder' | 'cotton' | 'saffron' | 'verdigris'; index: number }) {
  const host = React.useRef<HTMLDivElement>(null)
  const [src, setSrc] = React.useState<string | null>(null)

  React.useEffect(() => {
    const tex = getTextile(palette, 26)
    const img = tex.map.image as HTMLCanvasElement
    // Draw a tilted, lit crop so the swatch reads as a physical sample.
    const size = 420
    const out = document.createElement('canvas')
    out.width = size
    out.height = size
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#1c1813'
    ctx.fillRect(0, 0, size, size)
    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.rotate(((index - 2) * 3.1 * Math.PI) / 180)
    ctx.drawImage(img, -size / 2, -size / 2, size, size)
    ctx.restore()
    const shade = ctx.createLinearGradient(0, 0, size, size)
    shade.addColorStop(0, 'rgba(255,246,226,0.20)')
    shade.addColorStop(0.45, 'rgba(255,255,255,0)')
    shade.addColorStop(1, 'rgba(0,0,0,0.42)')
    ctx.fillStyle = shade
    ctx.fillRect(0, 0, size, size)
    setSrc(out.toDataURL('image/jpeg', 0.86))
  }, [palette, index])

  return (
    <div className="wall__frame" ref={host}>
      {src ? <img src={src} alt="" width={420} height={420} loading="lazy" decoding="async" /> : <div className="wall__placeholder" />}
    </div>
  )
}

/** The textile hero: one cloth, framed into whichever half of the hero it owns. */
function TextileObject({ aside = false }: { aside?: boolean }) {
  const viewport = useThree((s) => s.viewport)
  const narrow = viewport.aspect < 1.2
  // The page-hero canvas only occupies the right-hand column on wide screens,
  // so the object is centred in its own canvas rather than the page.
  const scale = narrow ? 0.82 : Math.min(1, 0.66 + viewport.aspect * 0.16)
  const x = narrow || !aside ? 0 : -Math.min(0.5, viewport.width * 0.04)

  return (
    <>
      <Studio />
      <Lights intensity={1.02} />
      <Ground y={-1.35} scale={4} opacity={0.4} />
      {/* Spinning slowly on its own so the cloth reads as material in motion;
          a drag adds to that angle instead of stopping it. */}
      <Draggable drift={0.18} tilt={0.4} float={0.03} spin={Math.PI * 2 / 52}>
        <group scale={scale} position={[x, 0, 0]}>
          <ClothPanel palette="verdigris" width={2.15} height={2.7} folds={3.4} seed={3.8} threads={16} />
        </group>
      </Draggable>
    </>
  )
}


export default function TextileHeroScene() {
  return <StageScene><TextileObject /></StageScene>
}
