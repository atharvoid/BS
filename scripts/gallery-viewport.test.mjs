import test from 'node:test'
import assert from 'node:assert/strict'
import {galleryViewport,reallocatedDpr} from '../src/three/gallery-viewport.ts'

test('six docked models share a tight surface rather than a full-screen buffer',()=>{
 const slots=Array.from({length:6},(_,i)=>({x:120+i*240,y:820,width:140,height:140,visible:true}))
 const v=galleryViewport(slots,1440,900)
 assert.ok(v.width<=1440&&v.height<180)
 for(const s of slots){assert.ok(s.x-s.width/2>=v.x);assert.ok(s.x+s.width/2<=v.x+v.width);assert.ok(s.y-s.height/2>=v.y)}
})
test('cropping preserves exact screen coordinates through the orthographic camera',()=>{
 const v=galleryViewport([{x:260,y:400,width:500,height:500,visible:true}],1440,900),ppu=100
 const original=[(260-1440/2)/ppu,(900/2-400)/ppu]
 const cropped=[(260-v.x-v.width/2)/ppu,(v.height/2-(400-v.y))/ppu]
 const project=(world,extent,origin,flip=false)=>(flip?extent/2-world*ppu:world*ppu+extent/2)+origin
 assert.ok(Math.abs(project(original[0],1440,0)-project(cropped[0],v.width,v.x))<1e-9)
 assert.ok(Math.abs(project(original[1],900,0,true)-project(cropped[1],v.height,v.y,true))<1e-9)
})
test('sharper cropped output never asks for more backing pixels than before',()=>{
 for(const [w,h,old] of [[1440,900,1.5],[2880,1800,.76],[1920,1080,1],[1440,900,2]]){
  for(const [cw,ch] of [[w,160],[600,600],[w,h]]){
   const d=reallocatedDpr(3,old,w,h,cw,ch)
   assert.ok(cw*ch*d*d<=w*h*old*old+1e-6)
  }
 }
})
test('hidden letterboxes do not inflate the crop; empty startup stays finite',()=>{
 const shown={x:150,y:150,width:200,height:200,visible:true}
 assert.deepEqual(galleryViewport([shown,{x:1400,y:800,width:500,height:500,visible:false}],1440,900),galleryViewport([shown],1440,900))
 assert.deepEqual(galleryViewport([],0,0),{x:0,y:0,width:1,height:1})
})
