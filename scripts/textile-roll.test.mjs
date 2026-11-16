import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { frameModel } from '../src/three/framing.ts'

async function factory() {
  const module=await import('../src/three/textileGeometry.ts')
  assert.equal(typeof module.makeTextileRoll,'function','fabric roll factory is missing')
  return module
}
test('the selected textile is a hollow horizontal roll with a short grounded tail inside its render budget', async () => {
  const {makeTextileRoll}=await factory(),g=makeTextileRoll()
  g.computeBoundingBox()
  assert.ok(frameModel(g.boundingBox),'must fit the existing gallery camera')
  assert.ok(g.index.count/3+2<=2930,'roll and shadow stay within the starting textile budget')
  assert.ok(g.userData.parts.some(p=>p.name==='roll-interior'),'the cut end has a real opening')
  assert.ok(g.userData.parts.some(p=>p.name==='draped-tail'))
  for(const [name,side] of [['cut-end-left',-1],['cut-end-right',1]]) {
    const part=g.userData.parts.find(p=>p.name===name),normal=g.attributes.normal
    for(let i=part.start;i<part.start+part.count;i++)assert.ok(side*normal.getX(i)>.9,'cut faces must point out, leaving only the small core hollow')
  }
  g.dispose()
})
test('the actual draped tail is a closed thin volume and no triangle enters the roll', async () => {
  const {makeRollTail}=await factory(),g=makeRollTail(),p=g.attributes.position,index=g.index,edges=new Map()
  for(let i=0;i<index.count;i+=3)for(let k=0;k<3;k++) {
    const a=index.getX(i+k),b=index.getX(i+(k+1)%3),key=[Math.min(a,b),Math.max(a,b)].join(',')
    edges.set(key,(edges.get(key)||0)+1)
  }
  assert.ok([...edges.values()].every(count=>count===2),'the cloth has closed cut edges')
  const origin=new THREE.Vector3(),closest=new THREE.Vector3()
  for(let i=0;i<index.count;i+=3) {
    const vertices=[0,1,2].map(k=>new THREE.Vector3(0,p.getY(index.getX(i+k)),p.getZ(index.getX(i+k))))
    const triangle=new THREE.Triangle(...vertices)
    if(triangle.getArea()>1e-12&&triangle.containsPoint(origin))assert.fail('tail crosses the roll axis')
    for(let k=0;k<3;k++) {
      new THREE.Line3(vertices[k],vertices[(k+1)%3]).closestPointToPoint(origin,true,closest)
      assert.ok(closest.length()>=.42+1e-4,`tail triangle ${i/3} enters the roll`)
    }
  }
  const layer=p.count/2
  for(let i=0;i<layer;i++)assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(p,i).distanceTo(new THREE.Vector3().fromBufferAttribute(p,i+layer))-.008)<1e-6)
  const end=[]
  for(let i=layer-9;i<layer;i++)end.push(p.getY(i)+.42)
  assert.ok(Math.max(...end)<.04&&Math.min(...end)>-.03,'short tail reaches the floor')
  g.dispose()
})

test('the refined sample retains the fall, removes the paper and stays within the existing textile envelope', async () => {
  const module=await factory()
  assert.equal(typeof module.makeTextileSample,'function','detailed fabric-and-paper composition is missing')
  const group=module.makeTextileSample()
  group.updateMatrixWorld(true)
  assert.ok(group.getObjectByName('indigo-fabric-roll'))
  assert.ok(group.getObjectByName('wound-cut-ends'))
  assert.equal(group.getObjectByName('roll-ends-and-kraft-tag'),undefined)
  let calls=1,triangles=2
  group.traverse(mesh=>{if(!mesh.isMesh)return;calls++;triangles+=mesh.geometry.index.count/3;assert.equal(mesh.geometry.attributes.color.count,mesh.geometry.attributes.position.count)})
  assert.ok(calls<=3&&triangles<=2930,`sample cost: ${calls} / ${triangles}`)
  assert.ok(frameModel(new THREE.Box3().setFromObject(group)))
  group.traverse(mesh=>{if(mesh.isMesh){mesh.geometry.dispose();mesh.material.dispose()}})
})

test('the roll and retained tail share their selvedge width and floor', async () => {
  const {makeTextileRoll}=await factory(),g=makeTextileRoll(),p=g.attributes.position
  const body=g.userData.parts.find(p=>p.name==='roll-face'),tail=g.userData.parts.find(p=>p.name==='draped-tail')
  const bounds=part=>new THREE.Box3().setFromPoints(Array.from({length:part.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,part.start+i)))
  const a=bounds(body),b=bounds(tail)
  assert.ok(Math.abs(a.min.x-b.min.x)<.0001&&Math.abs(a.max.x-b.max.x)<.0001,'the selvedges must not step sideways at the attachment')
  assert.ok(Math.abs(a.min.y)<1e-6,'the roll rests on the same floor as the loose end')
  assert.ok(Math.abs(b.min.y)<1e-6,'the loose fabric settles onto the floor')
  g.dispose()
})

test('the rounded rim meets the barrel with matching position, normal and weave phase',async()=>{
  const {makeTextileRoll}=await factory(),g=makeTextileRoll(),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv
  const body=g.userData.parts.find(p=>p.name==='roll-face'),points=new Map()
  const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*100000)).join(',')
  for(let i=body.start;i<body.start+body.count;i++)points.set(key(i),i)
  let joined=0
  for(const part of g.userData.parts.filter(p=>p.name.startsWith('rim-')))for(let i=part.start;i<part.start+part.count;i++) {
    const other=points.get(key(i));if(other===undefined)continue;joined++
    assert.ok(new THREE.Vector3().fromBufferAttribute(n,i).dot(new THREE.Vector3().fromBufferAttribute(n,other))>.9999,'smooth shoulder normal')
    const phase=Math.abs(uv.getY(i)-uv.getY(other))%1
    assert.ok(Math.min(phase,1-phase)<1e-5,'same wrapped thread phase across the rim')
  }
  assert.ok(joined>=128,'both circumference joins are checked')
  g.dispose()
})
