import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Returns the authed admin user, or a NextResponse(403/401) to short-circuit
 * the handler.
 */
export async function requireAdmin() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: new NextResponse('Unauthorized', { status: 401 }) }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (profile?.role !== 'admin') {
    return { error: new NextResponse('Forbidden — admin only', { status: 403 }) }
  }
  return { user, supabase }
}
