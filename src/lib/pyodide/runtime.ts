import type { CellOutput, RunResult } from '@/types/notebook'

type Status = 'idle' | 'loading' | 'ready' | 'running' | 'error' | 'terminated'

type StatusListener = (s: Status) => void
type StreamListener = (chunk: { type: 'stdout' | 'stderr'; text: string }) => void

export class PyodideRuntime {
  private worker: Worker | null = null
  private status: Status = 'idle'
  private ready: Promise<void> | null = null
  private statusListeners = new Set<StatusListener>()
  private streamListeners = new Set<StreamListener>()
  private pending: Map<
    string,
    { resolve: (r: RunResult) => void; reject: (e: Error) => void; outputs: CellOutput[]; timeout: ReturnType<typeof setTimeout> }
  > = new Map()

  static instance: PyodideRuntime | null = null
  static get(): PyodideRuntime {
    if (!this.instance) this.instance = new PyodideRuntime()
    return this.instance
  }

  onStatus(l: StatusListener) {
    this.statusListeners.add(l)
    l(this.status)
    return () => this.statusListeners.delete(l)
  }
  onStream(l: StreamListener) {
    this.streamListeners.add(l)
    return () => this.streamListeners.delete(l)
  }

  private setStatus(s: Status) {
    this.status = s
    this.statusListeners.forEach((l) => l(s))
  }

  init(): Promise<void> {
    if (this.ready) return this.ready
    this.setStatus('loading')
    this.worker = new Worker(new URL('./worker.ts', import.meta.url))
    this.worker.onmessage = this.handleMessage.bind(this)
    this.worker.onerror = (e) => {
      this.setStatus('error')
      console.error('[pyodide worker]', e)
    }

    this.ready = new Promise<void>((resolve, reject) => {
      const id = crypto.randomUUID()
      const timer = setTimeout(() => reject(new Error('Pyodide init timeout (60s)')), 60_000)
      const onReady = (e: MessageEvent) => {
        if (e.data.type === 'ready') {
          clearTimeout(timer)
          this.worker!.removeEventListener('message', onReady)
          this.setStatus('ready')
          resolve()
        }
      }
      this.worker!.addEventListener('message', onReady)
      this.worker!.postMessage({ id, type: 'init' })
    })

    return this.ready
  }

  async runCell(code: string, opts: { timeoutMs?: number } = {}): Promise<RunResult> {
    await this.init()
    const id = crypto.randomUUID()
    const timeoutMs = opts.timeoutMs ?? 30_000

    return new Promise<RunResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        this.terminate()
        reject(new Error(`Execution timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      this.pending.set(id, { resolve, reject, outputs: [], timeout })
      this.setStatus('running')
      this.worker!.postMessage({ id, type: 'run', payload: { code } })
    })
  }

  private handleMessage(e: MessageEvent) {
    const { id, type, payload } = e.data
    if (!id) return

    const entry = this.pending.get(id)

    if (type === 'stdout' || type === 'stderr') {
      const chunk = { type, text: payload.text as string }
      this.streamListeners.forEach((l) => l(chunk))
      if (entry) entry.outputs.push({ type, data: payload.text })
      return
    }

    if (type === 'output') {
      if (entry) entry.outputs.push(payload.output as CellOutput)
      return
    }

    if (type === 'done') {
      if (!entry) return
      clearTimeout(entry.timeout)
      const merged = [...entry.outputs, ...((payload.outputs as CellOutput[]) ?? [])]
      this.pending.delete(id)
      this.setStatus('ready')
      entry.resolve({ outputs: merged, executionTimeMs: payload.executionTimeMs ?? 0 })
      return
    }

    if (type === 'error') {
      if (!entry) return
      clearTimeout(entry.timeout)
      this.pending.delete(id)
      this.setStatus('ready')
      entry.outputs.push({
        type: 'error',
        data: `${payload.name ?? 'Error'}: ${payload.message ?? ''}\n${payload.traceback ?? ''}`,
      })
      entry.resolve({
        outputs: entry.outputs,
        executionTimeMs: payload.executionTimeMs ?? 0,
        error: {
          name: payload.name ?? 'Error',
          message: payload.message ?? '',
          traceback: payload.traceback ?? '',
        },
      })
      return
    }
  }

  terminate() {
    this.worker?.terminate()
    this.worker = null
    this.ready = null
    this.pending.forEach(({ reject, timeout }) => {
      clearTimeout(timeout)
      reject(new Error('Worker terminated'))
    })
    this.pending.clear()
    this.setStatus('terminated')
  }
}
