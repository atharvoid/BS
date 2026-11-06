import React from 'react'

/* ==========================================================================
   What a mounted 3D stage tells the scenes inside it.

   `still` is true when the site has decided the device cannot animate
   smoothly (see performance.ts) or when the visitor asked for reduced motion.
   Scenes read it to stop advancing their clocks. It is not a control: no button
   anywhere sets it.

   `invalidate` lets a scene ask for one more frame while the canvas is in its
   on-demand mode.
   ========================================================================== */

export type SceneSession = {
  id: string
  still: boolean
  invalidate: React.MutableRefObject<() => void>
}

export const SceneContext = React.createContext<SceneSession | null>(null)
export const useSceneSession = () => React.useContext(SceneContext)
