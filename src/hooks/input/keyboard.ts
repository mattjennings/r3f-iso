import { useRef, useEffect } from 'react'

export function useKeyboard() {
  const keyMap = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const onDocumentKey = (e: KeyboardEvent) => {
      keyMap.current[e.code] = e.type === 'keydown'
    }
    document.addEventListener('keydown', onDocumentKey)
    document.addEventListener('keyup', onDocumentKey)
    return () => {
      document.removeEventListener('keydown', onDocumentKey)
      document.removeEventListener('keyup', onDocumentKey)
    }
  }, [])

  return keyMap.current
}

export function useKeyDown(
  code: string,
  callback: (ev: KeyboardEvent) => void,
) {
  useEffect(() => {
    const onDocumentKey = (e: KeyboardEvent) => {
      if (e.code === code && e.type === 'keydown') {
        callback(e)
      }
    }
    document.addEventListener('keydown', onDocumentKey)
    return () => {
      document.removeEventListener('keydown', onDocumentKey)
    }
  }, [code, callback])
}

export function useKeyUp(code: string, callback: () => void) {
  useEffect(() => {
    const onDocumentKey = (e: KeyboardEvent) => {
      if (e.code === code && e.type === 'keyup') {
        callback()
      }
    }
    document.addEventListener('keyup', onDocumentKey)
    return () => {
      document.removeEventListener('keyup', onDocumentKey)
    }
  }, [code, callback])
}
