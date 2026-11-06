import React from 'react'

/* ==========================================================================
   Adaptive render quality.

   The 3D layer is the only thing on this site that can fall behind, so it is
   the only thing that needs to be told to slow down. Nothing here is a control
   the visitor has to find or operate: the browser measures its own frame
   cadence and the scene responds.

   How the measurement works
   -------------------------
   `requestAnimationFrame` hands every callback a timestamp. The gap between
   two consecutive frames is the real cost of the frame, whatever caused it:
   the globe's shader, a long style recalculation, a slow image decode, a
   throttled CPU. Sampling that gap is cheaper and more honest than any
   synthetic benchmark, and it needs no permissions.

   Two supporting signals tighten it:

   - **Long tasks.** `PerformanceObserver` reports main-thread tasks over 50ms.
     One 250ms task during animation is a visible stutter even if the average
     frame rate looks fine, so a long task counts against the current window.
   - **Device hints.** `navigator.hardwareConcurrency`, `navigator.deviceMemory`
     and `navigator.connection.saveData` describe the device before a single
     frame is drawn. They are not precise, so they only choose where sampling
     starts, never where it ends.

   What it decides
   ---------------
   `high`   full resolution, continuous animation
   `medium` device pixel ratio capped at 1, continuous animation
   `still`  one static frame; animation only while the visitor is actively
            dragging something, redrawn on demand

   Downgrades need two bad windows in a row, upgrades need six good ones, and
   an upgrade is refused for a few seconds after any change. That hysteresis is
   what stops the site oscillating between qualities on a borderline machine.
   ========================================================================== */

export type Quality = 'high' | 'medium' | 'still'

/** Window length used to judge the frame rate. */
const WINDOW_MS = 1200
/** Ignore gaps longer than this: a tab switch or a suspended process, not a frame. */
const GAP_CEILING = 400
/** Below this mean frame rate the window counts against the current quality. */
const SLOW_FPS = 33
/** Above this mean frame rate a window counts in favour of upgrading. */
const FAST_FPS = 50
const DOWNGRADES_NEEDED = 2
const UPGRADES_NEEDED = 6
/** No upgrade decision this soon after any change. */
const SETTLE_MS = 5000

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Where to start, based only on what the device says about itself. */
function initialQuality(): Quality {
  if (typeof window === 'undefined') return 'still'
  if (prefersReducedMotion()) return 'still'
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return 'medium'
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  if (cores <= 2 || memory <= 2) return 'medium'
  return 'high'
}

let quality: Quality = initialQuality()
let suspended = false
const listeners = new Set<() => void>()

function publish(next: Quality) {
  if (quality === next) return
  quality = next
  for (const notify of listeners) notify()
}

export function currentQuality() {
  return quality
}

/**
 * A download-saver visitor or a reduced-motion preference can change after the
 * page has loaded, and the scene has to follow it without a reload.
 */
function applyPreferences() {
  if (prefersReducedMotion()) {
    publish('still')
    return
  }
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  if (nav.connection?.saveData && quality === 'high') publish('medium')
}

/* -------------------------------------------------------------------------- */
/* Sampler                                                                     */
/* -------------------------------------------------------------------------- */

let running = false
let raf = 0
let windowStart = 0
let frames = 0
let slowRun = 0
let fastRun = 0
let changedAt = 0
let longTask = false

function step(time: number) {
  if (!running) return
  raf = requestAnimationFrame(step)
  if (document.hidden) {
    frames = 0
    windowStart = time
    return
  }
  if (!windowStart) windowStart = time
  frames += 1
  const elapsed = time - windowStart
  if (elapsed < WINDOW_MS) return

  const fps = (frames * 1000) / elapsed
  frames = 0
  windowStart = time

  // A single long task during the window is enough to call it slow, whatever
  // the mean says: the visitor experienced a freeze, not a low frame rate.
  const slow = fps < SLOW_FPS || longTask || document.visibilityState !== 'visible'
  longTask = false

  if (slow) {
    slowRun += 1
    fastRun = 0
  } else {
    fastRun = fps > FAST_FPS ? fastRun + 1 : 0
    slowRun = 0
  }

  if (slowRun >= DOWNGRADES_NEEDED) {
    slowRun = 0
    changedAt = time
    if (quality === 'high') publish('medium')
    else if (quality === 'medium') publish('still')
    return
  }

  if (fastRun >= UPGRADES_NEEDED && time - changedAt > SETTLE_MS) {
    fastRun = 0
    if (quality === 'still') publish('medium')
    else if (quality === 'medium' && !prefersReducedMotion()) publish('high')
  }
}

function start() {
  if (running || typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return
  running = true
  windowStart = 0
  frames = 0
  raf = requestAnimationFrame(step)
}

function stop() {
  running = false
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

/** Called when the first 3D stage mounts. */
export function watchPerformance() {
  if (suspended) return
  start()
}

/** The page has no 3D on it, so there is nothing to measure. */
export function releasePerformance() {
  stop()
}

export function suspendPerformance() {
  suspended = true
  stop()
}

export function resumePerformance() {
  if (!suspended) return
  suspended = false
  start()
}

let observer: PerformanceObserver | null = null
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (entry.duration > 250) longTask = true
    })
    observer.observe({ entryTypes: ['longtask'] })
  } catch {
    observer = null
  }
}

if (typeof window !== 'undefined') {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  motion.addEventListener('change', applyPreferences)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      frames = 0
      windowStart = 0
    }
  })
}

/* -------------------------------------------------------------------------- */
/* React bindings                                                              */
/* -------------------------------------------------------------------------- */

const subscribe = (notify: () => void) => {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}

export function useQuality(): Quality {
  return React.useSyncExternalStore(subscribe, currentQuality, () => 'still' as Quality)
}

/**
 * True when the scene should hold a still frame. Scenes read this and stop
 * advancing their clocks; they do not unmount, so a recovery is instant and
 * dragging still redraws on demand.
 */
export function useSceneStill() {
  return useQuality() === 'still' || prefersReducedMotion()
}

/** Device pixel ratio ceiling for the current quality. */
export function dprRange(q: Quality): [number, number] {
  if (q === 'high') return [1, 1.75]
  return [1, 1]
}
