import { createServerSupabase } from '@/lib/supabase/server'
import { submissionService } from '@/services/submission.service'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { OverrideScoreForm } from '@/components/teacher/override-score-form'
import { TestResultList } from '@/components/grading/test-result-list'
import { formatDate } from '@/lib/utils'

interface GradingRow {
  score: number
  max_score: number
  passed_tests: number
  total_tests: number
  test_details: unknown
  metric_value: number | null
  graded_by: string
  teacher_override_score: number | null
  teacher_comment: string | null
  reviewed_at: string | null
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: sub, error } = await submissionService.getDetail(supabase, id)
  if (error || !sub) notFound()

  const grading = (sub.grading_results?.[0] ?? null) as GradingRow | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feedback: any = (sub as any).ai_feedback?.[0]
  const finalScore = grading
    ? grading.teacher_override_score ?? grading.score
    : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <a href={`/teacher/assignments/${sub.assignment_id}`} className="text-sm text-muted-foreground hover:underline">
          ← Quay lại bài tập
        </a>
        <h1 className="mt-2 text-2xl font-bold">
          Submission của {sub.profiles?.full_name || sub.profiles?.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          Lần {sub.attempt_number} · {formatDate(sub.submitted_at)} · Status:{' '}
          <Badge variant="outline">{sub.status}</Badge>
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Code sinh viên nộp</h2>
        <pre className="overflow-auto rounded-md border bg-muted/30 p-4 font-mono text-sm">
          <code>{sub.code}</code>
        </pre>
      </section>

      {grading && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Kết quả chấm</h2>
          <div className="rounded-md border bg-card p-4">
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-bold">
                {Number(finalScore).toFixed(1)} / {Number(grading.max_score).toFixed(0)}
              </div>
              {grading.teacher_override_score !== null && (
                <span className="text-xs">
                  <span className="text-muted-foreground line-through">
                    {Number(grading.score).toFixed(1)}
                  </span>{' '}
                  → đã được điều chỉnh bởi giáo viên
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {grading.passed_tests}/{grading.total_tests} test pass
              {grading.metric_value !== null && (
                <> · metric: {Number(grading.metric_value).toFixed(3)}</>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Chấm tự động bởi <code>{grading.graded_by}</code>
              {grading.reviewed_at && ` · review ${formatDate(grading.reviewed_at)}`}
            </p>
          </div>

          {grading.test_details != null && (
            <details className="rounded-md border">
              <summary className="cursor-pointer p-3 text-sm font-medium hover:bg-muted/30">
                Chi tiết test
              </summary>
              <div className="border-t p-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <TestResultList tests={grading.test_details as any} />
              </div>
            </details>
          )}

          <OverrideScoreForm
            submissionId={sub.id}
            autoScore={Number(grading.score)}
            maxScore={Number(grading.max_score)}
            initialOverride={
              grading.teacher_override_score !== null
                ? Number(grading.teacher_override_score)
                : null
            }
            initialComment={grading.teacher_comment}
          />
        </section>
      )}

      {feedback && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">AI feedback</h2>
          <div className="rounded-md border bg-card p-4 text-sm">
            <div className="mb-2 text-xs text-muted-foreground">Model: {feedback.model_used}</div>
            <div className="whitespace-pre-wrap">{feedback.response_text}</div>
          </div>
        </section>
      )}
    </div>
  )
}
