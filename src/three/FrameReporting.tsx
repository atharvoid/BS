import React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { reportFrame, reportStall, useQuality } from './performance'
import type { Camera, Scene, WebGLRenderer } from 'three'

type DrawListener = { before: (delta: number) => void; after: () => void }
const draws = new WeakMap<object, Set<DrawListener>>()
/** Also used for a suspension snapshot: update every pose before drawing it. */
export function drawSceneFrame(gl: WebGLRenderer, scene: Scene, camera: Camera, delta = 0) {
  const listeners = draws.get(scene)
  listeners?.forEach(fn => fn.before(delta))
  gl.render(scene, camera)
  listeners?.forEach(fn => fn.after())
}
/** Advance and commit only frames that the adaptive renderer actually draws. */
export function useDrawFrame(before: DrawListener['before'], after: DrawListener['after']) {
  const scene = useThree(s => s.scene)
  const latest = React.useRef({ before, after })
  latest.current = { before, after }
  React.useLayoutEffect(() => {
    const listeners = draws.get(scene) ?? new Set<DrawListener>()
    draws.set(scene, listeners)
    const listener = { before: (d: number) => latest.current.before(d), after: () => latest.current.after() }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [scene])
}

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
    const target = quality === 'high' ? 60 : 30
    if (animated && last.current && now - last.current < 1000 / target - 2) { invalidate(); return }
    const delta = animated && last.current ? Math.min((now - last.current) / 1000, 1 / 30) : 0
    drawSceneFrame(gl, scene, camera, delta)
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
