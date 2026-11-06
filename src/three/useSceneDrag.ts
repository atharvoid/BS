import React from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { DragState } from './drag'
import { useSceneSession } from './SceneSession'
import { reportScenePointer } from './interaction'

/* ==========================================================================
   Drag binding for any scene object.

   Three rules, all of them about the visitor keeping control of the page:

   1. There is no OrbitControls. The camera is fixed and the object turns, so
      the wheel is never captured and a vertical swipe still scrolls.
   2. Whatever the scene was doing, a drag interrupts it and the visitor's
      angle is respected afterwards.
   3. A drag draws its own frames even when the site has settled the scene to a
      static image, so the object always follows the finger.
   ========================================================================== */

type Pointer = ThreeEvent<PointerEvent>

export type DragOptions = {
  initialYaw?: number
  tilt: number
  pitchScale?: number
  resetPhase: () => void
  /** Align the drag state with the object before a pointer starts turning it. */
  sync?: () => void
}

export function useSceneDrag(drag: DragState, node: React.RefObject<THREE.Group | null>, options: DragOptions) {
  const scene = useSceneSession()
  const invalidate = useThree((state) => state.invalidate)
  const currentScene = React.useRef(scene)
  currentScene.current = scene
  const currentOptions = React.useRef(options)
  currentOptions.current = options
  /* The pointer's own description of what it is over. The custom cursor listens
     for this so it can say "Drag" over a scene and go back to normal when the
     pointer leaves one. */
  const pointer = React.useRef({ id: -1, type: 'mouse' })
  const report = (phase: 'enter' | 'leave' | 'press' | 'drag' | 'release' | 'cancel' | 'remove', event?: Pointer) => {
    if (event) pointer.current = { id: event.pointerId, type: event.pointerType }
    reportScenePointer({
      sceneId: currentScene.current?.id ?? 'scene',
      phase,
      pointerId: pointer.current.id,
      pointerType: pointer.current.type,
    })
  }

  React.useEffect(() => {
    const object = node.current
    if (!object) return
    const stop = () => {
      if (drag.dragging) {
        drag.cancel()
        invalidate()
      }
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stop()
    }
    const visibility = () => {
      if (document.hidden) stop()
    }
    window.addEventListener('blur', stop)
    window.addEventListener('keydown', key)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      stop()
      report('remove')
      window.removeEventListener('blur', stop)
      window.removeEventListener('keydown', key)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [drag, node, invalidate])

  const bind = drag.bind()
  const sync = () => {
    if (currentOptions.current.sync) {
      currentOptions.current.sync()
      return
    }
    const object = node.current
    if (!object) return
    drag.current.y = drag.target.y = object.rotation.y
    drag.current.x = drag.target.x = object.rotation.x / (currentOptions.current.pitchScale ?? 1)
  }

  return {
    onPointerOver: (event: Pointer) => {
      report('enter', event)
      /* In a still scene a pointer arriving is the first sign of intent, so one
         frame is drawn to make sure the hit object is where it looks. */
      if (currentScene.current?.still) invalidate()
    },
    onPointerDown: (event: Pointer) => {
      if (event.button !== 0 || event.isPrimary === false || drag.dragging) return
      event.stopPropagation()
      sync()
      currentOptions.current.resetPhase()
      bind.onPointerDown(event)
      report('press', event)
      invalidate()
    },
    onPointerMove: (event: Pointer) => {
      bind.onPointerMove(event)
      if (drag.dragging) {
        report('drag', event)
        invalidate()
      }
    },
    onPointerUp: (event: Pointer) => {
      if (!drag.dragging) return
      bind.onPointerUp(event)
      report('release', event)
      invalidate()
    },
    onPointerCancel: (event: Pointer) => {
      bind.onPointerCancel(event)
      report('cancel', event)
      sync()
      invalidate()
    },
    onPointerLeave: (event: Pointer) => {
      bind.onPointerLeave(event)
      if (!drag.dragging) report('leave', event)
      invalidate()
    },
    onLostPointerCapture: (event: Pointer) => {
      if (drag.dragging) drag.cancel()
      report('cancel', event)
      invalidate()
    },
  }
}
