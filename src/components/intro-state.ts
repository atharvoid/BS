/* drawing: the logo draws; settling: it flies to the header; revealing: the
   cotton cover fades and the hero enters (globe flies in, headline slides in). */
export type IntroPhase = 'idle' | 'drawing' | 'settling' | 'revealing'
const listeners = new Set<() => void>()
let phase: IntroPhase = 'idle'

export function setIntroPhase(next: IntroPhase) {
  if (phase === next) return
  phase = next
  if (introActive()) document.documentElement.dataset.introActive = 'true'
  else delete document.documentElement.dataset.introActive
  document.documentElement.dataset.introPhase = next
  listeners.forEach(listener => listener())
}

/** The current phase of the opening. */
export function introPhase() {
  return phase
}

/** Is the opening on screen right now? */
export function introActive() {
  return phase !== 'idle'
}

/** Is the globe currently held for the intro? */
export function isGlobeHeld() {
  return phase === 'drawing'
}

/* The globe's entrance, owned by whichever globe gets there first.
   none:    no entrance this load (back navigation, reduced motion): show at rest.
   pending: the opening is playing; nothing may show the globe at rest yet.
   live:    the 3D globe has taken the entrance and is flying in.
   poster:  the 3D globe was not ready in time; the still image slides in.
   Whichever claims it, the other never shows a resting globe in its place. */
export type Entrance = 'none' | 'pending' | 'live' | 'poster'
let entrance: Entrance = 'none'

export function globeEntrance() {
  return entrance
}

export function setGlobeEntrance(next: Entrance) {
  if (entrance === next) return
  entrance = next
  listeners.forEach(listener => listener())
}

/** Take the pending entrance for one globe. True if this caller got it. */
export function claimGlobeEntrance(by: 'live' | 'poster') {
  if (entrance !== 'pending') return false
  setGlobeEntrance(by)
  return true
}

export function onIntroChange(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
