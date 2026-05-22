import { createServerSupabase } from '@/lib/supabase/server'
import { submissionService } from '@/services/submission.service'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { OverrideScoreForm } from '@/components/teacher/override-score-form'
import { TestResultList } from '@/components/grading/test-result-list'
import { formatDate } from '@/lib/utils'

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: sub, error } = await submissionService.getDetail(supabase, id)
  if (error || !sub) notFound()

  const grading: any = sub.grading_results?.[0]
  const feedback: any = (sub as any).ai_feedback?.[0]

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
          Lần {sub.attempt_number} · {formatDate(sub.submitted_at)} · Status: <Badge variant="outline">{sub.status}</Badge>
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
          <h2 className="text-lg font-semibold">Kết quả chấm tự động</h2>
          <div className="rounded-md border bg-card p-4">
            <div className="text-3xl font-bold">
              {Number(grading.score).toFixed(1)} / {Number(grading.max_score).toFixed(0)}
            </div>
            <p className="text-sm text-muted-foreground">
              {grading.passed_tests}/{grading.total_tests} test pass
              {grading.metric_value !== null && <> · metric: {Number(grading.metric_value).toFixed(3)}</>}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Chấm bởi <code>{grading.graded_by}</code>
            </p>
          </div>

          {grading.test_details && (
            <details className="rounded-md border">
              <summary className="cursor-pointer p-3 text-sm font-medium hover:bg-muted/30">
                Chi tiết test
              </summary>
              <div className="border-t p-3">
                <TestResultList tests={grading.test_details} />
              </div>
            </details>
          )}

          <OverrideScoreForm submissionId={sub.id} currentScore={Number(grading.score)} maxScore={Number(grading.max_score)} />
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
