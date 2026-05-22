'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNotebookStore } from '@/stores/notebook-store'
import type { NotebookCell } from '@/types/notebook'

export function MarkdownCell({ cell }: { cell: NotebookCell }) {
  const [editing, setEditing] = useState(cell.source.length === 0)
  const updateSource = useNotebookStore((s) => s.updateSource)

  if (editing) {
    return (
      <textarea
        autoFocus
        className="block w-full resize-y rounded-md bg-background p-4 font-mono text-sm outline-none"
        value={cell.source}
        rows={Math.max(3, cell.source.split('\n').length)}
        onChange={(e) => updateSource(cell.id, e.target.value)}
        onBlur={() => cell.source && setEditing(false)}
        placeholder="# Markdown content..."
      />
    )
  }

  return (
    <div
      onDoubleClick={() => setEditing(true)}
      className="prose prose-sm dark:prose-invert max-w-none cursor-text p-4"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{cell.source}</ReactMarkdown>
    </div>
  )
}
