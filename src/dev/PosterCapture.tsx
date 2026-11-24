import React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { GlobeScene } from '../three/GlobeScene'
import { ClothPanel, Lights, Studio } from '../three/objects'
import { SceneContext } from '../three/SceneSession'

/* Asset-authoring entry for the still posters shown while a scene loads (or
 * instead of it): the globe on the home page and the cloth on /textiles.
 *
 * Production never imports this. Build with `vite --mode posters`, open
 * ?motif=globe-square or ?motif=cloth, once with ?matte=white and once with
 * ?matte=black, capture each, then run scripts/build-posters.mjs to recover
 * the transparent poster from the two mattes. */

/** Draws a few frames, then reports that the canvas is ready to capture. */
function CaptureReady({ ready }: { ready: () => void }) {
  const frames = React.useRef(0)
  const { gl, scene, camera } = useThree()
  useFrame(() => {
    gl.render(scene, camera)
    if (++frames.current === 3) ready()
  }, 1)
  return null
}

export default function PosterCapture() {
  const [ready, setReady] = React.useState(false)
  const complete = React.useCallback(() => setReady(true), [])
  const params = new URLSearchParams(location.search)
  const motif = params.get('motif') || 'globe-square'
  const globe = motif !== 'cloth'
  const width = innerWidth, height = innerHeight
  return <SceneContext.Provider value={{ id: 'poster', still: true, invalidate: { current: () => {} } }}>
    <div style={{ position: 'fixed', inset: 0, background: params.get('matte') === 'black' ? '#000' : '#fff' }}>
      <output className="visually-hidden">{ready ? 'Capture ready' : 'Preparing capture'}</output>
      <Canvas dpr={1}
        camera={globe ? { position: [0, 0, 7.4], fov: 36 } : { position: [0, 0, 6.2], fov: 36 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.NoToneMapping }}>
        <React.Suspense fallback={null}>
          <Studio />
          {globe
            ? <GlobeScene compact={width / height < 1.5} capture={motif === 'globe-square'} />
            : <><Lights intensity={1.02} /><group scale={.82}><ClothPanel palette="indigo" width={2.15} height={2.7} folds={3.4} seed={3.8} threads={16} /></group></>}
          <CaptureReady ready={complete} />
        </React.Suspense>
      </Canvas>
    </div>
  </SceneContext.Provider>
}
