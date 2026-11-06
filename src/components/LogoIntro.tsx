import React from 'react'
import { useLocation } from 'react-router-dom'
import { Logo } from './Logo'

/* ==========================================================================
   The opening.

   Three seconds, in four beats:

   0.00 – 1.30  the BS and the ship draw themselves, then fill
   1.30 – 2.55  the mark lifts into the header
   2.55 – 3.00  the curtain clears

   There is no skip control. The sequence is short, it is interrupted by
   scrolling, a click, Escape or Tab, and it is skipped entirely for reduced
   motion, so a control would only be one more thing on the screen.
   ========================================================================== */

const DRAW = 1250
const FILL_AT = 1000
const FLY_AT = 1300
const FLY = 1200
const CLEAR_AT = 2550
const END = 3000

export function LogoIntro() {
  const { pathname, hash } = useLocation()
  const host = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
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
      document.documentElement.removeAttribute('data-intro-active')
      timers.splice(0).forEach(clearTimeout)
      animations.splice(0).forEach((animation) => animation.cancel())
      removeListeners.splice(0).forEach((remove) => remove())
      if (intro.contains(document.activeElement)) brand.focus({ preventScroll: true })
      intro.hidden = true
      intro.setAttribute('aria-hidden', 'true')
      intro.dataset.state = 'idle'
      art.style.transform = ''
    }
    const listen = (target: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions | boolean) => {
      target.addEventListener(type, handler, options)
      removeListeners.push(() => target.removeEventListener(type, handler, options))
    }
    const animate = (target: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      animations.push(target.animate(frames, options))
    }

    const play = () => {
      finish()
      if (reduced.matches || typeof art.animate !== 'function') return
      document.documentElement.dataset.introActive = 'true'
      intro.hidden = false
      intro.setAttribute('aria-hidden', 'false')
      intro.dataset.state = 'drawing'
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
            const destination = headerLogo.getBoundingClientRect()
            animate(art, [
              { transform: 'translate(0,0) scale(1)' },
              { transform: `translate(${destination.left - origin.left}px, ${destination.top - origin.top}px) scale(${destination.width / origin.width})` },
            ], { duration: FLY, easing: 'cubic-bezier(.38,.62,.16,1)', fill: 'forwards' })
            animate(surface, [{ opacity: 1 }, { opacity: 1 }, { opacity: 0 }], {
              duration: CLEAR_AT - FLY_AT,
              easing: 'cubic-bezier(.4,0,.2,1)',
              fill: 'forwards',
            })
          }, FLY_AT),
          setTimeout(() => { intro.dataset.state = 'clearing' }, CLEAR_AT),
          setTimeout(finish, END),
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
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (!hash || navigation?.type === 'reload' || navigation?.type === 'back_forward') play()
    return () => {
      brand.removeEventListener('click', replay)
      finish()
    }
  }, [pathname, hash])

  if (pathname !== '/') return null
  return (
    <div ref={host} className="brand-intro" id="brand-intro" hidden aria-hidden="true">
      <div className="intro-surface" aria-hidden="true" />
      <div className="intro-art" aria-hidden="true"><Logo className="logo-drawing" /></div>
    </div>
  )
}
