import * as THREE from 'three'
import { makeWeaveTexture, makeWeaveBump } from './textures.ts'

/** Reuse the existing weave, with a quiet selvedge and periodic tonal twill. */
export function makeTextileWeave() {
  const map=makeWeaveTexture({size:256,threads:64,repeat:1,warp:'#e1e0d8',weft:'#d2d3ce',sheen:'#f6f5ef'})
  const bump=makeWeaveBump({size:128,threads:32,repeat:1})
  for(const [texture,isColour] of [[map,true],[bump,false]] as const) {
    const canvas=texture.image as HTMLCanvasElement,ctx=canvas.getContext('2d')!,size=canvas.width
    const pixels=ctx.getImageData(0,0,size,size),data=pixels.data
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const i=(y*size+x)*4
      const stripe=Math.floor(x/(size/8)),direction=stripe%2===0?1:-1
      const phase=(y+direction*x)/(size/16)*Math.PI*2
      const tone=1+Math.cos(phase)*(isColour?.035:.025)
      for(let c=0;c<3;c++)data[i+c]=Math.min(255,Math.round(data[i+c]*tone))
      if(x<Math.ceil(size*.019)) {
        const quiet=isColour?[235,232,223]:[128,128,128]
        for(let c=0;c<3;c++)data[i+c]=quiet[c]
      }
    }
    // The first and last circumference rows represent the same thread phase.
    for(let x=0;x<size;x++)for(let c=0;c<3;c++) {
      const top=x*4+c,bottom=((size-1)*size+x)*4+c,mean=Math.round((data[top]+data[bottom])/2)
      data[top]=data[bottom]=mean
    }
    ctx.putImageData(pixels,0,0)
    texture.wrapS=THREE.ClampToEdgeWrapping;texture.wrapT=THREE.RepeatWrapping
    texture.repeat.set(1,3);texture.needsUpdate=true
  }
  return {map,bump}
}

export function makeWoundEndTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128
  const ctx=canvas.getContext('2d')!
  ctx.fillStyle='#647585';ctx.fillRect(0,0,128,128)
  ctx.strokeStyle='rgba(183,189,187,.42)';ctx.lineWidth=.75;ctx.beginPath()
  for(let i=0;i<=480;i++) {
    const t=i/480,r=9+t*53,a=t*Math.PI*2*10,x=64+Math.cos(a)*r,y=64+Math.sin(a)*r
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)
  }
  ctx.stroke()
  const texture=new THREE.CanvasTexture(canvas)
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter
  return texture
}
