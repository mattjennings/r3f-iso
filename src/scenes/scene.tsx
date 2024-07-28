import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useKeyboard, useKeyDown } from 'src/hooks/input/keyboard'
import { useCollider } from 'src/world/CollisionSystem'
import { useMotion } from 'src/world/MotionSystem'
import * as THREE from 'three'

export default function Scene() {
  return (
    <>
      <Camera />
      <OrbitControls />

      <Player />
      <Floor position={[0, -0.5, 0]} size={10} />
      <Floor position={[-3, 0.5, -3]} size={4} />

      <directionalLight
        ref={(r) => {
          r?.lookAt(0, 0, 0)
        }}
        intensity={1}
        castShadow
        position={[0, 200, 0]}
      />
    </>
  )
}

function Floor({ position, size }) {
  const mesh = useRef<THREE.Mesh>(null)
  useCollider(mesh, { type: 'fixed', useMesh: true })

  return (
    <mesh
      ref={mesh}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      <boxGeometry args={[size, size, 1]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  )
}
function Player() {
  const keymap = useKeyboard()
  const ref = useRef<THREE.Mesh>(null)
  const motion = useMotion(ref, {
    velocity: [0, 0, 0],
    gravity: [0, -9.8, 0],
  })

  useCollider(ref, { type: 'dynamic', useMesh: true })

  useFrame(() => {
    const vel = motion.current!.velocity
    const speed = 5

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

      const normalized = vel.clone().normalize()
      vel.x = normalized.x * speed
      vel.z = normalized.z * speed
    }
  })

  useKeyDown('Space', () => {
    motion.current!.velocity.y = 7
  })

  return (
    <mesh ref={ref} position={[0, 1, 0]} castShadow receiveShadow>
      <boxGeometry attach="geometry" args={[1, 1, 1]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  )
}

function Camera() {
  const camera = useRef<THREE.OrthographicCamera>(null)
  const light = useRef<THREE.DirectionalLight>(null)
  const locked = useRef(true)
  const rotation = useRef(45)

  useFrame((state, delta) => {
    const step = 0.05

    const targetPosition = new THREE.Vector3(0, 0, 0)
    const iso = 30

    if (camera.current) {
      if (locked.current) {
        const radius = 40
        const angle = (rotation.current * Math.PI) / 180
        const x = targetPosition.x + radius * Math.cos(angle)
        const z = targetPosition.y + radius * Math.sin(angle)

        camera.current.position.lerp(
          new THREE.Vector3(x, targetPosition.y + iso, z),
          step,
        )
        camera.current.lookAt(targetPosition)
        camera.current.updateProjectionMatrix()
      }

      if (light.current) {
        light.current.position.set(
          camera.current.position.x - iso / 4,
          camera.current.position.y,
          camera.current.position.z,
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
      <OrthographicCamera ref={camera} makeDefault zoom={40} />
      <directionalLight ref={light} color="white" intensity={2} />
    </>
  )
}
