import { createServerSupabase } from '@/lib/supabase/server'
import { courseService } from '@/services/course.service'
import { enrollmentService } from '@/services/enrollment.service'
import { moduleService } from '@/services/module.service'
import { listLessonsWithProgress } from '@/lib/lessons/gating'
import { Badge } from '@/components/ui/badge'
import { EnrollButton } from '@/components/course/enroll-button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, CheckCircle2, Clock, Lock } from 'lucide-react'
import type { LessonWithProgress } from '@/types/database'

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: course, error } = await courseService.getBySlug(supabase, slug)
  if (error || !course) notFound()

  const [{ data: modules }, lessons, isEnrolled] = await Promise.all([
    moduleService.listByCourse(supabase, course.id),
    listLessonsWithProgress(supabase, course.id),
    user ? enrollmentService.isEnrolled(supabase, user.id, course.id) : Promise.resolve(false),
  ])

  // Group lessons by module; lessons with module_id = null go into "Bài học khác"
  const lessonsByModule = new Map<string | null, LessonWithProgress[]>()
  for (const l of lessons) {
    const key = l.module_id
    const arr = lessonsByModule.get(key) ?? []
    arr.push(l)
    lessonsByModule.set(key, arr)
  }

  const sections: Array<{ id: string | null; title: string; description: string | null; lessons: LessonWithProgress[] }> = [
    ...(modules?.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      lessons: lessonsByModule.get(m.id) ?? [],
    })) ?? []),
  ]
  const orphanLessons = lessonsByModule.get(null) ?? []
  if (orphanLessons.length > 0) {
    sections.push({
      id: null,
      title: sections.length === 0 ? 'Nội dung khóa học' : 'Bài học khác',
      description: null,
      lessons: orphanLessons,
    })
  }

  const totalLessons = lessons.length
  const passedCount = lessons.filter((l) => l.passed).length
  const firstAccessibleLessonId = lessons.find((l) => !l.locked)?.id ?? lessons[0]?.id ?? null

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
            <BookOpen className="size-4" /> {totalLessons} bài
          </span>
          {course.estimated_hours && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" /> ~{course.estimated_hours} giờ
            </span>
          )}
          {isEnrolled && totalLessons > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-4 text-green-600" />
              {passedCount}/{totalLessons} đã hoàn thành
            </span>
          )}
        </div>
        <div className="pt-2">
          <EnrollButton
            courseId={course.id}
            initialEnrolled={isEnrolled}
            firstLessonId={firstAccessibleLessonId}
          />
        </div>
      </header>

      {sections.length === 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Nội dung khóa học</h2>
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Khóa học chưa có bài giảng nào.
          </div>
        </section>
      ) : (
        sections.map((section, sectionIdx) => (
          <section key={section.id ?? 'orphan'}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">
                {section.id && (
                  <span className="mr-2 text-muted-foreground">Module {sectionIdx + 1}.</span>
                )}
                {section.title}
              </h2>
              <span className="text-xs text-muted-foreground">
                {section.lessons.filter((l) => l.passed).length}/{section.lessons.length} bài
              </span>
            </div>
            {section.description && (
              <p className="mb-3 text-sm text-muted-foreground">{section.description}</p>
            )}
            <ol className="space-y-2">
              {section.lessons.map((lesson, i) => {
                const isAccessible = !lesson.locked
                return (
                  <li
                    key={lesson.id}
                    className="flex items-center justify-between rounded-md border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <LessonStatusBadge lesson={lesson} index={i + 1} />
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {lesson.estimated_minutes && <span>~{lesson.estimated_minutes} phút</span>}
                          {lesson.has_quiz && (
                            <span>· Quiz cần đạt {lesson.pass_threshold}%</span>
                          )}
                          {lesson.best_quiz_score !== null && (
                            <span
                              className={
                                lesson.passed ? 'text-green-600' : 'text-amber-600'
                              }
                            >
                              · Điểm cao nhất: {lesson.best_quiz_score}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isAccessible ? (
                      <Link
                        href={`/courses/${slug}/lessons/${lesson.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {lesson.passed ? 'Xem lại' : 'Học →'}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-3" />
                        {isEnrolled ? 'Hoàn thành bài trước' : 'Cần đăng ký'}
                      </span>
                    )}
                  </li>
                )
              })}
              {section.lessons.length === 0 && (
                <li className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Module này chưa có bài học.
                </li>
              )}
            </ol>
          </section>
        ))
      )}
    </div>
  )
}

function LessonStatusBadge({ lesson, index }: { lesson: LessonWithProgress; index: number }) {
  if (lesson.passed) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
        <CheckCircle2 className="size-4" />
      </span>
    )
  }
  if (lesson.locked) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-3" />
      </span>
    )
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
      {index}
    </span>
  )
}
