'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  signedUrl: string
  maxRows?: number
}

export function CSVPreview({ signedUrl, maxRows = 20 }: Props) {
  const [rows, setRows] = useState<string[][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(signedUrl)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return
        const lines = text.split('\n').slice(0, maxRows + 1)
        const parsed = lines.map((l) => l.split(',').map((c) => c.trim()))
        setRows(parsed)
      })
      .catch((e) => setError(String(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [signedUrl, maxRows])

  if (loading) return <Skeleton className="h-40" />
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (rows.length === 0) return null

  const [header, ...body] = rows
  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            {header!.map((h, i) => (
              <th key={i} className="border-b px-2 py-1.5 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i}>
              {row.map((c, j) => (
                <td key={j} className="border-b px-2 py-1">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
