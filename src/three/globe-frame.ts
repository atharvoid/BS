/* ==========================================================================
   Where the globe sits in the hero, as plain arithmetic.

   The live scene and the still image both use this, so they can never
   disagree. Before, the still was a fixed 1280x800 picture of the whole frame
   stretched to fit the hero; on any other window shape it sat at a different
   size and place from the live globe (the "jump" on a cached load) and was
   blurry when stretched. Now the still is a square picture of the globe alone,
   and this file says exactly where to put it.

   Rules (unchanged from the scene's original framing):
   - Stacked (phones, <=980px wide): centred, most of the stage.
   - Wide: as large as the height allows, kept clear of the copy column, with
     the centre 0.78 of a radius in from the right edge so it crops off-screen.
   ========================================================================== */

export const GLOBE_CAMERA = { z: 7.4, fov: 36 } as const

/** The globe's radius, in world units, in the square still-image capture. */
export const CAPTURE_RADIUS = 1.9

const COPY_MAX_PX = 720

export type GlobeFrame = { radius: number; x: number; y: number; stacked: boolean }

/** World-unit size of the view at the globe's distance. */
export function viewportAt(width: number, height: number, camera = GLOBE_CAMERA) {
  const h = 2 * camera.z * Math.tan((camera.fov * Math.PI) / 360)
  return { width: h * (width / Math.max(1, height)), height: h }
}

export function globeFrame(width: number, height: number, compact = false): GlobeFrame {
  const viewport = viewportAt(width, height)
  const stacked = compact || width <= 980
  if (stacked) {
    return { radius: Math.max(0.4, Math.min(viewport.height * 0.5, viewport.width * 0.46)), x: 0, y: 0, stacked }
  }
  /* 55% of the width is the copy column's share: on the light hero the
     headline sits next to the sphere, and at 1024px the two were touching. */
  const copyPx = Math.min(COPY_MAX_PX, width * 0.55) + 32
  const copyWorld = (copyPx / width) * viewport.width
  let radius = Math.min(
    viewport.height * 0.38,
    viewport.width * 0.36,
    Math.max(0, (viewport.width - copyWorld) / 1.7),
  )
  radius = Math.max(0.4, radius, viewport.height * 0.16)
  return { radius, x: viewport.width * 0.5 - radius * 0.78, y: -0.07, stacked }
}

/**
 * Where to draw the square still image (captured with the globe at the
 * centre, radius CAPTURE_RADIUS, filling the full view height) so it lands
 * exactly where the live globe will be. Returns CSS pixels in the stage box.
 */
export function globePosterBox(width: number, height: number, compact = false) {
  const frame = globeFrame(width, height, compact)
  const viewport = viewportAt(width, height)
  const pxPerUnit = height / viewport.height
  const size = height * (frame.radius / CAPTURE_RADIUS)
  const cx = width / 2 + frame.x * pxPerUnit
  const cy = height / 2 - frame.y * pxPerUnit
  return { left: cx - size / 2, top: cy - size / 2, size }
}
