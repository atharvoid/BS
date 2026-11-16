import React from 'react'
import * as THREE from 'three'
import { makeWeaveBump, makeWeaveTexture } from './textures'
import { FABRIC_COLOURS, makeFabricSamples, makeCommoditySamples, disposeSampleModel, type HolderVariant } from './sourcingGeometry'

export function FabricSamples() {
  const object = React.useMemo(() => {
    // One neutral weave pair shared across the three colourways, not six maps.
    const map = makeWeaveTexture({ size: 256, threads: 16, repeat: 6, warp: '#c9c5b9', weft: '#bbb8ae', sheen: '#e0dcd2' })
    const bump = makeWeaveBump({ size: 256, threads: 16, repeat: 6 })
    const materials = FABRIC_COLOURS.map(color => new THREE.MeshStandardMaterial({ color, map, bumpMap: bump, bumpScale: .012, roughness: .92, metalness: 0, vertexColors: true }))
    const group = makeFabricSamples(materials)
    return { group, map, bump }
  }, [])
  React.useEffect(() => () => { disposeSampleModel(object.group); object.map.dispose(); object.bump.dispose() }, [object])
  return <primitive object={object.group} dispose={null} />
}
export function CommoditySamples({ variant = 'stepped' }: { variant?: HolderVariant }) {
  const object = React.useMemo(() => makeCommoditySamples(variant), [variant])
  React.useEffect(() => () => disposeSampleModel(object), [object])
  return <primitive object={object} dispose={null} />
}
