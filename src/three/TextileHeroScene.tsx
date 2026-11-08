import React from 'react'
import { useThree } from '@react-three/fiber'
import { useCompactLayout } from '../components/useCompactLayout'
import { StageScene } from './Stage'
import { ClothPanel, Draggable, Ground, Lights, Studio, getTextile } from './objects'

/* ==========================================================================
   The textiles page's 3D, on its own.

   The cloth loads behind the scene boundary. The five flat woven swatches are
   generated ahead of time by scripts/build-swatches.mjs and load as images;
   reading the Fabric Types section never needs this renderer.
   ========================================================================== */

/** The textile hero: one cloth, framed into whichever half of the hero it owns. */
function TextileObject({ aside = false }: { aside?: boolean }) {
  const compact = useCompactLayout()
  const viewport = useThree((s) => s.viewport)
  const narrow = viewport.aspect < 1.2
  // The page-hero canvas only occupies the right-hand column on wide screens,
  // so the object is centred in its own canvas rather than the page.
  const scale = narrow ? 0.82 : Math.min(1, 0.66 + viewport.aspect * 0.16)
  const x = narrow || !aside ? 0 : -Math.min(0.5, viewport.width * 0.04)

  return (
    <>
      <Studio />
      <Lights intensity={1.02} />
      <Ground y={-1.35} scale={4} opacity={0.4} />
      {/* Spinning slowly on its own so the cloth reads as material in motion;
          a drag adds to that angle instead of stopping it. */}
      <Draggable drift={compact ? 0.22 : 0.18} tilt={0.4} float={0.03} spin={compact ? 0 : Math.PI * 2 / 52} yawLimit={compact ? .65 : undefined}>
        <group scale={scale} position={[x, 0, 0]}>
          <ClothPanel palette="verdigris" width={2.15} height={2.7} folds={3.4} seed={3.8} threads={16} />
        </group>
      </Draggable>
    </>
  )
}


export default function TextileHeroScene() {
  return <StageScene><TextileObject /></StageScene>
}
