import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/assignments/:id/datasets
 *
 * Returns datasets attached to a published assignment with short-lived signed
 * download URLs. Role `test` is filtered out — students should never get a
 * direct URL to ground-truth labels.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { id: assignmentId } = await params

  const userClient = await createServerSupabase()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify assignment is published or user is teacher
  const { data: assignment } = await userClient
    .from('assignments_public')
    .select('id')
    .eq('id', assignmentId)
    .maybeSingle()

  // Could still be the teacher of an unpublished assignment — they have direct read.
  const isTeacherAccessible = !!assignment
  if (!isTeacherAccessible) {
    const { data: teacherCheck } = await userClient
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .maybeSingle()
    if (!teacherCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const svc = createServiceSupabase()
  const { data: attached, error } = await svc
    .from('assignment_datasets')
    .select('role, datasets(id, name, description, dataset_type, storage_path, preview)')
    .eq('assignment_id', assignmentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter out test-role datasets for non-teachers
  // (we can detect teacher status by seeing if they can read the bare assignments row)
  const isTeacher =
    (
      await userClient
        .from('assignments')
        .select('id')
        .eq('id', assignmentId)
        .maybeSingle()
    ).data !== null

  const visible = (attached ?? []).filter((a) => isTeacher || a.role !== 'test')

  // Sign URLs in parallel (1h TTL)
  const out = await Promise.all(
    visible.map(async (a) => {
      // Supabase JS infers an array for joined tables; flatten safely.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = a.datasets as any
      if (!d) return null
      const { data: signed } = await svc.storage
        .from('datasets')
        .createSignedUrl(d.storage_path, 3600)
      return {
        role: a.role,
        id: d.id,
        name: d.name,
        description: d.description,
        dataset_type: d.dataset_type,
        preview: d.preview,
        signed_url: signed?.signedUrl ?? null,
      }
    }),
  )

  return NextResponse.json({ datasets: out.filter(Boolean) })
}
