import test from 'node:test'
import assert from 'node:assert/strict'

let probeId = 0
async function probe(contexts) {
  const previousWindow = globalThis.window, previousDocument = globalThis.document
  const requested = []
  globalThis.window = {}
  globalThis.document = {createElement: () => ({getContext: type => { requested.push(type); return contexts[type] ?? null }})}
  try {
    const {webglAvailable} = await import(`../src/three/webgl.ts?probe=${++probeId}`)
    return {first:webglAvailable(),cached:webglAvailable(),requested}
  } finally {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument
  }
}

test('WebGL 1 alone cannot enable a renderer that requires WebGL 2', async () => {
  const result = await probe({webgl:{getExtension:()=>null}})
  assert.equal(result.first,false)
  assert.equal(result.cached,false)
  assert.deepEqual(result.requested,['webgl2'])
})

test('an already-lost context keeps the static fallback', async () => {
  const result = await probe({webgl2:{isContextLost:()=>true,getExtension:()=>null}})
  assert.equal(result.first,false)
})

test('a healthy WebGL 2 probe is cached and its temporary GPU context is released', async () => {
  let released = 0
  const result = await probe({webgl2:{isContextLost:()=>false,getExtension:()=>({loseContext:()=>released++})}})
  assert.equal(result.first,true)
  assert.equal(result.cached,true)
  assert.deepEqual(result.requested,['webgl2'])
  assert.equal(released,1)
})
