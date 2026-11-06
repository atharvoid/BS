import React from 'react'
import { SceneContext, setScenePaused, useReducedMotion, useScenePaused, visibleController, type SceneController } from './SceneSession'
import './scene-controls.css'

/* ==========================================================================
   Stage: the shell every 3D scene sits in.

   - the three.js bundle is imported lazily, so it never delays first paint
   - mounts only when the stage scrolls near the viewport
   - stops rendering entirely when off screen (frameloop="never")
   - degrades to a styled still when WebGL is unavailable
   ========================================================================== */

const StageCanvas = React.lazy(() => import('./StageCanvas'))

type StageProps = {
  children: React.ReactNode
  className?: string
  /** Camera distance; scenes are framed for this. */
  z?: number
  fov?: number
  fallback?: React.ReactNode
  style?: React.CSSProperties
  label: string
}

class Boundary extends React.Component<
  { fallback?: React.ReactNode; children: React.ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    this.props.onFailure()
    if (import.meta.env.DEV) console.warn('[stage] falling back:', err)
  }
  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}

function webglAvailable() {
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

export function Stage({ children, className, z = 6, fov = 38, fallback, style, label }: StageProps) {
  const host = React.useRef<HTMLDivElement>(null)
  const [failed, setFailed] = React.useState(false)
  const [near, setNear] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const [ok] = React.useState(webglAvailable)
  const paused = useScenePaused()
  const reduced = useReducedMotion()
  const id = React.useId()
  const controllers = React.useRef(new Set<SceneController>())
  const invalidate = React.useRef<() => void>(() => {})
  const [pageVisible, setPageVisible] = React.useState(!document.hidden)
  const session = React.useMemo(() => ({ id, paused, reduced, setPaused: setScenePaused, controllers, invalidate }), [id, paused, reduced])

  React.useEffect(() => {
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  React.useEffect(() => {
    const el = host.current
    if (!el) return
    // A stage sharing the first screen should load immediately; only stages
    // further down wait for the observer. Either way the bundle arrives after
    // the page shell has painted.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight) {
      setNear(true)
      setVisible(true)
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true)
        // Render only while the stage is genuinely in front of the visitor.
        // A generous rootMargin keeps a canvas warm just before it arrives,
        // but it must not keep drawing a full-screen plate off screen.
        const r = el.getBoundingClientRect()
        const onScreen = r.bottom > -80 && r.top < window.innerHeight + 80
        setVisible(onScreen)
      },
      { rootMargin: '320px 0px', threshold: 0 },
    )
    io.observe(el)
    const visibility = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    visibility.observe(el)
    return () => { io.disconnect(); visibility.disconnect() }
  }, [])

  const command = (kind: 'left' | 'right' | 'up' | 'down' | 'reset') => {
    const controller = visibleController(controllers.current)
    if (!controller) return
    setScenePaused(true)
    const step = Math.PI / 12
    if (kind === 'reset') controller.reset()
    else controller.turn(kind === 'left' ? -step : kind === 'right' ? step : 0, kind === 'up' ? -step : kind === 'down' ? step : 0)
    invalidate.current()
  }

  return (
    <SceneContext.Provider value={session}><div ref={host} className={className} style={style}>
      {ok ? (
        near ? (
          <Boundary fallback={fallback} onFailure={() => setFailed(true)}>
            <React.Suspense fallback={fallback}>
              <StageCanvas visible={visible && pageVisible} paused={paused || reduced} z={z} fov={fov}>
                {children}
              </StageCanvas>
            </React.Suspense>
          </Boundary>
        ) : null
      ) : (
        fallback
      )}
      <span className="visually-hidden" role="img" aria-label={label} />
      {ok && !failed && near && <div className="scene-controls" aria-label="3D view controls">
        <button type="button" aria-label="Turn left" onClick={() => command('left')}>←</button>
        <button type="button" aria-label="Tilt up" onClick={() => command('up')}>↑</button>
        <button type="button" aria-label="Tilt down" onClick={() => command('down')}>↓</button>
        <button type="button" aria-label="Turn right" onClick={() => command('right')}>→</button>
        {!reduced && <button type="button" aria-label={paused ? 'Play animation' : 'Pause animation'} onClick={() => { if (paused) controllers.current.forEach(controller => controller.resume()); setScenePaused(!paused); invalidate.current() }}>{paused ? '▶' : 'Ⅱ'}</button>}
        <button type="button" aria-label="Reset view" onClick={() => command('reset')}>↺</button>
      </div>}
    </div></SceneContext.Provider>
  )
}
