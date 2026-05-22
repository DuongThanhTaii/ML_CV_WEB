import { createServerSupabase } from '@/lib/supabase/server'

export default async function TeacherAnalyticsPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('teacher_id', user!.id)

  const { count: enrolled } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .in('course_id', courses?.map((c) => c.id) ?? [])

  const { data: submissionStats } = await supabase
    .from('submissions')
    .select('status, assignment_id, assignments!inner(course_id)')
    .in('assignments.course_id', courses?.map((c) => c.id) ?? [])

  const stats = {
    total: submissionStats?.length ?? 0,
    graded: submissionStats?.filter((s) => s.status === 'graded').length ?? 0,
    pending:
      submissionStats?.filter((s) => s.status === 'pending' || s.status === 'running').length ?? 0,
    errors: submissionStats?.filter((s) => s.status === 'error').length ?? 0,
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Tổng quan hoạt động học của sinh viên.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Khóa học" value={courses?.length ?? 0} />
        <Stat label="Lượt đăng ký" value={enrolled ?? 0} />
        <Stat label="Tổng submission" value={stats.total} />
        <Stat label="Lỗi chấm" value={stats.errors} />
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">Phân bố trạng thái</h2>
        <div className="space-y-2">
          <Bar label="Đã chấm" value={stats.graded} total={stats.total} color="bg-emerald-500" />
          <Bar label="Đang xử lý" value={stats.pending} total={stats.total} color="bg-amber-500" />
          <Bar label="Lỗi" value={stats.errors} total={stats.total} color="bg-destructive" />
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  )
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground">
          {value} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
