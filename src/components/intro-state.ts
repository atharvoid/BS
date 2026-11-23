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

export function onIntroChange(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
