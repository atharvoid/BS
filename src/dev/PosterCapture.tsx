import React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { GlobeScene } from '../three/GlobeScene'
import { Exhibit } from '../three/Gallery'
import { ClothPanel, Ground, Lights, Studio } from '../three/objects'
import { SceneContext } from '../three/SceneSession'
import type { CategoryMotif } from '../three/categoryObjects'

/** Asset-authoring entry, excluded from normal production builds. */
function CaptureReady({ready}: {ready: () => void}) {
  const frames = React.useRef(0)
  useFrame(() => { if (++frames.current === 3) ready() })
  return null
}
export default function PosterCapture() {
  const [ready, setReady] = React.useState(false)
  const complete = React.useCallback(() => setReady(true), [])
  const params = new URLSearchParams(location.search)
  const motif = params.get('motif') || 'globe'
  const globe = motif === 'globe'
  const cloth = motif === 'cloth'
  const width = innerWidth, height = innerHeight
  return <SceneContext.Provider value={{id:'poster',still:true,invalidate:{current:()=>{}}}}>
    <div style={{position:'fixed',inset:0,background:params.get('matte') === 'black' ? '#000' : '#fff'}}>
      <output className="visually-hidden">{ready ? 'Capture ready' : 'Preparing capture'}</output>
      <Canvas flat orthographic={!globe && !cloth} dpr={1}
        camera={globe ? {position:[0,0,7.4],fov:36} : cloth ? {position:[0,0,6.2],fov:36} : {position:[0,0,10],zoom:height/2.8}}
        gl={{alpha:true,antialias:true}}>
        <Studio />
        <React.Suspense fallback={null}>{globe ? <GlobeScene compact={width/height < 1.5} /> : cloth ? <><Lights intensity={1.02}/><Ground y={-1.35} scale={4} opacity={.4}/><group scale={.82}><ClothPanel palette="verdigris" width={2.15} height={2.7} folds={3.4} seed={3.8} threads={16}/></group></> : <><Lights intensity={1.05}/><Exhibit motif={motif as CategoryMotif} slot={{motif:motif as CategoryMotif,x:width/2,y:height/2,height,width,visible:true}} pxPerUnit={height/2.8} paused /></>}<CaptureReady ready={complete}/></React.Suspense>
      </Canvas>
    </div>
  </SceneContext.Provider>
}
