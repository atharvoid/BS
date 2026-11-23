/* A soft tactile click for interactions, made in the browser with Web Audio:
 * a 10ms burst of filtered noise (the "tick") over a short low sine (the
 * "body"). No audio file to download.
 *
 * On by default, muted by the speaker button in the header; the choice is
 * remembered. Browsers only allow sound after a gesture, and the very first
 * pointer press is that gesture, so the first click is heard too.
 *
 * Plays on pointer-down (feels immediate) for links, buttons and other
 * controls, and on Enter / Space for keyboard users. Never while typing in a
 * text field. */

const KEY = 'bs-sound'
let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null
const listeners = new Set<() => void>()

export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}

export function setSound(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* storage blocked */ }
  listeners.forEach((l) => l())
}

export function onSoundChange(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function audio(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  const length = Math.floor(ctx.sampleRate * 0.02)
  noise = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return ctx
}

/** Play one click. `force` plays even when muted (used to confirm unmuting). */
export function playClick(force = false) {
  if (!force && !soundOn()) return
  if (document.hidden) return
  const ac = audio()
  if (!ac || !noise) return
  if (ac.state === 'suspended') void ac.resume()
  const t = ac.currentTime

  // The tick: band-passed noise, very short.
  const src = ac.createBufferSource()
  src.buffer = noise
  const band = ac.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 3200 + Math.random() * 400 // slight variation, less robotic
  band.Q.value = 1.4
  const tickGain = ac.createGain()
  tickGain.gain.setValueAtTime(0.0001, t)
  tickGain.gain.exponentialRampToValueAtTime(0.16, t + 0.001)
  tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.012)
  src.connect(band).connect(tickGain).connect(ac.destination)
  src.start(t)
  src.stop(t + 0.02)

  // The body: a low thump that dies away quickly.
  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(190, t)
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.03)
  const bodyGain = ac.createGain()
  bodyGain.gain.setValueAtTime(0.0001, t)
  bodyGain.gain.exponentialRampToValueAtTime(0.09, t + 0.002)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035)
  osc.connect(bodyGain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.04)
}

const CONTROL = 'a[href], button, [role="button"], summary, select, label, input[type="checkbox"], input[type="radio"], input[type="submit"], [role="radio"], [role="option"], [role="combobox"]'
const TYPING = 'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]), textarea, [contenteditable="true"]'

/** Listen once for the whole document. Returns a cleanup function. */
export function installClickSound() {
  const onPointer = (e: PointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as Element | null
    if (!target || target.closest(TYPING)) return
    if (target.closest('[data-sound="off"]')) return
    if (target.closest(CONTROL)) playClick()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const target = e.target as Element | null
    if (!target || target.closest(TYPING)) return
    if (target.closest('[data-sound="off"]')) return
    if (target.closest(CONTROL)) playClick()
  }
  document.addEventListener('pointerdown', onPointer, true)
  document.addEventListener('keydown', onKey, true)
  return () => {
    document.removeEventListener('pointerdown', onPointer, true)
    document.removeEventListener('keydown', onKey, true)
  }
}
