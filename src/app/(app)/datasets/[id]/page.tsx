import { createServerSupabase } from '@/lib/supabase/server'
import { datasetService } from '@/services/dataset.service'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { DatasetActions } from '@/components/dataset/dataset-actions'
import { DatasetAnnotationSection } from '@/components/dataset/dataset-annotation-section'
import type { GalleryImage } from '@/components/dataset/image-gallery'

interface PreviewShape {
  images?: Array<{ path: string; url?: string; label?: string; width?: number; height?: number }>
}

export default async function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: dataset, error } = await datasetService.getById(supabase, id)
  if (error || !dataset) notFound()

  const { data: signed } = await datasetService.signedUrl(supabase, dataset.storage_path, 3600)
  const isOwner = !!user && user.id === dataset.owner_id

  const preview = dataset.preview as PreviewShape | null
  const isImageFolder = dataset.dataset_type === 'image_folder'
  const images: GalleryImage[] =
    (preview?.images ?? [])
      .filter((i) => !!i.url)
      .map((i) => ({
        path: i.path,
        url: i.url!,
        label: i.label ?? null,
        width: i.width,
        height: i.height,
      }))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{dataset.dataset_type}</Badge>
          {dataset.is_public && <Badge variant="secondary">Public</Badge>}
        </div>
        <h1 className="mt-2 text-2xl font-bold">{dataset.name}</h1>
        <p className="text-sm text-muted-foreground">{dataset.description}</p>
      </header>

      {isImageFolder && images.length > 0 ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Ảnh trong dataset</h2>
          <DatasetAnnotationSection datasetId={dataset.id} images={images} isOwner={isOwner} />
        </section>
      ) : (
        dataset.preview && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">Xem trước</h2>
            <pre className="overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
              {JSON.stringify(dataset.preview, null, 2)}
            </pre>
          </section>
        )
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
