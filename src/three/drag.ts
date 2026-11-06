import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

type Pointer = ThreeEvent<PointerEvent>
type CaptureTarget = { setPointerCapture: (id: number) => void; releasePointerCapture: (id: number) => void }

export type DragState = {
  target: { x: number; y: number }
  current: { x: number; y: number }
  velocity: { x: number; y: number }
  dragging: boolean
  touched: boolean
  idle: number
  bind: () => {
    onPointerDown: (event: Pointer) => void
    onPointerMove: (event: Pointer) => void
    onPointerUp: (event: Pointer) => void
    onPointerLeave: (event: Pointer) => void
    onPointerCancel: (event: Pointer) => void
  }
  cancel: () => void
  reset: () => void
}

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))

export function createDrag(tiltLimit = 0.44): DragState {
  let pointerId: number | null = null
  let capture: CaptureTarget | null = null
  let lastX = 0
  let lastY = 0
  let lastT = 0
  const state: DragState = {
    target: { x: 0, y: 0 }, current: { x: 0, y: 0 }, velocity: { x: 0, y: 0 },
    dragging: false, touched: false, idle: 0,
    bind: () => ({ onPointerDown: start, onPointerMove: move, onPointerUp: end, onPointerLeave: leave, onPointerCancel: cancelEvent }),
    cancel: () => {
      const target = capture
      const id = pointerId
      capture = null
      pointerId = null
      state.dragging = false
      state.velocity.x = state.velocity.y = 0
      if (target && id !== null) {
        try { target.releasePointerCapture(id) } catch { /* capture already lost */ }
      }
    },
    reset: () => {
      state.cancel()
      state.target.x = state.target.y = 0
      state.current.x = state.current.y = 0
      state.touched = false
    },
  }
  function start(event: Pointer) {
    if (pointerId !== null || event.button !== 0 || event.isPrimary === false) return
    pointerId = event.pointerId
    capture = event.target as unknown as CaptureTarget
    state.dragging = true
    state.idle = 0
    lastX = event.clientX
    lastY = event.clientY
    lastT = performance.now()
    try { capture.setPointerCapture(pointerId) } catch { capture = null }
  }
  function move(event: Pointer) {
    if (!state.dragging || event.pointerId !== pointerId) return
    const now = performance.now()
    const dt = Math.max(16, now - lastT) / 1000
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    lastX = event.clientX
    lastY = event.clientY
    lastT = now
    state.target.y += dx * 0.008
    state.target.x = clamp(state.target.x + dy * 0.0045, -tiltLimit, tiltLimit)
    state.velocity.y = clamp(dx * 0.008 / dt, -2.4, 2.4)
    state.velocity.x = clamp(dy * 0.0045 / dt, -1.2, 1.2)
    if (dx || dy) state.touched = true
  }
  function end(event: Pointer) {
    if (!state.dragging || event.pointerId !== pointerId) return
    /* A flick should coast, not stop dead: the release velocity is kept and
       decays inside the scene's own frame loop, where it is capped. */
    state.dragging = false
    const target = capture
    const id = pointerId
    capture = null
    pointerId = null
    if (target && id !== null) {
      try { target.releasePointerCapture(id) } catch { /* capture already lost */ }
    }
  }
  function leave(event: Pointer) {
    if (state.dragging && !capture) end(event)
  }
  function cancelEvent(event: Pointer) {
    if (event.pointerId === pointerId) state.cancel()
  }
  return state
}

export function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))
}
