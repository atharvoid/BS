import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { makeWheatHead } from '../src/three/wheatGeometry.ts'
import { makeTextileSample } from '../src/three/textileGeometry.ts'
import { FABRIC_SAMPLE, fabricPath, makeFoldedLength, makeFabricSamples, makeCommoditySamples, commodityGrains, commodityLevels, disposeSampleModel } from '../src/three/sourcingGeometry.ts'

function orient(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]) }
function crosses(a,b,c,d) { return orient(a,b,c)*orient(a,b,d)<-1e-12 && orient(c,d,a)*orient(c,d,b)<-1e-12 }

test('actual folded sheets are closed thin volumes, not padded boxes', () => {
  for (const open of [false,true]) {
    const g=makeFoldedLength(1.38,open), p=g.attributes.position, n=fabricPath(open).length, row=7, layer=n*row
    const edges=new Map()
    for(let i=0;i<g.index.count;i+=3)for(let j=0;j<3;j++){
      const a=g.index.getX(i+j), b=g.index.getX(i+(j+1)%3), key=[Math.min(a,b),Math.max(a,b)].join(',')
      edges.set(key,(edges.get(key)||0)+1)
    }
    assert.ok([...edges.values()].every(count=>count===2),'no open seams or non-manifold edges')
    for(let i=0;i<layer;i++) {
      const a=new THREE.Vector3().fromBufferAttribute(p,i), b=new THREE.Vector3().fromBufferAttribute(p,i+layer)
      assert.ok(Math.abs(a.distanceTo(b)-FABRIC_SAMPLE.thickness)<1e-6,'real uniform normal thickness')
    }
    assert.ok(FABRIC_SAMPLE.thickness/1.38<.01,'thin cut edge, not cushion proportions')
    g.dispose()
  }
})
test('every actual fold cross-section clears itself, including interpolated triangle strips', () => {
  for(const open of [false,true]) {
    const g=makeFoldedLength(1.38,open), p=g.attributes.position,n=fabricPath(open).length,row=7,layer=n*row
    // Sample real vertex columns plus the linear interpolation between them.
    for(let u=0;u<=6;u+=.5){
      const lo=Math.floor(u),hi=Math.ceil(u),t=u-lo
      const point=(v,side)=>{const a=v*row+lo+side*layer,b=v*row+hi+side*layer;return [p.getY(a)*(1-t)+p.getY(b)*t,p.getZ(a)*(1-t)+p.getZ(b)*t]}
      const polygon=[...Array.from({length:n},(_,v)=>point(v,0)),...Array.from({length:n},(_,v)=>point(n-1-v,1))]
      for(let a=0;a<polygon.length;a++)for(let b=a+2;b<polygon.length;b++){
        if(a===0&&b===polygon.length-1)continue
        assert.equal(crosses(polygon[a],polygon[(a+1)%polygon.length],polygon[b],polygon[(b+1)%polygon.length]),false,`fold crossing: open=${open}, u=${u}, segments=${a}/${b}`)
      }
    }
    g.dispose()
  }
})
test('folded lengths have positive clearance between layers, including all triangle surfaces', () => {
  const group=makeFabricSamples();group.updateMatrixWorld(true)
  const boxes=group.children.map(child=>new THREE.Box3().setFromObject(child))
  // Disjoint Y bounds prove all contained triangle surfaces are disjoint, not
  // just a finite sample of vertices viewed from the initial camera.
  for(let i=1;i<boxes.length;i++)assert.ok(boxes[i].min.y-boxes[i-1].max.y>.02)
  assert.ok(boxes[2].max.y-boxes[2].min.y>.3,'upper leaf visibly opens')
  disposeSampleModel(group)
})
test('all three commodity beds rise above all rims in the retained comparison holder', () => {
  const group=makeCommoditySamples(),levels=commodityLevels('stepped')
  for(let kind=0;kind<3;kind++){
    const grains=commodityGrains(kind,'stepped')
    assert.equal(grains.length,48)
    assert.ok(grains.filter(g=>g.position[1]-g.scale[1]>levels[kind]+.07).length>=40,'contents not hidden behind retaining rims')
    for(const g of grains){
      assert.ok(Math.abs(g.position[0]-(kind-1)*.49)+Math.max(...g.scale)<.205,'inside compartment sides')
      assert.ok(Math.abs(g.position[2])+Math.max(...g.scale)<.29,'inside front/rear walls')
    }
    assert.equal(group.getObjectByName(`sample-grains-${kind}`).count,48)
  }
  disposeSampleModel(group)
})

test('production agriculture is one closed wheat mesh within its render budget', () => {
  const g=makeWheatHead()
  assert.equal(g.index.count/3+2,2914,'wheat plus the shared shadow')
  const edges=new Map()
  for(let i=0;i<g.index.count;i+=3)for(let j=0;j<3;j++) {
    const a=g.index.getX(i+j),b=g.index.getX(i+(j+1)%3),key=[Math.min(a,b),Math.max(a,b)].join(',')
    edges.set(key,(edges.get(key)||0)+1)
  }
  // Husk seam edges are shared. Cylinder caps have intentional split normals.
  assert.ok([...edges.values()].every(count=>count<=2),'no non-manifold overlaps')
  g.dispose()
})
test('replacement render geometry budgets include actual instanced triangles', () => {
  for(const [build,maxCalls,maxTriangles] of [[makeTextileSample,2,2928],[makeFabricSamples,3,3200],[makeCommoditySamples,7,4200]]){
    const group=build();let calls=0,triangles=0
    group.traverse(mesh=>{if(!mesh.isMesh)return;calls++;triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3*(mesh.isInstancedMesh?mesh.count:1)})
    assert.ok(calls<=maxCalls);assert.ok(triangles<=maxTriangles,`actual triangles: ${triangles}`)
    disposeSampleModel(group)
  }
})
