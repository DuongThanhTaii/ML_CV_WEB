import { requireAdmin } from '@/lib/auth/admin'
import { createServiceSupabase } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

/**
 * Force-verify a user's email. Use when SMTP fails or for testing.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if ('error' in guard) return guard.error

  const { id } = await params
  const service = createServiceSupabase()
  const { error } = await service.auth.admin.updateUserById(id, { email_confirm: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
