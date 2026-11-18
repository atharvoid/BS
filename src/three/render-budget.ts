import React from 'react'
import { useCompactLayout } from '../components/useCompactLayout'
import { drawingDpr, motionOwner, mobileMotionDone, PHONE_MOTION_MS } from './render-policy'

const owners = new Map<string, { id: string; score: number }>()
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
const publish = () => listeners.forEach(fn => fn())
const played = new Map<string, number>()

const deferred = () => matchMedia('(prefers-reduced-motion: reduce)').matches ||
  !!(navigator as Navigator & {connection?: {saveData?: boolean}}).connection?.saveData
const subscribePreference = (notify: () => void) => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const connection = (navigator as Navigator & {connection?: EventTarget}).connection
  motion.addEventListener('change', notify)
  connection?.addEventListener('change', notify)
  return () => { motion.removeEventListener('change', notify); connection?.removeEventListener('change', notify) }
}
export const useDeferred3D = () => React.useSyncExternalStore(subscribePreference, deferred, () => true)

/** One automatic motion window per section/document, including revisits. */
export function useMotionWindow(key: string, ready: boolean, enabled: boolean) {
  const [done, setDone] = React.useState(() => mobileMotionDone(0, played.get(key) ?? 0))
  React.useEffect(() => {
    if (!enabled || !ready || done) return
    const remaining = PHONE_MOTION_MS - (played.get(key) ?? 0)
    if (remaining <= 0) { setDone(true); return }
    const started = performance.now()
    const timer = setTimeout(() => {
      played.set(key, PHONE_MOTION_MS)
      setDone(true)
    }, remaining)
    return () => {
      clearTimeout(timer)
      played.set(key, Math.min(PHONE_MOTION_MS, (played.get(key) ?? 0) + performance.now() - started))
    }
  }, [done, enabled, key, ready])
  return enabled && done
}

/** Prefer the most visible stage; the other surface can still draw on input. */
export function useRenderBudget(host: React.RefObject<HTMLElement | null>, desired: number, width: number, height: number, eligible: boolean) {
  const compact = useCompactLayout()
  const id = React.useId()
  const owner = React.useSyncExternalStore(subscribe, () => motionOwner([...owners.values()]), () => null)
  const permit = !compact || owner === id
  React.useEffect(() => {
    const el = host.current
    if (!compact || !el || !eligible) return
    const observer = new IntersectionObserver(([entry]) => {
      owners.set(id, { id, score: entry.intersectionRatio })
      publish()
    }, { threshold: [0, .1, .25, .5, .75, 1] })
    observer.observe(el)
    return () => { observer.disconnect(); owners.delete(id); publish() }
  }, [compact, eligible, host, id])
  const dpr = drawingDpr(desired, width, height, compact ? 1_500_000 : 3_000_000, compact)
  return { dpr, permit }
}
