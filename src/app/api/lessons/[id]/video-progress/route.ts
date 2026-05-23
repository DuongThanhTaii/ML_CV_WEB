import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  bitmapFromBase64,
  bitmapToBase64,
  countSetBits,
  mergeBitmap,
  watchedPercent,
} from '@/lib/video/bitmap'

const bodySchema = z.object({
  bitmapBase64: z.string().max(500_000), // 500KB safety cap
  durationSeconds: z.number().int().positive().max(36_000), // 10h cap
  watchedSeconds: z.number().int().nonnegative(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/lessons/:id/video-progress
 *
 * Body: { bitmapBase64, durationSeconds, watchedSeconds }
 *
 * Server merges the incoming bitmap with the persisted one via bitwise OR
 * (monotonic — student can only ADD to their watched seconds, never reset).
 * This prevents simple replay attacks where a client posts a half-empty bitmap.
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
  const { bitmapBase64, durationSeconds } = parsed.data

  // Gate: must be allowed to view this lesson
  const { data: canAccess } = await userClient.rpc('can_access_lesson', {
    target_lesson_id: lessonId,
  })
  if (canAccess !== true) {
    return NextResponse.json({ error: 'Lesson not accessible' }, { status: 403 })
  }

  // Bypass RLS to read+merge bitmap atomically
  const svc = createServiceSupabase()

  const { data: existing } = await svc
    .from('lesson_progress')
    .select(
      'video_unique_seconds_bitmap, video_watched_pct, video_watched_seconds, passed, best_quiz_score',
    )
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  // Need lesson info to compute new passed state
  const { data: lesson } = await svc
    .from('lessons')
    .select('pass_threshold, video_required, video_youtube_id')
    .eq('id', lessonId)
    .single()
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  // Merge incoming bitmap into existing one (monotonic)
  const incoming = bitmapFromBase64(bitmapBase64, durationSeconds)
  const base = bitmapFromBase64(
    (existing?.video_unique_seconds_bitmap as string | null) ?? null,
    durationSeconds,
  )
  mergeBitmap(base, incoming)
  const newPct = watchedPercent(base, durationSeconds)
  const newWatchedSeconds = countSetBits(base)

  // Recompute passed: quiz pass (if applicable) AND video pct >= 90 (if required)
  const quizPassedSoFar = existing?.passed ?? false
  const bestQuizScore = existing?.best_quiz_score ?? null
  const quizOk =
    bestQuizScore === null
      ? !await hasQuiz(svc, lessonId)
      : bestQuizScore >= lesson.pass_threshold
  const videoOk = !lesson.video_youtube_id || !lesson.video_required || newPct >= 90
  const nowPassed = quizPassedSoFar || (quizOk && videoOk)

  const { error: upsertErr } = await svc.from('lesson_progress').upsert(
    {
      student_id: user.id,
      lesson_id: lessonId,
      video_unique_seconds_bitmap: bitmapToBase64(base),
      video_watched_pct: newPct,
      video_watched_seconds: newWatchedSeconds,
      passed: nowPassed,
      passed_at: nowPassed && !quizPassedSoFar ? new Date().toISOString() : undefined,
    },
    { onConflict: 'student_id,lesson_id' },
  )

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    watchedPct: newPct,
    watchedSeconds: newWatchedSeconds,
    passed: nowPassed,
  })
}

async function hasQuiz(svc: ReturnType<typeof createServiceSupabase>, lessonId: string) {
  const { count } = await svc
    .from('quizzes')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)
  return (count ?? 0) > 0
}
