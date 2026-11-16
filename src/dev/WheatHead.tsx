import React from 'react'
import { makeWheatHead } from '../three/wheatGeometry'

export function WheatHead() {
  const geometry = React.useMemo(makeWheatHead, [])
  React.useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh name="wheat-head-study" geometry={geometry}>
    <meshStandardMaterial color="#a09d96" roughness={.92} metalness={0} />
  </mesh>
}
