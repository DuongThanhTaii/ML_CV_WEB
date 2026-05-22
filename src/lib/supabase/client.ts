import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client. After running `pnpm db:types` (which requires
 * supabase CLI linked to your project), you can swap to:
 *   createBrowserClient<Database>(...)
 * to gain strict typing. For now we use the untyped client so dev can begin
 * without a live DB connection.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
