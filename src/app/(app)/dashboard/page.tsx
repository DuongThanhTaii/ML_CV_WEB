import { createServerSupabase } from '@/lib/supabase/server'
import { courseService } from '@/services/course.service'
import { submissionService } from '@/services/submission.service'
import { profileService } from '@/services/profile.service'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  FlaskConical,
  GraduationCap,
  NotebookPen,
} from 'lucide-react'

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
    <div className="space-y-10">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">
          Chào {profile?.full_name || 'bạn'}
        </h1>
        <p className="text-muted-foreground">
          Tiếp tục học hoặc thử nghiệm trong playground.
        </p>
      </header>

      {isTeacher && (
        <Link
          href="/teacher"
          className="group flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 transition-all hover:border-primary/50 hover:shadow-elevated"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <div className="font-medium tracking-tight">Bạn là giáo viên</div>
              <div className="text-sm text-muted-foreground">
                Truy cập bảng điều khiển giáo viên
              </div>
            </div>
          </div>
          <ArrowUpRight className="size-5 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Khóa học của bạn</h2>
            <p className="text-sm text-muted-foreground">
              Tiếp tục từ chỗ bạn đã dừng lại.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/courses">
              Xem tất cả <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        {enrollments?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => {
              const course = (
                e as unknown as {
                  courses: { id: string; slug: string; title: string; category: string | null }
                }
              ).courses
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group rounded-xl border border-border/60 bg-card/40 p-5 transition-all hover:border-primary/40 hover:bg-card hover:shadow-elevated"
                >
                  <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>{course.category}</span>
                    <span className="text-foreground/80">{e.progress_pct}%</span>
                  </div>
                  <div className="mt-2 font-medium tracking-tight group-hover:text-primary">
                    {course.title}
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                      style={{ width: `${e.progress_pct}%` }}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-10 text-center">
            <p className="text-muted-foreground">Bạn chưa đăng ký khóa học nào.</p>
            <Button asChild className="mt-4">
              <Link href="/courses">Khám phá khóa học</Link>
            </Button>
          </div>
        )}
      </section>

      {submissions && submissions.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Submission gần đây</h2>
            <p className="text-sm text-muted-foreground">
              5 bài nộp mới nhất của bạn.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
            <ul className="divide-y divide-border/60">
              {submissions.map((s) => {
                const g = (s as { grading_results: Array<{ score: number; max_score: number }> })
                  .grading_results?.[0]
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between p-4 text-sm transition-colors hover:bg-accent/30"
                  >
                    <div>
                      <div className="font-medium">Lần #{s.attempt_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(s.submitted_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {g && (
                        <span className="font-mono text-sm tabular-nums">
                          {Number(g.score).toFixed(1)}/{Number(g.max_score).toFixed(0)}
                        </span>
                      )}
                      <Badge variant={s.status === 'graded' ? 'success' : 'outline'}>
                        {s.status}
                      </Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Bắt đầu nhanh</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickAction
            href="/playground"
            icon={<FlaskConical className="size-5" />}
            title="Playground"
            desc="Notebook trống — thử nghiệm Python."
          />
          <QuickAction
            href="/ai-tutor"
            icon={<Bot className="size-5" />}
            title="AI Tutor"
            desc="Hỏi AI bất cứ điều gì về ML/CV."
          />
          <QuickAction
            href="/notebook"
            icon={<NotebookPen className="size-5" />}
            title="Notebook đã lưu"
            desc="Tiếp tục thí nghiệm đã có."
          />
        </div>
      </section>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3.5 rounded-xl border border-border/60 bg-card/40 p-5 transition-all hover:border-primary/40 hover:bg-card hover:shadow-elevated"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-gradient-to-br from-primary/15 to-primary/0 text-primary transition-colors group-hover:border-primary/40">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-medium tracking-tight group-hover:text-primary">{title}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{desc}</div>
      </div>
    </Link>
  )
}
