import { useFrame } from '@react-three/fiber'
import { ISO_ANGLE, IsoCamera, useIsoCamera } from 'src/components/iso-camera'

import { useKeyboard, useKeyDown } from 'src/hooks/input/keyboard'
import { usePhysics } from 'src/world/PhysicsSystem'
import { useFixedUpdate } from 'src/world/World'
import * as THREE from 'three'

export default function Scene() {
  return (
    <>
      <IsoCamera>
        <Player />
        <Floor position={[0, 0, 0]} size={16 * 100} color="green" />
        <Floor position={[-16, 16, -16]} size={16 * 4} />

        <Floor position={[-32, 16, -120]} size={16 * 4} depth={16 * 8} />
        <Floor position={[-32, 16, 120]} size={16 * 4} depth={16 * 8} />
        <Floor position={[120, 16, 0]} size={16 * 4} depth={16 * 8} />
        <Floor position={[-120, 16, 0]} size={16 * 4} depth={16 * 8} />
      </IsoCamera>
    </>
  )
}

function Floor({
  position,
  size,
  color = 'gray',
  depth = 16,
}: {
  position: [number, number, number]
  depth?: number
  size: number
  color?: string
}) {
  const ref = useRef<THREE.Mesh>(null)
  usePhysics(ref, { collider: 'auto', collisionType: 'fixed' })

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <boxGeometry args={[size, size, depth]} />

      <meshStandardMaterial color={color} />
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

  const isoCamera = useIsoCamera()

  useFrame(() => {
    isoCamera.setTarget(ref.current!.position)
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
