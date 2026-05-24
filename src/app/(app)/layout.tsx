import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar email={user.email ?? ''} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-6 md:p-8 animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
