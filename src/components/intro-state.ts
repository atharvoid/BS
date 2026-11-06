/* ==========================================================================
   The opening's state, as the rest of the site reads it.

   The intro sets `data-intro-active="true"` on <html> for the three seconds it
   is on screen. Scenes need to know this, because a globe that starts turning
   behind a curtain is already somewhere else by the time the curtain lifts —
   which is exactly what used to happen to India.

   This exposes the same DOM signal as a small subscribable store, so a three.js
   frame loop can read it without touching the DOM every frame, and so it does
   not depend on React re-rendering the scene at the right moment.
   ========================================================================== */

type Listener = (active: boolean) => void

const listeners = new Set<Listener>()
let active =
  typeof document !== 'undefined' && document.documentElement.dataset.introActive === 'true'
let wired = false

function broadcast(next: boolean) {
  if (next === active) return
  active = next
  listeners.forEach((listener) => listener(active))
}

/** Start following <html data-intro-active>. Idempotent; safe to call often. */
export function watchIntro() {
  if (wired || typeof document === 'undefined') return
  wired = true
  new MutationObserver(() => {
    broadcast(document.documentElement.dataset.introActive === 'true')
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-intro-active'] })
}

/** Is the opening on screen right now? */
export function introActive() {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.introActive === 'true'
}

/** Called when the opening clears, and again if the logo replays it later. */
export function onIntroChange(listener: Listener) {
  watchIntro()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
