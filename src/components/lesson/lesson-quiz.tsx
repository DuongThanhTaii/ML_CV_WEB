'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, XCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StudentQuizQuestion } from '@/services/quiz.service'

interface Props {
  lessonId: string
  questions: StudentQuizQuestion[]
  passThreshold: number
  bestScore: number | null
  alreadyPassed: boolean
  onPass?: () => void
}

interface AttemptResult {
  score: number
  passed: boolean
  correct: Record<string, boolean>
  explanations: Record<string, string | null>
  correctAnswers: Record<string, string>
}

export function LessonQuiz({
  lessonId,
  questions,
  passThreshold,
  bestScore,
  alreadyPassed,
  onPass,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPoints = useMemo(
    () => questions.reduce((s, q) => s + (q.points ?? 1), 0),
    [questions],
  )

  if (questions.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Bài học này chưa có quiz. Bạn có thể tiếp tục bài kế tiếp.
      </div>
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz-attempt`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Lỗi không xác định' }))
        throw new Error(body.error ?? 'Submit thất bại')
      }
      const payload = (await res.json()) as AttemptResult
      setResult(payload)
      if (payload.passed) onPass?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetry() {
    setAnswers({})
    setResult(null)
    setError(null)
  }

  const allAnswered = questions.every((q) => answers[q.id])
  const displayScore = result?.score ?? bestScore

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-md border bg-muted/30 p-4">
        <div className="space-y-1">
          <div className="font-medium">Quiz cuối bài</div>
          <div className="text-xs text-muted-foreground">
            {questions.length} câu hỏi · Cần đạt ≥{passThreshold}% để mở bài kế tiếp
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Điểm cao nhất</div>
          <div
            className={`text-lg font-semibold ${
              alreadyPassed || result?.passed
                ? 'text-green-600'
                : displayScore !== null
                  ? 'text-amber-600'
                  : 'text-muted-foreground'
            }`}
          >
            {displayScore !== null ? `${displayScore}%` : '—'}
          </div>
        </div>
      </div>

      <ol className="space-y-4">
        {questions.map((q, idx) => {
          const studentAnswer = answers[q.id] ?? ''
          const isCorrect = result?.correct[q.id]
          const correctAnswer = result?.correctAnswers[q.id]
          const explanation = result?.explanations[q.id]

          return (
            <li
              key={q.id}
              className={`rounded-md border p-4 ${
                result
                  ? isCorrect
                    ? 'border-green-300 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                    : 'border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                  : 'bg-card'
              }`}
            >
              <div className="mb-3 flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                <div className="flex-1 text-sm">{q.question}</div>
                {result && (
                  <span>
                    {isCorrect ? (
                      <CheckCircle2 className="size-5 text-green-600" />
                    ) : (
                      <XCircle className="size-5 text-red-600" />
                    )}
                  </span>
                )}
              </div>

              {q.question_type === 'mcq' && (
                <McqOptions
                  questionId={q.id}
                  options={(q.options ?? []) as string[]}
                  selected={studentAnswer}
                  disabled={!!result}
                  correctAnswer={correctAnswer}
                  onSelect={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                />
              )}

              {q.question_type === 'true_false' && (
                <McqOptions
                  questionId={q.id}
                  options={['true', 'false']}
                  selected={studentAnswer}
                  disabled={!!result}
                  correctAnswer={correctAnswer}
                  optionLabel={(v) => (v === 'true' ? 'Đúng' : 'Sai')}
                  onSelect={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                />
              )}

              {q.question_type === 'code_complete' && (
                <textarea
                  className="mt-2 w-full rounded-md border bg-background p-2 font-mono text-xs"
                  rows={3}
                  value={studentAnswer}
                  disabled={!!result}
                  placeholder="Viết câu trả lời / đoạn code..."
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              )}

              {result && explanation && (
                <div className="mt-3 rounded-md bg-background/60 p-2 text-xs text-muted-foreground">
                  <strong>Giải thích:</strong> {explanation}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          Tổng điểm: {totalPoints} · Đã trả lời {Object.keys(answers).length}/{questions.length}
        </div>
        {result ? (
          <div className="flex items-center gap-2">
            {result.passed ? (
              <span className="text-sm font-medium text-green-600">
                ✓ Đạt {result.score}% — bài kế đã mở
              </span>
            ) : (
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="mr-1 size-4" /> Làm lại
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
            {submitting ? 'Đang chấm...' : 'Nộp bài'}
          </Button>
        )}
      </div>
    </div>
  )
}

function McqOptions({
  questionId,
  options,
  selected,
  disabled,
  correctAnswer,
  optionLabel,
  onSelect,
}: {
  questionId: string
  options: string[]
  selected: string
  disabled: boolean
  correctAnswer?: string
  optionLabel?: (v: string) => string
  onSelect: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        const isSelected = selected === opt
        const isCorrectOpt = correctAnswer === opt
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
              disabled
                ? isCorrectOpt
                  ? 'border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950/30'
                  : isSelected
                    ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
                    : 'opacity-60'
                : isSelected
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted'
            }`}
          >
            <input
              type="radio"
              name={questionId}
              value={opt}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onSelect(opt)}
              className="size-4"
            />
            <span>{optionLabel ? optionLabel(opt) : opt}</span>
          </label>
        )
      })}
    </div>
  )
}
