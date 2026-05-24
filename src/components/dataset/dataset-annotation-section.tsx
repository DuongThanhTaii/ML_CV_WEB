'use client'

import { useEffect, useState } from 'react'
import { ImageGallery, type GalleryImage } from '@/components/dataset/image-gallery'
import { AnnotationEditor, type EditorAnnotation } from '@/components/teacher/annotation-editor'
import { Button } from '@/components/ui/button'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { annotationService } from '@/services/annotation.service'
import { ChevronLeft, Pencil } from 'lucide-react'

interface Props {
  datasetId: string
  images: GalleryImage[]
  isOwner: boolean
}

/**
 * Two-mode panel: grid of images → click → annotation editor for that image.
 * Only owners can edit; viewers just see the gallery.
 */
export function DatasetAnnotationSection({ datasetId, images, isOwner }: Props) {
  const [selected, setSelected] = useState<GalleryImage | null>(null)
  const [initialAnns, setInitialAnns] = useState<EditorAnnotation[]>([])
  const [loadingAnns, setLoadingAnns] = useState(false)

  useEffect(() => {
    if (!selected) return
    setLoadingAnns(true)
    const supabase = createBrowserSupabase()
    annotationService
      .listByImage(supabase, datasetId, selected.path)
      .then((rows) => {
        setInitialAnns(
          rows
            .filter((r) => r.shape_type !== 'point') // editor supports bbox + polygon
            .map((r) => ({
              id: r.id,
              shape_type: r.shape_type as 'bbox' | 'polygon',
              coordinates: r.coordinates as number[] | number[][],
              label: r.label,
              color: r.color,
            })),
        )
      })
      .finally(() => setLoadingAnns(false))
  }, [selected, datasetId])

  if (!selected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? 'Click vào ảnh để vẽ ground-truth annotation cho dataset.'
              : 'Click vào ảnh để xem chi tiết.'}
          </p>
          <span className="text-xs text-muted-foreground">{images.length} ảnh</span>
        </div>
        <ImageGallery images={images} />
        {isOwner && images.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-md border bg-muted/30 p-3">
            {images.slice(0, 12).map((img) => (
              <Button
                key={img.path}
                variant="outline"
                size="sm"
                onClick={() => setSelected(img)}
              >
                <Pencil className="size-3" />
                {img.label ?? img.path.split('/').pop()}
              </Button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!isOwner) {
    // Should not reach here, but defensive
    return null
  }

  if (loadingAnns) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Đang tải annotations…</div>
  }

  const width = selected.width ?? 800
  const height = selected.height ?? 600

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
        <ChevronLeft className="size-4" /> Quay lại danh sách ảnh
      </Button>
      <div className="text-sm font-medium">
        Annotating: <code>{selected.path}</code>
      </div>
      <AnnotationEditor
        datasetId={datasetId}
        imagePath={selected.path}
        imageUrl={selected.url}
        imageWidth={width}
        imageHeight={height}
        initial={initialAnns}
      />
    </div>
  )
}
