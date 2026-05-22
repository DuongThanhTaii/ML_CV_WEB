import { createServerSupabase } from '@/lib/supabase/server'
import { notebookService } from '@/services/notebook.service'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { CreateNotebookButton } from '@/components/notebook/create-notebook-button'

export default async function NotebookListPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: notebooks } = await notebookService.listMine(supabase, user!.id)

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notebook của tôi</h1>
          <p className="text-sm text-muted-foreground">Lưu và tiếp tục các thí nghiệm Python.</p>
        </div>
        <CreateNotebookButton />
      </header>

      {notebooks?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((nb) => (
            <Link
              key={nb.id}
              href={`/notebook/${nb.id}`}
              className="rounded-lg border bg-card p-4 transition hover:border-primary"
            >
              <div className="font-medium">{nb.title || 'Untitled'}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Cập nhật {formatDate(nb.updated_at)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Bạn chưa có notebook nào.</p>
          <div className="mt-4 flex justify-center gap-2">
            <CreateNotebookButton />
            <Button asChild variant="outline">
              <Link href="/playground">Mở playground</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
