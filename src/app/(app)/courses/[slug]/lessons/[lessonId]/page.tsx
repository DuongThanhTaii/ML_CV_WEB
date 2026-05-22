import { createServerSupabase } from '@/lib/supabase/server'
import { lessonService } from '@/services/lesson.service'
import { notFound } from 'next/navigation'
import { LessonView } from '@/components/lesson/lesson-view'

interface Props {
  params: Promise<{ slug: string; lessonId: string }>
}

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params
  const supabase = await createServerSupabase()
  const { data, error } = await lessonService.getWithAssignments(supabase, lessonId)
  if (error || !data) notFound()

  const { data: prevNext } = await supabase
    .from('lessons')
    .select('id, order_index, title')
    .eq('course_id', data.lesson.course_id)
    .order('order_index')

  const idx = prevNext?.findIndex((l) => l.id === lessonId) ?? -1
  const prev = (idx > 0 ? prevNext![idx - 1] : null) ?? null
  const next =
    (idx >= 0 && idx < (prevNext?.length ?? 0) - 1 ? prevNext![idx + 1] : null) ?? null

  return (
    <LessonView
      courseSlug={slug}
      lesson={data.lesson}
      assignments={data.assignments}
      prev={prev}
      next={next}
    />
  )
}
