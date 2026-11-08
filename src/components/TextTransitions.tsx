import React from 'react'
import { useLocation } from 'react-router-dom'
import { COMPACT_QUERY } from '../three/render-policy'
import { introActive, onIntroChange } from './intro-state'

const TEXT = 'h1,h2,h3,h4,h5,h6,p,li,a,button,label,legend,dt,dd,figcaption,summary,small,span'
const EXCLUDE = '.cursor,.nav,.drawer,#brand-intro,[data-text-reveal="off"],.visually-hidden,[aria-live],.field__error,[role="alert"],[role="status"],[role="listbox"],[role="combobox"],svg,canvas'

/** One route-wide observer. Existing typography/DOM stay intact; no word or
 * letter splitting. Critical UI and announcements never wait for an animation. */
export function TextTransitions() {
  const { pathname } = useLocation()
  React.useLayoutEffect(() => {
    if (matchMedia(COMPACT_QUERY).matches) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'))
      return
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const pending = new Set<HTMLElement>()
    const seen = new WeakSet<HTMLElement>()
    const animations = new Map<HTMLElement, Animation>()
    const show = (el: HTMLElement, animate = true) => {
      pending.delete(el)
      observer?.unobserve(el)
      el.style.removeProperty('opacity')
      if (animate && !reduced.matches && typeof el.animate === 'function') {
        const animation = el.animate([
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' })
        animations.set(el, animation)
        animation.onfinish = () => animations.delete(el)
      }
    }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      if (introActive()) return
      for (const entry of entries) if (entry.isIntersecting) show(entry.target as HTMLElement)
    }, { threshold: .01, rootMargin: '0px 0px -18px 0px' }) : null
    const scan = () => {
      // Legacy image/card reveals remain visible; this layer owns text timing.
      document.querySelectorAll<HTMLElement>('.reveal').forEach(el => el.classList.add('is-in'))
      for (const scope of document.querySelectorAll('main,footer')) {
        for (const el of scope.querySelectorAll<HTMLElement>(TEXT)) {
          if (seen.has(el) || el.closest(EXCLUDE) || !el.textContent?.trim()) continue
          // Inline words and links inherit their paragraph/heading transition.
          const parent = el.parentElement?.closest(TEXT)
          if (parent && scope.contains(parent) && !parent.matches('li:has(p),li:has(h2),li:has(h3)')) continue
          // List containers with independent text blocks should not conceal all
          // their descendants behind a second parent opacity animation.
          if (el.matches('li') && el.querySelector('p,h2,h3')) continue
          if (getComputedStyle(el).display === 'none') continue
          seen.add(el)
          if (reduced.matches || !observer) continue
          const r = el.getBoundingClientRect()
          if (r.width <= 0 || r.height <= 0) continue
          pending.add(el)
          el.style.opacity = '0'
          observer.observe(el)
          if (!introActive() && r.top < innerHeight - 18 && r.bottom > 0) show(el)
        }
      }
    }
    const clearIntro = onIntroChange(active => {
      if (!active) for (const el of pending) {
        const r = el.getBoundingClientRect()
        if (r.top < innerHeight - 18 && r.bottom > 0) show(el)
      }
    })
    const focus = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      for (const el of pending) if (el === target || el.contains(target)) show(el, false)
    }
    const preferences = () => {
      if (!reduced.matches) return
      for (const el of pending) show(el, false)
      for (const animation of animations.values()) animation.cancel()
      animations.clear()
    }
    scan()
    const mutations = new MutationObserver(scan)
    const main = document.querySelector('main')
    if (main) mutations.observe(main, { childList: true, subtree: true })
    document.addEventListener('focusin', focus)
    reduced.addEventListener('change', preferences)
    return () => {
      clearIntro(); observer?.disconnect(); mutations.disconnect()
      document.removeEventListener('focusin', focus)
      reduced.removeEventListener('change', preferences)
      for (const el of pending) el.style.removeProperty('opacity')
      for (const animation of animations.values()) animation.cancel()
    }
  }, [pathname])
  return null
}
