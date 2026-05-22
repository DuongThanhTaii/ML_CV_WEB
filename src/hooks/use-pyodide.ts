'use client'

import { PyodideRuntime } from '@/lib/pyodide/runtime'
import { useEffect, useState } from 'react'

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error' | 'terminated'

export function usePyodide() {
  const [status, setStatus] = useState<PyodideStatus>('idle')
  const runtime = PyodideRuntime.get()

  useEffect(() => {
    const off = runtime.onStatus(setStatus)
    return () => {
      off()
    }
  }, [runtime])

  return {
    status,
    init: () => runtime.init(),
    runCell: (code: string, opts?: { timeoutMs?: number }) => runtime.runCell(code, opts),
    terminate: () => runtime.terminate(),
    onStream: runtime.onStream.bind(runtime),
  }
}
