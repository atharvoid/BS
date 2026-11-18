import React from 'react'
import { MeshStandardMaterial } from 'three'
import { makeWheatHead } from './wheatGeometry'
import { useCategoryMaps } from './CategoryStudio'

export function WheatHead() {
  const { wheat, husk } = useCategoryMaps()
  const geometry = React.useMemo(makeWheatHead, [])
  const material = React.useMemo(() => new MeshStandardMaterial({
    vertexColors: true, map: husk, bumpMap: wheat, bumpScale: .012, roughnessMap: wheat, roughness: 1,
  }), [wheat, husk])
  React.useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  return <mesh name="wheat-head" geometry={geometry} material={material} dispose={null} />
}
