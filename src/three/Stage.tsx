import React from 'react'
import { SceneContext } from './SceneSession'
import { releasePerformance, useSceneStill } from './performance'

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
  children: React.ReactNode
  className?: string
  /** Camera distance; scenes are framed for this. */
  z?: number
  fov?: number
  fallback?: React.ReactNode
  style?: React.CSSProperties
  label: string
}

/** How long a canvas may sit off screen before it is released. Browsers cap the
 *  number of live WebGL contexts; a dormant stage is rebuilt from the already
 *  loaded three.js bundle in a few milliseconds. */
const DORMANT_AFTER_MS = 6000

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

  React.useEffect(() => {
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => {
      document.removeEventListener('visibilitychange', update)
      releasePerformance()
    }
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
        const r = el.getBoundingClientRect()
        const onScreen = r.bottom > -80 && r.top < window.innerHeight + 80
        if (entry.isIntersecting) {
          setNear(true)
          window.clearTimeout(dormant.current)
          setMounted(true)
        } else if (mounted) {
          window.clearTimeout(dormant.current)
          dormant.current = window.setTimeout(() => setMounted(false), DORMANT_AFTER_MS)
        }
        setVisible(onScreen)
      },
      { rootMargin: '320px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(dormant.current)
    }
    // `mounted` is read inside the callback and must not rebuild the observer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SceneContext.Provider value={session}>
      <div ref={host} className={className} style={style}>
        {ok ? (
          near && mounted ? (
            <Boundary fallback={fallback}>
              <React.Suspense fallback={fallback}>
                <StageCanvas visible={visible && pageVisible} still={still} z={z} fov={fov}>
                  {children}
                </StageCanvas>
              </React.Suspense>
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
