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

   - **Long tasks.** `PerformanceObserver` reports main-thread tasks over 250ms.
     One long task during animation is a visible stutter even if the average
     frame rate looks fine, so it counts against the current window.
   - **Device hints.** `navigator.hardwareConcurrency`, `navigator.deviceMemory`
     and `navigator.connection.saveData` describe the device before a single
     frame is drawn. They are not precise, so they only choose where sampling
     starts, never where it ends.

   What it decides
   ---------------
   `high`   full resolution, continuous animation
   `medium` device pixel ratio capped at 1, continuous animation
   `still`  one static frame; a scene redraws only for input (a drag) and stops
            advancing on its own

   Downgrades need two bad windows in a row, upgrades need six good ones, and an
   upgrade is refused for a few seconds after any change. That hysteresis is
   what stops the site oscillating between qualities on a borderline machine.
   ========================================================================== */

export type Quality = 'high' | 'medium' | 'still'

/** Window length used to judge the frame rate. */
const WINDOW_MS = 1200
/** Below this mean frame rate the window counts against the current quality. */
const SLOW_FPS = 33
/** Above this mean frame rate a window counts in favour of upgrading. */
const FAST_FPS = 50
const DOWNGRADES_NEEDED = 2
const UPGRADES_NEEDED = 6
/** No upgrade decision this soon after any change. */
const SETTLE_MS = 5000

const motionQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

/** Where to start, based only on what the device says about itself. */
function initialQuality(): Quality {
  if (typeof window === 'undefined') return 'still'
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return 'medium'
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  if (cores <= 2 || memory <= 2) return 'medium'
  return 'high'
}

/** What the device managed to sustain, before motion preferences are applied. */
let sustained: Quality = initialQuality()
let reduced = motionQuery()?.matches ?? false
let suspended = false
const listeners = new Set<() => void>()

/** A reduced-motion visitor is always served a still scene, whatever the device
 *  can do. The sustained measurement is kept, so the moment they turn the
 *  preference off the scene returns to the right quality without a reload. */
function current(): Quality {
  return reduced ? 'still' : sustained
}

function publish() {
  for (const notify of listeners) notify()
}

export function currentQuality(): Quality {
  return current()
}

/* -------------------------------------------------------------------------- */
/* Sampler                                                                     */
/* -------------------------------------------------------------------------- */

let running = false
let owners = 0
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

  /* A single long task during the window is enough to call it slow, whatever
     the mean says: the visitor experienced a freeze, not a low frame rate. */
  const slow = fps < SLOW_FPS || longTask
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
    if (sustained === 'high') {
      sustained = 'medium'
      publish()
    } else if (sustained === 'medium') {
      sustained = 'still'
      publish()
    }
    return
  }

  if (fastRun >= UPGRADES_NEEDED && time - changedAt > SETTLE_MS) {
    fastRun = 0
    if (sustained === 'still') {
      sustained = 'medium'
      publish()
    } else if (sustained === 'medium') {
      sustained = 'high'
      publish()
    }
  }
}

function start() {
  if (running || typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return
  running = true
  windowStart = 0
  frames = 0
  slowRun = 0
  fastRun = 0
  raf = requestAnimationFrame(step)
}

function stop() {
  running = false
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

/** Called by every 3D stage that mounts. Reference counted, so one stage going
 *  away does not stop the measurement other stages still rely on. */
export function watchPerformance() {
  owners += 1
  if (suspended) return
  start()
}

export function releasePerformance() {
  owners = Math.max(0, owners - 1)
  if (owners === 0) stop()
}

export function suspendPerformance() {
  suspended = true
  stop()
}

export function resumePerformance() {
  if (!suspended) return
  suspended = false
  if (owners > 0) start()
}

/* -------------------------------------------------------------------------- */
/* Device and preference changes                                               */
/* -------------------------------------------------------------------------- */

let longTaskObserver: PerformanceObserver | null = null
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  try {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (entry.duration > 250) longTask = true
    })
    longTaskObserver.observe({ entryTypes: ['longtask'] })
  } catch {
    longTaskObserver = null
  }
}

if (typeof window !== 'undefined') {
  const motion = motionQuery()
  motion?.addEventListener?.('change', (event) => {
    reduced = event.matches
    publish()
  })
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; addEventListener?: (t: string, f: () => void) => void } }
  nav.connection?.addEventListener?.('change', () => {
    if (nav.connection?.saveData && sustained === 'high') {
      sustained = 'medium'
      publish()
    }
  })
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
  return React.useSyncExternalStore(subscribe, current, () => 'still' as Quality)
}

/**
 * True when the scene should hold a still frame. Scenes read this and stop
 * advancing their clocks. They are not unmounted, so a recovery is instant and
 * a drag still redraws on demand.
 */
export function useSceneStill() {
  return useQuality() === 'still'
}

/** Device pixel ratio ceiling for the current quality. */
export function dprRange(q: Quality): [number, number] {
  if (q === 'high') return [1, 1.75]
  return [1, 1]
}
