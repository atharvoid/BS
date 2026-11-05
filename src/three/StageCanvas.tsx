import React from 'react'
import { Canvas } from '@react-three/fiber'

/* ==========================================================================
   The WebGL surface itself. Loaded on demand, so the ~900 KB three.js bundle
   never blocks the first paint — it arrives only when a stage scrolls near the
   viewport.
   ========================================================================== */

export default function StageCanvas({
  children,
  visible,
  z,
  fov,
}: {
  children: React.ReactNode
  visible: boolean
  z: number
  fov: number
}) {
  return (
    <Canvas
      /* No tone mapping pass: the globe palette is authored in display space,
         and ACES would wash the ocean out to grey. */
      flat
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, z], fov, near: 0.1, far: 60 }}
      style={{ touchAction: 'pan-y' }}
      resize={{ scroll: false }}
    >
      {children}
    </Canvas>
  )
}
