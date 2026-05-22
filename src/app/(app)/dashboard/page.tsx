import { createServerSupabase } from '@/lib/supabase/server'
import { courseService } from '@/services/course.service'
import { submissionService } from '@/services/submission.service'
import { profileService } from '@/services/profile.service'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { GraduationCap } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: enrollments }, { data: submissions }, { data: profile }] = await Promise.all([
    courseService.listMyCourses(supabase, user!.id),
    submissionService.listMine(supabase, user!.id, 5),
    profileService.getById(supabase, user!.id),
  ])

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Chào {profile?.full_name || 'bạn'} 👋</h1>
        <p className="text-muted-foreground">Tiếp tục học hoặc thử nghiệm trong playground.</p>
      </header>

      {isTeacher && (
        <Link
          href="/teacher"
          className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4 transition hover:bg-primary/10"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="size-5 text-primary" />
            <div>
              <div className="font-medium">Bạn là giáo viên</div>
              <div className="text-sm text-muted-foreground">Truy cập bảng điều khiển giáo viên</div>
            </div>
          </div>
          <span className="text-primary">→</span>
        </Link>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Khóa học của bạn</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/courses">Xem tất cả</Link>
          </Button>
        </div>
        {enrollments?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => {
              // Supabase nested select returns single object even though typed as array in older inferences
              const course = (e as unknown as { courses: { id: string; slug: string; title: string; category: string | null } }).courses
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="rounded-lg border bg-card p-4 transition hover:border-primary"
                >
                  <div className="text-xs uppercase text-muted-foreground">{course.category}</div>
                  <div className="mt-1 font-medium">{course.title}</div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${e.progress_pct}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{e.progress_pct}% hoàn thành</div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">Bạn chưa đăng ký khóa học nào.</p>
            <Button asChild className="mt-4">
              <Link href="/courses">Khám phá khóa học</Link>
            </Button>
          </div>
        )}
      </section>

      {submissions && submissions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Submission gần đây</h2>
          <div className="rounded-md border">
            <ul className="divide-y">
              {submissions.map((s) => {
                const g = (s as { grading_results: Array<{ score: number; max_score: number }> })
                  .grading_results?.[0]
                return (
                  <li key={s.id} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <div className="font-medium">Lần #{s.attempt_number}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(s.submitted_at)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {g && (
                        <span className="font-mono">
                          {Number(g.score).toFixed(1)}/{Number(g.max_score).toFixed(0)}
                        </span>
                      )}
                      <Badge variant={s.status === 'graded' ? 'success' : 'outline'}>{s.status}</Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Bắt đầu nhanh</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/playground" className="rounded-lg border bg-card p-4 transition hover:border-primary">
            <div className="font-medium">🧪 Playground</div>
            <div className="mt-1 text-sm text-muted-foreground">Notebook trống.</div>
          </Link>
          <Link href="/ai-tutor" className="rounded-lg border bg-card p-4 transition hover:border-primary">
            <div className="font-medium">🤖 AI Tutor</div>
            <div className="mt-1 text-sm text-muted-foreground">Hỏi AI bất cứ điều gì.</div>
          </Link>
          <Link href="/notebook" className="rounded-lg border bg-card p-4 transition hover:border-primary">
            <div className="font-medium">📓 Notebook đã lưu</div>
            <div className="mt-1 text-sm text-muted-foreground">Tiếp tục thí nghiệm.</div>
          </Link>
        </div>
      </section>
    </div>
  )
}
