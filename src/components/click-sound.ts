/* Interface sound and background music, made in the browser with Web Audio.
 * No audio files are downloaded and nothing needs a licence.
 *
 * Four interface sounds:
 *   mouse  a classic mouse click (press, then release), for the page links
 *          in the header and menu: Products, Textiles, About
 *   tick   a small woody tap, for links and ordinary controls
 *   chime  two soft bell partials a fifth apart, for primary buttons
 *   dip    a low, soft drop, for opening a product area
 *
 * Background music (ambient.ts) is a quiet tanpura-style drone with an
 * occasional plucked note from a pentatonic scale. It starts only after the
 * visitor's first press or key (browsers require a gesture), fades in over
 * several seconds, pauses while the tab is hidden, and fades out when muted.
 *
 * One switch for all of it: the speaker button in the header. On by
 * default; muting is remembered. Never sounds while typing in a text field. */

import { startAmbient, stopAmbient } from './ambient'

const KEY = 'bs-sound'
let ctx: AudioContext | null = null
let out: GainNode | null = null
let noise: AudioBuffer | null = null
const listeners = new Set<() => void>()

export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}

export function setSound(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* storage blocked */ }
  listeners.forEach((l) => l())
  const ac = audio()
  if (!ac || !out) return
  if (on) {
    if (ac.state === 'suspended') void ac.resume()
    startAmbient(ac, out)
  } else stopAmbient()
}

export function onSoundChange(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** The shared audio context and master output (a gentle limiter). */
export function audio(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -14
  limiter.ratio.value = 6
  out = ctx.createGain()
  out.gain.value = 1
  out.connect(limiter).connect(ctx.destination)
  const length = Math.floor(ctx.sampleRate * 0.05)
  noise = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return ctx
}

type Sound = 'mouse' | 'tick' | 'chime' | 'dip'

function envelope(ac: AudioContext, t: number, peak: number, attack: number, release: number) {
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release)
  return g
}

/** Play one interface sound. `force` plays even when muted (to confirm unmuting). */
export function playSound(kind: Sound = 'tick', force = false) {
  if (!force && !soundOn()) return
  if (document.hidden) return
  const ac = audio()
  if (!ac || !out || !noise) return
  if (ac.state === 'suspended') void ac.resume()
  const t = ac.currentTime + 0.002
  const vary = 1 + (Math.random() - 0.5) * 0.06 // never quite the same twice

  if (kind === 'mouse') {
    // A classic mouse button: a crisp press and, a moment later, a quieter
    // release. Each is a very short burst of bright noise with a little body.
    for (const [at, peak, freq] of [[0, 0.11, 4200], [0.035, 0.05, 3600]] as const) {
      const start = t + at
      const src = ac.createBufferSource()
      src.buffer = noise
      const high = ac.createBiquadFilter()
      high.type = 'bandpass'
      high.frequency.value = freq * vary
      high.Q.value = 0.9
      const g = envelope(ac, start, peak, 0.0005, 0.006)
      src.connect(high).connect(g).connect(out)
      src.start(start)
      src.stop(start + 0.02)
      const body = ac.createOscillator()
      body.type = 'square'
      body.frequency.setValueAtTime(1900 * vary, start)
      body.frequency.exponentialRampToValueAtTime(900, start + 0.006)
      const bg = envelope(ac, start, peak * 0.18, 0.0005, 0.007)
      const soft = ac.createBiquadFilter()
      soft.type = 'lowpass'
      soft.frequency.value = 5000
      body.connect(soft).connect(bg).connect(out)
      body.start(start)
      body.stop(start + 0.012)
    }
    return
  }

  if (kind === 'tick') {
    // Wood: a short triangle that drops in pitch, plus a breath of noise.
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1250 * vary, t)
    osc.frequency.exponentialRampToValueAtTime(620 * vary, t + 0.028)
    const g = envelope(ac, t, 0.085, 0.002, 0.05)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 0.07)

    const src = ac.createBufferSource()
    src.buffer = noise
    const band = ac.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 2600 * vary
    band.Q.value = 1.2
    const ng = envelope(ac, t, 0.05, 0.001, 0.012)
    src.connect(band).connect(ng).connect(out)
    src.start(t)
    src.stop(t + 0.03)
    return
  }

  if (kind === 'chime') {
    // A small bell: two sine partials a fifth apart, the upper one quieter.
    for (const [freq, peak] of [[880, 0.05], [1320, 0.022], [2640, 0.006]] as const) {
      const osc = ac.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq * vary
      const g = envelope(ac, t, peak, 0.004, 0.5)
      osc.connect(g).connect(out)
      osc.start(t)
      osc.stop(t + 0.55)
    }
    return
  }

  // dip: a soft low drop with a little air on top, like cloth into a vat.
  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(330 * vary, t)
  osc.frequency.exponentialRampToValueAtTime(150 * vary, t + 0.22)
  const g = envelope(ac, t, 0.07, 0.01, 0.28)
  osc.connect(g).connect(out)
  osc.start(t)
  osc.stop(t + 0.32)
  const src = ac.createBufferSource()
  src.buffer = noise
  src.loop = true
  const low = ac.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.setValueAtTime(1800, t)
  low.frequency.exponentialRampToValueAtTime(300, t + 0.25)
  const ng = envelope(ac, t, 0.018, 0.02, 0.22)
  src.connect(low).connect(ng).connect(out)
  src.start(t)
  src.stop(t + 0.3)
}

/** Kept for existing callers: the ordinary tick. */
export function playClick(force = false) {
  playSound('tick', force)
}

const CONTROL = 'a[href], button, [role="button"], summary, select, label, input[type="checkbox"], input[type="radio"], input[type="submit"], [role="radio"], [role="option"], [role="combobox"]'
const TYPING = 'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]), textarea, [contenteditable="true"]'

function soundFor(control: Element): Sound {
  if (control.matches('.vat__tab')) return 'dip'
  if (control.matches('.nav__link, .drawer__link')) return 'mouse'
  if (control.matches('.btn, [type="submit"]')) return 'chime'
  return 'tick'
}

/** Listen once for the whole document. Returns a cleanup function. */
export function installClickSound() {
  let musicStarted = false
  const startMusic = () => {
    if (musicStarted || !soundOn()) return
    const ac = audio()
    if (!ac || !out) return
    musicStarted = true
    if (ac.state === 'suspended') void ac.resume()
    startAmbient(ac, out)
  }
  const unsubscribe = onSoundChange(() => { if (!soundOn()) musicStarted = false })

  const fire = (target: Element | null) => {
    if (!target || target.closest(TYPING)) return
    if (target.closest('[data-sound="off"]')) return
    const control = target.closest(CONTROL)
    if (control) playSound(soundFor(control))
  }
  const onPointer = (e: PointerEvent) => {
    if (e.button !== 0) return
    startMusic()
    fire(e.target as Element | null)
  }
  const onKey = (e: KeyboardEvent) => {
    startMusic()
    if (e.key !== 'Enter' && e.key !== ' ') return
    fire(e.target as Element | null)
  }
  const onVisibility = () => {
    if (!ctx) return
    if (document.hidden) void ctx.suspend()
    else if (soundOn()) void ctx.resume()
  }
  document.addEventListener('pointerdown', onPointer, true)
  document.addEventListener('keydown', onKey, true)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    document.removeEventListener('pointerdown', onPointer, true)
    document.removeEventListener('keydown', onKey, true)
    document.removeEventListener('visibilitychange', onVisibility)
    unsubscribe()
  }
}
