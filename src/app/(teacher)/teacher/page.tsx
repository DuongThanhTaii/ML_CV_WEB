import { createServerSupabase } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeacherHomePage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { count: courseCount } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', user!.id)

  const { count: pendingCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'manual_review')

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Bảng điều khiển giáo viên</h1>
        <p className="text-sm text-muted-foreground">Quản lý khóa học và theo dõi sinh viên.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Số khóa học" value={courseCount ?? 0} />
        <Stat label="Cần chấm tay" value={pendingCount ?? 0} />
        <Stat label="Sinh viên đang học" value="—" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/teacher/courses/new"
          className="rounded-lg border bg-card p-5 transition hover:border-primary"
        >
          <div className="text-lg font-semibold">+ Tạo khóa học mới</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Bắt đầu một khóa học từ đầu.
          </p>
        </Link>
        <Link
          href="/teacher/courses"
          className="rounded-lg border bg-card p-5 transition hover:border-primary"
        >
          <div className="text-lg font-semibold">📚 Khóa học của tôi</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý lessons, assignments, submissions.
          </p>
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  )
}
