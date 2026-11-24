/* Background music: quiet, slow, and never the point.
 *
 * A tanpura-style drone on D (the four strings plucked in turn: Pa, Sa, Sa,
 * low Sa, as a tanpura is played), under an occasional soft plucked note
 * from the Bhupali pentatonic scale (D E F# A B). Everything passes through
 * a lowpass and a short generated reverb, and the whole mix sits about 30 dB
 * below full scale, so it reads as room tone rather than a song.
 *
 * Scheduling uses a small look-ahead timer against the audio clock, so the
 * rhythm stays steady even when the page is busy. */

const MASTER_LEVEL = 0.05
const FADE_IN_S = 6
const FADE_OUT_S = 1.2

// D3 = 146.83 Hz. Tanpura strings: Pa (A2), Sa (D3), Sa (D3), low Sa (D2).
const STRINGS = [110.0, 146.83, 146.83, 73.42]
const STRING_GAP_S = 1.15
// Bhupali on D, two octaves: D E F# A B.
const SCALE = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25]

let master: GainNode | null = null
let bus: AudioNode | null = null
let timer: number | undefined
let nextString = 0
let stringIndex = 0
let nextNote = 0
let lastNote = 2

function makeReverb(ac: AudioContext) {
  const seconds = 3.2
  const length = Math.floor(ac.sampleRate * seconds)
  const impulse = ac.createBuffer(2, length, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6)
  }
  const conv = ac.createConvolver()
  conv.buffer = impulse
  return conv
}

function build(ac: AudioContext, destination: AudioNode) {
  master = ac.createGain()
  master.gain.value = 0.0001
  const tone = ac.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 2400
  const dry = ac.createGain()
  dry.gain.value = 0.55
  const wet = ac.createGain()
  wet.gain.value = 0.6
  const reverb = makeReverb(ac)
  tone.connect(dry).connect(master)
  tone.connect(reverb).connect(wet).connect(master)
  master.connect(destination)
  bus = tone
}

/** One tanpura string: a bright buzzy pluck that blooms and fades slowly. */
function pluckString(ac: AudioContext, t: number, freq: number) {
  if (!bus) return
  const voice = ac.createGain()
  voice.gain.setValueAtTime(0.0001, t)
  voice.gain.exponentialRampToValueAtTime(0.32, t + 0.06)
  voice.gain.exponentialRampToValueAtTime(0.0001, t + 4.2)
  // The jivari buzz: rich harmonics swept down by a resonant filter.
  const buzz = ac.createBiquadFilter()
  buzz.type = 'lowpass'
  buzz.Q.value = 4
  buzz.frequency.setValueAtTime(freq * 9, t)
  buzz.frequency.exponentialRampToValueAtTime(freq * 2.2, t + 3.5)
  for (const [mult, type, level] of [[1, 'sawtooth', 0.5], [1.003, 'sawtooth', 0.35], [2, 'triangle', 0.25]] as const) {
    const osc = ac.createOscillator()
    osc.type = type
    osc.frequency.value = freq * mult
    const g = ac.createGain()
    g.gain.value = level
    osc.connect(g).connect(buzz)
    osc.start(t)
    osc.stop(t + 4.3)
  }
  buzz.connect(voice).connect(bus)
}

/** A soft plucked note, like a distant santoor. */
function pluckNote(ac: AudioContext, t: number, freq: number) {
  if (!bus) return
  const voice = ac.createGain()
  voice.gain.setValueAtTime(0.0001, t)
  voice.gain.exponentialRampToValueAtTime(0.11, t + 0.008)
  voice.gain.exponentialRampToValueAtTime(0.0001, t + 2.6)
  for (const [mult, level] of [[1, 1], [2, 0.18], [3.01, 0.06]] as const) {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    const g = ac.createGain()
    g.gain.value = level
    osc.connect(g).connect(voice)
    osc.start(t)
    osc.stop(t + 2.7)
  }
  voice.connect(bus)
}

function schedule(ac: AudioContext) {
  const horizon = ac.currentTime + 0.4
  while (nextString < horizon) {
    pluckString(ac, nextString, STRINGS[stringIndex % STRINGS.length])
    stringIndex++
    nextString += STRING_GAP_S * (stringIndex % STRINGS.length === 0 ? 1.6 : 1)
  }
  while (nextNote < horizon) {
    // A small step up or down the scale, so the line wanders but never jumps.
    const step = [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]
    lastNote = Math.min(SCALE.length - 1, Math.max(0, lastNote + step))
    pluckNote(ac, nextNote, SCALE[lastNote])
    // Sometimes a second note follows closely, like a phrase.
    if (Math.random() < 0.35) {
      const second = Math.min(SCALE.length - 1, Math.max(0, lastNote + (Math.random() < 0.5 ? -1 : 1)))
      pluckNote(ac, nextNote + 0.42, SCALE[second])
    }
    nextNote += 4 + Math.random() * 5
  }
}

export function startAmbient(ac: AudioContext, destination: AudioNode) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!master) build(ac, destination)
  if (timer !== undefined || !master) return
  const now = ac.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now)
  master.gain.exponentialRampToValueAtTime(MASTER_LEVEL, now + FADE_IN_S)
  nextString = now + 0.1
  nextNote = now + 3
  schedule(ac)
  timer = window.setInterval(() => schedule(ac), 150)
}

export function stopAmbient() {
  if (!master) return
  const ac = master.context
  const now = ac.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now)
  master.gain.exponentialRampToValueAtTime(0.0001, now + FADE_OUT_S)
  window.clearInterval(timer)
  timer = undefined
}
