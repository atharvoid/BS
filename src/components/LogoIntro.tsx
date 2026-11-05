import React from 'react'
import { useLocation } from 'react-router-dom'
import { Logo } from './Logo'

/** The supplied startup sequence, with its lifecycle owned by the homepage. */
export function LogoIntro() {
  const { pathname, hash } = useLocation()
  const host = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const intro = host.current
    const brand = document.querySelector<HTMLAnchorElement>('.nav .brand')
    const headerLogo = brand?.querySelector<SVGSVGElement>('.brand-logo')
    if (!intro || !brand || !headerLogo) return
    const art = intro.querySelector<HTMLElement>('.intro-art')!
    const surface = intro.querySelector<HTMLElement>('.intro-surface')!
    const skip = intro.querySelector<HTMLButtonElement>('.intro-skip')!
    const paths = [...intro.querySelectorAll<SVGPathElement>('path[data-draw]')]
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const animations: Animation[] = []
    const timers: ReturnType<typeof setTimeout>[] = []
    const removeListeners: (() => void)[] = []

    const finish = () => {
      document.documentElement.removeAttribute('data-intro-active')
      timers.splice(0).forEach(clearTimeout)
      animations.splice(0).forEach(animation => animation.cancel())
      removeListeners.splice(0).forEach(remove => remove())
      if (intro.contains(document.activeElement)) brand.focus({ preventScroll: true })
      intro.hidden = true
      intro.setAttribute('aria-hidden', 'true')
      intro.dataset.state = 'idle'
      skip.tabIndex = -1
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
      skip.tabIndex = 0
      const origin = art.getBoundingClientRect()
      try {
        for (const path of paths) {
          const length = path.getTotalLength()
          const ship = path.dataset.draw === 'ship'
          path.style.strokeDasharray = String(length)
          path.style.strokeDashoffset = String(length)
          path.style.fillOpacity = '0'
          if (!ship) {
            path.style.stroke = getComputedStyle(path).fill
            path.style.strokeWidth = '.7px'
          }
          const delay = path.dataset.draw === 'bs' ? 0 : ship ? 100 : 160
          animate(path, [{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
            duration: 460, delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards',
          })
          if (!ship) animate(path, [{ fillOpacity: 0 }, { fillOpacity: 1 }], {
            duration: 160, delay: 440, fill: 'forwards',
          })
        }
        timers.push(setTimeout(() => {
          intro.dataset.state = 'settling'
          const destination = headerLogo.getBoundingClientRect()
          animate(art, [
            { transform: 'translate(0,0) scale(1)' },
            { transform: `translate(${destination.left - origin.left}px, ${destination.top - origin.top}px) scale(${destination.width / origin.width})` },
          ], { duration: 330, easing: 'cubic-bezier(.22,.65,.2,1)', fill: 'forwards' })
          animate(surface, [{ opacity: 1 }, { opacity: 0 }], { duration: 330, fill: 'forwards' })
        }, 690), setTimeout(finish, 1040), setTimeout(finish, 1500))
        listen(skip, 'click', finish)
        listen(window, 'wheel', finish, { passive: true })
        listen(window, 'touchstart', finish, { passive: true })
        listen(window, 'keydown', event => {
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
      <button className="intro-skip" type="button" tabIndex={-1}>Skip introduction</button>
    </div>
  )
}
