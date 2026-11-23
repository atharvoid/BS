import React from 'react'
import { globePosterBox } from '../three/globe-frame'

/* The globe's still image: shown before the live globe is ready, while the
   page is restored from cache, and for good when WebGL is unavailable or the
   network fails. It measures the stage and places itself with the same
   arithmetic the live scene uses (globe-frame.ts), so swapping one for the
   other never moves or resizes the globe. Always facing India. */

export function GlobePoster() {
  const host = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState<{ left: number; top: number; size: number } | null>(null)

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

  return (
    <div ref={host} className="globe-still" aria-hidden="true">
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
