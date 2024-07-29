import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { RenderSystem } from './RenderSystem'
import { PhysicsSystem } from './PhysicsSystem'
import { useRaf } from 'src/hooks/render/useRaf'

export interface SystemProps {
  priority: number
  children: ReactNode
}

const systems = [PhysicsSystem, RenderSystem]
const FIXED_UPDATE_FPS = 60

export function World(props: { children: ReactNode }) {
  let baseSystemPriority = -10000

  const accumulator = useRef(0)
  const preFns = useRef<RegisteredCallback[]>([])
  const fns = useRef<RegisteredCallback[]>([])
  const postFns = useRef<RegisteredCallback[]>([])

  const registerUpdateFn: WorldValue['registerUpdateFn'] = useCallback(
    (fn, { type, priority } = {}) => {
      const arr = type === 'pre' ? preFns : type === 'post' ? postFns : fns
      const item = { fn, priority: priority ?? 0 }
      arr.current.push(item)
      arr.current.sort((a, b) => a.priority - b.priority)
      return () => {
        const idx = arr.current.indexOf(item)
        if (idx >= 0) arr.current.splice(idx, 1)
      }
    },
    [],
  )

  useRaf((delta) => {
    accumulator.current = Math.min(
      accumulator.current + delta,
      // cap out at 60 frames as to avoid a large amount of updates queuing up
      (1 / FIXED_UPDATE_FPS) * 60,
    )

    const fixedDelta = 1 / FIXED_UPDATE_FPS

    while (accumulator.current >= fixedDelta) {
      for (const { fn } of preFns.current) fn(fixedDelta)
      for (const { fn } of fns.current) fn(fixedDelta)
      for (const { fn } of postFns.current) fn(fixedDelta)

      accumulator.current -= fixedDelta
    }
  })

  return (
    <WorldContext.Provider
      value={{
        registerUpdateFn,
        getFrameInterpolation: useCallback(
          () => accumulator.current / (1 / FIXED_UPDATE_FPS),
          [],
        ),
        fixedUpdateFps: FIXED_UPDATE_FPS,
      }}
    >
      {/* render each system so that they are prioritized in the defined order */}
      {systems.reduceRight(
        (children, System) => (
          <System priority={--baseSystemPriority}>{children}</System>
        ),
        props.children,
      )}
    </WorldContext.Provider>
  )
}

export function useFixedUpdate(
  fn: RenderCallback,
  args: { type?: 'pre' | 'post'; priority?: number } = {},
) {
  const { registerUpdateFn } = useContext(WorldContext)
  useEffect(() => registerUpdateFn(fn, args), [fn, args, registerUpdateFn])
}

export const useWorld = () => useContext(WorldContext)

const WorldContext = createContext<WorldValue>(null!)

type RenderCallback = (delta: number) => void
type RegisteredCallback = {
  fn: RenderCallback
  priority: number
}

interface WorldValue {
  registerUpdateFn: (
    fn: RenderCallback,
    args: {
      type?: 'pre' | 'post'
      priority?: number
    },
  ) => () => void
  getFrameInterpolation: () => number
  fixedUpdateFps: number
}
