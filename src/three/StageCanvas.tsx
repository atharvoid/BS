import React from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { FrameReporter, useQuality, measuredDpr } from './performance'
import { useSceneSession } from './SceneSession'

function InvalidateBridge() {
  const scene = useSceneSession()
  const invalidate = useThree((state) => state.invalidate)
  React.useEffect(() => {
    if (scene) scene.invalidate.current = invalidate
  }, [scene, invalidate])
  return null
}

/* ==========================================================================
   The WebGL surface itself. Loaded on demand, so the ~900 KB three.js bundle
   never blocks the first paint.

   `frameloop` is the whole performance story:

   - visible + animated: "always", at whatever the display does
   - visible + still:    "demand", so a scene with a stopped clock costs
                         nothing until something asks for a frame (a drag, a
                         new object, a resize)
   - off screen:         "never"

   Resolution comes from `measuredDpr`: a ceiling set by the screen and a pixel
   budget, stepped down one rung at a time when frames are actually slow. It is
   never dropped to 1 in one jump — a sudden loss of clarity reads as a bug,
   while a slightly cheaper frame is invisible.
   ========================================================================== */

export default function StageCanvas({
  children,
  visible,
  still,
  z,
  fov,
}: {
  children: React.ReactNode
  visible: boolean
  still: boolean
  z: number
  fov: number
}) {
  const quality = useQuality()

  /* Measured from the element, not assumed: a canvas can be any size, and the
     budget has to know how many pixels it is being asked to fill. */
  const host = React.useRef<HTMLDivElement | null>(null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  React.useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const dpr = React.useMemo(
    () => measuredDpr(quality, box.w, box.h),
    [quality, box.w, box.h],
  )

  return (
    <div ref={host} style={{ width: '100%', height: '100%' }}>
    <Canvas
      /* No tone mapping pass: the globe palette is authored in display space,
         and ACES would wash the ocean out to grey. */
      flat
      frameloop={visible ? (still ? 'demand' : 'always') : 'never'}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: [0, 0, z], fov, near: 0.1, far: 60 }}
      style={{ touchAction: 'pan-y pinch-zoom' }}
      resize={{ scroll: false }}
    >
      <InvalidateBridge />
      {/* Only draws while the scene does, which is what makes the quality
          measurement a measure of this device rather than of the page. */}
      <FrameReporter />
      {children}
    </Canvas>
    </div>
  )
}
