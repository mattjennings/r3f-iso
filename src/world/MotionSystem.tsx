import { useFrame } from '@react-three/fiber'
import React, { RefObject, useRef, useEffect, ReactNode } from 'react'
import { Object3D } from 'three'
import * as THREE from 'three'
import { SystemProps } from './World'

interface MotionContextValue {
  objects: Map<Object3D, MotionObjectData>
}

interface MotionObjectData {
  velocity: THREE.Vector3
  gravity: {
    disabled: boolean
    force: THREE.Vector3
  }
}

export const MotionContext = React.createContext<MotionContextValue>({
  objects: new Map(),
})

export const useMotion = (
  object: RefObject<Object3D>,
  data: {
    velocity?: [number, number, number]
    gravity?:
      | [number, number, number]
      | {
          disabled: boolean
          force: [number, number, number]
        }
  },
) => {
  const { objects } = React.useContext(MotionContext)
  const motion = useRef<MotionObjectData>()

  useEffect(() => {
    if (!object.current) return

    motion.current = {
      velocity: new THREE.Vector3(...(data.velocity ?? [0, 0, 0])),
      gravity: Array.isArray(data.gravity)
        ? {
            disabled: false,
            force: new THREE.Vector3(...data.gravity),
          }
        : {
            disabled: data.gravity?.disabled ?? false,
            force: new THREE.Vector3(...(data.gravity?.force ?? [0, 0, 0])),
          },
    }
    objects.set(object.current, motion.current)

    const self = object.current
    return () => {
      objects.delete(self)
    }
  }, [data, data.gravity, data.velocity, object, objects])

  return motion
}

export function MotionSystem({ priority, children }: SystemProps) {
  const objects = React.useRef<MotionContextValue['objects']>(new Map())

  useFrame((_, delta) => {
    const scratch = new THREE.Vector3()
    for (const [object, { velocity, gravity }] of objects.current) {
      scratch.set(0, 0, 0)

      if (!gravity.disabled) {
        velocity.add(gravity.force.clone().multiplyScalar(delta))
      }

      // scratch.add(gravity.force.clone().multiplyScalar(delta))
      scratch.add(velocity.clone().multiplyScalar(delta))

      object.position.add(scratch)
    }
  }, priority)

  return (
    <MotionContext.Provider value={{ objects: objects.current }}>
      {children}
    </MotionContext.Provider>
  )
}
