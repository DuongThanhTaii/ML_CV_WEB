import { createServerSupabase } from '@/lib/supabase/server'
import { lessonService } from '@/services/lesson.service'
import { quizService } from '@/services/quiz.service'
import { lessonProgressService } from '@/services/lesson-progress.service'
import { canAccessLesson } from '@/lib/lessons/gating'
import { loadGatingAssignmentsForLesson } from '@/lib/lessons/assignment-gating'
import { createSignedUrl } from '@/lib/storage/signed-urls'
import { notFound, redirect } from 'next/navigation'
import { LessonView } from '@/components/lesson/lesson-view'
import { LockedLessonBanner } from '@/components/lesson/locked-lesson-banner'

interface Props {
  params: Promise<{ slug: string; lessonId: string }>
}

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/courses/${slug}/lessons/${lessonId}`)

  const { data, error } = await lessonService.getWithAssignments(supabase, lessonId)
  if (error || !data) notFound()

  const accessible = await canAccessLesson(supabase, lessonId)
  if (!accessible) {
    return <LockedLessonBanner courseSlug={slug} />
  }

  await lessonProgressService.markViewed(supabase, user.id, lessonId)

  const [
    { data: prevNext },
    { data: quizQuestions },
    progress,
    pdfSignedUrl,
    gatingAssignments,
  ] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, order_index, title')
      .eq('course_id', data.lesson.course_id)
      .order('order_index'),
    quizService.listForStudent(supabase, lessonId),
    lessonProgressService.getForStudent(supabase, user.id, lessonId),
    data.lesson.pdf_storage_path
      ? createSignedUrl(supabase, 'lesson-pdfs', data.lesson.pdf_storage_path)
      : Promise.resolve(null),
    loadGatingAssignmentsForLesson(supabase, user.id, lessonId),
  ])

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
      quizQuestions={quizQuestions}
      progress={progress}
      pdfSignedUrl={pdfSignedUrl}
      gatingAssignments={gatingAssignments}
    />
  )
}
