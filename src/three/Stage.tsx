import React from 'react'
import { useThree } from '@react-three/fiber'
import { SceneContext } from './SceneSession'
import { releasePerformance, useSceneStill, watchPerformance } from './performance'

/* ==========================================================================
   Stage: the shell every 3D scene sits in.

   - the three.js bundle is imported lazily, so it never delays first paint
   - mounts only when the stage scrolls near the viewport
   - stops rendering entirely when off screen (frameloop="never")
   - holds a static frame when the device cannot animate smoothly
   - degrades to a styled still when WebGL is unavailable

   There are no controls here. Every scene turns by dragging it and animates by
   itself; nothing needs a button.
   ========================================================================== */

const StageCanvas = React.lazy(() => import('./StageCanvas'))

type StageProps = {
  /** The scene. Omitted when `load` is given instead. */
  children?: React.ReactNode
  className?: string
  /** Camera distance; scenes are framed for this. */
  z?: number
  fov?: number
  fallback?: React.ReactNode
  style?: React.CSSProperties
  label: string
}

/** How long a canvas may sit off screen before it is released. Browsers cap the
 *  number of live WebGL contexts, so a stage that is well out of view gives its
 *  context back; it is rebuilt from the already-loaded three.js bundle in a few
 *  milliseconds when it returns.
 *
 *  Six seconds, not immediately: scrolling past a stage and straight back is a
 *  common gesture, and rebuilding in between would show a blank frame at the
 *  exact moment the visitor is looking. Short enough that the contexts are back
 *  well before another stage wants one — the home page has two, and a page
 *  transition replaces both. */
const DORMANT_AFTER_MS = 2000

class Boundary extends React.Component<
  { fallback?: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    if (import.meta.env.DEV) console.warn('[stage] falling back:', err)
  }
  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}

/** Whether this browser will give us a WebGL context at all. Exported because
 *  the shared category canvas needs the same answer before it mounts. */
export function webglAvailable() {
  if (typeof window === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  } catch {
    return false
  }
}

/**
 * Renders a scene only while its stage is live.
 *
 * A stage is live while it is near the viewport, or for a couple of seconds
 * after it leaves. Pulling the scenes out through this boundary is what lets
 * the three bundle, the models and the generated textures load on demand
 * instead of with the first paint: the page's own markup, headings, links and
 * form controls are static imports and never wait for any of it.
 */
export /** Listens for a lost context from inside the canvas, where the renderer is
 *  reachable. Rendered as a child, not around the Canvas: R3F's hooks only
 *  exist below it. */
function ContextLoss() {
  const live = React.useContext(LiveContext)
  const gl = useThree((s) => s.gl)
  React.useEffect(() => {
    if (!live) return
    const el = gl.domElement
    el.addEventListener('webglcontextlost', live.onContextLost)
    return () => el.removeEventListener('webglcontextlost', live.onContextLost)
  }, [gl, live])
  return null
}

export function StageScene({ children }: { children: React.ReactNode }) {
  const live = React.useContext(LiveContext)
  if (!live) return null
  return (
    <React.Suspense fallback={null}>
      <StageCanvas visible={live.visible} still={live.still} z={live.z} fov={live.fov}>
        <ContextLoss />
        {children}
      </StageCanvas>
    </React.Suspense>
  )
}

type Live = {
  visible: boolean
  still: boolean
  z: number
  fov: number
  /** Told when the GPU drops the context, so the stage can rebuild. */
  onContextLost: () => void
}

const LiveContext = React.createContext<Live | null>(null)

/** The scene content for a stage, loaded on demand. */
function LazyScene({ load, fallback }: { load: LiveLoader; fallback?: React.ReactNode }) {
  return (
    <React.Suspense fallback={fallback ?? null}>
      <LoadedScene load={load} />
    </React.Suspense>
  )
}

export type LiveLoader = () => Promise<{ default: React.ComponentType }>

function LoadedScene({ load }: { load: LiveLoader }) {
  const [Scene, setScene] = React.useState<React.ComponentType | null>(null)
  React.useEffect(() => {
    let alive = true
    load().then((mod) => {
      if (alive) setScene(() => mod.default)
    }).catch(() => {
      /* A scene that cannot load leaves its fallback in place; the stage is
         decoration over static markup that is already on screen. */
    })
    return () => {
      alive = false
    }
  }, [load])
  if (!Scene) return null
  return <Scene />
}

export function Stage({
  children,
  className,
  z = 6,
  fov = 38,
  fallback,
  style,
  label,
  load,
}: StageProps & { load?: LiveLoader }) {
  const host = React.useRef<HTMLDivElement>(null)
  const [near, setNear] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const [ok] = React.useState(webglAvailable)
  const [mounted, setMounted] = React.useState(false)
  const [pageVisible, setPageVisible] = React.useState(!document.hidden)
  const still = useSceneStill()
  const id = React.useId()
  const invalidate = React.useRef<() => void>(() => {})
  const session = React.useMemo(() => ({ id, still, invalidate }), [id, still])
  const dormant = React.useRef<number | undefined>(undefined)
  /* The observer callback below is built once and must not be rebuilt on every
     mount change, so it cannot read `mounted` from its closure — that copy is
     frozen at the value it had on the render that created the observer, and a
     stage that has since mounted would take the "was never mounted" branch and
     never schedule its release. The ref is the live value. */
  const mountedRef = React.useRef(false)
  React.useEffect(() => {
    mountedRef.current = mounted
  }, [mounted])

  /* A lost context is the one failure the fallback cannot catch: the canvas
     stays in the DOM, keeps its size, and simply stops drawing, so the stage
     would sit there as a blank rectangle. Listening for the event means the
     stage can be torn down and rebuilt — which is what a restore needs anyway,
     because the React tree's GPU resources are gone with the context.
     `remount` is a key on the canvas, not a state flag. */
  const [remount, setRemount] = React.useState(0)
  const lostAt = React.useRef(0)
  const dead = React.useRef(false)
  const onContextLost = React.useCallback(() => {
    /* Rebuilding is not immediate. A lost context stays lost for the rest of the
       task that lost it — the renderer still holds the dead object, and any
       draw or shader upload against it throws (`shaderSource: parameter 1 is not
       of type WebGLShader`). Remounting on the next frame removes the canvas
       first, so React disposes the old renderer before a new one is built.
       Two losses close together means this device cannot hold a canvas at all:
       the stage gives up and keeps its drawn fallback rather than thrashing. */
    const now = Date.now()
    if (!lostAt.current) lostAt.current = now
    else if (now - lostAt.current < 5000) {
      dead.current = true
      setMounted(false)
      return
    }
    window.requestAnimationFrame(() => setRemount((n) => n + 1))
  }, [])

  /* While this stage is mounted and near the viewport, its frames are what the
     quality sampler reads. The sampler is reference counted in performance.ts,
     so several stages can be open at once without one closing the measurement
     the others depend on. */
  React.useEffect(() => {
    /* Measure only while this stage is actually drawing. A sampler that keeps
       running over the footer would be reading the frame rate of nothing. */
    if (!near || !visible || !pageVisible) return
    watchPerformance()
    return () => releasePerformance()
  }, [near, visible, pageVisible])

  React.useEffect(() => {
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  /* Is the stage actually on screen right now?

     This is read directly from layout rather than trusted to the observer
     alone: an observer only reports *crossings*, so a stage that is scrolled
     into view, or that is already on screen when it mounts, can sit with a
     stale "not visible" and never draw. The observer is still what wakes a
     dormant stage up, and still the cheap path for the common case. */
  const measureVisibility = React.useCallback(() => {
    const el = host.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const onScreen = r.bottom > -80 && r.top < window.innerHeight + 80 && r.bottom > 0
    setVisible(onScreen)
    if (r.top < window.innerHeight && r.bottom > 0) setNear(true)
  }, [])

  React.useEffect(() => {
    const el = host.current
    if (!el) return

    measureVisibility()

    /* A layout change can move a stage on or off screen without any scrolling
       (an image settling, a font swapping in, the intro clearing), so the
       rect is re-read on resize and whenever the page height changes. */
    const observer = new ResizeObserver(measureVisibility)
    observer.observe(el)
    observer.observe(document.body)
    window.addEventListener('resize', measureVisibility)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          window.clearTimeout(dormant.current)
          setMounted(true)
        } else if (mountedRef.current) {
          window.clearTimeout(dormant.current)
          dormant.current = window.setTimeout(() => setMounted(false), DORMANT_AFTER_MS)
        }
        measureVisibility()
      },
      { rootMargin: '320px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      observer.disconnect()
      window.removeEventListener('resize', measureVisibility)
      window.clearTimeout(dormant.current)
    }
    // `mounted` is read through `mountedRef` so that this observer is built once.
  }, [measureVisibility])

  /* Scrolling off screen must stop the drawing; scrolling back must resume it.
     Passive, because this only ever reads geometry. */
  React.useEffect(() => {
    let queued = false
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        measureVisibility()
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [measureVisibility])

  return (
    <SceneContext.Provider value={session}>
      <div ref={host} className={className} style={style}>
        {ok ? (
          near && mounted ? (
            <Boundary fallback={fallback}>
              <LiveContext.Provider value={{ visible: visible && pageVisible, still, z, fov, onContextLost }}>
                <React.Suspense fallback={fallback} key={remount}>
                  {load ? <LazyScene load={load} fallback={fallback} /> : children}
                </React.Suspense>
              </LiveContext.Provider>
            </Boundary>
          ) : null
        ) : (
          fallback
        )}
        {label ? <span className="visually-hidden" role="img" aria-label={label} /> : null}
      </div>
    </SceneContext.Provider>
  )
}
