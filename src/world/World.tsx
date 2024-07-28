import { ReactNode } from 'react'
import { MotionSystem } from './MotionSystem'
import { RenderSystem } from './RenderSystem'
import { CollisionSystem } from './CollisionSystem'

export interface SystemProps {
  priority: number
  children: ReactNode
}

const systems = [MotionSystem, CollisionSystem, RenderSystem]

export function World(props: { children: ReactNode }) {
  // render each system so that they are prioritized in the defined order
  let basePriority = -10000
  return systems.reduceRight((children, System) => {
    return <System priority={--basePriority}>{children}</System>
  }, props.children)
}
