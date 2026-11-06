import React from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useQuality, dprRange, watchPerformance } from './performance'
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

   Resolution follows the measured quality, so a struggling device drops to
   pixel ratio 1 before it is ever asked to stop animating.
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
  React.useEffect(() => {
    watchPerformance()
  }, [])

  return (
    <Canvas
      /* No tone mapping pass: the globe palette is authored in display space,
         and ACES would wash the ocean out to grey. */
      flat
      frameloop={visible ? (still ? 'demand' : 'always') : 'never'}
      dpr={dprRange(quality)}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: [0, 0, z], fov, near: 0.1, far: 60 }}
      style={{ touchAction: 'pan-y pinch-zoom' }}
      resize={{ scroll: false }}
    >
      <InvalidateBridge />
      {children}
    </Canvas>
  )
}
