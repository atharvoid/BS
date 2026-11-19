/* ==========================================================================
   The globe's rotation gate.

   The globe should be found facing India. That is easy to state and easy to get
   wrong, because three things all move it:

   - the globe starts turning from India as the logo lifts;
   - a drag offsets the angle, and any momentum left on it would carry into the
     next look;
   - a still-frame device draws one image, so "the angle it mounts at" is the
     angle it is stuck with.

   So the angle is a small state machine, kept out of the component and out of
   the render loop so it can be tested without a browser:

     held    the logo is drawing
     free    drift advances from the start angle
     still   the device is holding a frame

   Every replay starts the drift from India.
   ========================================================================== */

/** Radians per second of automatic drift. A full turn takes about 140 s. */
export const SPIN_RATE = 0.045

export type GlobeGate = {
  /** Angle the globe rests at before the logo lifts. */
  readonly start: number
  /** Current angle. */
  angle(): number
  /** True while the logo is drawing. */
  held(): boolean
  /** Accumulated drift since the last rewind. */
  drift(): number
  /** Start holding, or clear the hold and rewind to the start angle. */
  intro(active: boolean): void
  /** Advance by `dt` seconds. `still` freezes without rewinding. */
  advance(dt: number, still: boolean, dragging: boolean): void
  /** Rewind to the start angle, dropping drift and momentum. */
  rewind(): void
}

/** Anything longer than this is not a frame, it is a tab that was in the
 *  background or a stall. Time like that is dropped rather than counted: the
 *  globe should resume where it was, not leap forward to catch up. */
export const MAX_FRAME_S = 0.25

export function createGlobeGate(start: number): GlobeGate {
  let spin = 0
  let isHeld = false

  const gate: GlobeGate = {
    start,
    angle: () => start + spin,
    held: () => isHeld,
    drift: () => spin,
    intro: (active: boolean) => {
      isHeld = active
      /* Both edges rewind: entering the opening means the first honest frame is
         the start angle, and leaving it means the drift begins from there. */
      spin = 0
    },
    advance: (dt: number, still: boolean, dragging: boolean) => {
      if (still || isHeld || dragging) return
      /* NaN, negative and zero are not time passing. */
      if (!(dt > 0) || !Number.isFinite(dt)) return
      if (dt > MAX_FRAME_S) return
      spin += dt * SPIN_RATE
    },
    rewind: () => {
      spin = 0
    },
  }
  return gate
}
