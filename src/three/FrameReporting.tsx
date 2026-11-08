import React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { reportFrame, reportStall, useQuality } from './performance'

/** Own the actual draw, so sampled frames are rendered frames, including 30Hz. */
export function SceneFrames({ prepared = true, animated, onReady }: {prepared?: boolean; animated: boolean; onReady?: () => void}) {
  const { gl, scene, camera, invalidate } = useThree()
  const quality = useQuality()
  const last = React.useRef(0)
  const frames = React.useRef(0)
  const pending = React.useRef(0)
  const ready = React.useRef(onReady)
  ready.current = onReady
  React.useEffect(() => {
    last.current = 0
    if (prepared) invalidate()
  }, [animated, prepared, quality, invalidate])
  React.useEffect(() => () => cancelAnimationFrame(pending.current), [])
  useFrame(() => {
    if (!prepared) return
    const now = performance.now()
    const target = quality === 'medium' ? 30 : 60
    if (animated && last.current && now - last.current < 1000 / target - 2) { invalidate(); return }
    gl.render(scene, camera)
    if (animated && last.current) {
      reportFrame(now - last.current, target)
      reportStall(now - last.current)
    }
    last.current = now
    if (++frames.current === 2) pending.current = requestAnimationFrame(() => ready.current?.())
    if (animated || frames.current < 2) invalidate()
  }, 1)
  return null
}
