import React from 'react'
import { selectNearbyTarget, type CursorTarget } from './cursor-state'
import type { ScenePointerEvent } from '../three/interaction'
import '../styles/cursor.css'

type Mode = 'idle' | 'approach' | 'explore' | 'action' | 'scene' | 'dragging'
type MeasuredTarget = CursorTarget & { element: HTMLElement }
type SceneHit = { id: string; pointerId: number; inside: boolean; dragging: boolean }

/** Anything that should offer the filled Explore disc. Menu links only: these
 *  are the links that go somewhere else in the site's own structure. */
const TARGETS = '[data-cursor="menu"], .nav__link, .drawer__link'
const NATIVE = 'input, textarea, select, [contenteditable="true"], [data-cursor="native"], iframe'
const ACTION = 'a, button, [role="tab"], [data-cursor="action"]'

/** The diameter of every labelled disc, in CSS pixels. The stage geometry
 *  below keeps it fully on screen using the same number. */
const DISC = 60
const DRAG_DISC = 56
const RING = 18

/** Which theme the pointer is over.
 *
 *  Sections declare it with `data-tone`; the CSS class `on-dark` is the older,
 *  equivalent signal and is honoured too, so no section has to be annotated
 *  twice. A page with neither is treated as light, which most of this site is.
 */
function toneAt(hit: Element | null): 'dark' | 'light' {
  const el = hit?.closest('[data-tone], .on-dark') as HTMLElement | null
  if (!el) return 'light'
  if (el.dataset.tone) return el.dataset.tone === 'dark' ? 'dark' : 'light'
  return el.classList.contains('on-dark') ? 'dark' : 'light'
}

/**
 * The pointer.
 *
 * Over a navigation item it becomes one opaque circular disc with the word
 * Explore set inside it, sitting exactly on the pointer. It is a disc, not a
 * pill and not a caption under the cursor: one shape, one word, no offset.
 */
export function Cursor() {
  const host = React.useRef<HTMLDivElement>(null)
  const ring = React.useRef<HTMLDivElement>(null)
  const dot = React.useRef<HTMLDivElement>(null)
  const label = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const container = host.current
    const body = ring.current
    const pointer = dot.current
    const text = label.current
    if (!container || !body || !pointer || !text || !window.matchMedia) return

    const root = document.documentElement
    const fine = matchMedia('(any-hover: hover) and (any-pointer: fine)')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const forced = matchMedia('(forced-colors: active)')
    const targetIds = new WeakMap<HTMLElement, string>()
    let idCounter = 0
    let targets: MeasuredTarget[] = []
    let geometryDirty = true
    let nearId: string | null = null
    let scene: SceneHit | null = null
    let mouseActive = false
    let x = 0
    let y = 0
    let rx = 0
    let ry = 0
    let initialized = false
    let raf = 0
    let previousTime = 0
    let disposed = false

    const conceal = () => {
      root.classList.remove('has-custom-cursor')
      container.dataset.visible = 'false'
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      previousTime = 0
      initialized = false
    }

    const measure = () => {
      geometryDirty = false
      targets = [...document.querySelectorAll<HTMLElement>(TARGETS)].flatMap(element => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        if (!rect.width || !rect.height || style.visibility === 'hidden' || style.display === 'none' ||
            rect.right <= 0 || rect.left >= innerWidth || rect.bottom <= 0 || rect.top >= innerHeight) return []
        const cx = Math.min(innerWidth - 1, Math.max(0, (rect.left + rect.right) / 2))
        const cy = Math.min(innerHeight - 1, Math.max(0, (rect.top + rect.bottom) / 2))
        const top = document.elementFromPoint(cx, cy)
        if (top !== element && (!top || !element.contains(top))) return []
        let id = targetIds.get(element)
        if (!id) {
          id = String(++idCounter)
          targetIds.set(element, id)
        }
        return [{ id, rect, element }]
      })
    }

    /** A disc is larger than a normal cursor, so it is kept fully on screen.
     *  One rule for every size: the disc's own radius in from each edge. */
    const clampToDisc = (value: number, size: number, extent: number) => {
      const half = size / 2
      const margin = half + 4
      return Math.min(Math.max(margin, value), Math.max(margin, extent - margin))
    }

    const tick = (time: number) => {
      raf = 0
      try {
        if (!mouseActive || !fine.matches || reduced.matches || forced.matches || document.hidden ||
            root.dataset.introActive === 'true' || !document.hasFocus()) {
          conceal()
          return
        }
        if (geometryDirty) measure()
        const hit = document.elementFromPoint(x, y) as HTMLElement | null
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed) {
          conceal()
          return
        }
        const direct = hit?.closest<HTMLElement>(TARGETS) ?? null
        const native = hit?.closest(NATIVE)
        if (native && !scene?.dragging) {
          conceal()
          return
        }

        nearId = selectNearbyTarget(targets, x, y, nearId)
        const target = targets.find(item => item.element === direct) ??
          targets.find(item => item.id === nearId) ?? null
        const action = hit?.closest(ACTION)
        const onCanvas = hit instanceof HTMLCanvasElement

        /* One mode per frame, in priority order. Drag is shown only while a
           scene is actually draggable under the pointer, and only while the
           pointer is the one holding the drag. */
        let mode: Mode = 'idle'
        let size = RING
        if (scene?.dragging) {
          mode = 'dragging'
          size = DRAG_DISC
        } else if (scene?.inside && onCanvas) {
          mode = 'scene'
          size = DISC
        } else if (target) {
          mode = 'explore'
          size = DISC
        } else if (action) {
          mode = 'action'
        }

        /* Tone follows the section under the pointer, so a disc on the dark
           hero and a disc in the light body do not try to use one palette. */
        const tone = toneAt(hit ?? direct)
        if (container.dataset.tone !== tone) container.dataset.tone = tone

        /* The disc holds the pointer exactly; it is only nudged enough to stay
           fully on screen, using the same rule at every size. */
        let tx = x
        let ty = y
        if (mode === 'explore' || mode === 'scene' || mode === 'dragging') {
          tx = clampToDisc(x, size, innerWidth)
          ty = clampToDisc(y, size, innerHeight)
        } else if (mode === 'idle' && target) {
          /* Approaching a menu item: the ring grows towards it, but stays a
             circle. The word does not appear until the pointer is on it. */
          const cx = (target.rect.left + target.rect.right) / 2
          const cy = (target.rect.top + target.rect.bottom) / 2
          tx += Math.max(-6, Math.min(6, (cx - x) * 0.1))
          ty += Math.max(-6, Math.min(6, (cy - y) * 0.1))
        }

        container.dataset.mode = mode
        const caption = mode === 'dragging' || mode === 'scene' ? 'Drag' : 'Explore'
        if (text.textContent !== caption) text.textContent = caption
        root.classList.add('has-custom-cursor')
        container.dataset.visible = 'true'
        if (!initialized) {
          rx = x
          ry = y
          initialized = true
        }

        /* The disc tracks the pointer closely enough to feel attached to it:
           a short follow, not a lag. */
        const follow = mode === 'explore' || mode === 'scene' || mode === 'dragging' ? 42 : 70
        const elapsed = previousTime ? Math.min(50, time - previousTime) : 16
        previousTime = time
        const amount = 1 - Math.exp(-elapsed / follow)
        rx += (tx - rx) * amount
        ry += (ty - ry) * amount
        body.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`
        pointer.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
        if (Math.abs(tx - rx) > 0.15 || Math.abs(ty - ry) > 0.15) raf = requestAnimationFrame(tick)
        else {
          body.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`
          rx = tx
          ry = ty
          previousTime = 0
        }
      } catch {
        mouseActive = false
        conceal()
      }
    }

    const wake = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(tick)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        mouseActive = false
        scene = null
        conceal()
        return
      }
      x = event.clientX
      y = event.clientY
      mouseActive = true
      wake()
    }
    const updateScene = (event: Event) => {
      const detail = (event as CustomEvent<ScenePointerEvent>).detail
      if (!detail) return
      if ((detail.phase === 'remove' || detail.phase === 'cancel') && scene?.id === detail.sceneId) {
        scene = null
        wake()
        return
      }
      if (detail.pointerType !== 'mouse') return
      if (detail.phase === 'enter') scene = { id: detail.sceneId, pointerId: detail.pointerId, inside: true, dragging: false }
      else if (!scene && (detail.phase === 'press' || detail.phase === 'drag')) {
        scene = { id: detail.sceneId, pointerId: detail.pointerId, inside: true, dragging: true }
      }
      else if (scene?.id === detail.sceneId && scene.pointerId === detail.pointerId) {
        if (detail.phase === 'leave') {
          scene.inside = false
          if (!scene.dragging) scene = null
        } else if (detail.phase === 'press' || detail.phase === 'drag') scene.dragging = true
        else if (detail.phase === 'release') {
          scene.dragging = false
          if (!scene.inside) scene = null
        } else if (detail.phase === 'cancel' || detail.phase === 'remove') scene = null
      }
      wake()
    }
    const invalidate = () => { geometryDirty = true; wake() }
    const stop = () => { mouseActive = false; scene = null; nearId = null; conceal() }
    const keyboard = () => stop()
    const preferences = () => {
      if (!fine.matches || reduced.matches || forced.matches) stop()
      else invalidate()
    }
    const onVisibility = () => { if (document.hidden) stop(); else invalidate() }
    const observer = new MutationObserver(invalidate)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'data-cursor', 'data-cursor-size'] })
    const introObserver = new MutationObserver(() => { if (root.dataset.introActive === 'true') conceal(); else invalidate() })
    introObserver.observe(root, { attributes: true, attributeFilter: ['data-intro-active'] })

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', move, { passive: true })
    window.addEventListener('bs:scene-pointer', updateScene)
    window.addEventListener('blur', stop)
    window.addEventListener('resize', invalidate)
    window.addEventListener('scroll', invalidate, { passive: true })
    document.addEventListener('pointerleave', stop)
    document.addEventListener('keydown', keyboard, true)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('selectionchange', invalidate)
    document.addEventListener('transitionend', invalidate)
    fine.addEventListener('change', preferences)
    reduced.addEventListener('change', preferences)
    forced.addEventListener('change', preferences)
    document.fonts?.ready.then(() => { if (!disposed) invalidate() })

    return () => {
      disposed = true
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', move)
      window.removeEventListener('bs:scene-pointer', updateScene)
      window.removeEventListener('blur', stop)
      window.removeEventListener('resize', invalidate)
      window.removeEventListener('scroll', invalidate)
      document.removeEventListener('pointerleave', stop)
      document.removeEventListener('keydown', keyboard, true)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('selectionchange', invalidate)
      document.removeEventListener('transitionend', invalidate)
      fine.removeEventListener('change', preferences)
      reduced.removeEventListener('change', preferences)
      forced.removeEventListener('change', preferences)
      observer.disconnect()
      introObserver.disconnect()
      conceal()
    }
  }, [])

  return (
    <div className="cursor" ref={host} data-mode="idle" data-visible="false" data-explore="false" aria-hidden="true">
      <div className="cursor__ring" ref={ring}><span className="cursor__label" ref={label} /></div>
      <div className="cursor__dot" ref={dot} />
    </div>
  )
}
