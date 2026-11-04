/**
 * Motion preference, read once. A visitor who has asked their system for less
 * motion should land on the finished cloth, not watch it weave — and the
 * idle drift in the stage objects should be still.
 */
export const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
