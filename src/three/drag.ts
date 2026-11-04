import * as THREE from 'three'

/* ==========================================================================
   Drag-to-turn controller.
   Deliberately NOT OrbitControls: on a marketing page the visitor must always
   be able to keep scrolling. Pointer drag rotates the objects themselves, the
   camera stays put, and the wheel is never captured. Every value is damped, so
   a hard flick settles instead of snapping or tipping the composition ("anti
   slope" behaviour).
   ========================================================================== */

export type DragState = {
  /** Rotation targets in radians. */
  target: { x: number; y: number }
  /** Current damped rotation. */
  current: { x: number; y: number }
  velocity: { x: number; y: number }
  dragging: boolean
  /** True once the visitor has moved it — suppresses the idle drift. */
  touched: boolean
  idle: number
  bind: () => {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: (e: React.PointerEvent) => void
    onPointerLeave: (e: React.PointerEvent) => void
    style: React.CSSProperties
  }
  reset: () => void
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function createDrag(tiltLimit = 0.44): DragState {
  const state: DragState = {
    target: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    dragging: false,
    touched: false,
    idle: 0,
    bind: () => ({} as ReturnType<DragState['bind']>),
    reset: () => {
      state.target.x = 0
      state.target.y = 0
      state.velocity.x = 0
      state.velocity.y = 0
      state.touched = false
    },
  }

  let lastX = 0
  let lastY = 0
  let lastT = 0

  const start = (e: React.PointerEvent) => {
    state.dragging = true
    state.idle = 0
    lastX = e.clientX
    lastY = e.clientY
    lastT = performance.now()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const move = (e: React.PointerEvent) => {
    if (!state.dragging) return
    const now = performance.now()
    const dt = Math.max(16, now - lastT) / 1000
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    lastT = now

    // Amplitude is generous but the tilt is clamped, so the object can never
    // end up presenting an unreadable, flipped silhouette.
    state.target.y += dx * 0.008
    state.target.x = clamp(state.target.x + dy * 0.0045, -tiltLimit, tiltLimit)
    state.velocity.y = (dx * 0.008) / dt
    state.velocity.x = (dy * 0.0045) / dt
    state.touched = true
  }

  const end = (e: React.PointerEvent) => {
    if (!state.dragging) return
    state.dragging = false
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    // Keep a little of the flick, capped so it can never spin out.
    state.velocity.y = clamp(state.velocity.y, -2.4, 2.4)
    state.velocity.x = clamp(state.velocity.x, -1.2, 1.2)
  }

  state.bind = () => ({
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: end,
    onPointerLeave: end,
    style: {
      touchAction: 'pan-y',
      cursor: state.dragging ? 'grabbing' : 'grab',
      userSelect: 'none',
    } as React.CSSProperties,
  })

  return state
}

/** Frame-rate independent damping toward a target. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))
}
