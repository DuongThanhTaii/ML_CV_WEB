'use client'

import { useEffect, useRef } from 'react'
import { useNotebookStore } from '@/stores/notebook-store'
import { Cell } from './cell'
import { NotebookToolbar } from './toolbar'
import type { NotebookCell } from '@/types/notebook'

interface NotebookProps {
  initialCells?: NotebookCell[]
  onChange?: (cells: NotebookCell[]) => void
}

export function Notebook({ initialCells, onChange }: NotebookProps) {
  // Stable selectors — actions are referentially stable in Zustand,
  // so subscribing to each one individually avoids unnecessary re-renders.
  const cells = useNotebookStore((s) => s.cells)
  const setCells = useNotebookStore((s) => s.setCells)
  const addCell = useNotebookStore((s) => s.addCell)

  // Keep the latest onChange in a ref so it can be called from effects
  // without being part of the dep list (avoiding loops if parent passes
  // an inline function).
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (initialCells) setCells(initialCells)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    onChangeRef.current?.(cells)
  }, [cells])

  return (
    <div className="space-y-4">
      <NotebookToolbar />
      <div className="space-y-2">
        {cells.map((c) => (
          <Cell key={c.id} cell={c} />
        ))}
      </div>
      <div className="flex justify-center gap-2 pt-4">
        <button
          onClick={() => addCell(undefined, 'code')}
          className="rounded border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          + Code
        </button>
        <button
          onClick={() => addCell(undefined, 'markdown')}
          className="rounded border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          + Markdown
        </button>
      </div>
    </div>
  )
}
