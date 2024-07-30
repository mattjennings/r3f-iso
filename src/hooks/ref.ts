/* eslint-disable react-hooks/rules-of-hooks */

/**
 * syntactic sugar for useRef. usage:
 *
 * ```ts
 * const something = ref(0)
 * console.log(something()) // 0
 * ```
 * can be passed as a ref to a component
 *
 * ```jsx
 * <mesh ref={something} />
 * ```
 */
export function ref<T>(initialValue?: T): RefFunction<T> {
  const _ref = useRef<T>(initialValue ?? null!) // makes ts life so much easier assuming refs will be defined
  return useMemo<RefFunction<T>>(() => {
    const fn: any = (initialValue?: T) => {
      // get value when passed in as <el ref={ref} />
      if (initialValue !== undefined) _ref.current = initialValue
      return _ref.current
    }

    Object.defineProperty(fn, 'current', {
      get: () => _ref.current,
      set: (value: T) => {
        _ref.current = value
      },
    })

    fn.set = (value: T | ((prev: T) => T)) => {
      _ref.current = value instanceof Function ? value(_ref.current) : value
    }

    return fn
  }, [])
}

interface RefFunction<T> {
  (): T
  current: T
  set(value: T | ((prev: T) => T)): void
}
