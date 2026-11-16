import test from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {createCanvas} from '@napi-rs/canvas'

test('the herringbone texture wraps without a seam and leaves the trim quiet',async()=>{
  assert.ok(existsSync('src/three/textileTextures.ts'),'refined weave textures are missing')
  globalThis.document={createElement:()=>createCanvas(1,1)}
  try {
    const {makeTextileWeave}=await import('../src/three/textileTextures.ts')
    const textures=makeTextileWeave()
    for(const texture of Object.values(textures)) {
      const canvas=texture.image,{width:w,height:h}=canvas,data=canvas.getContext('2d').getImageData(0,0,w,h).data
      for(let x=0;x<w;x++)for(let c=0;c<3;c++)assert.equal(data[x*4+c],data[((h-1)*w+x)*4+c],'periodic circumference has no texture seam')
      const sample=[...data.slice(0,3)]
      for(let y=0;y<h;y++)for(let x=0;x<Math.floor(w*.019);x++)assert.deepEqual([...data.slice((y*w+x)*4,(y*w+x)*4+3)],sample,'trim is free of noisy bump/colour grain')
      texture.dispose()
    }
  }finally{delete globalThis.document}
})
