import { createServerSupabase } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowUpRight, Signal } from 'lucide-react'

export default async function CoursesPage() {
  const supabase = await createServerSupabase()
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title, description, category, difficulty')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Khóa học</h1>
        <p className="text-muted-foreground">Chọn khóa học để bắt đầu hành trình ML/CV.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses?.map((c) => (
          <Link
            key={c.id}
            href={`/courses/${c.slug}`}
            className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-5 transition-all hover:border-primary/40 hover:bg-card hover:shadow-elevated"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-center justify-between">
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-primary">
                {c.category}
              </span>
              <DifficultyMeter level={c.difficulty ?? 0} />
            </div>
            <h3 className="mt-3.5 font-semibold tracking-tight group-hover:text-primary">
              {c.title}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {c.description}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Bắt đầu học <ArrowUpRight className="size-3.5" />
            </div>
          </Link>
        ))}
        {(!courses || courses.length === 0) && (
          <div className="col-span-full rounded-xl border border-dashed border-border/60 bg-card/30 p-12 text-center text-muted-foreground">
            Chưa có khóa học nào được publish.
          </div>
        )}
      </div>
    </div>
  )
}

function DifficultyMeter({ level }: { level: number }) {
  return (
    <span
      className="flex items-center gap-0.5 text-muted-foreground"
      title={`Độ khó ${level}/5`}
      aria-label={`Độ khó ${level}/5`}
    >
      <Signal className="size-3.5" />
      <span className="text-xs font-medium tabular-nums">{level}/5</span>
    </span>
  )
}
