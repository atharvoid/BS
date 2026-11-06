import React from 'react'
import type { Object3D } from 'three'

export type SceneController = {
  object: Object3D
  turn: (yaw: number, pitch: number) => void
  reset: () => void
  resume: () => void
  cancel: () => void
}

export type SceneSession = {
  id: string
  paused: boolean
  reduced: boolean
  setPaused: (value: boolean) => void
  controllers: React.MutableRefObject<Set<SceneController>>
  invalidate: React.MutableRefObject<() => void>
}

export const SceneContext = React.createContext<SceneSession | null>(null)
export const useSceneSession = () => React.useContext(SceneContext)

let paused = false
const subscribers = new Set<() => void>()
export function setScenePaused(value: boolean) {
  if (paused === value) return
  paused = value
  subscribers.forEach((notify) => notify())
}
const subscribe = (notify: () => void) => {
  subscribers.add(notify)
  return () => { subscribers.delete(notify) }
}
export function useScenePaused() {
  return React.useSyncExternalStore(subscribe, () => paused, () => false)
}

export function useReducedMotion() {
  const [reduced, setReduced] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

export function visibleController(controllers: Set<SceneController>) {
  return [...controllers].find(({ object }) => {
    for (let node: Object3D | null = object; node; node = node.parent) if (!node.visible) return false
    return true
  })
}
