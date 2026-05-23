import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  answers: z.record(z.string(), z.string()),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/lessons/:id/quiz-attempt
 * Body: { answers: { [quizId]: studentAnswer } }
 * Returns: { score, passed, correct, explanations, correctAnswers }
 *
 * Server-side grading: student never sees `correct_answer` directly. We read it
 * via the service-role client (bypasses RLS) and compute the score here.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { id: lessonId } = await params

  const userClient = await createServerSupabase()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { answers } = parsed.data

  // Verify the student is allowed to attempt this lesson's quiz (enrolled + gating)
  const { data: canAccess } = await userClient.rpc('can_access_lesson', {
    target_lesson_id: lessonId,
  })
  if (canAccess !== true) {
    return NextResponse.json({ error: 'Lesson not accessible' }, { status: 403 })
  }

  // Service role: load full quiz including correct answers
  const svc = createServiceSupabase()
  const { data: quizzes, error: quizErr } = await svc
    .from('quizzes')
    .select('id, lesson_id, question_type, correct_answer, explanation, points')
    .eq('lesson_id', lessonId)
    .order('order_index')
  if (quizErr) return NextResponse.json({ error: quizErr.message }, { status: 500 })
  if (!quizzes || quizzes.length === 0) {
    return NextResponse.json({ error: 'No quiz questions' }, { status: 404 })
  }

  // Get the lesson's pass threshold
  const { data: lesson, error: lessonErr } = await svc
    .from('lessons')
    .select('pass_threshold')
    .eq('id', lessonId)
    .single()
  if (lessonErr || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  // Grade
  const correct: Record<string, boolean> = {}
  const explanations: Record<string, string | null> = {}
  const correctAnswers: Record<string, string> = {}
  let earnedPoints = 0
  let totalPoints = 0

  for (const q of quizzes) {
    const points = q.points ?? 1
    totalPoints += points
    const studentAnswer = (answers[q.id] ?? '').trim()
    const expected = (q.correct_answer ?? '').trim()
    const isCorrect = compareAnswer(q.question_type, studentAnswer, expected)
    correct[q.id] = isCorrect
    explanations[q.id] = q.explanation
    correctAnswers[q.id] = expected
    if (isCorrect) earnedPoints += points
  }

  const score = Math.round((earnedPoints / totalPoints) * 100)
  const passed = score >= lesson.pass_threshold

  // Record per-quiz attempts (RLS: user can insert own)
  const attemptRows = quizzes.map((q) => ({
    quiz_id: q.id,
    student_id: user.id,
    answer: answers[q.id] ?? null,
    is_correct: correct[q.id],
  }))
  // Best-effort: don't fail the whole request if this insert fails
  await userClient.from('quiz_attempts').insert(attemptRows)

  // Upsert lesson_progress with new best score
  const { data: existing } = await userClient
    .from('lesson_progress')
    .select('best_quiz_score, quiz_attempts_count, passed')
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const prevBest = existing?.best_quiz_score ?? 0
  const newBest = Math.max(prevBest, score)
  const wasPassed = existing?.passed ?? false
  const nowPassed = wasPassed || passed

  await userClient.from('lesson_progress').upsert(
    {
      student_id: user.id,
      lesson_id: lessonId,
      best_quiz_score: newBest,
      quiz_attempts_count: (existing?.quiz_attempts_count ?? 0) + 1,
      passed: nowPassed,
      passed_at: nowPassed && !wasPassed ? new Date().toISOString() : undefined,
    },
    { onConflict: 'student_id,lesson_id' },
  )

  return NextResponse.json({
    score,
    passed,
    correct,
    explanations,
    correctAnswers,
  })
}

function compareAnswer(
  type: 'mcq' | 'true_false' | 'code_complete',
  given: string,
  expected: string,
): boolean {
  if (type === 'code_complete') {
    // Light normalization: strip whitespace, case-insensitive
    return given.replace(/\s+/g, ' ').trim().toLowerCase() ===
      expected.replace(/\s+/g, ' ').trim().toLowerCase()
  }
  return given === expected
}
