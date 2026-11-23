import { SourcingIteration, type Iteration } from './SourcingIterations'
import { WheatHead } from './WheatHead'
import { TextileRollStudy } from './TextileRollStudy'
import { TextileSample } from '../three/TextileSample'
import React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { GlobeScene } from '../three/GlobeScene'
import { Exhibit } from '../three/Gallery'
import { CategoryStudio } from '../three/CategoryStudio'
import { ClothPanel, Lights, Studio } from '../three/objects'
import { SceneContext } from '../three/SceneSession'
import { CommoditySamples } from '../three/SourcingSamples'
import { CATEGORY_OBJECTS } from '../three/categoryObjects'
import type { CategoryMotif } from '../three/categoryObjects'

/** Asset-authoring entry, excluded from normal production builds. */
const preparationStart = performance.now()
function CaptureReady({ready}: {ready: () => void}) {
  const frames = React.useRef(0)
  const { gl, scene, camera } = useThree()
  useFrame(() => {
    gl.render(scene, camera)
    if (++frames.current !== 3) return
    const geometries = new Set<THREE.BufferGeometry>()
    const textures = new Set<THREE.Texture>()
    let meshes = 0, instances = 0
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      meshes++
      if ((mesh as THREE.InstancedMesh).isInstancedMesh) instances += (mesh as THREE.InstancedMesh).count
      geometries.add(mesh.geometry)
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value)
      }
    })
    let textureBytes = 0
    for (const tex of textures) {
      const image = tex.image as {width?: number; height?: number} | undefined
      textureBytes += (image?.width || 0) * (image?.height || 0) * 4 * (tex.generateMipmaps ? 4 / 3 : 1)
    }
    const metrics = {
      preparationMs: performance.now() - preparationStart,
      calls: gl.info.render.calls, triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries, textures: gl.info.memory.textures,
      modelGeometries: geometries.size, meshes, instances,
      vertices: [...geometries].reduce((n,g) => n + g.getAttribute('position').count, 0),
      materialTextureBytesEstimate: Math.round(textureBytes),
      width: gl.domElement.width, height: gl.domElement.height,
      camera: {zoom:(camera as THREE.OrthographicCamera).zoom},
      initialRotation: [0.05, 0.7, 0],
    }
    Object.assign(window, {__MODEL_METRICS: metrics})
    ready()
  }, 1)
  return null
}
/** Studio-only inspection. Production never imports this entry. */
function InspectModel({ motif, params }: { motif: string; params: URLSearchParams }) {
  const { scene, gl, camera } = useThree()
  // Export directly after drawing so transparent edges and the canonical
  // camera match the gallery without screen grabs or wall-clock timing.
  React.useEffect(() => {
    if (!params.has('turntable')) return
    const capture = (yaw: number) => {
      const model = scene.getObjectByName(`category-spin-${motif}`)
      if (!model) throw new Error('Category model has not been framed yet')
      model.rotation.y = yaw
      gl.render(scene, camera)
      return gl.domElement.toDataURL('image/png')
    }
    const host = window as Window & { captureTurntablePose?: typeof capture }
    host.captureTurntablePose = capture
    return () => { delete host.captureTurntablePose }
  }, [params, motif, scene, gl, camera])
  React.useLayoutEffect(() => {
    if (!params.has('neutral') && !params.has('mask')) return
    const clones: THREE.Material[] = []
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      if (params.has('mask')) {
        const colour = mesh.name.startsWith('sample-bed-') || mesh.name.startsWith('sample-grains-') ? '#00ff00' : '#ffffff'
        const mat = new THREE.MeshBasicMaterial({ color: colour }); mesh.material = mat; clones.push(mat)
      } else {
        const original = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
        if (!(original instanceof THREE.MeshStandardMaterial)) return
        const mat = new THREE.MeshStandardMaterial({ color: '#aaa69c', roughness: .9 }); mesh.material = mat; clones.push(mat)
      }
    })
    return () => clones.forEach(m => m.dispose())
  }, [scene])
  useFrame(() => {
    const spin = scene.getObjectByName(`category-spin-${motif}`)
    if (spin && params.has('yaw')) spin.rotation.y = Number(params.get('yaw'))
  }, .5)
  return null
}
export default function PosterCapture() {
  const [ready, setReady] = React.useState(false)
  const complete = React.useCallback(() => setReady(true), [])
  const params = new URLSearchParams(location.search)
  const motif = params.get('motif') || 'globe'
  if (motif === 'agriculture' && params.has('variant')) CATEGORY_OBJECTS.agriculture.model = <CommoditySamples variant={params.get('variant') === 'shallow' ? 'shallow' : 'stepped'} />
  const iteration = params.get('iteration')
  if (motif === 'textiles' && iteration === 'fabric-roll') CATEGORY_OBJECTS.textiles.model = <TextileRollStudy />
  if (motif === 'textiles' && iteration === 'fabric-sample') CATEGORY_OBJECTS.textiles.model = <TextileSample />
  if (motif === 'agriculture' && iteration === 'wheat') CATEGORY_OBJECTS.agriculture.model = <WheatHead />
  if (iteration && ['swatches','rail','scoops','bowls'].includes(iteration) && (motif === 'textiles' || motif === 'agriculture')) CATEGORY_OBJECTS[motif].model = <SourcingIteration kind={iteration as Iteration} />
  const square = motif === 'globe-square'
  const globe = motif === 'globe' || square
  const cloth = motif === 'cloth'
  const category = !globe && !cloth
  const width = innerWidth, height = innerHeight
  return <SceneContext.Provider value={{id:'poster',still:true,invalidate:{current:()=>{}}}}>
    <div style={{position:'fixed',inset:0,background:params.get('matte') === 'black' ? '#000' : '#fff'}}>
      <output className="visually-hidden">{ready ? 'Capture ready' : 'Preparing capture'}</output>
      <Canvas orthographic={category} dpr={1}
        camera={globe ? {position:[0,0,7.4],fov:36} : cloth ? {position:[0,0,6.2],fov:36} : {position:[0,0,10],zoom:height/2.8}}
        gl={{alpha:true,antialias:true,toneMapping:category ? THREE.NeutralToneMapping : THREE.NoToneMapping}}>
        <React.Suspense fallback={null}>
          {category ? (
            <CategoryStudio>
              <Exhibit motif={motif as CategoryMotif} slot={{motif:motif as CategoryMotif,x:width/2,y:height/2,height,width,visible:true}} pxPerUnit={height/2.8} paused />
              <InspectModel motif={motif} params={params}/>
              <CaptureReady ready={complete}/>
            </CategoryStudio>
          ) : (
            <>
              <Studio />
              {globe ? <GlobeScene compact={width/height < 1.5} capture={square} /> : <><Lights intensity={1.02}/><group scale={.82}><ClothPanel palette="indigo" width={2.15} height={2.7} folds={3.4} seed={3.8} threads={16}/></group></>}
              <InspectModel motif={motif} params={params}/>
              <CaptureReady ready={complete}/>
            </>
          )}
        </React.Suspense>
      </Canvas>
    </div>
  </SceneContext.Provider>
}
