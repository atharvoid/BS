import React from 'react'
import { globePosterBox } from '../three/globe-frame'
import { claimGlobeEntrance, globeEntrance, introPhase, onIntroChange, setGlobeEntrance } from './intro-state'

/* The globe's still image: shown before the live globe is ready, while the
   page is restored from cache, and for good when WebGL is unavailable or the
   network fails. It measures the stage and places itself with the same
   arithmetic the live scene uses (globe-frame.ts), so swapping one for the
   other never moves or resizes the globe. Always facing India.

   During the opening it stays hidden: the live globe is expected to fly in.
   If the live globe has not arrived shortly after the cover lifts (slow
   network, no WebGL), the still takes the entrance itself and slides in. */

/** How long after the cover lifts the still waits for the live globe. */
const LIVE_GRACE_MS = 1400
const SLIDE_MS = 1300

export function GlobePoster() {
  const host = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState<{ left: number; top: number; size: number } | null>(null)
  const entrance = React.useSyncExternalStore(onIntroChange, globeEntrance, () => 'none' as const)
  const phase = React.useSyncExternalStore(onIntroChange, introPhase, () => 'idle' as const)

  React.useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) setBox(globePosterBox(width, height))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const lifting = phase === 'revealing' || phase === 'idle'
  React.useEffect(() => {
    if (entrance !== 'pending' || !lifting) return
    const wait = setTimeout(() => claimGlobeEntrance('poster'), LIVE_GRACE_MS)
    return () => clearTimeout(wait)
  }, [entrance, lifting])

  React.useEffect(() => {
    if (entrance !== 'poster') return
    const done = setTimeout(() => setGlobeEntrance('none'), SLIDE_MS)
    return () => clearTimeout(done)
  }, [entrance])

  const state = entrance === 'pending' || entrance === 'live' ? 'waiting' : entrance === 'poster' ? 'entering' : 'rest'

  return (
    <div ref={host} className="globe-still" aria-hidden="true" data-entry={state}>
      {box && (
        <img
          src="/posters/globe-square.webp"
          srcSet="/posters/globe-square-small.webp 800w, /posters/globe-square.webp 1600w"
          sizes={`${Math.round(box.size)}px`}
          alt=""
          width={1600}
          height={1600}
          fetchPriority="high"
          decoding="async"
          style={{ left: box.left, top: box.top, width: box.size, height: box.size }}
        />
      )}
    </div>
  )
}
