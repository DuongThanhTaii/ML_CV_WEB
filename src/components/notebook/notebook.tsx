'use client'

import { useEffect } from 'react'
import { useNotebookStore } from '@/stores/notebook-store'
import { Cell } from './cell'
import { NotebookToolbar } from './toolbar'
import type { NotebookCell } from '@/types/notebook'

interface NotebookProps {
  initialCells?: NotebookCell[]
  onChange?: (cells: NotebookCell[]) => void
}

export function Notebook({ initialCells, onChange }: NotebookProps) {
  const { cells, setCells, addCell } = useNotebookStore()

  useEffect(() => {
    if (initialCells) setCells(initialCells)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    onChange?.(cells)
  }, [cells, onChange])

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
