import React from 'react'

/* ==========================================================================
   The mark.

   The supplied artwork is one flat gold on white, so the colour is thrown away
   and the alpha channel is used as a mask. One file therefore renders gold on
   ink, ink on cotton and gold on navy, with no tinted duplicates and no second
   version to keep in step.

   The two boxes below are the artwork's real proportions: the BS lockup with the
   ship is 968 x 511 of a 1024 x 752 canvas, and the wordmark is the remaining
   991 x 130. Keeping them as ratios means the mark is always exact, at any
   size, and no letter-spacing guess can drift it.
   ========================================================================== */

export const MARK = {
  width: 968,
  height: 511,
  /** Where the lockup sits inside the full artwork, as a fraction. */
  box: { x: 32 / 1024, y: 19 / 752, w: 968 / 1024, h: 511 / 752 },
} as const

export const WORDMARK = {
  width: 991,
  height: 130,
  box: { x: 20 / 1024, y: 600 / 752, w: 991 / 1024, h: 130 / 752 },
} as const

const SRC = '/logo/logo.png'

/** The BS lockup and ship, as a single masked block. */
export function Mark({ height = 30, className = '' }: { height?: number; className?: string }) {
  const k = height / MARK.height
  return (
    <span
      className={`logo-mark ${className}`}
      style={{ height, width: MARK.width * k, ['--k' as string]: k }}
      role="img"
      aria-label="BS"
    />
  )
}

/** The wordmark, masked from the same file. */
export function Wordmark({ height = 11, className = '' }: { height?: number; className?: string }) {
  const k = height / WORDMARK.height
  return (
    <span
      className={`logo-word ${className}`}
      style={{ height, width: WORDMARK.width * k, ['--k' as string]: k }}
      role="img"
      aria-label="EXIMNEXUS"
    />
  )
}

/** The full lockup with a single accessible name, for a link. */
export function Brand({ name }: { name: string }) {
  return (
    <span className="logo-brand" aria-hidden="true">
      <span className="logo-brand__mark">
        <Mark height={28} />
      </span>
      <span className="logo-brand__rule" />
      <span className="logo-brand__word">
        <Wordmark height={10} />
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Preloads the mask once, so the header mark is not blank for a frame while the
 * browser fetches it. Called from the intro sequence, which needs it anyway.
 */
let preloaded = false
export function preloadLogo() {
  if (preloaded) return
  preloaded = true
  const img = new Image()
  img.src = SRC
}
