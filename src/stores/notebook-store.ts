import { create } from 'zustand'
import type { CellOutput, NotebookCell } from '@/types/notebook'

type State = {
  cells: NotebookCell[]
  executionCounter: number
}
type Actions = {
  setCells: (c: NotebookCell[]) => void
  addCell: (after?: string, type?: 'code' | 'markdown') => void
  deleteCell: (id: string) => void
  updateSource: (id: string, source: string) => void
  setOutputs: (id: string, outputs: CellOutput[]) => void
  setRunning: (id: string, running: boolean) => void
  incrementExecution: (id: string) => void
}

export const useNotebookStore = create<State & Actions>((set) => ({
  cells: [],
  executionCounter: 0,

  setCells: (cells) => set({ cells }),

  addCell: (after, type = 'code') =>
    set((s) => {
      const newCell: NotebookCell = {
        id: crypto.randomUUID(),
        type,
        source: '',
        outputs: [],
      }
      if (!after) return { cells: [...s.cells, newCell] }
      const idx = s.cells.findIndex((c) => c.id === after)
      const next = [...s.cells]
      next.splice(idx + 1, 0, newCell)
      return { cells: next }
    }),

  deleteCell: (id) =>
    set((s) => ({ cells: s.cells.filter((c) => c.id !== id) })),

  updateSource: (id, source) =>
    set((s) => ({
      cells: s.cells.map((c) => (c.id === id ? { ...c, source } : c)),
    })),

  setOutputs: (id, outputs) =>
    set((s) => ({
      cells: s.cells.map((c) => (c.id === id ? { ...c, outputs } : c)),
    })),

  setRunning: (id, isRunning) =>
    set((s) => ({
      cells: s.cells.map((c) => (c.id === id ? { ...c, isRunning } : c)),
    })),

  incrementExecution: (id) =>
    set((s) => {
      const nextCounter = s.executionCounter + 1
      return {
        executionCounter: nextCounter,
        cells: s.cells.map((c) =>
          c.id === id ? { ...c, executionCount: nextCounter } : c,
        ),
      }
    }),
}))
