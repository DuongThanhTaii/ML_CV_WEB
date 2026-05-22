'use client'

import { Button } from '@/components/ui/button'
import { usePyodide } from '@/hooks/use-pyodide'
import { useNotebookStore } from '@/stores/notebook-store'
import { Loader2, Play, RotateCcw } from 'lucide-react'

export function NotebookToolbar() {
  const { status, init, terminate } = usePyodide()
  const cells = useNotebookStore((s) => s.cells)

  const label =
    status === 'idle'
      ? 'Bấm để khởi tạo Python'
      : status === 'loading'
        ? 'Đang tải Pyodide (~5-8s)…'
        : status === 'ready'
          ? `Python sẵn sàng · ${cells.length} ô`
          : status === 'running'
            ? 'Đang chạy…'
            : status === 'terminated'
              ? 'Worker đã dừng — bấm khởi tạo lại'
              : 'Lỗi runtime'

  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm">
      <div className="flex size-2 shrink-0 rounded-full bg-emerald-500 data-[s=idle]:bg-muted-foreground data-[s=loading]:animate-pulse data-[s=loading]:bg-amber-500 data-[s=error]:bg-destructive data-[s=terminated]:bg-destructive" data-s={status} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      {status === 'idle' && (
        <Button size="sm" onClick={() => init()}>
          <Play className="size-3.5" /> Khởi tạo
        </Button>
      )}
      {status === 'loading' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      {(status === 'ready' || status === 'running' || status === 'terminated') && (
        <Button size="sm" variant="outline" onClick={() => terminate()}>
          <RotateCcw className="size-3.5" /> Reset
        </Button>
      )}
    </div>
  )
}
