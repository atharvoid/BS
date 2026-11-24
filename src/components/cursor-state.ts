type Bounds = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>

export type CursorTarget = { id: string; rect: Bounds }

/** Keep a nearby target stable until a neighbour is meaningfully closer. */
export function selectNearbyTarget(targets: CursorTarget[], x: number, y: number, current: string | null) {
  const distances = targets.map(({ id, rect }) => ({
    id,
    distance: Math.hypot(Math.max(rect.left - x, 0, x - rect.right), Math.max(rect.top - y, 0, y - rect.bottom)),
  }))
  const nearest = distances.reduce<(typeof distances)[number] | null>(
    (best, item) => !best || item.distance < best.distance ? item : best,
    null,
  )
  const previous = distances.find(item => item.id === current)
  if (nearest?.distance === 0) return nearest.id
  if (previous && previous.distance <= 34 && (!nearest || nearest.distance > previous.distance - 6)) return previous.id
  return nearest && nearest.distance <= 24 ? nearest.id : null
}
