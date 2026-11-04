import React from 'react'

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

export function Stage({ children, className, z = 6, fov = 38, fallback, style, label }: StageProps) {
  const host = React.useRef<HTMLDivElement>(null)
  const [near, setNear] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const [ok] = React.useState(webglAvailable)

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
        setVisible(entry.isIntersecting)
      },
      { rootMargin: '320px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={host} className={className} style={style} aria-label={label} role="img">
      {ok ? (
        near ? (
          <Boundary fallback={fallback}>
            <React.Suspense fallback={fallback}>
              <StageCanvas visible={visible} z={z} fov={fov}>
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
