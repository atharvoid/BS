import React from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { TextileSample } from './TextileSample'
import { WheatHead } from './WheatHead'
import { useCategoryMaps } from './CategoryStudio'
import { CRATE, bollCalyx, bollLobes, crateBattens, makeCopperCoil, makeBollLobe, makeVaseBody } from './categoryGeometry'

function PotteryVase() {
  const { pottery, glaze } = useCategoryMaps()
  const body = React.useMemo(makeVaseBody, [])
  React.useEffect(() => () => body.dispose(), [body])

  return (
    <group>
      <mesh geometry={body}>
        <meshStandardMaterial map={pottery} bumpMap={glaze} bumpScale={.0025}
          roughnessMap={glaze} roughness={1} envMapIntensity={1.04} />
      </mesh>
      <mesh position={[0, .659, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[.194, 48]} />
        <meshStandardMaterial color="#66564d" roughness={.93} envMapIntensity={.28} />
      </mesh>
    </group>
  )
}

function CopperCoil() {
  const { copper } = useCategoryMaps()
  const wire = React.useMemo(makeCopperCoil, [])
  const ends = React.useMemo(() => {
    const { path } = wire.parameters
    return [0, 1].map(t => ({
      position: path.getPointAt(t),
      rotation: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), path.getTangentAt(t).multiplyScalar(t ? 1 : -1)),
    }))
  }, [wire])
  React.useEffect(() => () => wire.dispose(), [wire])

  return (
    <group rotation={[.2, 0, 0]}>
      <mesh geometry={wire}>
        <meshStandardMaterial color="#d38c64" metalness={1} roughness={1}
          roughnessMap={copper} bumpMap={copper} bumpScale={.0008} />
      </mesh>
      {ends.map(({ position, rotation }, i) => (
        <mesh key={i} position={position} quaternion={rotation}>
          <circleGeometry args={[wire.parameters.radius, wire.parameters.radialSegments]} />
          <meshStandardMaterial color="#db956e" metalness={1} roughness={.35} />
        </mesh>
      ))}
      {[.24, -.24].map(y => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[.43, .016, 8, 56]} />
          <meshStandardMaterial color="#c19a57" metalness={1} roughness={.36} />
        </mesh>
      ))}
    </group>
  )
}

function CottonBoll() {
  const { lint, cotton, wheat } = useCategoryMaps()
  const lobes = React.useMemo(() => bollLobes(), [])
  const calyx = React.useMemo(() => bollCalyx(), [])
  const lobeGeometry = React.useMemo(() => lobes.map((_, i) => makeBollLobe(i * 2.1)), [lobes])
  const lintMaterial = React.useMemo(() => new THREE.MeshStandardMaterial({
    vertexColors: true, map: lint, bumpMap: cotton, bumpScale: .028, roughnessMap: cotton, roughness: 1,
  }), [lint, cotton])
  const huskMaterial = React.useMemo(() => new THREE.MeshStandardMaterial({
    color: '#917044', bumpMap: wheat, bumpScale: .012, roughness: .96,
  }), [wheat])
  React.useEffect(() => () => {
    lobeGeometry.forEach(geometry => geometry.dispose())
    lintMaterial.dispose()
    huskMaterial.dispose()
  }, [lobeGeometry, lintMaterial, huskMaterial])

  return (
    <group rotation={[.2, 0, -.08]}>
      {lobes.map((lobe, i) => (
        <mesh key={i} geometry={lobeGeometry[i]} material={lintMaterial}
          position={lobe.position} rotation={[0, 0, lobe.rotation]} scale={lobe.scale} />
      ))}
      {calyx.map((sepal, i) => (
        <mesh key={i} material={huskMaterial} position={sepal.position}
          rotation={[sepal.tilt, 0, sepal.rotation]} scale={[.2, .075, .012]}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
      <mesh material={huskMaterial} position={[0, 0, -.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[.028, .038, .34, 10]} />
      </mesh>
    </group>
  )
}

function ExportCrate() {
  const { planks, pine, stencil } = useCategoryMaps()
  const { corners, rails } = React.useMemo(crateBattens, [])
  const boards = React.useMemo(() => {
    const shell = new RoundedBoxGeometry(CRATE.width, CRATE.height, CRATE.depth, 1, .012)
    const upright = new RoundedBoxGeometry(.06, CRATE.height + .03, .06, 1, .007)
    const rail = new RoundedBoxGeometry(CRATE.width + .03, .055, CRATE.depth + .03, 1, .007)
    // Use a single plank from the finish atlas on each batten. Across
    // the rails, the grain runs with their length on all four upright faces.
    for (const geometry of [upright, rail]) {
      const uv = geometry.getAttribute('uv')
      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i), v = uv.getY(i)
        uv.setXY(i, .39 + (geometry === rail ? v : u) * .18, geometry === rail ? u : v)
      }
    }
    return { shell, upright, rail }
  }, [])
  const timber = React.useMemo(() => new THREE.MeshStandardMaterial({
    map: planks, bumpMap: pine, bumpScale: .009, roughnessMap: pine, roughness: 1,
  }), [planks, pine])
  React.useEffect(() => () => {
    Object.values(boards).forEach(geometry => geometry.dispose())
    timber.dispose()
  }, [boards, timber])

  return (
    <group rotation={[.08, 0, 0]}>
      <mesh geometry={boards.shell} material={timber} />
      {corners.map((position, i) => (
        <mesh key={i} geometry={boards.upright} material={timber} position={position} />
      ))}
      {rails.map(y => (
        <mesh key={y} geometry={boards.rail} material={timber} position={[0, y, 0]} />
      ))}
      <mesh position={[0, .02, CRATE.depth / 2 + .003]}>
        <planeGeometry args={[CRATE.width * .86, CRATE.height * .44]} />
        <meshStandardMaterial map={stencil} transparent roughness={.9} depthWrite={false} />
      </mesh>
    </group>
  )
}

export type CategoryMotif = 'textiles' | 'handicrafts' | 'agriculture' | 'industrial' | 'organic' | 'general'

export const CATEGORY_OBJECTS: Record<CategoryMotif, { model: React.ReactNode; speed: number }> = {
  textiles: { model: <TextileSample />, speed: .18 },
  handicrafts: { model: <PotteryVase />, speed: .18 },
  agriculture: { model: <WheatHead />, speed: .18 },
  industrial: { model: <CopperCoil />, speed: .18 },
  organic: { model: <CottonBoll />, speed: .18 },
  general: { model: <ExportCrate />, speed: .18 },
}
