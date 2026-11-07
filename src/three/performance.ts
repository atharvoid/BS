import React from 'react'

/* ==========================================================================
   Adaptive render quality.

   **This module must not import `@react-three/fiber` or `three`.**
   `Stage.tsx` imports it, and both pages import `Stage.tsx` statically, so a
   single import of the renderer here is enough to put the whole 918 kB three
   chunk in the entry bundle and fetch it on every route — including pages with
   no 3D at all. That regression happened once already, when the frame reporter
   lived here. The reporter now lives in `FrameReporting.tsx`, below the canvas,
   where the renderer belongs.

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
/** More than this many stalls in one window is a bad window. Two, not one: a
 *  single hitch on an otherwise smooth scene is a hiccup, not a tier. */
const STALLS_PER_WINDOW = 2
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

/* -------------------------------------------------------------------------- */
/* Render timing                                                               */
/* -------------------------------------------------------------------------- */

/**
 * How long the frames actually took, as opposed to how often they happened.
 *
 * The sampler above reads the gap between `requestAnimationFrame` callbacks,
 * which is only a frame rate while something is drawing. A stage that is on
 * screen but idle — scrolled to and then left alone, a still scene waiting for
 * input, a tab that was just brought back — still fires the callback, so a
 * quiet page reads as a slow one, and a scene that never draws never recovers
 * once it has been marked down.
 *
 * Each canvas therefore reports its own drawn frames: the draw call's duration,
 * and the interval between the frames it actually produced. Both are needed. A
 * draw that takes 4 ms but happens sixty times a second is healthy; a draw that
 * takes 4 ms and happens three times a second is not, and only the interval can
 * tell them apart.
 *
 * Reports are dropped when nothing is drawing. A window with no reports is not
 * a bad window — it is no data, and the sampler leaves the quality alone.
 */
/** One report per frame would be thousands of allocations a second; the window
 *  keeps a running tally instead. */
const frame = { count: 0, intervalTotal: 0 }
let lastReport = 0

/** Called by every scene, once per drawn frame. Both figures are milliseconds. */
export function reportFrame(sinceLastMs: number) {
  if (!(sinceLastMs >= 0)) return
  /* A gap longer than the window is a pause, not a frame: the page was hidden,
     the stage was off screen, or a tab was in the background. Those are excluded
     from the mean rather than dragging it up. */
  if (sinceLastMs > WINDOW_MS * 2) return
  frame.count += 1
  frame.intervalTotal += sinceLastMs
  lastReport = typeof performance !== 'undefined' ? performance.now() : Date.now()
}

/** Mean of the frames drawn since the last read, or null if nothing drew. */
function readFrames(now: number): { fps: number } | null {
  /* Nothing has drawn for more than two windows: the scene has stopped, so
     there is no frame rate to judge and no reason to change anything. */
  if (!frame.count || now - lastReport > WINDOW_MS * 2) {
    frame.count = 0
    frame.intervalTotal = 0
    return null
  }
  const meanInterval = frame.intervalTotal / frame.count
  frame.count = 0
  frame.intervalTotal = 0
  return { fps: meanInterval > 0 ? 1000 / meanInterval : 0 }
}

/* -------------------------------------------------------------------------- */
/* Stall detection                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A single frame that took far too long is a stall, and a visitor notices one
 * stall more than a slightly low average. These are counted per window in
 * addition to the mean, so a scene that is mostly smooth but hitches every few
 * frames is treated as the problem it is.
 */
let stalls = 0

export function reportStall(ms: number) {
  if (ms >= STALL_MS) stalls += 1
}

const STALL_MS = 120

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
  const drawn = readFrames(time)
  const stalledThisWindow = stalls
  stalls = 0

  /* No frames were drawn, so the window says nothing about this device's
     capability. Leave the runs exactly as they were rather than counting or
     clearing them: a page that was scrolled away from must not come back
     downgraded, and it must not come back upgraded either. Reset only the
     per-window signals that would otherwise be attributed to the next window
     with data. */
  if (!drawn) {
    longTask = false
    return
  }

  const slow =
    drawn.fps < SLOW_FPS || longTask || stalledThisWindow >= STALLS_PER_WINDOW
  longTask = false

  if (slow) {
    slowRun += 1
    fastRun = 0
  } else {
    /* Judged on the frames the scene actually drew, not on the rAF cadence: a
       quiet stage fires rAF on time while drawing nothing, and would otherwise
       look like the best device in the world. */
    fastRun = drawn.fps > FAST_FPS ? fastRun + 1 : 0
    slowRun = 0
  }

  /* A change costs the scene a rebuild — new shaders at a new resolution, or a
     clock that stops — so two in a row is a visible flutter. The cooldown
     applies to going down as well as coming back up, which is the direction it
     was missing: a device in trouble is the one most likely to prompt a second
     immediate decision. */
  if (slowRun >= DOWNGRADES_NEEDED) {
    slowRun = 0
    if (changedAt && time - changedAt < SETTLE_MS) return
    changedAt = time
    /* Clarity first, animation last. A slow device is asked to draw fewer
       pixels before it is asked to stop moving: a slightly softer frame is
       invisible, a stopped scene is not. */
    if (lowerClarity()) return
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
    /* A recovering device gets its clarity back before it is asked to animate
       more; the animation tiers are slower to return than they are to go. */
    if (raiseClarity()) return
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
  if (running || suspended || typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return
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
  /* Nothing to sample while the visitor has asked for no motion. */
  if (suspended || reduced) return
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
    /* `reduced` masks the sustained tier rather than replacing it, so turning
       the preference back off returns the device to whatever it had measured —
       no reload, and no relearning of a device we already know. */
    /* A visitor who has asked for no motion gets a still scene, and a still
       scene has no frame rate to measure. Stopping the sampler is the honest
       reading of "measure only while rendering" — and it means no work is being
       done on behalf of someone who asked for less of it. */
    if (reduced) stop()
    else if (owners > 0 && !suspended) start()
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

/* -------------------------------------------------------------------------- */
/* Resolution                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * How many device pixels to spend on each CSS pixel.
 *
 * The old rule was one number per tier: 1.75 at `high`, and 1 the moment the
 * quality dropped. On a 3× phone the fall from 1.75 to 1 is a visible step —
 * the scene goes soft in one frame, which reads as a bug rather than a
 * compromise. It is also the wrong thing to give up first: brightness and
 * geometry are nearly free, and clarity is the thing a visitor notices.
 *
 * So resolution has its own ladder with smaller steps, and a change is only
 * made for a *sustained* miss. Between steps the scene keeps its own aspect,
 * and because the ceiling is the device's own ratio nothing is ever drawn above
 * what the screen can show.
 *
 * The third factor is a pixel budget. A phone at 3× drawing a 1400×900 canvas
 * wants 11.3 million pixels per frame, which no phone GPU can fill and shade at
 * 60Hz; capping the buffer keeps the frame time bounded without touching the
 * CSS layout. 3 million is the budget — a little over 1080p at 1×.
 *
 * It is deliberately generous: the ladder already steps down when frames are
 * actually slow, so the budget's job is only to stop a large canvas asking for
 * the absurd (a desktop hero at 3× would be 11 million pixels), not to make the
 * first frame cheap. Starting mild and correcting under measurement is the
 * whole design, and it is what lets a phone open at its own 3× and settle to
 * whatever it can hold.
 */
const DPR_STEPS = [3, 2.5, 2, 1.75, 1.5, 1.25, 1] as const
const PIXEL_BUDGET = 3_000_000

export type Resolution = {
  /** Ceiling handed to the renderer. */
  dpr: number
  /** True when the budget, not the ladder, set the number. */
  capped: boolean
}

/**
 * The resolution to draw at, for a canvas of `cssWidth × cssHeight` CSS pixels
 * on a screen of `deviceDpr`.
 *
 * Pure, and exported: the ladder and the budget are the kind of thing that is
 * easy to get subtly wrong (a step that never applies, a cap that ignores one
 * axis) and impossible to check by eye, so they are tested directly.
 */
export function resolutionFor(
  q: Quality,
  cssWidth: number,
  cssHeight: number,
  deviceDpr: number,
): Resolution {
  if (q === 'still') return { dpr: 1, capped: false }

  /* `high` starts at the screen's own ratio; `medium` starts below it. Both
     descend the same steps, so a drop is always one rung, never a cliff. */
  const ceiling = q === 'high' ? Math.max(1, deviceDpr) : Math.min(2, Math.max(1, deviceDpr))
  let dpr = DPR_STEPS.find((step) => step <= ceiling + 1e-3) ?? 1

  /* The budget can only lower the number: it is there to bound the fill cost,
     never to raise a small canvas above the screen. */
  const cssPixels = Math.max(1, cssWidth) * Math.max(1, cssHeight)
  let capped = false
  while (dpr > 1 && cssPixels * dpr * dpr > PIXEL_BUDGET) {
    const next = DPR_STEPS.find((step) => step < dpr) ?? 1
    if (next === dpr) break
    dpr = next
    capped = true
  }

  return { dpr, capped }
}

/** How many times the scene has had to give up clarity. Read by the report in
 *  the acceptance table, so a regression is visible as a number. */
export function clarityStep(): number {
  return clarityIndex
}

let clarityIndex = 0

/** Called when a window is slow for long enough that the scene should be
 *  drawn more cheaply. Returns true when it actually stepped down, so callers
 *  can tell a real change from a repeated request. */
export function lowerClarity(): boolean {
  if (clarityIndex >= DPR_STEPS.length - 1) return false
  clarityIndex += 1
  publish()
  return true
}

/** Resets the ladder after a period of good frames. */
export function raiseClarity(): boolean {
  if (clarityIndex <= 0) return false
  clarityIndex -= 1
  publish()
  return true
}

/** The resolution a scene should ask its renderer for, right now. */
export function measuredDpr(q: Quality, cssWidth: number, cssHeight: number): number {
  const base = resolutionFor(q, cssWidth, cssHeight, deviceDpr())
  /* The clarity ladder is applied after the budget: a slow device steps down
     from where it was, rather than jumping to a floor. */
  const step = DPR_STEPS[Math.min(clarityIndex, DPR_STEPS.length - 1)]
  const limited = Math.min(base.dpr, step)
  return Math.max(1, limited)
}

/** The screen's own ratio, defensively: some embedded browsers report 0. */
function deviceDpr(): number {
  const raw = typeof window !== 'undefined' ? window.devicePixelRatio : 1
  return Number.isFinite(raw) && raw > 0 ? raw : 1
}

/* -------------------------------------------------------------------------- */
/* Reporting, from inside a scene                                              */
/* -------------------------------------------------------------------------- */
