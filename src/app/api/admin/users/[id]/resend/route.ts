import { requireAdmin } from '@/lib/auth/admin'
import { createServiceSupabase } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

/**
 * Generate a new signup confirmation link for the user (admin-only).
 * Returns the link directly so admin can copy/share manually if email is broken.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if ('error' in guard) return guard.error

  const { id } = await params
  const service = createServiceSupabase()

  const { data: userRes, error: getErr } = await service.auth.admin.getUserById(id)
  if (getErr || !userRes.user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  // magiclink also confirms email for unverified users when clicked
  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: userRes.user.email,
    options: { redirectTo: `${siteUrl}/callback?next=/dashboard` },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, link: data.properties?.action_link })
}
