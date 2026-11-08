/** Renderer-free policy: page content never imports Three through this file. */
export const PHONE_MOTION_MS = 4500
export const COMPACT_QUERY = '(max-width: 980px), (max-height: 479px)'
export function productYaw(seconds: number, speed: number, compact: boolean) {
  return .7 + (compact ? Math.sin(seconds * speed) * .26 : seconds * speed)
}
export function mobileMotionDone(start: number, now: number) { return now - start >= PHONE_MOTION_MS }
export function drawingDpr(desired: number, width: number, height: number, budget: number, compact: boolean) {
  return Math.min(desired, compact ? 2 : desired, Math.sqrt(budget / Math.max(1, width * height)))
}
export function motionOwner(entries: { id: string; score: number }[]) {
  return entries.filter(e => e.score > 0).sort((a, b) => b.score - a.score)[0]?.id ?? null
}
export function horizontalIntent(dx: number, dy: number): 'pending' | 'scroll' | 'rotate' {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 7) return 'pending'
  return Math.abs(dx) > Math.abs(dy) * 1.2 ? 'rotate' : 'scroll'
}
