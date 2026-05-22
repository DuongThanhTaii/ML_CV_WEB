'use client'

import { useEffect, useState } from 'react'
import { PyodideRuntime } from '@/lib/pyodide/runtime'

/**
 * Subscribe to live stdout/stderr from the Pyodide worker.
 * Use in a console-style component that displays streaming output across cells.
 */
export function usePyodideStream() {
  const [chunks, setChunks] = useState<Array<{ type: 'stdout' | 'stderr'; text: string }>>([])

  useEffect(() => {
    const off = PyodideRuntime.get().onStream((c) => {
      setChunks((s) => [...s.slice(-200), c])
    })
    return () => {
      off()
    }
  }, [])

  function clear() {
    setChunks([])
  }

  return { chunks, clear }
}
