import React from 'react'
import { Canvas, useThree } from '@react-three/fiber'

/* ==========================================================================
   The WebGL surface itself. Loaded on demand, so the three.js bundle never
   blocks the first paint; it arrives only when a stage scrolls near the
   viewport.

   Three economies matter here.

   1. `visible` comes from an IntersectionObserver on the stage, not from a rect
      sampled once at mount. A stage that scrolls away stops drawing entirely,
      so the hero's globe no longer renders behind the enquiry form.

   2. The loop is driven by hand on a demand frameloop, capped at `maxFps`.
      Every scene here is a slow drift: a turning globe, an object settling into
      place. Sixty frames a second buys nothing thirty does not, and halving it
      frees the frame budget for the one thing that has to stay smooth, which is
      scrolling.

   3. Frames stop when the tab is hidden. A backgrounded tab keeps a normal rAF
      running on some browsers and quietly burns battery for a page nobody can
      see.
   ========================================================================== */

/**
 * Calls `invalidate` on a fixed interval while `active`. Because the canvas
 * runs `frameloop="demand"`, this is the only thing that produces frames, so
 * the rate is exact and dropping it costs nothing.
 */
function FrameGate({ active, fps }: { active: boolean; fps: number }) {
  const invalidate = useThree((s) => s.invalidate)

  React.useEffect(() => {
    if (!active) return
    let raf = 0
    let last = 0
    /* A little under the interval, so a 16.7ms display hits the cap every time
       instead of landing just short and halving itself. */
    const gap = 1000 / fps - 1.2
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (document.hidden) return
      if (t - last < gap) return
      last = t
      invalidate()
    }
    raf = requestAnimationFrame(loop)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active, fps, invalidate])

  return null
}

/** Whether this canvas is actually on screen. */
export const ScreenContext = React.createContext(false)

export default function StageCanvas({
  children,
  visible,
  z,
  fov,
  maxFps = 30,
  dpr = [1, 1.6],
}: {
  children: React.ReactNode
  visible: boolean
  z: number
  fov: number
  maxFps?: number
  dpr?: [number, number]
}) {
  return (
    <Canvas
      /* No tone mapping pass: the palette is authored in display space, and
         ACES would wash the navy out to grey. */
      flat
      frameloop="demand"
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        /* Unused by these scenes; on some drivers asking for it forces a
           slower path. */
        stencil: false,
      }}
      camera={{ position: [0, 0, z], fov, near: 0.1, far: 60 }}
      style={{ touchAction: 'pan-y' }}
      resize={{ scroll: false }}
    >
      <FrameGate active={visible} fps={maxFps} />
      <ScreenContext.Provider value={visible}>{children}</ScreenContext.Provider>
    </Canvas>
  )
}
