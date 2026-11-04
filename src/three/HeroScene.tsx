import React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { ClothPanel, Draggable, Lights, Studio, PALETTES, getTextile } from './objects'
import { makeCloth } from './geometry'

/* ==========================================================================
   Hero composition: two hanging cloths, a floating brass ring and a pair of
   folded swatches. Each is separately draggable.
   ========================================================================== */

function Frame({ children }: { children: React.ReactNode }) {
  const viewport = useThree((s) => s.viewport)
  const narrow = viewport.aspect < 0.92
  const scale = narrow ? 0.62 : Math.min(1, 0.62 + viewport.aspect * 0.19)
  const x = narrow ? 0 : Math.min(1.75, viewport.width * 0.185)
  const y = narrow ? 0.32 : 0

  return (
    <group scale={scale} position={[x, y, 0]}>
      {children}
    </group>
  )
}

/** A folded swatch of cloth, fanned like a hanger sample. */
function Swatch({
  palette,
  position,
  rotation,
  width = 0.74,
  height = 0.72,
  seed = 2.1,
}: {
  palette: keyof typeof PALETTES
  position: [number, number, number]
  rotation: [number, number, number]
  width?: number
  height?: number
  seed?: number
}) {
  const geo = React.useMemo(
    () => makeCloth({ width, height, folds: 1.6, seed, foldDepth: 0.05, sway: 0.03, curl: 0.04, taper: 0.02 }),
    [width, height, seed],
  )
  const tex = React.useMemo(() => getTextile(palette, 20), [palette])
  return (
    <mesh geometry={geo} position={position} rotation={rotation}>
      <meshStandardMaterial
        map={tex.map}
        bumpMap={tex.bump}
        bumpScale={1.6}
        roughness={0.9}
        metalness={0.02}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Thin brass rod the swatches hang from. */
function HangingRod() {
  return (
    <group position={[-0.68, 0.95, 0.9]} rotation={[0, 0.36, 0.08]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 1.5, 12]} />
        <meshStandardMaterial color="#bb8a48" roughness={0.3} metalness={1} envMapIntensity={1.5} />
      </mesh>
      {[-0.5, 0.5].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
          <sphereGeometry args={[0.04, 16, 12]} />
          <meshStandardMaterial color="#d6a55f" roughness={0.22} metalness={1} />
        </mesh>
      ))}
    </group>
  )
}

export function HeroScene({ onEngage }: { onEngage?: () => void }) {
  return (
    <>
      <Studio />
      <Lights intensity={1.05} />
      <Frame>
        {/* back cloth — madder, set behind and turned away */}
        <group position={[-1.18, 0.1, -1.15]} rotation={[0, 0.42, 0.05]}>
          <ClothPanel palette="madder" width={2.1} height={3.15} folds={2.4} seed={4.2} threads={12} opacity={0.96} />
        </group>

        {/* front cloth — indigo, the main draggable object */}
        <Draggable drift={0.17} tilt={0.4} float={0.03} onEngage={onEngage}>
          <group position={[0.12, 0, 0.2]} rotation={[0.02, -0.1, 0]}>
            <ClothPanel palette="indigo" width={2.35} height={3.25} folds={3.5} seed={1.2} threads={16} />
          </group>
        </Draggable>

        {/* brass ring, floating front-right */}
        <Draggable drift={0.24} tilt={0.5} float={0.06} squash={0.6} onEngage={onEngage}>
          <group position={[1.42, 0.62, 1.05]} rotation={[-0.2, 0.3, 0.1]} scale={0.4}>
            <mesh rotation={[Math.PI / 2.15, 0, 0]}>
              <torusGeometry args={[0.62, 0.085, 24, 96]} />
              <meshStandardMaterial color="#c08d4a" roughness={0.24} metalness={1} envMapIntensity={1.7} />
            </mesh>
            <mesh rotation={[Math.PI / 2.15, 0, 0]} scale={0.66}>
              <torusGeometry args={[0.62, 0.045, 16, 80]} />
              <meshStandardMaterial color="#8e6631" roughness={0.4} metalness={1} />
            </mesh>
          </group>
        </Draggable>

        {/* folded swatches on a rod */}
        <Draggable drift={0.28} tilt={0.46} float={0.045} squash={0.7} onEngage={onEngage}>
          <group position={[0.1, 0, 0]}>
            <HangingRod />
            {[
              { palette: 'saffron' as const, x: -1.02, z: 0.9, rot: [0.05, 0.46, 0.13], seed: 3.3 },
              { palette: 'verdigris' as const, x: -0.22, z: 1.0, rot: [0.02, 0.34, -0.05], seed: 5.1 },
              { palette: 'cotton' as const, x: 0.58, z: 1.06, rot: [0.03, 0.22, 0.04], seed: 6.6 },
            ].map((sw) => (
              <group key={sw.palette}>
                <Swatch
                  palette={sw.palette}
                  position={[sw.x, 0.56, sw.z]}
                  rotation={sw.rot as [number, number, number]}
                  seed={sw.seed}
                />
                {/* brass clip, so the swatch reads as hanging rather than floating */}
                <mesh position={[sw.x, 0.9, sw.z - 0.01]} rotation={[0.1, 0.36, 0.08]}>
                  <boxGeometry args={[0.06, 0.11, 0.035]} />
                  <meshStandardMaterial color="#c08d4a" roughness={0.28} metalness={1} envMapIntensity={1.6} />
                </mesh>
              </group>
            ))}
          </group>
        </Draggable>
      </Frame>
    </>
  )
}
