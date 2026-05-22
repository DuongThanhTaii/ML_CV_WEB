import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TestResultList } from './test-result-list'
import type { Database } from '@/types/database'
import type { TestResult } from '@/lib/grading/types'

type GradingResult = Database['public']['Tables']['grading_results']['Row']
type Status = Database['public']['Enums']['submission_status'] | 'idle'

export function GradingResultView({ status, result }: { status: Status; result: GradingResult | null }) {
  if (status === 'pending' || status === 'running') {
    return (
      <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-4">
        <Loader2 className="size-5 animate-spin text-primary" />
        <div className="text-sm">
          <div className="font-medium">Đang chấm bài…</div>
          <div className="text-muted-foreground">
            Hidden tests đang chạy trên server. Có thể mất 10-30 giây.
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="size-5 text-destructive" />
        <div className="text-sm">
          <div className="font-medium">Lỗi khi chấm</div>
          <div className="text-muted-foreground">
            Hệ thống không chạy được code của bạn. Hãy kiểm tra lại và nộp lại.
          </div>
        </div>
      </div>
    )
  }

  if (status === 'manual_review') {
    return (
      <div className="rounded-md border bg-muted/30 p-4 text-sm">
        Bài đã được chuyển sang chế độ <strong>chấm tay</strong>. Giáo viên sẽ xem lại.
      </div>
    )
  }

  if (!result) return null

  const pct = (Number(result.score) / Number(result.max_score)) * 100
  const passColor =
    pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-destructive'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-md border bg-card p-4">
        <CheckCircle2 className="size-8 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${passColor}`}>{Number(result.score).toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ {Number(result.max_score).toFixed(0)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {result.passed_tests}/{result.total_tests} test pass
            {result.metric_value !== null && (
              <> · metric: {Number(result.metric_value).toFixed(3)}</>
            )}
          </div>
        </div>
        <Badge variant={pct >= 50 ? 'success' : 'destructive'}>
          {pct >= 80 ? 'Xuất sắc' : pct >= 50 ? 'Đạt' : 'Chưa đạt'}
        </Badge>
      </div>

      {result.test_details && (
        <details className="rounded-md border">
          <summary className="cursor-pointer p-3 text-sm font-medium hover:bg-muted/30">
            Chi tiết test
          </summary>
          <div className="border-t p-3">
            <TestResultList tests={result.test_details as unknown as TestResult[]} />
          </div>
        </details>
      )}

      {result.stderr && (
        <details className="rounded-md border">
          <summary className="cursor-pointer p-3 text-sm font-medium hover:bg-muted/30">
            Lỗi runtime (stderr)
          </summary>
          <pre className="overflow-auto border-t bg-muted/30 p-3 font-mono text-xs">{result.stderr}</pre>
        </details>
      )}
    </div>
  )
}
