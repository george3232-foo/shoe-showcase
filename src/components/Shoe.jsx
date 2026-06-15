/*
  3D shoe model: drcmda/floating-shoe shoe-draco.glb (MIT).
  8 named parts: laces, mesh, caps, inner, sole, stripes, band, patch.
  Scroll (5 pages) drives rotation / scale / pose; colors come from App state.
*/
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useScroll } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'

// BASE_URL prefix so the model loads under the GitHub Pages subpath in prod ('/' in dev)
const MODEL = `${import.meta.env.BASE_URL}models/shoe-draco.glb`

export default function Shoe({ colors }) {
  const group = useRef()
  const { nodes, materials } = useGLTF(MODEL, true)
  const scroll = useScroll()

  // Push colors onto materials each frame (cheap; .set is a no-op if unchanged-ish)
  useFrame((state, delta) => {
    for (const part in colors) {
      if (materials[part]) materials[part].color.set(colors[part])
    }

    const t = state.clock.elapsedTime
    const r0 = scroll.range(0, 1 / 5)        // hero -> rotate showcase
    const r1 = scroll.range(1 / 5, 1 / 5)    // rotate section: full spin
    const r2 = scroll.range(2 / 5, 1 / 5)    // color section: 3/4 tilt
    const r3 = scroll.range(3 / 5, 1 / 5)    // feature/zoom: push in
    const r4 = scroll.range(4 / 5, 1 / 5)    // CTA: settle

    // Target pose blended across sections
    const targetRotY = r0 * 0.6 + r1 * Math.PI * 2 + r2 * 0.4 - r3 * 0.3
    const idleY = Math.sin(t * 0.5) * 0.08
    const targetRotX = -0.15 + r2 * 0.25 - r4 * 0.1
    const float = Math.sin(t * 1.2) * 0.04 * (1 - r3)
    // fit to viewport width: 1 on desktop, shrinks on narrow (portrait/mobile) so the shoe isn't cropped
    const fit = Math.min(1, state.viewport.width / 2.6)
    const targetScale = (1 + r3 * 0.5) * fit  // zoom in on feature section

    easing.damp(group.current.rotation, 'y', targetRotY + idleY, 0.3, delta)
    easing.damp(group.current.rotation, 'x', targetRotX, 0.3, delta)
    easing.damp(group.current.position, 'y', float, 0.3, delta)
    easing.damp3(group.current.scale, targetScale, 0.3, delta)
  })

  return (
    <group ref={group} dispose={null} rotation={[-0.15, 0.5, 0]}>
      <mesh geometry={nodes.shoe.geometry} material={materials.laces} castShadow />
      <mesh geometry={nodes.shoe_1.geometry} material={materials.mesh} castShadow />
      <mesh geometry={nodes.shoe_2.geometry} material={materials.caps} castShadow />
      <mesh geometry={nodes.shoe_3.geometry} material={materials.inner} castShadow />
      <mesh geometry={nodes.shoe_4.geometry} material={materials.sole} castShadow />
      <mesh geometry={nodes.shoe_5.geometry} material={materials.stripes} castShadow />
      <mesh geometry={nodes.shoe_6.geometry} material={materials.band} castShadow />
      <mesh geometry={nodes.shoe_7.geometry} material={materials.patch} castShadow />
    </group>
  )
}

useGLTF.preload(MODEL, true)
