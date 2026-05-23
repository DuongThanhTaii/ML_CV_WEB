'use client'

import { PyodideRuntime } from '@/lib/pyodide/runtime'
import { useEffect, useMemo, useState } from 'react'

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error' | 'terminated'

/**
 * Hook into the singleton Pyodide runtime.
 *
 * The returned object is memoized so consumers that destructure
 * `{ runCell, init }` get stable references and can safely put them in
 * useEffect dependency lists.
 */
export function usePyodide() {
  const [status, setStatus] = useState<PyodideStatus>('idle')
  const runtime = PyodideRuntime.get()

  useEffect(() => {
    const off = runtime.onStatus(setStatus)
    return () => {
      off()
    }
  }, [runtime])

  const api = useMemo(
    () => ({
      init: () => runtime.init(),
      runCell: (code: string, opts?: { timeoutMs?: number }) => runtime.runCell(code, opts),
      terminate: () => runtime.terminate(),
      onStream: runtime.onStream.bind(runtime),
    }),
    [runtime],
  )

  return { status, ...api }
}
