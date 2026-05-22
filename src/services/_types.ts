import type { createBrowserSupabase } from '@/lib/supabase/client'

/**
 * Inferred Supabase client type so services accept both server- and browser-side
 * clients without having to track @supabase/ssr's internal generic shape.
 */
export type SB = ReturnType<typeof createBrowserSupabase>
