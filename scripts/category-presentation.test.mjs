import test from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'

test('textile and wheat resume pairs use separate asset versions and tab storage keys',async()=>{
  assert.ok(existsSync('src/three/category-presentation.ts'),'shared presentation store is missing')
  const {createPresentationStore}=await import('../src/three/category-presentation.ts')
  const values=new Map()
  globalThis.sessionStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}
  try {
    const wheat=createPresentationStore('agriculture','golden-wheat-v1'),textile=createPresentationStore('textiles','indigo-roll-v2')
    const pair={version:'indigo-roll-v2',phase:2,bounded:true,image:'data:image/png;base64,AAAA',height:135,dpr:2}
    textile.retain(pair);textile.persist()
    assert.equal(wheat.get(),null)
    assert.equal(wheat.valid(pair,135,2,true),false)
    assert.equal(createPresentationStore('textiles','indigo-roll-v2').get().phase,2)
    assert.equal(createPresentationStore('textiles','old-roll').get(),null)
  }finally{delete globalThis.sessionStorage}
})
