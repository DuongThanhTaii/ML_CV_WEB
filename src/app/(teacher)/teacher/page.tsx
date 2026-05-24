import { createServerSupabase } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, ClipboardList, Plus, Users } from 'lucide-react'

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
    <div className="space-y-10">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển giáo viên</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý khóa học và theo dõi sinh viên.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Số khóa học"
          value={courseCount ?? 0}
          icon={<BookOpen className="size-4" />}
        />
        <Stat
          label="Cần chấm tay"
          value={pendingCount ?? 0}
          icon={<ClipboardList className="size-4" />}
          accent={pendingCount && pendingCount > 0 ? 'amber' : undefined}
        />
        <Stat
          label="Sinh viên đang học"
          value="—"
          icon={<Users className="size-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          href="/teacher/courses/new"
          title="Tạo khóa học mới"
          desc="Bắt đầu một khóa học từ đầu."
          icon={<Plus className="size-5" />}
          accent
        />
        <ActionCard
          href="/teacher/courses"
          title="Khóa học của tôi"
          desc="Quản lý lessons, assignments, submissions."
          icon={<BookOpen className="size-5" />}
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: 'amber'
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={
            accent === 'amber'
              ? 'flex size-7 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'flex size-7 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground'
          }
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
    </div>
  )
}

function ActionCard({
  href,
  title,
  desc,
  icon,
  accent,
}: {
  href: string
  title: string
  desc: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={
        accent
          ? 'group flex items-start gap-3.5 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 transition-all hover:border-primary/50 hover:shadow-elevated'
          : 'group flex items-start gap-3.5 rounded-xl border border-border/60 bg-card/40 p-5 transition-all hover:border-primary/40 hover:bg-card hover:shadow-elevated'
      }
    >
      <span
        className={
          accent
            ? 'flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/15 text-primary'
            : 'flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-gradient-to-br from-primary/15 to-primary/0 text-primary transition-colors group-hover:border-primary/40'
        }
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-base font-semibold tracking-tight group-hover:text-primary">
          {title}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
      </div>
    </Link>
  )
}
