import { OrbitControls, OrthographicCamera, useHelper } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { createContext } from 'react'
import { useKeyDown } from 'src/hooks/input/keyboard'
import { ref } from 'src/hooks/ref'
import * as THREE from 'three'

export const ISO_ANGLE = 55

export function IsoCamera({ children }: { children: React.ReactNode }) {
  const cameraLight = ref<THREE.DirectionalLight>()
  const aboveLight = ref<THREE.DirectionalLight>()
  const locked = ref(true)
  const rotation = ref(45)
  const target = ref(new THREE.Vector3())
  const { camera } = useThree()
  useHelper(cameraLight, THREE.DirectionalLightHelper, 10, 'red')

  useFrame((state, delta) => {
    const camera = state.camera
    const step = 0.05

    if (camera) {
      if (locked()) {
        const radius = 40
        const angle = (rotation() * Math.PI) / 180

        // Calculate the camera position
        const x = target().x + radius * Math.cos(angle)
        const z = target().z + radius * Math.sin(angle)

        const isoAngleRad = (ISO_ANGLE * Math.PI) / 180

        camera.position.copy(
          new THREE.Vector3(x, target().y + radius * Math.sin(isoAngleRad), z),
        )

        // Ensure the camera looks at the target position
        camera.lookAt(target())
        camera.updateProjectionMatrix()
      }
    }

    if (cameraLight()) {
      cameraLight().target.position.set(target().x, target().y, target().z)

      // determine which x/y/z to set based on rotation so that its
      // consistent with the camera position and perspective
      let x, y, z
      const _x = target().x + 100
      const _y = target().y + 400
      const _z = target().z - 400

      if (rotation() > 0 && rotation() < 90) {
        x = _x
        y = _y
        z = _z
      } else if (rotation() > 90 && rotation() < 180) {
        x = -_z
        y = _y
        z = _x
      } else if (rotation() > 180 && rotation() < 270) {
        x = -_x
        y = _y
        z = -_z
      } else {
        x = _z
        y = _y
        z = -_x
      }
      cameraLight().position.set(x, y, z)
    }

    if (aboveLight()) {
      // aboveLight().position.set(target().x, target().y + 200, target().z)
      // aboveLight().lookAt(target())
    }
  }, 999999)

  useKeyDown('Tab', (e) => {
    e.preventDefault()
    locked.current = !locked.current
  })

  useKeyDown('KeyQ', () => {
    rotation.set((prev) => Math.abs((prev + 270) % 360))
  })

  useKeyDown('KeyE', () => {
    rotation.set((prev) => Math.abs((prev + 90) % 360))
  })

  const viewSize = 270
  const aspect = 16 / 9

  const setTarget = useCallback((newTarget: THREE.Vector3) => {
    target().copy(newTarget)
  }, [])

  return (
    <IsoCameraContext.Provider
      value={{
        setTarget,
      }}
    >
      <OrthographicCamera
        makeDefault
        manual
        zoom={1}
        left={(-viewSize * aspect) / 2}
        right={(viewSize * aspect) / 2}
        top={viewSize / 2}
        bottom={-viewSize / 2}
        far={1000}
        near={-1000}
      />
      <OrbitControls enableZoom={true} />

      <ambientLight intensity={0.5} />

      <directionalLight
        ref={cameraLight}
        color="white"
        intensity={5}
        position={[100, 400, -400]}
      />

      {children}
    </IsoCameraContext.Provider>
  )
}

interface IsoCameraContextValue {
  setTarget: (target: THREE.Vector3) => void
}

const IsoCameraContext = createContext<IsoCameraContextValue>(null!)

export function useIsoCamera() {
  return useContext(IsoCameraContext)
}
