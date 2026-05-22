export type CellType = 'code' | 'markdown'

export interface CellOutput {
  type: 'stdout' | 'stderr' | 'result' | 'image' | 'dataframe' | 'plotly' | 'error'
  data: string
  mime?: string
}

export interface NotebookCell {
  id: string
  type: CellType
  source: string
  outputs: CellOutput[]
  executionCount?: number | null
  isRunning?: boolean
}

export interface RunResult {
  outputs: CellOutput[]
  executionTimeMs: number
  error?: { name: string; message: string; traceback: string }
}

export interface PyodideWorkerMessage {
  id: string
  type: 'init' | 'run' | 'install' | 'reset' | 'ready' | 'output' | 'done' | 'error' | 'stdout' | 'stderr'
  payload?: unknown
}
