import React from 'react'

/**
 * A restrained cursor companion: a hairline ring that trails the pointer and
 * swells over anything interactive. Pointer-fine devices only, and it steps
 * aside entirely for reduced motion or keyboard/native-cursor users.
 */
export function Cursor() {
  const ring = React.useRef<HTMLDivElement>(null)
  const dot = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    const r = ring.current
    const d = dot.current
    if (!r || !d) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let raf = 0
    let visible = false
    let scale = 1
    let targetScale = 1

    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!visible) {
        visible = true
        r.style.opacity = '1'
        d.style.opacity = '1'
        rx = x
        ry = y
      }
      const el = e.target as HTMLElement | null
      const hot = el?.closest('a, button, input, textarea, label, [data-cursor="hot"]')
      targetScale = hot ? 2.05 : 1
    }

    const leave = () => {
      visible = false
      r.style.opacity = '0'
      d.style.opacity = '0'
    }

    const tick = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      scale += (targetScale - scale) * 0.14
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`
      d.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', move)
      document.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ring} />
      <div className="cursor__dot" ref={dot} />
    </div>
  )
}
