export type ScenePointerPhase = 'enter' | 'leave' | 'press' | 'drag' | 'release' | 'cancel' | 'remove'

export type ScenePointerEvent = {
  sceneId: string
  phase: ScenePointerPhase
  pointerId: number
  pointerType: string
}

/** Report semantic hit changes. Pointer positions stay on the browser event. */
export function reportScenePointer(detail: ScenePointerEvent) {
  window.dispatchEvent(new CustomEvent<ScenePointerEvent>('bs:scene-pointer', { detail }))
}
