import React from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useQuality, measuredDpr } from './performance'
import { SceneFrames } from './FrameReporting'
import { useRenderBudget } from './render-budget'
import { useSceneSession } from './SceneSession'

function InvalidateBridge() {
  const scene = useSceneSession()
  const invalidate = useThree((state) => state.invalidate)
  React.useEffect(() => {
    if (scene) scene.invalidate.current = invalidate
  }, [scene, invalidate])
  return null
}

/* ==========================================================================
   The WebGL surface itself. Loaded on demand, so the ~900 KB three.js bundle
   never blocks the first paint.

   `frameloop` is the whole performance story:

   - visible + animated: "demand", invalidated at the selected draw cadence
   - visible + still:    "demand", so a scene with a stopped clock costs
                         nothing until something asks for a frame (a drag, a
                         new object, a resize)
   - off screen:         "never"

   Resolution comes from `measuredDpr`: a ceiling set by the screen and a pixel
   budget, stepped down one rung at a time when frames are actually slow. It is
   never dropped to 1 in one jump — a sudden loss of clarity reads as a bug,
   while a slightly cheaper frame is invisible.
   ========================================================================== */

/** Listens for a lost context from inside the canvas, where the renderer is
 *  reachable. It lives here rather than in `Stage` because `Stage` is imported
 *  by every page and must not pull the renderer into the entry bundle. */
function ContextLoss({ onLost }: { onLost?: () => void }) {
  const gl = useThree((s) => s.gl)
  React.useEffect(() => {
    if (!onLost) return
    const el = gl.domElement
    el.addEventListener('webglcontextlost', onLost)
    return () => el.removeEventListener('webglcontextlost', onLost)
  }, [gl, onLost])
  return null
}

export default function StageCanvas({
  children,
  visible,
  still,
  z,
  fov,
  onContextLost,
  stableVisual = false,
  onReady,
}: {
  children: React.ReactNode
  visible: boolean
  still: boolean
  z: number
  fov: number
  onContextLost?: () => void
  stableVisual?: boolean
  onReady?: () => void
}) {
  const quality = useQuality()
  const [ready, setReady] = React.useState(false)
  const reveal = React.useCallback(() => { setReady(true); onReady?.() }, [onReady])

  /* Measured from the element, not assumed: a canvas can be any size, and the
     budget has to know how many pixels it is being asked to fill. */
  const host = React.useRef<HTMLDivElement | null>(null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  React.useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const desired = measuredDpr(quality, box.w, box.h)
  const { dpr, permit } = useRenderBudget(host, desired, box.w, box.h, visible && !still)


  return (
    <div ref={host} data-scene-ready={ready} data-motion={still || !permit ? "frozen" : "running"} style={{ width: '100%', height: '100%', opacity: !stableVisual || ready ? 1 : 0, transition: stableVisual ? 'opacity 320ms ease-out' : undefined }}>
    <Canvas
      /* No tone mapping pass: the globe palette is authored in display space,
         and ACES would wash the ocean out to grey. */
      flat
      frameloop={visible ? 'demand' : 'never'}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: [0, 0, z], fov, near: 0.1, far: 60 }}
      style={{ touchAction: 'pan-y pinch-zoom' }}
      resize={{ scroll: false }}
    >
      <InvalidateBridge />
      <ContextLoss onLost={onContextLost} />
      {/* Only draws while the scene does, which is what makes the quality
          measurement a measure of this device rather than of the page. */}
      <React.Suspense fallback={null}>
        {children}
        <SceneFrames animated={visible && !still && permit} onReady={reveal} />
      </React.Suspense>
    </Canvas>
    </div>
  )
}
