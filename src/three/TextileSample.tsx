import React from 'react'
import * as THREE from 'three'
import { makeTextileSample } from './textileGeometry'
import { useCategoryMaps } from './CategoryStudio'

export function TextileSample() {
  const { weave, weaveHeight, woundEnd } = useCategoryMaps()
  const object=React.useMemo(()=>{
    const cloth = new THREE.MeshPhysicalMaterial({
      vertexColors: true, map: weave, bumpMap: weaveHeight, bumpScale: .0035,
      roughness: .88, sheen: .38, sheenRoughness: .8, sheenColor: '#8996a4',
    })
    const detail = new THREE.MeshStandardMaterial({ vertexColors: true, map: woundEnd, roughness: .92 })
    return { group: makeTextileSample({ cloth, detail }), cloth, detail }
  }, [weave, weaveHeight, woundEnd])
  React.useEffect(()=>()=>{
    object.group.traverse(mesh=>{if((mesh as THREE.Mesh).isMesh)(mesh as THREE.Mesh).geometry.dispose()})
    object.cloth.dispose();object.detail.dispose()
  },[object])
  return <primitive object={object.group} dispose={null}/>
}
