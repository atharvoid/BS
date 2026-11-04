import React from 'react'

/**
 * Scroll progress through a tall track, for the pinned process section.
 *
 * Returns a ref (written every frame, so the 3D layer can read it in useFrame
 * without React re-rendering) and the active step index as state (which only
 * changes where a step crosses the middle of the screen).
 */
export function useScrollProgress(track: React.RefObject<HTMLElement | null>, count: number) {
  const progress = React.useRef(0)
  const [active, setActive] = React.useState(0)
  const last = React.useRef(0)

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

      // A step becomes active once it is centred in the pinned frame.
      const idx = Math.min(count - 1, Math.max(0, Math.floor(p * count + 0.5 - 0.0001)))
      if (idx !== last.current) {
        last.current = idx
        setActive(idx)
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
