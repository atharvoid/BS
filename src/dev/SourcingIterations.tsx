/* Authoring prototypes only: excluded from the normal website entry. */
import React from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { makeWeaveTexture, makeWeaveBump } from '../three/textures'
import { makeCommoditySamples, disposeSampleModel } from '../three/sourcingGeometry'

export type Iteration = 'swatches' | 'rail' | 'scoops' | 'bowls'
function fabricPanel(width: number, length: number, phase: number, rail = false) {
  const g = new THREE.PlaneGeometry(width, length, 12, 20), p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), t = (.5 - y / length)
    if (rail) {
      // Fabric travels over the rail and falls in two unequal lengths.
      const a = (t - .18) / .16 * Math.PI
      const z = t < .18 ? -.11 : t < .34 ? -.11 * Math.cos(a) : .11 + .015 * Math.sin(t * 6 + phase)
      const yy = t < .18 ? -.30 * (1 - t / .18) : t < .34 ? .11 * Math.sin(a) : -1.08 * (t - .34)
      p.setXYZ(i, x, yy + .018 * Math.sin(x * 13 + phase) * t, z + .045 * Math.sin(x * 12 + phase) * Math.sin(t * Math.PI / 2))
    } else p.setXYZ(i, x + width / 2 - .055, y - length / 2 + .06, .018 * Math.sin(t * 2.5 + phase) * t + .006 * Math.sin(x * 14 + phase) * t * t)
  }
  g.computeVertexNormals();return g
}
function makeTextileIteration(kind: 'swatches' | 'rail') {
  const group = new THREE.Group()
  const map = makeWeaveTexture({size:256,threads:20,repeat:5,warp:'#ece8df',weft:'#d6d0c4',sheen:'#f8f3e9'})
  const bump = makeWeaveBump({size:256,threads:20,repeat:5})
  const colors = ['#ba754e','#d6c4a1','#526975','#293e59']
  if (kind === 'swatches') {
    for(let i=0;i<4;i++) {
      const mesh = new THREE.Mesh(fabricPanel(.65,.99,i),new THREE.MeshStandardMaterial({color:colors[i],map,bumpMap:bump,bumpScale:.006,roughness:.92,side:THREE.DoubleSide}))
      mesh.rotation.z=[-.62,-.30,.02,.33][i];mesh.position.z=i*.07;group.add(mesh)
    }
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.065,.012,6,24),new THREE.MeshStandardMaterial({color:'#b39153',metalness:.65,roughness:.4}))
    ring.position.set(0,.065,.25);ring.rotation.x=.3;group.add(ring)
  } else {
    const metal=new THREE.MeshStandardMaterial({color:'#8c765a',roughness:.7})
    const rail=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,1.58,10),metal);rail.rotation.z=Math.PI/2;rail.position.set(0,.02,0);group.add(rail)
    for(let i=0;i<3;i++) {
      const mesh=new THREE.Mesh(fabricPanel(.44,1.25,i*.7,true),new THREE.MeshStandardMaterial({color:[colors[3],colors[1],colors[2]][i],map,bumpMap:bump,bumpScale:.006,roughness:.92,side:THREE.DoubleSide}))
      mesh.position.set((i-1)*.49,.03,0);group.add(mesh)
    }
    for(const x of [-.77,.77]) {
      const upright=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.95,8),metal);upright.position.set(x,-.43,-.04);group.add(upright)
      const foot=new THREE.Mesh(new THREE.BoxGeometry(.13,.025,.3),metal);foot.position.set(x,-.91,0);group.add(foot)
    }
  }
  return {group,textures:[map,bump]}
}
function makeFoodIteration(kind:'scoops'|'bowls') {
  const group=makeCommoditySamples('stepped'),holder=group.getObjectByName('sample-holder-stepped') as THREE.Mesh
  group.remove(holder);holder.geometry.dispose();(holder.material as THREE.Material).dispose()
  const pieces:THREE.BufferGeometry[]=[]
  for(let i=0;i<3;i++) {
    const shift=new THREE.Vector3(0,-[.05,.25,.45][i] + [0,.035,.015][i],(i===1?-.06:.04))
    group.getObjectByName(`sample-bed-${i}`)!.position.add(shift)
    group.getObjectByName(`sample-grains-${i}`)!.position.add(shift)
    // Closed thin bowl profile: outside up to lip, then inside back to floor.
    const profile=[[.015,-.075],[.12,-.075],[.18,-.04],[.215,.025],[.223,.065],[.211,.065],[.202,.025],[.168,-.027],[.11,-.06],[.015,-.06]].map(([r,y])=>new THREE.Vector2(r,y))
    const bowl=new THREE.LatheGeometry(profile,16)
    // Elliptical sampling vessels fit the actual deterministic grain footprint.
    bowl.scale(1,1,1.28);bowl.translate((i-1)*.49,[0,.035,.015][i],shift.z);pieces.push(bowl)
    if(kind==='scoops') {
      const handle=new THREE.BoxGeometry(.075,.028,.42)
      handle.rotateX(-.22);handle.translate((i-1)*.49,[0,.035,.015][i]+.065,shift.z+.44);pieces.push(handle)
    }
  }
  const vessel=new THREE.Mesh(mergeGeometries(pieces),new THREE.MeshStandardMaterial({color:kind==='scoops'?'#c5bca8':'#d6c5a8',metalness:kind==='scoops'?.35:0,roughness:kind==='scoops'?.55:.85}))
  group.add(vessel);pieces.forEach(p=>p.dispose())
  return {group,textures:[] as THREE.Texture[]}
}
export function SourcingIteration({kind}:{kind:Iteration}) {
  const object=React.useMemo(()=>kind==='swatches'||kind==='rail'?makeTextileIteration(kind):makeFoodIteration(kind),[kind])
  React.useEffect(()=>()=>{disposeSampleModel(object.group);object.textures.forEach(t=>t.dispose())},[object])
  return <primitive object={object.group} dispose={null}/>
}
