import React from 'react'
import { useFrame } from '@react-three/fiber'
import { reportFrame, reportStall } from './performance'

/* ==========================================================================
   Frame reporting, from inside a canvas.

   This is the only thing in the quality system that needs the renderer, so it
   is the only thing in a module that imports one. Keeping it separate is not
   tidiness: `performance.ts` is reachable from `Stage.tsx`, which both pages
   import statically, so anything it imports ends up in the entry bundle. When
   the reporter lived there it dragged three onto `/privacy`.

   Rendered as a child of a `<Canvas>`, where the frame loop exists. It is what
   makes "measure only while rendering" true rather than intended: R3F calls
   `useFrame` exactly once per drawn frame, so the gap between calls is the real
   interval between frames — and when the scene stops drawing (a still tier
   waiting for input, a stage scrolled out of view, a hidden tab) the reports
   stop too. The sampler then finds no data and leaves the quality alone,
   instead of reading a quiet page as a slow one.
   ========================================================================== */

export function FrameReporter() {
  const last = React.useRef(0)
  const hidden = React.useRef(false)

  React.useEffect(() => {
    const update = () => {
      hidden.current = document.hidden
      /* A tab that comes back has a stale interval; start again from zero so the
         gap while it was away is not reported as one enormous frame. */
      if (document.hidden) last.current = 0
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useFrame((_, delta) => {
    if (hidden.current) return
    /* `delta` is in seconds and already excludes time the loop was stopped, so a
       paused loop resumes without a spike. */
    const ms = delta * 1000
    if (last.current === 0) {
      last.current = ms
      return
    }
    last.current = ms
    reportFrame(ms)
    reportStall(ms)
  })

  return null
}
