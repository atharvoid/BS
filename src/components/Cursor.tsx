import React from 'react'
import { selectNearbyTarget, type CursorTarget } from './cursor-state'
import type { ScenePointerEvent } from '../three/interaction'
import '../styles/cursor.css'

type Mode = 'idle' | 'approach' | 'explore' | 'explore-row' | 'action' | 'scene' | 'dragging'
type MeasuredTarget = CursorTarget & { element: HTMLElement; row: boolean }
type SceneHit = { id: string; pointerId: number; inside: boolean; dragging: boolean }

/** Anything that should offer the filled Explore disc. */
const TARGETS = '[data-cursor="menu"], .nav__link, .drawer__link'
const NATIVE = 'input, textarea, select, [contenteditable="true"], [data-cursor="native"], iframe'
const ACTION = 'a, button, [role="tab"], [data-cursor="action"]'

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
        return [{ id, rect, element, row: element.classList.contains('drawer__link') || element.dataset.cursorSize === 'row' }]
      })
    }

    /** The disc is larger than a normal cursor, so it is kept fully on screen. */
    const clampToDisc = (value: number, size: number) =>
      Math.min(size > 0 ? innerWidth - size / 2 - 6 : innerWidth, Math.max(size / 2 + 6, value))

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
        const isMenu = !!direct && (direct.dataset.cursor === 'menu' ||
          direct.classList.contains('nav__link') || direct.classList.contains('drawer__link'))
        const action = hit?.closest(ACTION)
        const onCanvas = hit instanceof HTMLCanvasElement
        let mode: Mode = 'idle'
        if (scene?.dragging) mode = 'dragging'
        else if (isMenu && target) mode = target.row ? 'explore-row' : 'explore'
        else if (action) mode = 'action'
        else if (scene?.inside && onCanvas) mode = 'scene'
        else if (target) mode = 'approach'

        let tx = x
        let ty = y
        if (mode === 'explore') {
          /* The disc holds the pointer exactly, so it never reads as a tooltip
             hanging underneath. It is nudged only enough to stay on screen. */
          tx = clampToDisc(x, 88)
          ty = clampToDisc(y, 88)
        } else if (mode === 'explore-row') {
          tx = clampToDisc(x, 104)
          ty = clampToDisc(y, 104)
        } else if (mode === 'approach' && target) {
          const cx = (target.rect.left + target.rect.right) / 2
          const cy = (target.rect.top + target.rect.bottom) / 2
          const distance = Math.hypot(
            Math.max(target.rect.left - x, 0, x - target.rect.right),
            Math.max(target.rect.top - y, 0, y - target.rect.bottom),
          )
          const strength = Math.max(0, Math.min(1, 1 - distance / 24))
          const width = (21 + strength * (target.row ? 55 : 43)).toFixed(1) + 'px'
          const height = (21 + strength * (target.row ? 55 : 15)).toFixed(1) + 'px'
          if (container.style.getPropertyValue('--approach-width') !== width) container.style.setProperty('--approach-width', width)
          if (container.style.getPropertyValue('--approach-height') !== height) container.style.setProperty('--approach-height', height)
          tx += Math.max(-8, Math.min(8, (cx - x) * 0.12))
          ty += Math.max(-8, Math.min(8, (cy - y) * 0.12))
        }

        container.dataset.mode = mode
        /* A short fade instead of a pop: the disc is 88px across, and appearing
           at full size instantly reads as a glitch. */
        container.dataset.explore = mode === 'explore' || mode === 'explore-row' ? 'true' : 'false'
        const caption = mode === 'scene' || mode === 'dragging' ? 'Drag' : 'Explore'
        if (text.textContent !== caption) text.textContent = caption
        root.classList.add('has-custom-cursor')
        container.dataset.visible = 'true'
        if (!initialized) {
          rx = x
          ry = y
          initialized = true
        }
        /* The disc tracks the pointer tightly so it feels attached to it; the
           small rings keep the softer follow. */
        const follow = mode === 'explore' || mode === 'explore-row' ? 55 : 90
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
