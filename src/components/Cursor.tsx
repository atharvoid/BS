import React from 'react'
import '../styles/cursor.css'

/* ==========================================================================
   The pointer, for mouse and trackpad only.

   - A small dot that sits exactly on the pointer: no lag, so precision is
     never worse than the system cursor.
   - A thin gold ring that trails a moment behind and swells over anything
     that can be clicked.
   - Over the globe or the cloth it becomes a gold disc that says "Drag";
     over a closed product area, "Open".
   - In text fields the system cursor comes back (an I-beam is the right
     tool there), and the custom one steps aside.

   Off entirely for touch screens, forced colours (Windows high contrast)
   and reduced motion, where the system cursor is used throughout.
   ========================================================================== */

const NATIVE = 'input:not([type="radio"]):not([type="checkbox"]), textarea, select, [contenteditable="true"], iframe'
const ACTION = 'a[href], button, [role="button"], [role="option"], [role="combobox"], label, summary'

function labelFor(el: Element | null): string {
  if (!el) return ''
  if (el.closest('.hero__canvas, .page-hero__canvas')) return 'Drag'
  if (el.closest('.vat[data-active="false"]')) return 'Open'
  return ''
}

export function Cursor() {
  const host = React.useRef<HTMLDivElement>(null)
  const ring = React.useRef<HTMLDivElement>(null)
  const dot = React.useRef<HTMLDivElement>(null)
  const label = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const container = host.current
    const ringEl = ring.current
    const dotEl = dot.current
    const labelEl = label.current
    if (!container || !ringEl || !dotEl || !labelEl) return

    const fine = matchMedia('(hover: hover) and (pointer: fine)')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const forced = matchMedia('(forced-colors: active)')
    const root = document.documentElement
    const enabled = () => fine.matches && !reduced.matches && !forced.matches

    let x = -100
    let y = -100
    let rx = -100
    let ry = -100
    let raf = 0
    let last = 0
    let lastHit: Element | null = null

    const setMode = (hit: Element | null) => {
      if (hit === lastHit) return
      lastHit = hit
      const native = !!hit?.closest(NATIVE)
      const text = labelFor(hit)
      const action = !text && !!hit?.closest(ACTION)
      container.dataset.mode = native ? 'native' : text ? 'label' : action ? 'action' : 'idle'
      if (text) labelEl.textContent = text
    }

    const frame = (time: number) => {
      raf = 0
      const dt = last ? Math.min(64, time - last) : 16
      last = time
      // Ease the ring toward the pointer, frame-rate independent.
      const k = 1 - Math.pow(1 - 0.28, dt / 16.7)
      rx += (x - rx) * k
      ry += (y - ry) * k
      ringEl.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) raf = requestAnimationFrame(frame)
      else last = 0
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !enabled()) return
      x = e.clientX
      y = e.clientY
      if (container.dataset.visible !== 'true') {
        rx = x
        ry = y
        container.dataset.visible = 'true'
        root.classList.add('has-cursor')
      }
      dotEl.style.transform = `translate3d(${x}px, ${y}px, 0)`
      setMode(e.target as Element | null)
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const hide = () => {
      container.dataset.visible = 'false'
      root.classList.remove('has-cursor')
    }
    const onDown = () => { container.dataset.pressed = 'true' }
    const onUp = () => { container.dataset.pressed = 'false' }
    const onLeave = (e: MouseEvent) => { if (!e.relatedTarget) hide() }
    const onPreference = () => { if (!enabled()) hide() }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('mouseout', onLeave)
    window.addEventListener('blur', hide)
    for (const q of [fine, reduced, forced]) q.addEventListener('change', onPreference)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('mouseout', onLeave)
      window.removeEventListener('blur', hide)
      for (const q of [fine, reduced, forced]) q.removeEventListener('change', onPreference)
      hide()
    }
  }, [])

  return (
    <div ref={host} className="cursor" aria-hidden="true" data-visible="false" data-mode="idle" data-pressed="false">
      <div ref={ring} className="cursor__ring">
        <span className="cursor__disc"><span ref={label} className="cursor__label" /></span>
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  )
}
