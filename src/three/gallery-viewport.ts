/** Tighten the backing surface around visible letterboxes, not the empty page.
 * Coordinates remain relative to the original gallery host. No scene copies. */
export type Letterbox = { x: number; y: number; width: number; height: number; visible: boolean }
export function galleryViewport(slots: Letterbox[], width: number, height: number) {
  const visible = slots.filter(s => s.visible)
  if (!visible.length || width < 1 || height < 1) return { x: 0, y: 0, width: Math.max(1,width), height: Math.max(1,height) }
  // Pad for the soft contact shadow and round outward to avoid resize jitter.
  const left = Math.max(0, Math.floor(Math.min(...visible.map(s => s.x - s.width / 2 - s.height * .08))))
  const top = Math.max(0, Math.floor(Math.min(...visible.map(s => s.y - s.height * .58))))
  const right = Math.min(width, Math.ceil(Math.max(...visible.map(s => s.x + s.width / 2 + s.height * .08))))
  const bottom = Math.min(height, Math.ceil(Math.max(...visible.map(s => s.y + s.height * .58))))
  return { x:left, y:top, width:Math.max(1,right-left), height:Math.max(1,bottom-top) }
}
/** Never grow the previous backing-buffer pixel budget while reallocating it. */
export function reallocatedDpr(desired: number, oldDpr: number, width: number, height: number, cropWidth: number, cropHeight: number) {
  return Math.min(desired, Math.sqrt(Math.max(1,width*height)*oldDpr*oldDpr/Math.max(1,cropWidth*cropHeight)))
}
