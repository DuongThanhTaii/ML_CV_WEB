import { requireAdmin } from '@/lib/auth/admin'
import { createServiceSupabase } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const guard = await requireAdmin()
  if ('error' in guard) return guard.error

  const url = new URL(req.url)
  const page = Number(url.searchParams.get('page') ?? '1')
  const perPage = Math.min(Number(url.searchParams.get('perPage') ?? '50'), 200)

  const service = createServiceSupabase()
  const { data, error } = await service.auth.admin.listUsers({ page, perPage })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Augment with profile.role (separate query, since auth.users doesn't store it)
  const ids = data.users.map((u) => u.id)
  const { data: profiles } = await service.from('profiles').select('id, role, full_name').in('id', ids)
  const profileMap = new Map((profiles ?? []).map((p: { id: string }) => [p.id, p]))

  const merged = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    email_confirmed_at: u.email_confirmed_at,
    provider: u.app_metadata?.provider ?? 'email',
    profile: profileMap.get(u.id) ?? null,
  }))

  return NextResponse.json({ users: merged, total: data.users.length })
}
