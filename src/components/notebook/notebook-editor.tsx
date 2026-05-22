'use client'

import { useEffect, useState } from 'react'
import { Notebook } from './notebook'
import { useNotebookAutosave } from '@/hooks/use-notebook-autosave'
import { useNotebookStore } from '@/stores/notebook-store'
import { Input } from '@/components/ui/input'
import { Cloud, CloudOff, Loader2 } from 'lucide-react'
import type { NotebookCell } from '@/types/notebook'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { notebookService } from '@/services/notebook.service'

interface Props {
  notebookId: string
  initialTitle: string
  initialCells: NotebookCell[]
}

export function NotebookEditor({ notebookId, initialTitle, initialCells }: Props) {
  const [title, setTitle] = useState(initialTitle)
  const cells = useNotebookStore((s) => s.cells)
  const status = useNotebookAutosave(notebookId, cells)

  useEffect(() => {
    const supabase = createBrowserSupabase()
    const t = setTimeout(() => notebookService.rename(supabase, notebookId, title), 800)
    return () => clearTimeout(t)
  }, [title, notebookId])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="flex items-center justify-between gap-3 rounded-md border bg-card p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          placeholder="Untitled notebook"
        />
        <SaveStatusIcon status={status} />
      </header>
      <Notebook initialCells={initialCells} />
    </div>
  )
}

function SaveStatusIcon({ status }: { status: 'idle' | 'dirty' | 'saving' | 'saved' | 'error' }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Đang lưu…
      </span>
    )
  }
  if (status === 'saved' || status === 'idle') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Cloud className="size-3" /> Đã lưu
      </span>
    )
  }
  if (status === 'dirty') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Cloud className="size-3" /> Đang chờ…
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-destructive">
      <CloudOff className="size-3" /> Lỗi lưu
    </span>
  )
}
