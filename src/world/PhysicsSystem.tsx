import React, { RefObject, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Object3D } from 'three'
import { SystemProps, useFixedUpdate } from './World'

interface PhysicsContextValue {
  objects: Map<Object3D, PhysicsObjectData>
}

interface PhysicsObjectData {
  acceleration: THREE.Vector3
  velocity: THREE.Vector3
  gravity: THREE.Vector3
  position: THREE.Vector3
  prevPosition: THREE.Vector3
  collider?: THREE.Box3
  collisionType?: 'fixed' | 'dynamic'
}

export const PhysicsContext = React.createContext<PhysicsContextValue>({
  objects: new Map(),
})

export const usePhysics = (
  object: RefObject<Object3D>,
  data: {
    acceleration?: [number, number, number]
    position?: [number, number, number]
    velocity?: [number, number, number]
    gravity?: [number, number, number]
    collisionType?: 'fixed' | 'dynamic'
    collider?: 'auto' | (() => THREE.Box3)
  },
) => {
  const { objects } = React.useContext(PhysicsContext)
  const body = useRef<PhysicsObjectData>()

  function detectCollider(object: Object3D) {
    const localObject = object.clone()
    localObject.position.set(0, 0, 0)
    return new THREE.Box3().setFromObject(localObject)
  }

  useEffect(() => {
    if (!object.current) return

    body.current = {
      position: object.current.position.clone(),
      prevPosition: object.current.position.clone(),
      acceleration: new THREE.Vector3(...(data.acceleration ?? [0, 0, 0])),
      velocity: new THREE.Vector3(...(data.velocity ?? [0, 0, 0])),
      gravity: new THREE.Vector3(...(data.gravity ?? [0, 0, 0])),
      collider:
        data.collider === 'auto'
          ? detectCollider(object.current)
          : data.collider?.(),
      collisionType: data.collisionType ?? 'fixed',
    }
    objects.set(object.current, body.current)

    const self = object.current
    return () => {
      objects.delete(self)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return body
}

export function PhysicsSystem({ priority, children }: SystemProps) {
  const objects = React.useRef<PhysicsContextValue['objects']>(new Map())

  // apply velocities
  useFixedUpdate(
    (delta) => {
      for (const [
        obj,
        {
          position,
          velocity,
          gravity,
          prevPosition,
          acceleration,
          collisionType,
        },
      ] of objects.current) {
        prevPosition.copy(position)

        acceleration.add(gravity)

        velocity.add(acceleration.multiplyScalar(delta))

        position.add(velocity.clone().multiplyScalar(delta))
        position.add(velocity.clone().multiplyScalar(delta))
        acceleration.set(0, 0, 0)
      }
    },
    { priority },
  )

  // handle collisions
  useFixedUpdate(
    () => {
      // Crudely check every object against every other object
      for (const [obj1, physics1] of objects.current) {
        if (!physics1.collider) continue

        for (const [obj2, physics2] of objects.current) {
          if (!physics2.collider || obj1 === obj2) continue

          const positionedCollider1 = physics1.collider
            .clone()
            .translate(physics1.position)

          const positionedCollider2 = physics2.collider
            .clone()
            .translate(physics2.position)

          if (positionedCollider1.intersectsBox(positionedCollider2)) {
            const mtv = getMTV(positionedCollider1, positionedCollider2)

            if (
              physics1.collisionType === 'dynamic' &&
              physics2.collisionType === 'dynamic'
            ) {
              const halfMTV = mtv.clone().multiplyScalar(0.5)

              physics1.position.add(halfMTV)
              physics2.position.sub(halfMTV)
            } else if (
              (physics1.collisionType === 'dynamic' &&
                physics2.collisionType === 'fixed') ||
              (physics1.collisionType === 'fixed' &&
                physics2.collisionType === 'dynamic')
            ) {
              const dynamic =
                physics1.collisionType === 'dynamic' ? physics1 : physics2
              const fixed =
                physics1.collisionType === 'fixed' ? physics1 : physics2

              // Ensure the MTV pushes away from the fixed object
              const direction = dynamic.position
                .clone()
                .sub(fixed.position)
                .normalize()

              if (direction.dot(mtv) < 0) {
                mtv.negate()
              }

              // zero out velocity on the axis of collision if
              // the object is moving into the fixed object
              if (mtv.x && Math.sign(mtv.x) !== Math.sign(dynamic.velocity.x)) {
                dynamic.velocity.x = 0
                dynamic.acceleration.x = 0
              }

              if (mtv.y && Math.sign(mtv.y) !== Math.sign(dynamic.velocity.y)) {
                dynamic.velocity.y = 0
                dynamic.acceleration.y = 0
              }

              if (mtv.z && Math.sign(mtv.z) !== Math.sign(dynamic.velocity.z)) {
                dynamic.velocity.z = 0
                dynamic.acceleration.z = 0
              }

              dynamic.position.add(mtv)
            }
          }
        }
      }
    },
    // ensure this runs after the velocity update
    { priority: priority + 0.1 },
  )

  return (
    <PhysicsContext.Provider value={{ objects: objects.current }}>
      {children}
    </PhysicsContext.Provider>
  )
}

function getMTV(box1: THREE.Box3, box2: THREE.Box3) {
  const min1 = box1.min
  const max1 = box1.max
  const min2 = box2.min
  const max2 = box2.max

  const x = Math.min(max1.x - min2.x, max2.x - min1.x)
  const y = Math.min(max1.y - min2.y, max2.y - min1.y)
  const z = Math.min(max1.z - min2.z, max2.z - min1.z)

  if (x < y && x < z) {
    return new THREE.Vector3(x, 0, 0)
  } else if (y < x && y < z) {
    return new THREE.Vector3(0, y, 0)
  } else {
    return new THREE.Vector3(0, 0, z)
  }
}
