import { Canvas } from '@react-three/fiber'
import Scene from './scenes/scene'
import { World } from './world/World'
import { EffectComposer } from '@react-three/postprocessing'

export default function App() {
  return (
    <div
      id="canvas-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
      }}
    >
      <Canvas
        shadows
        frameloop="demand"
        dpr={window.devicePixelRatio}
        style={{
          background: 'white',
        }}
      >
        <World>
          <Scene />
        </World>
      </Canvas>
    </div>
  )
}
