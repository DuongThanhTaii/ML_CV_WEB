import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  assignmentId: z.string().uuid(),
  code: z.string().min(1).max(50_000),
  clientTestPassed: z.boolean(),
})

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 })
  const { assignmentId, code, clientTestPassed } = parsed.data

  // Count existing attempts
  const { count } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
  const attemptNumber = (count ?? 0) + 1

  // Insert pending submission
  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({
      assignment_id: assignmentId,
      student_id: user.id,
      code,
      client_test_passed: clientTestPassed,
      attempt_number: attemptNumber,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger Edge Function (fire-and-forget; client subscribes to realtime updates)
  const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/grade-submission`
  fetch(edgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ submissionId: submission.id }),
  }).catch(() => {
    // Errors will surface as submission stuck in 'pending' — a watchdog cron can flip them
  })

  return NextResponse.json({ submissionId: submission.id, attemptNumber })
}
