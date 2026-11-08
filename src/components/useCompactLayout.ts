import { useSyncExternalStore } from 'react'
import { COMPACT_QUERY } from '../three/render-policy'
const subscribe = (notify: () => void) => {
  const query = matchMedia(COMPACT_QUERY)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
export const useCompactLayout = () => useSyncExternalStore(subscribe, () => matchMedia(COMPACT_QUERY).matches, () => true)
