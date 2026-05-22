'use client'

import type { CellOutput } from '@/types/notebook'
import { cn } from '@/lib/utils'

export function OutputRenderer({ output }: { output: CellOutput }) {
  switch (output.type) {
    case 'stdout':
      return <pre className="whitespace-pre-wrap">{output.data}</pre>
    case 'stderr':
      return <pre className="whitespace-pre-wrap text-amber-600">{output.data}</pre>
    case 'error':
      return (
        <pre className="whitespace-pre-wrap rounded bg-destructive/10 p-2 text-destructive">
          {output.data}
        </pre>
      )
    case 'image':
      return (
        <img
          src={`data:${output.mime ?? 'image/png'};base64,${output.data}`}
          alt="Plot"
          className="my-2 max-w-full rounded"
        />
      )
    case 'result':
      if (output.mime === 'text/html') {
        return (
          <div
            className={cn(
              'overflow-auto [&_.df]:text-xs',
              '[&_table]:border-collapse [&_th]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1',
              '[&_td]:border [&_td]:px-2 [&_td]:py-1',
            )}
            dangerouslySetInnerHTML={{ __html: output.data }}
          />
        )
      }
      return <pre className="whitespace-pre-wrap">{output.data}</pre>
    default:
      return null
  }
}
