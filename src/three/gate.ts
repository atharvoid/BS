/* ==========================================================================
   A one-way gate for the opening sequence.

   Building the hero's globe takes real work: a sphere, two line meshes, and the
   geography fetch. If that work happens while the opening is still drawing, it
   takes the main thread away from the animation that is meant to introduce the
   site, and the first impression is a stutter.

   So the 3D layer waits until the opening is done. The gate is one boolean and
   one set of listeners, it opens exactly once, and anything that subscribes
   after it has opened runs immediately.
   ========================================================================== */

let open = !hasOpening()

function hasOpening() {
  if (typeof window === 'undefined') return false
  // The same conditions the Intro component uses. Duplicated deliberately: this
  // module must be importable by the 3D layer without pulling in React.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (window.location.pathname !== '/') return false
  try {
    return sessionStorage.getItem('bs.opening.seen') === '1'
  } catch {
    return false
  }
}

const listeners = new Set<() => void>()

/** Subscribe to the gate. Returns an unsubscribe function. */
export function onSceneReady(fn: () => void) {
  if (open) {
    fn()
    return () => {}
  }
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function isSceneReady() {
  return open
}

/** Called by the opening sequence, and by its backstop. Idempotent. */
export function openSceneGate() {
  if (open) return
  open = true
  listeners.forEach((fn) => fn())
  listeners.clear()
}
