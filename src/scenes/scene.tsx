import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useKeyboard, useKeyDown } from 'src/hooks/input/keyboard'
import { usePhysics } from 'src/world/PhysicsSystem'
import { useFixedUpdate } from 'src/world/World'
import * as THREE from 'three'

const ISO_ANGLE = 55

export default function Scene() {
  return (
    <>
      <Camera />
      <OrbitControls enableZoom={false} />

      <Player />
      <Floor position={[0, 0, 0]} size={16 * 10} />
      <Floor position={[-16, -16, -16]} size={16 * 4} />
      <Floor position={[-16, 0, -16]} size={16 * 4} />
      <Floor position={[-16, 16, -16]} size={16 * 4} />

      <directionalLight
        ref={(r) => {
          r?.lookAt(0, 0, 0)
        }}
        intensity={2}
        castShadow
        position={[0, 200, 0]}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
    </>
  )
}

function Floor({
  position,
  size,
}: {
  position: [number, number, number]
  size: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  usePhysics(ref, { collider: 'auto', collisionType: 'fixed' })

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      <boxGeometry args={[size, size, 16]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  )
}

function Player() {
  const keymap = useKeyboard()
  const ref = useRef<THREE.Mesh>(null)
  const physics = usePhysics(ref, {
    position: [0, 32, 0],
    velocity: [0, 0, 0],
    gravity: [0, -300, 0],
    collider: 'auto',
    collisionType: 'dynamic',
  })

  useFixedUpdate(() => {
    const vel = new THREE.Vector3()
    const speed = 100

    if (ref.current) {
      if (keymap['KeyW']) {
        vel.z = -speed
      } else if (keymap['KeyS']) {
        vel.z = speed
      } else {
        vel.z = 0
      }

      if (keymap['KeyA']) {
        vel.x = -speed
      } else if (keymap['KeyD']) {
        vel.x = speed
      } else {
        vel.x = 0
      }

      vel
        .normalize()
        .multiplyScalar(speed)
        // rotate velocity to match ISO_ANGLE
        .applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          (ISO_ANGLE * Math.PI) / (ISO_ANGLE * 4),
        )

      physics.current!.velocity.x = vel.x
      physics.current!.velocity.z = vel.z
    }
  })

  useKeyDown('Space', () => {
    physics.current!.velocity.y = 100
  })

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry attach="geometry" args={[16, 16, 16]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  )
}

function Camera() {
  const light = useRef<THREE.DirectionalLight>(null)
  const locked = useRef(true)
  const rotation = useRef(45)

  useFrame((state, delta) => {
    const camera = state.camera
    const step = 0.05

    const targetPosition = new THREE.Vector3(0, 0, 0)

    if (camera) {
      if (locked.current) {
        const radius = 40
        const angle = (rotation.current * Math.PI) / 180

        // Calculate the camera position
        const x = targetPosition.x + radius * Math.cos(angle)
        const z = targetPosition.z + radius * Math.sin(angle)

        const isoAngleRad = (ISO_ANGLE * Math.PI) / 180

        camera.position.lerp(
          new THREE.Vector3(
            x,
            targetPosition.y + radius * Math.sin(isoAngleRad),
            z,
          ),
          step,
        )

        // Ensure the camera looks at the target position
        camera.lookAt(targetPosition)
        camera.updateProjectionMatrix()
      }

      if (light.current) {
        light.current.position.set(
          camera.position.x - ISO_ANGLE / 4,
          camera.position.y,
          camera.position.z,
        )
        light.current.lookAt(targetPosition)
      }
    }
  })

  useKeyDown('Tab', (e) => {
    e.preventDefault()
    locked.current = !locked.current
  })

  useKeyDown('KeyQ', () => {
    rotation.current -= 90
  })

  useKeyDown('KeyE', () => {
    rotation.current += 90
  })

  return (
    <>
      <directionalLight ref={light} color="white" intensity={2} />
    </>
  )
}
