import { StageScene } from './Stage'
import { GlobeScene } from './GlobeScene'

/* ==========================================================================
   The hero's globe, on its own.

   The globe, its geometry and its generated textures are the largest thing the
   home page draws. Keeping them in a module of their own means `Stage` can load
   them after the hero's own markup — the headline, the lede, both buttons, the
   scroll cue — is already on screen, rather than blocking it.

   Proxied through `StageScene` so the scene mounts inside the live stage and is
   told when to draw and when to stop.
   ========================================================================== */

export default function HeroScene() {
  return <StageScene><GlobeScene /></StageScene>
}
