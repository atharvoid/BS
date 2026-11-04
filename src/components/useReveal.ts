import React from 'react'

/**
 * Adds `.is-in` to every `.reveal` element as it enters the viewport.
 * One observer for the whole page, and it disconnects once everything has
 * been revealed, so there is no permanent scroll listener.
 */
export function useReveal(deps: unknown[] = []) {
  React.useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (!els.length) return

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )

    els.forEach((el) => {
      // Anything already on screen at mount reveals immediately, without a
      // flash of hidden content.
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.94) el.classList.add('is-in')
      else io.observe(el)
    })

    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

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
