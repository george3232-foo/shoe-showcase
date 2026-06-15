import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  ScrollControls,
  Scroll,
  Environment,
  ContactShadows,
  Html,
  useProgress,
} from '@react-three/drei'
import { EffectComposer, DepthOfField, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import Shoe from './components/Shoe'
import Overlay from './components/Overlay'
import Background from './components/Background'

const INITIAL_COLORS = {
  laces: '#1a1a1a',
  mesh: '#dddddd',
  caps: '#ffffff',
  inner: '#888888',
  sole: '#ffffff',
  stripes: '#111111',
  band: '#111111',
  patch: '#e02d2d',
}

function Loader() {
  const { progress } = useProgress()
  return <Html center className="loader">{Math.round(progress)}%</Html>
}

export default function App() {
  const [colors, setColors] = useState(INITIAL_COLORS)
  const setColor = useCallback(
    (part, hex) => setColors((c) => ({ ...c, [part]: hex })),
    []
  )

  return (
    <div className="app">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4], fov: 40 }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
          antialias: true,
        }}
      >
        <color attach="background" args={['#0d0d0f']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.6} castShadow />

        <Suspense fallback={<Loader />}>
          <ScrollControls pages={5} damping={0.18}>
            <Background />
            <Shoe colors={colors} />
            <ContactShadows
              position={[0, -0.8, 0]}
              opacity={0.5}
              scale={10}
              blur={2.4}
              far={2}
            />
            <Environment preset="city" />
            <Scroll html>
              <Overlay colors={colors} setColor={setColor} />
            </Scroll>
          </ScrollControls>
        </Suspense>

        {/* shoe stays in focus; petals at other depths fall naturally out of focus */}
        <EffectComposer>
          <DepthOfField
            worldFocusDistance={4}
            worldFocusRange={2.4}
            bokehScale={3.5}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
