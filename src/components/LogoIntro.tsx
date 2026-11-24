import React from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { COMPACT_QUERY } from '../three/render-policy'
import { Logo } from './Logo'
import { globeEntrance, setGlobeEntrance, setIntroPhase } from './intro-state'

const DRAW = 1250
const FILL_AT = 1000
const FLY_AT = 1300
const FLY = 1200
const REVEAL_AT = 2050
const REVEAL = 650
const MAX_CANVAS_WAIT = 700

export function LogoIntro() {
  const { pathname, hash, key } = useLocation()
  const navigationType = useNavigationType()
  const initialKey = React.useRef(key)
  const navigated = React.useRef(false)
  const host = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (key !== initialKey.current) navigated.current = true
    const intro = host.current
    const brand = document.querySelector<HTMLAnchorElement>('.nav .brand')
    const headerLogo = brand?.querySelector<SVGSVGElement>('.brand-logo')
    if (!intro || !brand || !headerLogo) return
    const art = intro.querySelector<HTMLElement>('.intro-art')
    const surface = intro.querySelector<HTMLElement>('.intro-surface')
    if (!art || !surface) return
    const paths = [...intro.querySelectorAll<SVGPathElement>('path[data-draw]')]
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const animations: Animation[] = []
    const timers: ReturnType<typeof setTimeout>[] = []
    const removeListeners: (() => void)[] = []

    const finish = () => {
      timers.splice(0).forEach(clearTimeout)
      animations.splice(0).forEach((animation) => animation.cancel())
      removeListeners.splice(0).forEach((remove) => remove())
      if (intro.contains(document.activeElement)) brand.focus({ preventScroll: true })
      intro.hidden = true
      intro.setAttribute('aria-hidden', 'true')
      intro.dataset.state = 'idle'
      art.style.transform = ''
      setIntroPhase('idle')
    }
    const listen = (target: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions | boolean) => {
      target.addEventListener(type, handler, options)
      removeListeners.push(() => target.removeEventListener(type, handler, options))
    }
    const animate = (target: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      const animation = target.animate(frames, options)
      animations.push(animation)
      return animation
    }
    const reveal = () => {
      setIntroPhase('revealing')
      const fade = animate(surface, [{ opacity: 1 }, { opacity: 0 }], {
        duration: REVEAL,
        easing: 'cubic-bezier(.4,0,.2,1)',
        fill: 'forwards',
      })
      listen(fade, 'finish', finish, { once: true })
    }
    const revealWhenDrawn = () => {
      const stage = document.querySelector('.hero__stage[data-webgl="true"]')
      if (!stage || matchMedia(COMPACT_QUERY).matches || stage.querySelector('[data-scene-ready="true"]')) {
        reveal()
        return
      }
      // Slow startup gets a short grace period. The poster covers longer delays.
      const observer = new MutationObserver(() => {
        if (stage.querySelector('[data-scene-ready="true"]')) clear()
      })
      const deadline = setTimeout(() => clear(), MAX_CANVAS_WAIT)
      const stopWaiting = () => {
        observer.disconnect()
        clearTimeout(deadline)
      }
      const clear = () => {
        stopWaiting()
        reveal()
      }
      observer.observe(stage, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-scene-ready'] })
      removeListeners.push(stopWaiting)
    }

    const play = () => {
      finish()
      if (reduced.matches || typeof art.animate !== 'function') return
      const box = headerLogo.getBoundingClientRect()
      intro.style.setProperty('--intro-left', `${box.left}px`)
      intro.style.setProperty('--intro-top', `${box.top}px`)
      intro.style.setProperty('--intro-width', `${box.width}px`)
      intro.style.setProperty('--intro-height', `${box.height}px`)
      intro.hidden = false
      intro.setAttribute('aria-hidden', matchMedia(COMPACT_QUERY).matches ? 'true' : 'false')
      intro.dataset.state = 'drawing'
      setGlobeEntrance('pending')
      setIntroPhase('drawing')
      const origin = art.getBoundingClientRect()
      try {
        for (const path of paths) {
          const length = path.getTotalLength()
          const ship = path.dataset.draw === 'ship'
          const isName = path.dataset.draw === 'name'
          path.style.strokeDasharray = String(length)
          path.style.strokeDashoffset = String(length)
          path.style.fillOpacity = '0'
          if (!ship) {
            path.style.stroke = getComputedStyle(path).fill
            path.style.strokeWidth = '.7px'
          }
          /* Every stroke is drawn across the same window, so the mark reads as
             one shape being cut rather than a queue of lines. */
          const delay = ship ? 120 : isName ? 260 : 0
          animate(path, [{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
            duration: DRAW - delay,
            delay,
            easing: 'cubic-bezier(.4,0,.2,1)',
            fill: 'forwards',
          })
          if (!ship) animate(path, [{ fillOpacity: 0 }, { fillOpacity: 1 }], {
            duration: 420,
            delay: FILL_AT,
            easing: 'ease-out',
            fill: 'forwards',
          })
        }
        timers.push(
          setTimeout(() => {
            intro.dataset.state = 'settling'
            setIntroPhase('settling')
            const destination = headerLogo.getBoundingClientRect()
            animate(art, [
              { transform: 'translate(0,0) scale(1)' },
              { transform: `translate(${destination.left - origin.left}px, ${destination.top - origin.top}px) scale(${destination.width / origin.width})` },
            ], { duration: FLY, easing: 'cubic-bezier(.38,.62,.16,1)', fill: 'forwards' })
          }, FLY_AT),
          setTimeout(revealWhenDrawn, REVEAL_AT),
        )
        listen(window, 'wheel', finish, { passive: true })
        listen(window, 'touchstart', finish, { passive: true })
        listen(window, 'keydown', (event) => {
          if (['Escape', 'Tab', 'PageDown', 'ArrowDown', ' '].includes((event as KeyboardEvent).key)) finish()
        }, true)
        listen(window, 'resize', finish)
        listen(reduced, 'change', finish)
      } catch {
        finish()
      }
    }
    const replay = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      // Let the router clear a section hash before the new effect starts.
      if (hash) return
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: 'instant' })
      play()
    }
    brand.addEventListener('click', replay)
    // Back restores an existing reading position. It must not put a new
    // opening curtain over that chapter or rewind a direct section entry.
    if (!hash && (!navigated.current || navigationType !== 'POP')) play()
    return () => {
      brand.removeEventListener('click', replay)
      finish()
      // Leaving the page mid-opening: a later visit shows the globe at rest.
      if (globeEntrance() === 'pending') setGlobeEntrance('none')
    }
  }, [pathname, hash, key, navigationType])

  if (pathname !== '/') return null
  return (
    <div ref={host} className="brand-intro" id="brand-intro" hidden aria-hidden="true">
      <div className="intro-surface" aria-hidden="true" />
      <div className="intro-art" aria-hidden="true"><Logo className="logo-drawing" /></div>
    </div>
  )
}
