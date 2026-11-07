/** Shared capability probe. Release the temporary context immediately. */
let available: boolean | undefined
export function webglAvailable() {
  if (typeof window === 'undefined') return false
  if (available !== undefined) return available
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    available = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    available = false
  }
  return available
}
