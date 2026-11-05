import React from 'react'

/**
 * Scroll progress through a tall track, for the pinned process section.
 *
 * Returns a ref (written every frame, so the 3D layer can read it in useFrame
 * without React re-rendering) and the active step index as state (which only
 * changes where a step crosses the middle of the screen).
 *
 * The index and the cross-fade deliberately read the *same* rectangle. An
 * earlier version derived the object from the track's height and the text from
 * each step's own box; two references measured at two different scroll offsets
 * disagree for a few dozen pixels around every boundary, which is exactly when
 * the object has changed and its paragraph has not. One measurement, one
 * answer.
 */
export function useScrollProgress(track: React.RefObject<HTMLElement | null>, count: number) {
  const progress = React.useRef(0)
  const [active, setActive] = React.useState(0)
  const last = React.useRef(-1)
  const steps = React.useRef<HTMLElement[]>([])

  /* The steps are collected once, after mount, from inside the track. */
  React.useEffect(() => {
    const el = track.current
    if (!el) return
    steps.current = Array.from(el.querySelectorAll<HTMLElement>('[data-step]'))
  }, [track, count])

  React.useEffect(() => {
    const el = track.current
    if (!el) return

    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const span = Math.max(1, rect.height - window.innerHeight)
      // 0 at the moment the track pins, 1 as it releases
      const p = Math.min(1, Math.max(0, -rect.top / span))
      progress.current = p

      /* Which step is nearest the middle of the screen. Measured from the step
         boxes themselves, so the object can only ever be the one belonging to
         the paragraph a visitor is actually reading. */
      let idx = 0
      const mid = window.innerHeight / 2
      let best = Infinity
      const list = steps.current
      for (let i = 0; i < list.length; i++) {
        const r = list[i].getBoundingClientRect()
        if (!r.height) continue
        const d = Math.abs(r.top + r.height / 2 - mid)
        if (d < best) {
          best = d
          idx = i
        }
      }
      if (idx !== last.current) {
        last.current = idx
        setActive(idx)
        /* Exact scroll offset of this step's centre, handed to CSS so the
           cross-fade can be tied to the same number the 3D layer uses. */
        el.style.setProperty('--step', String(idx))
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [track, count])

  return { progress, active }
}
