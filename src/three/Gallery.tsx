import React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Lights, Studio, getShadowTexture } from './objects'
import { CATEGORY_OBJECTS, type CategoryMotif } from './categoryObjects'
import { frameModel, type Framing } from './framing'
import { resolutionFor, useQuality, useSceneStill, watchPerformance, releasePerformance } from './performance'
import { FrameReporter } from './FrameReporting'
import { useSceneSession } from './SceneSession'

/* ==========================================================================
   One canvas, six objects.

   Six tiles used to mean six WebGL contexts, which is why the row was reserved
   for wide screens with a fine pointer: browsers cap live contexts at about
   eight, the hero globe holds one, and Android is often stricter. That gate is
   what left phones with coloured swatches.

   This draws all six from a single context. The row sits in one orthographic
   view, and each object is placed at its tile's position in that view, so the
   tiles keep their own HTML links and the 3D is a single transparent sheet
   behind them.

   Orthographic rather than perspective on purpose: with six objects spread
   across one view, a perspective camera would show the outer two from the
   side. Straight-on keeps them identical, which is the point of a row.

   The view's scale comes from the canvas height, so an object is always the
   same apparent size; each tile's x comes from its anchor element, measured in
   the DOM, so the grid can be any width the stylesheet likes.
   ========================================================================== */

/** World units across one tile's letterbox. This is the height the single-tile
 *  perspective camera used to see at the object's origin (2 · 4.6 · tan 17°), so
 *  the objects keep exactly the size and framing they had when each tile owned a
 *  canvas. The view is this tall per letterbox, not per canvas: the canvas spans
 *  the whole row, and only the top band of each tile is the object's. */
const TILE_VIEW = 2.8

/** Where one object goes, in canvas pixels: the centre of its letterbox, and
 *  the height of that letterbox (which is what sets the scale). */
type Slot = { motif: CategoryMotif; x: number; y: number; height: number; visible: boolean }

/** Reads where each tile is, in canvas pixels. Scroll and resize both move
 *  them, so this is re-run whenever either could have happened. */
function measure(wrapper: HTMLElement | null): Slot[] {
  if (!wrapper) return []
  const box = wrapper.getBoundingClientRect()
  /* The anchors live inside the tiles' own links, which are siblings of this
     canvas rather than its children — so search from the row, not from here. */
  const anchors = wrapper.parentElement?.querySelectorAll<HTMLElement>('[data-motif]')
  if (!anchors) return []
  return [...anchors].flatMap((el) => {
    const r = el.getBoundingClientRect()
    /* A tile scrolled out of the strip has no letterbox on screen; there is
       nothing to place, and no reason to draw it. */
    if (r.width < 1 || r.height < 1) return []
    /* On a phone the strip is a scroller, so only two tiles are ever on screen
       and the other four would be drawn off the edge of the canvas every frame.
       A tile is kept only if its letterbox overlaps the visible band. */
    const left = r.left < box.right
    const right = r.right > box.left
    const onScreen = left && right

    return [
      {
        motif: el.dataset.motif as CategoryMotif,
        x: r.left + r.width / 2 - box.left,
        y: r.top + r.height / 2 - box.top,
        height: r.height,
        visible: onScreen && el.dataset.active !== 'false',
      },
    ]
  })
}

function Exhibit({ motif, slot, pxPerUnit, paused }: { motif: CategoryMotif; slot: Slot; pxPerUnit: number; paused: boolean }) {
  const { size } = useThree()
  const spin = React.useRef<THREE.Group>(null)
  const body = React.useRef<THREE.Group>(null)
  const [framing, setFraming] = React.useState<Framing | null>(null)
  const entry = CATEGORY_OBJECTS[motif]

  React.useLayoutEffect(() => {
    const g = body.current
    if (!g) return
    g.scale.setScalar(1)
    g.position.set(0, 0, 0)
    g.updateMatrixWorld(true)
    const next = frameModel(new THREE.Box3().setFromObject(g))
    if (next) setFraming(next)
  }, [])

  useFrame((_, delta) => {
    const g = spin.current
    if (!g || paused || !slot.visible) return
    const d = Math.min(delta, 1 / 30)
    g.rotation.y += d * entry.speed
  })

  /* One scale for the whole row: pixels per world unit. It comes from the
     letterbox height, so an object is the same apparent size whatever the canvas
     is; the position is the offset of that letterbox's centre from the canvas
     centre. */
  const worldX = (slot.x - size.width / 2) / pxPerUnit
  const worldY = (size.height / 2 - slot.y) / pxPerUnit

  return (
    <group position={[worldX, worldY, 0]} visible={slot.visible} scale={slot.height / (pxPerUnit * TILE_VIEW)}>
      <group ref={spin} rotation={[0.05, 0.7, 0]}>
        <group ref={body} scale={framing?.scale ?? 1} position={framing?.position ?? [0, 0, 0]}>
          {entry.model}
        </group>
        {framing ? (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, framing.base + 0.015, 0]}
            scale={framing.footprint * 1.7}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={getShadowTexture()}
              transparent
              opacity={0.4}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ) : null}
      </group>
    </group>
  )
}

/**
 * Sizes the orthographic view, in world units.
 *
 * `zoom` is the number of CSS pixels per world unit, so the view is
 * `size / zoom` world units across — set from the canvas height alone, which is
 * what keeps an object the same apparent size at any width. R3F computes the
 * frustum from this on resize; setting left/right/top/bottom by hand as well
 * would double-apply the scale (the first attempt did, and the objects came out
 * as large as their tiles).
 */
function OrthoCamera({ pxPerUnit }: { pxPerUnit: number }) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera
  const set = useThree((s) => s.set)
  const { size } = useThree()
  React.useLayoutEffect(() => {
    /* `zoom` is the number of pixels one world unit occupies, so it has to be
       the same number the exhibits divide by. When the two disagreed the
       objects were placed at one scale and drawn at another. */
    camera.zoom = pxPerUnit
    camera.position.set(0, 0, 10)
    camera.near = 0.1
    camera.far = 60
    camera.updateProjectionMatrix()
    set({ camera })
  }, [camera, set, pxPerUnit])
  return null
}

/**
 * Tells the row when there are real pixels to look at.
 *
 * The stills stay uncovered until this fires, so the switch from vector to 3D
 * only happens once something has actually been drawn — not when the canvas
 * element appears. If the context is lost, the row is told again and the stills
 * come back, rather than leaving six blank letterboxes.
 */
function Ready({ onReady, onLost, modelsReady }: { onReady: () => void; onLost: () => void; modelsReady: boolean }) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const compiled = React.useRef(false)
  const frames = React.useRef(0)
  const done = React.useRef(false)

  React.useEffect(() => {
    if (!modelsReady) return
    let cancelled = false
    // Run after the studio environment and model framing have mounted. Compile
    // all six materials, including currently hidden chapters, before revealing
    // any model; entering a later category must not introduce a shader pop.
    const frame = requestAnimationFrame(() => {
      gl.compileAsync(scene, camera).then(() => {
        if (cancelled) return
        compiled.current = true
        invalidate()
      }).catch(() => { if (!cancelled) onLost() })
    })
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [gl, scene, camera, invalidate, modelsReady, onLost])

  // Taking ownership prevents a half-prepared first render being displayed.
  useFrame(() => {
    if (!compiled.current) return
    gl.render(scene, camera)
    if (done.current) return
    frames.current += 1
    if (frames.current < 2) { invalidate(); return }
    done.current = true
    onReady()
  }, 1)

  React.useEffect(() => {
    const el = gl.domElement
    const lost = () => {
      done.current = false
      frames.current = 0
      onLost()
    }
    const restored = () => {
      done.current = false
      frames.current = 0
    }
    el.addEventListener('webglcontextlost', lost)
    el.addEventListener('webglcontextrestored', restored)
    return () => {
      el.removeEventListener('webglcontextlost', lost)
      el.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl, onLost])

  return null
}

export function Gallery({ onReady, onLost, journey = false }: { onReady: () => void; onLost: () => void; journey?: boolean }) {
  const quality = useQuality()
  const [prepared, setPrepared] = React.useState(false)
  const handleReady = React.useCallback(() => { setPrepared(true); onReady() }, [onReady])
  const session = useSceneSession()
  const adaptiveStill = useSceneStill()
  const [visible, setVisible] = React.useState(false)
  const [pageVisible, setPageVisible] = React.useState(!document.hidden)
  const host = React.useRef<HTMLDivElement>(null)
  const [slots, setSlots] = React.useState<Slot[]>([])
  React.useEffect(() => {
    if (!visible || !pageVisible) return
    watchPerformance()
    return () => releasePerformance()
  }, [visible, pageVisible])

  // A mounted row must not keep drawing below the footer or in a hidden tab.
  React.useEffect(() => {
    const el = host.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(el)
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  /* Every letterbox is the same height (the stylesheet gives them all one), so
     any slot sets the row's scale. Before the first measurement there is
     nothing to draw, so the fallback only has to be finite. */
  const pxPerUnit = journey ? 100 : (slots[0]?.height ?? 152) / TILE_VIEW

  /* Same rule as the hero: one rung at a time, capped by a pixel budget, never
     above the screen. The row is one canvas, so its area is the whole strip —
     which is exactly the case the budget exists for. */
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
  const dpr = React.useMemo(() => resolutionFor('high', box.w, box.h, window.devicePixelRatio || 1).dpr, [quality, box.w, box.h])

  /* Where the tiles are. Re-measured on scroll, resize and layout changes, not
     every frame: the grid only moves when the visitor scrolls it. */
  React.useEffect(() => {
    const el = host.current
    if (!el) return
    let raf = 0
    const run = () => {
      raf = 0
      if (journey) setVisible(el.closest('.sourcing--journey')?.getAttribute('data-begun') === 'true')
      const next = measure(el)
      setSlots((prev) => {
        if (prev.length === next.length && prev.every((p, i) =>
          p.motif === next[i].motif && Math.abs(p.x - next[i].x) < 0.1 && Math.abs(p.y - next[i].y) < 0.1 && Math.abs(p.height - next[i].height) < 0.1 && p.visible === next[i].visible)) return prev
        return next
      })
    }
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(run)
    }
    run()
    const io = new ResizeObserver(queue)
    io.observe(el)
    /* Capture, not bubble: on a phone the row is a horizontal scroller, and a
       scroll on an inner element does not reach window by bubbling. Without the
       capture phase the objects stay where the strip used to be. */
    window.addEventListener('scroll', queue, { passive: true, capture: true })
    window.addEventListener('resize', queue)
    window.addEventListener('bs:journey-layout', run)
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', queue, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', queue)
      window.removeEventListener('bs:journey-layout', run)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className={journey ? "gallery gallery--journey" : "gallery"} data-motion={adaptiveStill || session?.still ? "frozen" : "running"} ref={host} aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 60 }}
        flat
        frameloop={!visible || !pageVisible ? 'never' : (session?.still || adaptiveStill) ? 'demand' : 'always'}
        dpr={dpr}
        gl={{ antialias: true, alpha: true, stencil: false, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
        resize={{ scroll: false }}
      >
        <FrameReporter />
        <Ready onReady={handleReady} onLost={onLost} modelsReady={slots.length === 6} />
        <OrthoCamera pxPerUnit={pxPerUnit} />
        <Studio />
        <Lights intensity={1.05} />
        {slots.map((slot) => (
          <Exhibit key={slot.motif} motif={slot.motif} slot={slot} pxPerUnit={pxPerUnit} paused={!prepared || adaptiveStill || !!session?.still} />
        ))}
      </Canvas>
    </div>
  )
}
