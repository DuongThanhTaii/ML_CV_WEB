import { createServerSupabase } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CoursesPage() {
  const supabase = await createServerSupabase()
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title, description, category, difficulty')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Khóa học</h1>
        <p className="text-muted-foreground">Chọn khóa học để bắt đầu hành trình ML/CV.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses?.map((c) => (
          <Link
            key={c.id}
            href={`/courses/${c.slug}`}
            className="group rounded-lg border bg-card p-5 transition hover:border-primary"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="rounded bg-primary/10 px-2 py-0.5 uppercase text-primary">
                {c.category}
              </span>
              <span className="text-muted-foreground">Độ khó {c.difficulty}/5</span>
            </div>
            <h3 className="mt-3 font-semibold group-hover:text-primary">{c.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
