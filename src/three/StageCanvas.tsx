import React from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useSceneSession } from './SceneSession'

function InvalidateBridge() {
  const scene = useSceneSession()
  const invalidate = useThree((state) => state.invalidate)
  React.useEffect(() => { if (scene) scene.invalidate.current = invalidate }, [scene, invalidate])
  return null
}

/* ==========================================================================
   The WebGL surface itself. Loaded on demand, so the ~900 KB three.js bundle
   never blocks the first paint — it arrives only when a stage scrolls near the
   viewport.
   ========================================================================== */

export default function StageCanvas({
  children,
  visible,
  paused,
  z,
  fov,
}: {
  children: React.ReactNode
  visible: boolean
  paused: boolean
  z: number
  fov: number
}) {
  return (
    <Canvas
      /* No tone mapping pass: the globe palette is authored in display space,
         and ACES would wash the ocean out to grey. */
      flat
      frameloop={visible ? (paused ? 'demand' : 'always') : 'never'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, z], fov, near: 0.1, far: 60 }}
      style={{ touchAction: 'pan-y pinch-zoom' }}
      resize={{ scroll: false }}
    >
      <InvalidateBridge />
      {children}
    </Canvas>
  )
}
