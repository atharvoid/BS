import React from 'react'
import * as THREE from 'three'
import { makeTextileSample } from './textileGeometry'
import { makeTextileWeave, makeWoundEndTexture } from './textileTextures'

export function TextileSample() {
  const object=React.useMemo(()=>{
    const {map,bump}=makeTextileWeave(),end=makeWoundEndTexture()
    const cloth=new THREE.MeshStandardMaterial({color:'white',vertexColors:true,map,bumpMap:bump,bumpScale:.004,roughness:.93,metalness:0})
    const detail=new THREE.MeshStandardMaterial({color:'white',vertexColors:true,map:end,roughness:.96,metalness:0})
    return {group:makeTextileSample({cloth,detail}),map,bump,end,cloth,detail}
  },[])
  React.useEffect(()=>()=>{
    object.group.traverse(mesh=>{if((mesh as THREE.Mesh).isMesh)(mesh as THREE.Mesh).geometry.dispose()})
    object.map.dispose();object.bump.dispose();object.end.dispose();object.cloth.dispose();object.detail.dispose()
  },[object])
  return <primitive object={object.group} dispose={null}/>
}
