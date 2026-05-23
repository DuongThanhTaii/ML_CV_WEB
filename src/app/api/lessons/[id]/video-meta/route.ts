import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  durationSeconds: z.number().int().positive().max(36_000),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/lessons/:id/video-meta
 *
 * Called by the player on first load to backfill `video_duration_seconds`
 * when the teacher didn't set it. Only writes if currently NULL — students
 * can't tamper with a teacher-supplied duration.
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
  const { durationSeconds } = parsed.data

  const { data: canAccess } = await userClient.rpc('can_access_lesson', {
    target_lesson_id: lessonId,
  })
  if (canAccess !== true) {
    return NextResponse.json({ error: 'Lesson not accessible' }, { status: 403 })
  }

  const svc = createServiceSupabase()
  const { data: lesson } = await svc
    .from('lessons')
    .select('video_duration_seconds')
    .eq('id', lessonId)
    .single()

  if (lesson?.video_duration_seconds) {
    return NextResponse.json({ skipped: true })
  }

  const { error } = await svc
    .from('lessons')
    .update({ video_duration_seconds: durationSeconds })
    .eq('id', lessonId)
    .is('video_duration_seconds', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, durationSeconds })
}
