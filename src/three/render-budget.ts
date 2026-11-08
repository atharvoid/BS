import React from 'react'
import { useCompactLayout } from '../components/useCompactLayout'
import { drawingDpr, motionOwner, mobileMotionDone, PHONE_MOTION_MS } from './render-policy'

const owners = new Map<string, { id: string; score: number }>()
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
const publish = () => listeners.forEach(fn => fn())
const starts = new Map<string, number>()

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
export function usePhoneMotion(key: string, ready: boolean) {
  const compact = useCompactLayout()
  const [done, setDone] = React.useState(() => {
    const start = starts.get(key)
    return start !== undefined && mobileMotionDone(start, Date.now())
  })
  React.useEffect(() => {
    if (!compact || !ready) return
    const start = starts.get(key) ?? Date.now()
    starts.set(key, start)
    const remaining = PHONE_MOTION_MS - (Date.now() - start)
    if (remaining <= 0) { setDone(true); return }
    const timer = setTimeout(() => setDone(true), remaining)
    return () => clearTimeout(timer)
  }, [compact, key, ready])
  return compact && done
}

/** Prefer the most visible stage; the other surface can still draw on input. */
export function useRenderBudget(host: React.RefObject<HTMLElement | null>, desired: number, width: number, height: number, eligible: boolean) {
  const compact = useCompactLayout()
  const id = React.useId()
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
  const owner = React.useSyncExternalStore(subscribe, () => motionOwner([...owners.values()]), () => null)
  const permit = !compact || owner === id
  const dpr = drawingDpr(desired, width, height, compact ? 1_500_000 : 3_000_000, compact)
  return { dpr, permit }
}
