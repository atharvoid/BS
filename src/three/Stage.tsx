import React from 'react'
import { isSceneReady, onSceneReady } from './gate'

/* ==========================================================================
   Stage: the shell every 3D scene sits in.

   - the three.js bundle is imported lazily, so it never delays first paint
   - mounts only when the stage scrolls near the viewport
   - stops rendering entirely when off screen (frameloop="never")
   - degrades to a styled still when WebGL is unavailable
   ========================================================================== */

const StageCanvas = React.lazy(() => import('./StageCanvas'))

/**
 * How long a canvas may sit off screen before it is destroyed rather than
 * paused. Browsers cap the number of live WebGL contexts (typically 16, and far
 * fewer on mobile); once the cap is hit the oldest context is silently dropped
 * and the page shows a blank plate. Destroying an idle canvas keeps the count
 * at one or two and, since the three.js bundle is already loaded, rebuilding it
 * costs a few milliseconds.
 */
const DORMANT_AFTER_MS = 6000

type StageProps = {
  children: React.ReactNode
  className?: string
  /** Camera distance; scenes are framed for this. */
  z?: number
  fov?: number
  fallback?: React.ReactNode
  style?: React.CSSProperties
  label: string
  /** Frame cap. The default suits a slow drift; raise it only for interaction. */
  maxFps?: number
  dpr?: [number, number]
}

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
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

export function Stage({
  children,
  className,
  z = 6,
  fov = 38,
  fallback,
  style,
  label,
  maxFps = 30,
  dpr,
}: StageProps) {
  const host = React.useRef<HTMLDivElement>(null)
  const [near, setNear] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const [ok] = React.useState(webglAvailable)
  const [mounted, setMounted] = React.useState(false)
  /* The opening sequence owns the first two seconds. Nothing heavy is allowed
     to build until it has finished, or the introduction stutters while the
     globe compiles its shaders behind the curtain. */
  const [ready, setReady] = React.useState(isSceneReady)
  React.useEffect(() => {
    if (ready) return
    return onSceneReady(() => setReady(true))
  }, [ready])
  const dormantTimer = React.useRef<number | undefined>(undefined)

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
    // A stage already scrolled past at mount (a deep link, a restored scroll
    // position) is left dormant until it is actually looked at.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true)
        // Draw only while the stage is genuinely in front of the visitor. The
        // observer's own margin is what keeps a canvas warm just before it
        // arrives; anything further away must not be drawing at all, because a
        // full-screen sphere rendering behind the rest of the page is the most
        // expensive thing this site can do.
        setVisible(entry.isIntersecting)

        if (entry.isIntersecting) {
          window.clearTimeout(dormantTimer.current)
          setMounted(true)
        } else if (mounted) {
          window.clearTimeout(dormantTimer.current)
          dormantTimer.current = window.setTimeout(() => setMounted(false), DORMANT_AFTER_MS)
        }
      },
      { rootMargin: '120px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(dormantTimer.current)
    }
    // `mounted` is read inside the callback but must not retrigger the effect:
    // recreating the observer on every mount change would fight itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={host} className={className} style={style} aria-label={label} role="img">
      {ok ? (
        ready && near && mounted ? (
          <Boundary fallback={fallback}>
            <React.Suspense fallback={fallback}>
              <StageCanvas visible={visible} z={z} fov={fov} maxFps={maxFps} dpr={dpr}>
                {children}
              </StageCanvas>
            </React.Suspense>
          </Boundary>
        ) : null
      ) : (
        fallback
      )}
    </div>
  )
}
