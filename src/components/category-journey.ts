/** Scroll choreography in CSS pixels. Pure so fast scrolling, reverse scrolling
 * and narrow screens use the same continuous path, independent of frame rate. */
export const CATEGORY_COUNT = 6
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
export const ease = (n: number) => { const t = clamp01(n); return t * t * (3 - 2 * t) }
export function journeyPose(index: number, progress: number, width: number, height: number, shelfHeight: number) {
  const t = progress - index
  const mobile = width <= 720
  const compact = mobile && height < 650
  const enter = ease(t / 0.22)
  const dock = ease((t - 0.58) / 0.32)
  const featuredHeight = Math.min(compact ? width * 0.44 : mobile ? width * 0.92 : width * 0.48, height * (mobile ? 0.39 : 0.61))
  const featuredX = compact ? width * 0.22 : mobile ? width * 0.5 : width * 0.28
  const featuredY = compact ? height * 0.5 : mobile ? height * 0.32 : height * 0.48
  const dockHeight = Math.min(shelfHeight * 0.76, width / 6 * 1.45)
  const dockX = width / 6 * (index + 0.5)
  const dockY = height - shelfHeight + shelfHeight * 0.38
  const enteredX = -featuredHeight + (featuredX + featuredHeight) * enter
  return {
    x: enteredX + (dockX - enteredX) * dock,
    y: featuredY + (dockY - featuredY) * dock,
    height: featuredHeight + (dockHeight - featuredHeight) * dock,
    visible: t >= 0,
    title: enter * (1 - ease((t - 0.63) / 0.2)),
    detail: enter * (1 - ease((t - 0.38) / 0.18)),
    textX: (1 - enter) * (mobile ? 40 : 150),
    docked: ease((t - 0.76) / 0.16),
  }
}
