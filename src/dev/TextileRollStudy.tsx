import React from 'react'
import * as THREE from 'three'
import { makeTextileRoll } from '../three/textileGeometry'

export function TextileRollStudy() {
  const geometry=React.useMemo(makeTextileRoll,[])
  const material=React.useMemo(()=>new THREE.MeshStandardMaterial({color:'#a09d96',roughness:.93,metalness:0}),[])
  React.useEffect(()=>()=>{geometry.dispose();material.dispose()},[geometry,material])
  return <mesh name="textile-roll-neutral-study" geometry={geometry} material={material} dispose={null}/>
}
