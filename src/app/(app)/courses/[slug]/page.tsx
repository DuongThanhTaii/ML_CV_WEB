import { createServerSupabase } from '@/lib/supabase/server'
import { courseService } from '@/services/course.service'
import { enrollmentService } from '@/services/enrollment.service'
import { Badge } from '@/components/ui/badge'
import { EnrollButton } from '@/components/course/enroll-button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock } from 'lucide-react'

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: course, error } = await courseService.getBySlug(supabase, slug)
  if (error || !course) notFound()

  const { data: lessons } = await courseService.listLessons(supabase, course.id)
  const isEnrolled = user ? await enrollmentService.isEnrolled(supabase, user.id, course.id) : false

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{course.category?.toUpperCase()}</Badge>
          <Badge variant="outline">Độ khó {course.difficulty}/5</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-4" /> {lessons?.length ?? 0} bài
          </span>
          {course.estimated_hours && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" /> ~{course.estimated_hours} giờ
            </span>
          )}
        </div>
        <div className="pt-2">
          <EnrollButton courseId={course.id} initialEnrolled={isEnrolled} firstLessonId={lessons?.[0]?.id ?? null} />
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Nội dung khóa học</h2>
        <ol className="space-y-2">
          {lessons?.map((lesson, i) => (
            <li
              key={lesson.id}
              className="flex items-center justify-between rounded-md border bg-card p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {i + 1}
                </span>
                <div>
                  <div className="font-medium">{lesson.title}</div>
                  {lesson.estimated_minutes && (
                    <div className="text-xs text-muted-foreground">~{lesson.estimated_minutes} phút</div>
                  )}
                </div>
              </div>
              {(isEnrolled || lesson.is_free_preview) ? (
                <Link
                  href={`/courses/${slug}/lessons/${lesson.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Học →
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">🔒 Cần đăng ký</span>
              )}
            </li>
          ))}
          {!lessons?.length && (
            <li className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Khóa học chưa có bài giảng nào.
            </li>
          )}
        </ol>
      </section>
    </div>
  )
}
