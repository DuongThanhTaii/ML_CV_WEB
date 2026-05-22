import { createServerSupabase } from '@/lib/supabase/server'
import { datasetService } from '@/services/dataset.service'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { DatasetActions } from '@/components/dataset/dataset-actions'

export default async function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: dataset, error } = await datasetService.getById(supabase, id)
  if (error || !dataset) notFound()

  const { data: signed } = await datasetService.signedUrl(supabase, dataset.storage_path, 3600)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{dataset.dataset_type}</Badge>
          {dataset.is_public && <Badge variant="secondary">Public</Badge>}
        </div>
        <h1 className="mt-2 text-2xl font-bold">{dataset.name}</h1>
        <p className="text-sm text-muted-foreground">{dataset.description}</p>
      </header>

      {dataset.preview && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Xem trước</h2>
          <pre className="overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
            {JSON.stringify(dataset.preview, null, 2)}
          </pre>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold">Sử dụng trong notebook</h2>
        <pre className="overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
{`# Trong notebook, tải URL signed này (hết hạn 1h):
import pandas as pd
df = pd.read_csv("${signed?.signedUrl ?? '<signed-url>'}")
df.head()`}
        </pre>
      </section>

      <DatasetActions datasetId={dataset.id} storagePath={dataset.storage_path} />
    </div>
  )
}
