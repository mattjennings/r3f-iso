import { useRef, useCallback, useEffect } from 'react'

export function useRaf(fn: (delta: number) => void) {
  const fnRef = useRef(fn)
  const lastTime = useRef(performance.now())
  fnRef.current = fn

  const raf = useRef<number>()

  const loop = useCallback((time: number) => {
    const delta = time - lastTime.current
    lastTime.current = time
    fnRef.current(delta / 1000)
    raf.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current!)
  }, [loop])
}
