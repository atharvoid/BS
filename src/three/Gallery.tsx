import React from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { CategoryStudio, useCategoryMaps } from './CategoryStudio'
import { CATEGORY_OBJECTS, type CategoryMotif } from './categoryObjects'
import { frameModel, type Framing } from './framing'
import { measuredDpr, useQuality, useSceneStill, watchPerformance, releasePerformance } from './performance'
import { SceneFrames, useDrawFrame } from './FrameReporting'
import { useRenderBudget } from './render-budget'
import { useSceneSession } from './SceneSession'
import { productYaw } from './render-policy'
import { CategoryContinuity } from './CategoryContinuity'
import { WHEAT_PRESENTATION, TEXTILE_PRESENTATION } from './category-presentation'

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
 *  perspective camera used to see at the object's origin (2 Â· 4.6 Â· tan 17Â°), so
 *  the objects keep exactly the size and framing they had when each tile owned a
 *  canvas. The view is this tall per letterbox, not per canvas: the canvas spans
 *  the whole row, and only the top band of each tile is the object's. */
const TILE_VIEW = 2.8

/** Where one object goes, in canvas pixels: the centre of its letterbox, and
 *  the height of that letterbox (which is what sets the scale). */
type Slot = { motif: CategoryMotif; x: number; y: number; height: number; width: number; visible: boolean; docked?: boolean }

// Card posters and the gallery canvas are separately rasterized CSS boxes.
// Snap both edges before centering the model so fractional grid positions
// do not move fine strands by a device pixel when the canvas appears.
function paintedRect(element: Element, card: boolean) {
  const rect = element.getBoundingClientRect()
  if (!card) return rect
  const left = Math.round(rect.left), top = Math.round(rect.top)
  const right = Math.round(rect.right), bottom = Math.round(rect.bottom)
  return { left, top, bottom, width: right - left, height: bottom - top }
}

const CONTACT = {
  textiles: [1.6, 1.28, .64],
  handicrafts: [1.45, 1.45, .72],
  agriculture: [1.3, 1.3, .51],
  industrial: [1.45, 1.47, .72],
  organic: [1.6, 1.17, .54],
  general: [1.45, 1.26, .76],
} as const

/** Reads where each tile is, in canvas pixels. Scroll and resize both move
 *  them, so this is re-run whenever either could have happened. */
function measure(wrapper: HTMLElement | null): Slot[] {
  if (!wrapper) return []
  const box = wrapper.getBoundingClientRect()
  /* The anchors live inside the tiles' own links, which are siblings of this
     canvas rather than its children â€” so search from the row, not from here. */
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
        width: r.width,
        visible: onScreen && r.bottom > 0 && r.top < innerHeight && el.dataset.active !== 'false',
        docked: el.dataset.docked === 'true',
      },
    ]
  })
}

export function Exhibit({ motif, slot, pxPerUnit, paused, card = false }: { motif: CategoryMotif; slot: Slot; pxPerUnit: number; paused: boolean; card?: boolean }) {
  const { gl } = useThree()
  const { contact } = useCategoryMaps()
  const outer = React.useRef<THREE.Group>(null)
  const spin = React.useRef<THREE.Group>(null)
  const anchor = React.useRef<HTMLElement | null>(null)
  const phase = React.useRef(0)
  const body = React.useRef<THREE.Group>(null)
  const [framing, setFraming] = React.useState<Framing | null>(null)
  const entry = CATEGORY_OBJECTS[motif]
  const presentation = motif === 'agriculture' ? WHEAT_PRESENTATION : motif === 'textiles' ? TEXTILE_PRESENTATION : null
  const [shadowWidth, shadowDepth, shadowOpacity] = CONTACT[motif]

  React.useLayoutEffect(() => {
    anchor.current = gl.domElement.closest('.gallery')?.parentElement?.querySelector<HTMLElement>(`[data-motif="${motif}"]`) ?? null
  }, [gl, motif])

  React.useLayoutEffect(() => {
    const g = body.current
    if (!g) return
    g.scale.setScalar(1)
    g.position.set(0, 0, 0)
    g.updateMatrixWorld(true)
    const next = frameModel(new THREE.Box3().setFromObject(g, true))
    if (next) setFraming(next)
  }, [])

  useDrawFrame(delta => {
    const el = anchor.current, host = outer.current
    if (!host) return
    // Read the current letterbox at the draw boundary. A React scroll update
    // may still be pending; never present an earlier scroll position.
    const box = paintedRect(gl.domElement, card)
    const r = el ? paintedRect(el, card) : {left:box.left+slot.x-slot.width/2,top:box.top+slot.y-slot.height/2,width:slot.width,height:slot.height,bottom:box.top+slot.y+slot.height/2}
    const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && (el ? el.dataset.active !== 'false' : slot.visible)
    host.visible = visible
    host.position.set((r.left + r.width / 2 - box.left - box.width / 2) / pxPerUnit,
      (box.height / 2 - (r.top + r.height / 2 - box.top)) / pxPerUnit, 0)
    host.scale.setScalar(r.height / (pxPerUnit * TILE_VIEW))
    const g = spin.current
    if (!g || paused || !visible || presentation) return
    phase.current += delta
    g.rotation.y = productYaw(phase.current, entry.speed)
  }, () => {
    if (anchor.current && outer.current?.visible && spin.current) anchor.current.dataset.presentedYaw = String(spin.current.rotation.y)
  })

  /* One scale for the whole row: pixels per world unit. It comes from the
     letterbox height, so an object is the same apparent size whatever the canvas
     is; the position is the offset of that letterbox's centre from the canvas
     centre. */
  return (
    <group ref={outer} visible={slot.visible}>
      <group name={`category-spin-${motif}`} ref={spin} rotation={[0.05, 0.7, 0]}>
        {presentation && <CategoryContinuity motif={motif} presentation={presentation} spin={spin} slot={slot} paused={paused} speed={entry.speed} />}
        <group ref={body} scale={framing?.scale ?? 1} position={framing?.position ?? [0, 0, 0]}>
          {entry.model}
        </group>
      </group>
      {framing ? (
        <mesh
          rotation={[-Math.PI / 2 + .105, 0, 0]}
          position={[0, framing.base, -.055]}
          scale={[framing.footprint * shadowWidth, framing.footprint * shadowDepth, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={contact}
            transparent
            opacity={shadowOpacity}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  )
}

/**
 * Sizes the orthographic view, in world units.
 *
 * `zoom` is the number of CSS pixels per world unit, so the view is
 * `size / zoom` world units across. Synchronise the CSS surface once at each
 * draw boundary, before placing any exhibits, including during window resize.
 */
function OrthoCamera({ pxPerUnit, journey }: { pxPerUnit: number; journey: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera
  const set = useThree((s) => s.set)
  const gl = useThree(s => s.gl)
  const invalidate = useThree(s => s.invalidate)
  React.useEffect(() => {
    if (!journey) return
    const redraw = () => {
      if (gl.domElement.closest('.sourcing--journey')?.getAttribute('data-begun') === 'true') invalidate()
    }
    // A stopped animation clock still needs to paint a changed scroll pose.
    window.addEventListener('bs:journey-layout', redraw)
    return () => window.removeEventListener('bs:journey-layout', redraw)
  }, [gl, invalidate, journey])
  useDrawFrame(() => {
    const box = paintedRect(gl.domElement, !journey)
    camera.zoom = pxPerUnit
    camera.left = -box.width / 2; camera.right = box.width / 2
    camera.top = box.height / 2; camera.bottom = -box.height / 2
    camera.updateProjectionMatrix()
  }, () => {})
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
 * only happens once something has actually been drawn â€” not when the canvas
 * element appears. If the context is lost, the row is told again and the stills
 * come back, rather than leaving six blank letterboxes.
 */
function Ready({ onReady, onLost, modelsReady, animated }: { onReady: () => void; onLost: () => void; modelsReady: boolean; animated: boolean }) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const [compiled, setCompiled] = React.useState(false)

  React.useEffect(() => {
    if (!modelsReady) return
    let cancelled = false
    // Run after the studio environment and model framing have mounted. Compile
    // the mounted material set before revealing it. Retain all six models so
    // scrolling a new phone row into view never hides or recompiles the others.
    const frame = requestAnimationFrame(() => {
      gl.compileAsync(scene, camera).then(() => {
        if (cancelled) return
        setCompiled(true)
        invalidate()
      }).catch(() => { if (!cancelled) onLost() })
    })
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [gl, scene, camera, invalidate, modelsReady, onLost])

  React.useEffect(() => {
    const el = gl.domElement
    const lost = () => {
      setCompiled(false)
      onLost()
    }
    const restored = () => {
      setCompiled(false)
    }
    el.addEventListener('webglcontextlost', lost)
    el.addEventListener('webglcontextrestored', restored)
    return () => {
      el.removeEventListener('webglcontextlost', lost)
      el.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl, onLost])

  return <SceneFrames prepared={compiled} animated={animated} onReady={onReady} />
}

export function Gallery({ onReady, onLost, onPreparing, journey = false, activeMotif = null }: { onReady: () => void; onLost: () => void; onPreparing?: () => void; journey?: boolean; activeMotif?: CategoryMotif | null }) {
  const quality = useQuality()
  const [prepared, setPrepared] = React.useState(false)
  const handleReady = React.useCallback(() => { setPrepared(true); onReady() }, [onReady])
  const session = useSceneSession()
  const adaptiveStill = useSceneStill()
  const [visible, setVisible] = React.useState(false)
  const [pageVisible, setPageVisible] = React.useState(!document.hidden)
  const host = React.useRef<HTMLDivElement>(null)
  const [slots, setSlots] = React.useState<Slot[]>([])


  // A mounted row must not keep drawing below the footer or in a hidden tab.
  React.useEffect(() => {
    const el = host.current
    if (!el) return
    const observer = journey ? null : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer?.observe(el)
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [journey])

  /* Every letterbox is the same height (the stylesheet gives them all one), so
     any slot sets the row's scale. Before the first measurement there is
     nothing to draw, so the fallback only has to be finite. */
  const pxPerUnit = journey ? 100 : (slots[0]?.height ?? 152) / TILE_VIEW

  /* Same rule as the hero: one rung at a time, capped by a pixel budget, never
     above the screen. The row is one canvas, so its area is the whole strip â€”
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
  // Keep the surface stable while objects travel. Moving/resizing a cropped
  // Canvas races its ResizeObserver, camera and model layout on every scroll.
  const desired = measuredDpr(quality, box.w, box.h)
  // Explicit shelf interaction remains responsive at the cheapest tier. Motion
  // preferences/data saving are handled by the renderer-free parent boundary.
  const hoverMotion = journey && slots.some(slot => slot.visible && slot.docked && slot.motif === activeMotif)
  const canAnimate = !adaptiveStill || hoverMotion
  const { dpr, permit } = useRenderBudget(host, desired, box.w, box.h, prepared && visible && pageVisible && canAnimate)
  const hasMotion = slots.some(slot => slot.visible && (!journey || !slot.docked || slot.motif === activeMotif))
  const animated = visible && pageVisible && canAnimate && !session?.still && permit && hasMotion
  React.useEffect(() => {
    if (!visible || !pageVisible || !animated) return
    watchPerformance()
    return () => releasePerformance()
  }, [visible, pageVisible, animated])
  const models = slots
  const layoutKey = journey ? 'journey' : models.map(s => s.motif).join(',')
  React.useLayoutEffect(() => { setPrepared(false); onPreparing?.() }, [layoutKey, onPreparing])

  /* Where the tiles are. Re-measured on scroll, resize and layout changes, not
     every frame: the grid only moves when the visitor scrolls it. */
  React.useEffect(() => {
    const el = host.current
    if (!el) return
    let raf = 0
    const run = () => {
      raf = 0
      if (journey) setVisible(el.closest('.sourcing--journey')?.getAttribute('data-begun') === 'true' && el.closest('.sourcing--journey')!.getBoundingClientRect().bottom > 0)
      const next = measure(el)
      setSlots((prev) => {
        if (prev.length === next.length && prev.every((p, i) =>
          p.motif === next[i].motif && Math.abs(p.x - next[i].x) < 0.1 && Math.abs(p.y - next[i].y) < 0.1 && Math.abs(p.height - next[i].height) < 0.1 && p.visible === next[i].visible && p.docked === next[i].docked && p.width === next[i].width)) return prev
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
    if (!journey) window.addEventListener('scroll', queue, { passive: true, capture: true })
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
    <div className={journey ? "gallery gallery--journey" : "gallery gallery--cards"} data-ready={prepared} data-motion={animated ? "running" : "frozen"} ref={host} aria-hidden="true">
      <div style={{width:'100%',height:'100%',pointerEvents:'none'}}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 60 }}
        frameloop={!visible || !pageVisible ? 'never' : 'demand'}
        dpr={dpr}
        gl={{ antialias: true, alpha: true, stencil: false, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping }}
        style={{ pointerEvents: 'none' }}
        resize={{ scroll: false }}
      >
        <React.Suspense fallback={null}>
          <CategoryStudio>
            <Ready key={layoutKey} onReady={handleReady} onLost={onLost} modelsReady={models.length > 0} animated={animated && visible && pageVisible} />
            <OrthoCamera pxPerUnit={pxPerUnit} journey={journey} />
            {models.map((slot) => (
              <Exhibit key={slot.motif} motif={slot.motif} slot={slot} pxPerUnit={pxPerUnit} card={!journey} paused={!prepared || !animated || (journey && !!slot.docked && slot.motif !== activeMotif)} />
            ))}
          </CategoryStudio>
        </React.Suspense>
      </Canvas>
      </div>
    </div>
  )
}
