/* Background music: a clean, quiet pad. Nothing plucked, nothing struck.
 *
 * Four soft chords (D major 9, B minor 7, G major 7, A sus 2) that swell in
 * over three seconds, hold, and fade over four, overlapping so there is never
 * a gap or an edge. Each note is a sine with a slightly detuned triangle for
 * warmth. A lowpass that breathes very slowly keeps it from sounding static,
 * and a short generated reverb gives it a room. The whole mix sits low,
 * as background, not as a song.
 *
 * Scheduling uses a look-ahead timer against the audio clock, so the chords
 * stay evenly spaced even when the page is busy. */

const MASTER_LEVEL = 0.065 // about -44 dBFS RMS: present, never in front
const FADE_IN_S = 6
const FADE_OUT_S = 1.2

const CHORD_EVERY_S = 8
const ATTACK_S = 3
const HOLD_S = 5
const RELEASE_S = 4

const CHORDS = [
  [146.83, 220.0, 277.18, 329.63, 369.99], // D major 9
  [123.47, 185.0, 220.0, 293.66, 329.63],  // B minor 7 (add 11)
  [98.0, 146.83, 185.0, 246.94, 293.66],   // G major 7
  [110.0, 164.81, 220.0, 246.94, 329.63],  // A sus 2
]

let master: GainNode | null = null
let bus: AudioNode | null = null
let timer: number | undefined
let nextChord = 0
let chordIndex = 0

function makeReverb(ac: AudioContext) {
  const seconds = 3.5
  const length = Math.floor(ac.sampleRate * seconds)
  const impulse = ac.createBuffer(2, length, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3)
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
  tone.frequency.value = 1300
  tone.Q.value = 0.4
  // The filter breathes: one slow cycle about every twenty seconds.
  const lfo = ac.createOscillator()
  lfo.frequency.value = 0.05
  const depth = ac.createGain()
  depth.gain.value = 280
  lfo.connect(depth).connect(tone.frequency)
  lfo.start()

  const dry = ac.createGain()
  dry.gain.value = 0.7
  const wet = ac.createGain()
  wet.gain.value = 0.45
  const reverb = makeReverb(ac)
  tone.connect(dry).connect(master)
  tone.connect(reverb).connect(wet).connect(master)
  master.connect(destination)
  bus = tone
}

function playChord(ac: AudioContext, t: number, notes: number[]) {
  if (!bus) return
  const end = t + ATTACK_S + HOLD_S + RELEASE_S
  const voice = ac.createGain()
  voice.gain.setValueAtTime(0.0001, t)
  voice.gain.exponentialRampToValueAtTime(1, t + ATTACK_S)
  voice.gain.setValueAtTime(1, t + ATTACK_S + HOLD_S)
  voice.gain.exponentialRampToValueAtTime(0.0001, end)
  voice.connect(bus)
  notes.forEach((freq, i) => {
    // Lower notes a little louder, so the chord sits on its root.
    const level = 0.11 * (1 - i * 0.12)
    for (const [type, detune, mix] of [['sine', 0, 1], ['triangle', 5, 0.35], ['triangle', -5, 0.35]] as const) {
      const osc = ac.createOscillator()
      osc.type = type
      osc.frequency.value = freq
      osc.detune.value = detune
      const g = ac.createGain()
      g.gain.value = level * mix
      osc.connect(g).connect(voice)
      osc.start(t)
      osc.stop(end + 0.05)
    }
  })
}

function schedule(ac: AudioContext) {
  const horizon = ac.currentTime + 0.5
  while (nextChord < horizon) {
    playChord(ac, nextChord, CHORDS[chordIndex % CHORDS.length])
    chordIndex++
    nextChord += CHORD_EVERY_S
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
  nextChord = now + 0.1
  schedule(ac)
  timer = window.setInterval(() => schedule(ac), 250)
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
