import { useFrame, useThree } from '@react-three/fiber'
import type { SystemProps } from './World'

export function RenderSystem({ priority, children }: SystemProps) {
  const { invalidate, get } = useThree()

  useFrame(() => {
    const { gl, scene, camera } = get()

    invalidate()
    gl.render(scene, camera)
  }, priority)

  return children
}
