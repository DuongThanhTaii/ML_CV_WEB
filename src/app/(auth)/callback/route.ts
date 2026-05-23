import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Handles all Supabase auth redirects:
 *   - OAuth (Google)            → ?code=...
 *   - Email confirmation        → ?code=...&type=signup
 *   - Password recovery         → ?code=...&type=recovery
 *
 * Recovery redirects to /reset-password (session is established for password update).
 * Others redirect to ?next or /dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error_description') ?? searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`)
  }

  if (code) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
