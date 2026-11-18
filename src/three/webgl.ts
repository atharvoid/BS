/** Shared capability probe. Release the temporary context immediately. */
let available: boolean | undefined
export function webglAvailable() {
  if (typeof window === 'undefined') return false
  if (available !== undefined) return available
  try {
    const canvas = document.createElement('canvas')
    // The installed Three renderer requires WebGL 2. A WebGL 1-only or
    // already-lost context must keep the usable poster/directory fallback.
    const gl = canvas.getContext('webgl2')
    available = !!gl && !gl.isContextLost()
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    available = false
  }
  return available
}
