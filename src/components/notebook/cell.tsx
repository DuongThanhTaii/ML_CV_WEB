'use client'

import { CodeCell } from './code-cell'
import { MarkdownCell } from './markdown-cell'
import type { NotebookCell as NotebookCellT } from '@/types/notebook'
import { useNotebookStore } from '@/stores/notebook-store'
import { Trash2 } from 'lucide-react'

export function Cell({ cell }: { cell: NotebookCellT }) {
  const deleteCell = useNotebookStore((s) => s.deleteCell)

  return (
    <div className="group relative rounded-md border bg-card transition hover:border-muted-foreground/30">
      <button
        onClick={() => deleteCell(cell.id)}
        className="absolute right-2 top-2 z-10 hidden rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
        title="Xóa ô"
      >
        <Trash2 className="size-3.5" />
      </button>
      {cell.type === 'code' ? <CodeCell cell={cell} /> : <MarkdownCell cell={cell} />}
    </div>
  )
}
