import React from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { DragState } from './drag'
import { reportScenePointer } from './interaction'
import { useSceneSession, type SceneController } from './SceneSession'

type Pointer = ThreeEvent<PointerEvent>

export function useSceneDrag(drag: DragState, node: React.RefObject<THREE.Group | null>, options: { initialYaw?: number; tilt: number; pitchScale?: number; resetPhase: () => void }) {
  const scene = useSceneSession()
  const invalidate = useThree((state) => state.invalidate)
  const currentScene = React.useRef(scene)
  currentScene.current = scene
  const currentOptions = React.useRef(options)
  currentOptions.current = options
  const pointer = React.useRef({ id: -1, type: 'mouse' })

  const report = (phase: 'enter' | 'leave' | 'press' | 'drag' | 'release' | 'cancel' | 'remove', event?: Pointer) => {
    if (event) pointer.current = { id: event.pointerId, type: event.pointerType }
    reportScenePointer({ sceneId: currentScene.current?.id ?? 'scene', phase, pointerId: pointer.current.id, pointerType: pointer.current.type })
  }

  React.useEffect(() => {
    const object = node.current
    if (!object || !scene) return
    const stop = () => { if (drag.dragging) { drag.cancel(); report('cancel'); invalidate() } }
    const controller: SceneController = {
      object,
      turn: (yaw, pitch) => {
        const scale = currentOptions.current.pitchScale ?? 1
        drag.current.y = drag.target.y = object.rotation.y + yaw
        drag.current.x = drag.target.x = THREE.MathUtils.clamp(object.rotation.x / scale + pitch, -currentOptions.current.tilt, currentOptions.current.tilt)
        drag.touched = true
        object.rotation.y = drag.current.y
        object.rotation.x = drag.current.x * scale
      },
      reset: () => {
        drag.cancel()
        drag.current.x = drag.target.x = 0
        drag.current.y = drag.target.y = currentOptions.current.initialYaw ?? 0
        drag.touched = true
        object.rotation.x = 0
        object.rotation.y = drag.current.y
        currentOptions.current.resetPhase()
      },
      resume: () => {
        drag.current.y = drag.target.y = object.rotation.y
        drag.current.x = drag.target.x = object.rotation.x / (currentOptions.current.pitchScale ?? 1)
        drag.touched = false
        currentOptions.current.resetPhase()
      },
      cancel: stop,
    }
    scene.controllers.current.add(controller)
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') stop() }
    const visibility = () => { if (document.hidden) stop() }
    window.addEventListener('blur', stop)
    window.addEventListener('bs:scene-cancel', stop)
    window.addEventListener('keydown', key)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      stop()
      report('remove')
      scene.controllers.current.delete(controller)
      window.removeEventListener('blur', stop)
      window.removeEventListener('bs:scene-cancel', stop)
      window.removeEventListener('keydown', key)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [drag, node, scene?.controllers, invalidate])

  const bind = drag.bind()
  return {
    onPointerOver: (event: Pointer) => { report('enter', event) },
    onPointerOut: (event: Pointer) => { if (!drag.dragging) report('leave', event) },
    onPointerDown: (event: Pointer) => {
      if (event.button !== 0 || event.isPrimary === false || drag.dragging) return
      event.stopPropagation()
      const object = node.current
      if (object) {
        drag.current.y = drag.target.y = object.rotation.y
        drag.current.x = drag.target.x = object.rotation.x / (currentOptions.current.pitchScale ?? 1)
      }
      currentOptions.current.resetPhase()
      currentScene.current?.setPaused(true)
      bind.onPointerDown(event)
      if (drag.dragging) report('press', event)
      invalidate()
    },
    onPointerMove: (event: Pointer) => {
      bind.onPointerMove(event)
      if (drag.dragging) { report('drag', event); invalidate() }
    },
    onPointerUp: (event: Pointer) => { if (drag.dragging) { bind.onPointerUp(event); report('release', event); invalidate() } },
    onPointerCancel: (event: Pointer) => { bind.onPointerCancel(event); report('cancel', event); invalidate() },
    onPointerLeave: (event: Pointer) => { bind.onPointerLeave(event); if (!drag.dragging) report('leave', event) },
    onLostPointerCapture: (event: Pointer) => { if (drag.dragging) { drag.cancel(); report('cancel', event); invalidate() } },
  }
}
