import React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { reportFrame, reportStall, useQuality } from './performance'

/** Own the actual draw, so sampled frames are rendered frames, including 30Hz. */
export function SceneFrames({ prepared = true, animated, redrawOn, onReady }: {
  prepared?: boolean
  animated: boolean
  redrawOn?: string
  onReady?: () => void
}) {
  const { gl, scene, camera, invalidate } = useThree()
  const quality = useQuality()
  const last = React.useRef(0)
  const frames = React.useRef(0)
  const pending = React.useRef(0)
  const layoutChanged = React.useRef(false)
  const ready = React.useRef(onReady)
  ready.current = onReady
  React.useLayoutEffect(() => {
    last.current = 0
    if (prepared) invalidate()
  }, [animated, prepared, quality, invalidate])
  React.useEffect(() => () => cancelAnimationFrame(pending.current), [])
  React.useLayoutEffect(() => {
    if (!redrawOn) return
    const redraw = () => {
      layoutChanged.current = true
      invalidate()
    }
    window.addEventListener(redrawOn, redraw)
    return () => window.removeEventListener(redrawOn, redraw)
  }, [redrawOn, invalidate])
  useFrame(() => {
    if (!prepared) return
    const now = performance.now()
    const target = quality === 'high' ? 60 : 30
    if (!layoutChanged.current && animated && last.current && now - last.current < 1000 / target - 2) { invalidate(); return }
    layoutChanged.current = false
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
