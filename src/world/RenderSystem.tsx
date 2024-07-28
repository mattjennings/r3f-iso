import { useThree } from '@react-three/fiber'
import { useCallback, useContext } from 'react'
import * as THREE from 'three'
import { PhysicsContext } from './PhysicsSystem'
import { useWorld, type SystemProps } from './World'
import { useRaf } from 'src/hooks/render/useRaf'

export function RenderSystem({ priority, children }: SystemProps) {
  const { get } = useThree()
  const physicsSystem = useContext(PhysicsContext)
  const world = useWorld()

  const render = useCallback(() => {
    const { gl, scene, camera, invalidate } = get()
    invalidate()
    gl.render(scene, camera)
  }, [get])

  useRaf((delta) => {
    const blend = world.getFrameInterpolation()

    for (const [object, data] of physicsSystem.objects) {
      // since physics system is running in a fixed step,
      // interpolate the positions between frames
      const interpolatedPosition = new THREE.Vector3().lerpVectors(
        data.prevPosition,
        data.position,
        blend,
      )

      object.position.copy(interpolatedPosition)
    }

    render()
  })

  return children
}
