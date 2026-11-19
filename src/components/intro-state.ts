type IntroPhase = 'idle' | 'drawing' | 'settling'
const listeners = new Set<() => void>()
let phase: IntroPhase = 'idle'

export function setIntroPhase(next: IntroPhase) {
  if (phase === next) return
  phase = next
  if (introActive()) document.documentElement.dataset.introActive = 'true'
  else delete document.documentElement.dataset.introActive
  listeners.forEach(listener => listener())
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
