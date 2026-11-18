import React from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CATEGORY_ENVIRONMENT_INTENSITY, CATEGORY_KEY, CATEGORY_RIM } from './category-environment'
import studio from './maps/studio.png'
import husk from './maps/husk.webp'
import weave from './maps/weave.webp'
import weaveHeight from './maps/weave-height.png'
import woundEnd from './maps/wound-end.webp'
import pottery from './maps/pottery.webp'
import glaze from './maps/glaze-surface.png'
import wheat from './maps/wheat-surface.png'
import copper from './maps/copper-surface.png'
import lint from './maps/lint.webp'
import cotton from './maps/cotton-surface.png'
import planks from './maps/planks.webp'
import pine from './maps/pine-surface.png'
import stencil from './maps/stencil.webp'
import contact from './maps/contact.webp'

const urls = { studio, weave, weaveHeight, woundEnd, pottery, glaze, wheat, husk, copper, lint, cotton, planks, pine, stencil, contact }
const colourKeys = new Set(['studio', 'weave', 'woundEnd', 'pottery', 'husk', 'lint', 'planks', 'stencil', 'contact'])
const keys = Object.keys(urls) as (keyof typeof urls)[]
const sources = Object.values(urls)
type Maps = Record<keyof typeof urls, THREE.Texture>
const CategoryMaps = React.createContext<Maps | null>(null)

export function useCategoryMaps() {
  const maps = React.useContext(CategoryMaps)
  if (!maps) throw new Error('Category models require the category studio')
  return maps
}

/** Keep the gallery and canonical poster renders under the same lighting. */
export function CategoryStudio({ children }: { children: React.ReactNode }) {
  const loaded = useLoader(THREE.TextureLoader, sources)
  const scene = useThree(state => state.scene)
  const maps = React.useMemo(() => {
    const result = {} as Maps
    keys.forEach((key, index) => {
      const texture = loaded[index]
      result[key] = texture
      if (texture.name === key) return
      texture.name = key
      texture.colorSpace = colourKeys.has(key) ? THREE.SRGBColorSpace : THREE.NoColorSpace
      texture.anisotropy = 4
      texture.minFilter = THREE.LinearMipmapLinearFilter
      if (key === 'weave' || key === 'weaveHeight') {
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(1, 3)
      }
      if (key === 'studio') {
        texture.flipY = false
        texture.mapping = THREE.EquirectangularReflectionMapping
        texture.generateMipmaps = false
        texture.minFilter = THREE.LinearFilter
      }
      texture.needsUpdate = true
    })
    return result
  }, [loaded])

  React.useLayoutEffect(() => {
    const previous = scene.environment
    const intensity = scene.environmentIntensity
    scene.environment = maps.studio
    scene.environmentIntensity = CATEGORY_ENVIRONMENT_INTENSITY
    return () => { scene.environment = previous; scene.environmentIntensity = intensity }
  }, [scene, maps])

  return (
    <CategoryMaps.Provider value={maps}>
      <directionalLight position={CATEGORY_KEY} intensity={1.78} color="#fff3e4" />
      <directionalLight position={CATEGORY_RIM} intensity={.70} color="#d8e2f5" />
      {children}
    </CategoryMaps.Provider>
  )
}
