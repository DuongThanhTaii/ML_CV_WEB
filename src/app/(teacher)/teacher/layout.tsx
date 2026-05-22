import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeacherSidebar } from '@/components/teacher/teacher-sidebar'
import { Topbar } from '@/components/layout/topbar'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/teacher')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      <TeacherSidebar />
      <div className="flex flex-1 flex-col">
        <Topbar email={user.email ?? ''} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
