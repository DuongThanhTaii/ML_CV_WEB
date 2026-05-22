import { createServerSupabase } from '@/lib/supabase/server'
import { notebookService } from '@/services/notebook.service'
import { notFound } from 'next/navigation'
import { NotebookEditor } from '@/components/notebook/notebook-editor'
import type { NotebookCell } from '@/types/notebook'

export default async function NotebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: notebook, error } = await notebookService.getById(supabase, id)
  if (error || !notebook) notFound()

  const cells = (notebook.cells_json ?? []) as unknown as NotebookCell[]

  return (
    <NotebookEditor
      notebookId={notebook.id}
      initialTitle={notebook.title ?? 'Untitled'}
      initialCells={cells}
    />
  )
}
