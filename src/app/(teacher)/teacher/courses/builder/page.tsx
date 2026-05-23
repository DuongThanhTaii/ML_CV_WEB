import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CourseBuilder } from '@/components/teacher/course-builder'

export default async function CourseBuilderPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/teacher/courses/builder')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-4xl">
      <CourseBuilder />
    </div>
  )
}
