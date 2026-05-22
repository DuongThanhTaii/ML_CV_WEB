import { Check, X } from 'lucide-react'
import type { TestResult } from '@/lib/grading/types'
import { cn } from '@/lib/utils'

export function TestResultList({ tests }: { tests: TestResult[] }) {
  return (
    <ul className="space-y-1">
      {tests.map((t, i) => (
        <li
          key={i}
          className={cn(
            'flex items-start gap-2 rounded-md border p-2 text-sm',
            t.passed
              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30'
              : 'border-destructive/30 bg-destructive/5',
          )}
        >
          {t.passed ? (
            <Check className="mt-0.5 size-4 text-emerald-600" />
          ) : (
            <X className="mt-0.5 size-4 text-destructive" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-mono">{t.name}</div>
            {t.error && (
              <pre className="mt-1 whitespace-pre-wrap break-words text-xs text-destructive">
                {t.error}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
