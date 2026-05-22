'use client'

import dynamic from 'next/dynamic'
import { useNotebookStore } from '@/stores/notebook-store'
import { usePyodide } from '@/hooks/use-pyodide'
import { Loader2, Play } from 'lucide-react'
import type { NotebookCell } from '@/types/notebook'
import { OutputRenderer } from './output-renderer'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-muted" />,
})

export function CodeCell({ cell }: { cell: NotebookCell }) {
  const { updateSource, setOutputs, setRunning, incrementExecution } = useNotebookStore()
  const { runCell, status } = usePyodide()

  async function handleRun() {
    setRunning(cell.id, true)
    setOutputs(cell.id, [])
    try {
      const result = await runCell(cell.source, { timeoutMs: 30_000 })
      setOutputs(cell.id, result.outputs)
      incrementExecution(cell.id)
    } catch (err: any) {
      setOutputs(cell.id, [{ type: 'error', data: err?.message ?? String(err) }])
    } finally {
      setRunning(cell.id, false)
    }
  }

  const isReady = status === 'ready' || status === 'running'

  return (
    <div>
      <div className="flex items-stretch">
        <div className="flex w-12 shrink-0 flex-col items-center border-r bg-muted/30 py-3 text-xs text-muted-foreground">
          <button
            onClick={handleRun}
            disabled={!isReady || cell.isRunning}
            title="Chạy ô (Shift+Enter)"
            className="rounded p-1.5 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40"
          >
            {cell.isRunning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
          </button>
          <span className="mt-2 font-mono text-[10px]">
            [{cell.executionCount ?? ' '}]
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <MonacoEditor
            height="auto"
            defaultLanguage="python"
            value={cell.source}
            onChange={(v) => updateSource(cell.id, v ?? '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              lineNumbers: 'off',
              folding: false,
              renderLineHighlight: 'none',
              scrollbar: { vertical: 'hidden' },
            }}
            onMount={(editor, monaco) => {
              const updateHeight = () => {
                const h = Math.max(48, Math.min(editor.getContentHeight(), 600))
                editor.layout({ width: editor.getLayoutInfo().width, height: h })
                const wrapper = editor.getContainerDomNode() as HTMLDivElement
                if (wrapper) wrapper.style.height = `${h}px`
              }
              editor.onDidContentSizeChange(updateHeight)
              updateHeight()
              editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, handleRun)
            }}
          />
        </div>
      </div>
      {cell.outputs.length > 0 && (
        <div className="cell-output max-h-[480px] overflow-auto border-t bg-background p-3 font-mono text-xs">
          {cell.outputs.map((o, i) => (
            <OutputRenderer key={i} output={o} />
          ))}
        </div>
      )}
    </div>
  )
}
