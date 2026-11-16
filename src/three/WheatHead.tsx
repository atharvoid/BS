import React from 'react'
import { MeshStandardMaterial } from 'three'
import { makeWheatHead } from './wheatGeometry'

export function WheatHead() {
  const geometry = React.useMemo(makeWheatHead, [])
  const material = React.useMemo(() => new MeshStandardMaterial({ color: 'white', vertexColors: true, roughness: .90, metalness: 0, emissive: 'black' }), [])
  React.useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  return <mesh name="wheat-head" geometry={geometry} material={material} dispose={null} />
}
