import { useFrame } from '@react-three/fiber'
import React, {
  RefObject,
  useRef,
  useEffect,
  ReactNode,
  useContext,
} from 'react'
import { Object3D } from 'three'
import * as THREE from 'three'
import { MotionContext } from './MotionSystem'

interface CollisionContextValue {
  objects: Map<Object3D, CollisionObjectData>
}

interface CollisionObjectData {
  // only box3 for now
  collider: THREE.Box3
  type: 'fixed' | 'dynamic'
}

const CollisionContext = React.createContext<CollisionContextValue>({
  objects: new Map(),
})

export const useCollider = (
  object: RefObject<Object3D>,
  args: {
    type: 'fixed' | 'dynamic'
    useMesh?: boolean
  },
) => {
  const { objects } = React.useContext(CollisionContext)
  const data = useRef<CollisionObjectData>()
  const collider = useRef<THREE.Box3>()

  useEffect(() => {
    if (!object.current) return

    collider.current = new THREE.Box3().setFromObject(object.current)
    data.current = {
      type: args.type ?? 'fixed',
      collider: collider.current,
    }
    objects.set(object.current, data.current)

    const self = object.current
    return () => {
      objects.delete(self)
    }
  }, [args.type, data, object, objects])

  return data
}

export function CollisionSystem({
  priority,
  children,
}: {
  priority: number
  children: ReactNode
}) {
  const objects = React.useRef<CollisionContextValue['objects']>(new Map())
  const { objects: motionObjects } = useContext(MotionContext)

  function update() {
    // Crudely check every object against every other object
    for (const [obj1, data1] of objects.current) {
      data1.collider.setFromObject(obj1)
      for (const [obj2, data2] of objects.current) {
        if (obj1 === obj2) continue
        data2.collider.setFromObject(obj2)

        if (data1.collider.intersectsBox(data2.collider)) {
          const mtv = getMTV(data1.collider, data2.collider)

          if (data1.type === 'dynamic' && data2.type === 'dynamic') {
            const motion1 = obj1 as THREE.Object3D
            const motion2 = obj2 as THREE.Object3D

            const halfMTV = mtv.clone().multiplyScalar(0.5)

            motion1.position.add(halfMTV)
            motion2.position.sub(halfMTV)
          } else if (
            (data1.type === 'dynamic' && data2.type === 'fixed') ||
            (data1.type === 'fixed' && data2.type === 'dynamic')
          ) {
            const dynamicObj = data1.type === 'dynamic' ? obj1 : obj2
            const fixedObj = data1.type === 'fixed' ? obj1 : obj2

            // Ensure the MTV pushes away from the fixed object
            const direction = dynamicObj.position
              .clone()
              .sub(fixedObj.position)
              .normalize()

            if (direction.dot(mtv) < 0) {
              mtv.negate()
            }

            if (mtv.length() > 0.01) {
              dynamicObj.position.add(mtv)

              if (motionObjects.has(dynamicObj)) {
                // negate the velocity in the direction of the MTV
                const motion = motionObjects.get(dynamicObj)!
                if (mtv.x) {
                  motion.velocity.x = 0
                }

                if (mtv.y) {
                  motion.velocity.y = 0
                }

                if (mtv.z) {
                  motion.velocity.z = 0
                }
              }
            }
          }
        }
      }
    }
  }

  useFrame(update, priority)

  return (
    <CollisionContext.Provider value={{ objects: objects.current }}>
      {children}
    </CollisionContext.Provider>
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
