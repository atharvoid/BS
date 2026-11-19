import React from 'react'
import type * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { drawSceneFrame, useDrawFrame } from './FrameReporting'
import { productYaw } from './render-policy'
import type { PresentationStore } from './category-presentation'

type Slot = { x: number; y: number; height: number; visible: boolean }
/** Retain the presented pose and its still for one versioned category asset. */
export function CategoryContinuity({ motif, presentation, spin, slot, painted, paused, speed }: {
  motif: string; presentation: PresentationStore; spin: React.RefObject<THREE.Group | null>; slot: Slot; painted: boolean; paused: boolean; speed: number
}) {
  const { gl, scene, camera } = useThree()
  const phase = React.useRef(0)
  const presented = React.useRef<{ phase: number; slot: Slot; width: number; height: number } | null>(null)
  const advanced = React.useRef(false)
  const anchor = React.useRef<HTMLElement | null>(null)
  React.useLayoutEffect(() => {
    const gallery = gl.domElement.closest('.gallery')
    anchor.current = gallery?.parentElement?.querySelector<HTMLElement>(`[data-motif="${motif}"]`) ?? null
    if (spin.current) spin.current.rotation.y = productYaw(phase.current, speed)
  }, [gl, spin, speed, motif])
  useDrawFrame(delta => {
    const group = spin.current
    if (!group || !painted) return
    if (!advanced.current) {
      const pair = presentation.get()
      phase.current = presentation.valid(pair, slot.height, window.devicePixelRatio, false) ? pair.phase : 0
    }
    if (!paused && advanced.current) phase.current += delta
    group.rotation.y = productYaw(phase.current, speed)
  }, () => {
    if (!painted || !spin.current?.parent?.visible || !anchor.current) return
    advanced.current = true
    const r = anchor.current.getBoundingClientRect(), box = gl.domElement.getBoundingClientRect()
    presented.current = { phase: phase.current, slot: {x:r.left+r.width/2-box.left,y:r.top+r.height/2-box.top,height:r.height,visible:true}, width:box.width, height:box.height }
  })

  const snapshot = React.useCallback(() => {
    const last = presented.current
    const box = gl.domElement.getBoundingClientRect()
    if (!last || gl.getContext().isContextLost() || last.width !== box.width || last.height !== box.height) return
    try {
      // The lifecycle handler refreshes the buffer immediately before capture.
      const ratio = gl.domElement.width / box.width
      const h = last.slot.height, w = h * 1.25
      // Keep native backing resolution. An oversized pair falls back together
      // to the canonical poster and pose instead of storing a blurred bitmap.
      if (w * ratio > 1500 || h * ratio > 1200) return
      const crop = document.createElement('canvas')
      crop.width = Math.round(w * ratio)
      crop.height = Math.round(crop.width / 1.25)
      crop.getContext('2d')!.drawImage(gl.domElement,
        (last.slot.x - w / 2) * ratio, (last.slot.y - h / 2) * ratio, w * ratio, h * ratio,
        0, 0, crop.width, crop.height)
      presentation.retain({ version: presentation.version, phase: last.phase, bounded: false, image: crop.toDataURL('image/png'), height: h, dpr: window.devicePixelRatio })
    } catch { /* Context/readback failures leave the canonical pair usable. */ }
  }, [gl, presentation])
  const save = React.useCallback(() => {
    if (presented.current && !gl.getContext().isContextLost()) {
      drawSceneFrame(gl, scene, camera)
      snapshot()
    }
    presentation.persist()
  }, [gl, scene, camera, presentation, snapshot])
  React.useEffect(() => {
    const hidden = () => { if (document.hidden) save() }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', hidden)
    return () => { window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', hidden) }
  }, [save])
  return null
}
