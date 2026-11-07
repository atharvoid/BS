import React from 'react'

/**
 * Adds `.is-in` to every `.reveal` element as it enters the viewport.
 * One observer for the whole page, and it disconnects once everything has
 * been revealed, so there is no permanent scroll listener.
 */
/** Compatibility for existing pages. TextTransitions now coordinates reveals
 * across routes (including footer and dynamically inserted content). */
export function useReveal(_deps: unknown[] = []) {}

/** Parallax offset driven by scroll position, written straight to a CSS var. */
export function useParallax(ref: React.RefObject<HTMLElement | null>, strength = 0.12) {
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const mid = rect.top + rect.height / 2 - window.innerHeight / 2
      el.style.setProperty('--parallax', `${(-mid * strength).toFixed(2)}px`)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, strength])
}
