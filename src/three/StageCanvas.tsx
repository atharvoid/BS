import React from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useQuality, measuredDpr, resolutionFor } from './performance'
import { FrameReporter } from './FrameReporting'
import { useSceneSession } from './SceneSession'

function FirstCompleteFrame({ reveal }: { reveal: () => void }) {
  const invalidate = useThree((s) => s.invalidate)
  const frames = React.useRef(0)
  useFrame(() => {
    if (frames.current >= 2) return
    frames.current++
    if (frames.current === 2) requestAnimationFrame(reveal)
    else invalidate()
  })
  return null
}

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

   - visible + animated: "always", at whatever the display does
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
}: {
  children: React.ReactNode
  visible: boolean
  still: boolean
  z: number
  fov: number
  onContextLost?: () => void
  stableVisual?: boolean
}) {
  const quality = useQuality()
  const [ready, setReady] = React.useState(false)
  const reveal = React.useCallback(() => setReady(true), [])

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
  const dpr = React.useMemo(
    () => stableVisual
      ? resolutionFor('high', box.w, box.h, window.devicePixelRatio || 1).dpr
      : measuredDpr(quality, box.w, box.h),
    [quality, box.w, box.h, stableVisual],
  )

  return (
    <div ref={host} data-scene-ready={ready} data-motion={still ? "frozen" : "running"} style={{ width: '100%', height: '100%', opacity: !stableVisual || ready ? 1 : 0, transition: stableVisual ? 'opacity 320ms ease-out' : undefined }}>
    <Canvas
      /* No tone mapping pass: the globe palette is authored in display space,
         and ACES would wash the ocean out to grey. */
      flat
      frameloop={visible ? (still ? 'demand' : 'always') : 'never'}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: [0, 0, z], fov, near: 0.1, far: 60 }}
      style={{ touchAction: 'pan-y pinch-zoom' }}
      resize={{ scroll: false }}
    >
      <InvalidateBridge />
      {stableVisual ? <FirstCompleteFrame reveal={reveal} /> : null}
      <ContextLoss onLost={onContextLost} />
      {/* Only draws while the scene does, which is what makes the quality
          measurement a measure of this device rather than of the page. */}
      <FrameReporter />
      {children}
    </Canvas>
    </div>
  )
}
