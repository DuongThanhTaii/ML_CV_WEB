import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client. NEVER expose to client code.
 * Use only in:
 *  - API route handlers (server-only context)
 *  - Edge Functions
 *  - Background jobs
 */
export function createServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
