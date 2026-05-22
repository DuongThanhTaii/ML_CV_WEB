import { createServerSupabase } from '@/lib/supabase/server'
import { datasetService } from '@/services/dataset.service'
import { DatasetUploader } from '@/components/dataset/dataset-uploader'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Database } from 'lucide-react'

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default async function DatasetsPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: mine } = await datasetService.listMine(supabase, user!.id)
  const { data: publicDs } = await datasetService.listPublic(supabase)

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dữ liệu</h1>
          <p className="text-sm text-muted-foreground">Upload CSV, ảnh, JSON để thực hành.</p>
        </div>
        <DatasetUploader />
      </header>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Của tôi</h2>
        {mine?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {mine.map((d) => (
              <Link
                key={d.id}
                href={`/datasets/${d.id}`}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 transition hover:border-primary"
              >
                <Database className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{d.name}</span>
                    <Badge variant="outline">{d.dataset_type}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatSize(d.size_bytes)}
                    {d.row_count && ` · ${d.row_count} dòng`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Bạn chưa có dataset nào.
          </p>
        )}
      </section>

      {publicDs && publicDs.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Dataset công khai</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {publicDs.map((d) => (
              <div key={d.id} className="rounded-lg border bg-card p-4">
                <div className="font-medium">{d.name}</div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
