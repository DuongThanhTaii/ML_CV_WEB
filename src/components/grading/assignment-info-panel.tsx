'use client'

import { useEffect, useState } from 'react'
import { ImageGallery, type GalleryImage } from '@/components/dataset/image-gallery'
import { Download, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { IoSpec } from '@/components/teacher/assignment-io-spec-editor'

interface DatasetEntry {
  role: 'train' | 'test' | 'validation' | 'reference'
  id: string
  name: string
  description: string | null
  dataset_type: 'csv' | 'image_folder' | 'json' | 'parquet'
  preview: unknown | null
  signed_url: string | null
}

interface Props {
  assignmentId: string
  ioSpec: IoSpec | null
}

/**
 * Read-only panel shown to students inside an AssignmentPanel.
 * Loads datasets via /api/assignments/:id/datasets (signed URLs, test-role hidden).
 */
export function AssignmentInfoPanel({ assignmentId, ioSpec }: Props) {
  const [datasets, setDatasets] = useState<DatasetEntry[] | null>(null)

  useEffect(() => {
    fetch(`/api/assignments/${assignmentId}/datasets`)
      .then((r) => (r.ok ? r.json() : { datasets: [] }))
      .then((j) => setDatasets(j.datasets ?? []))
      .catch(() => setDatasets([]))
  }, [assignmentId])

  const hasContent = ioSpec || (datasets && datasets.length > 0)
  if (!hasContent) return null

  return (
    <div className="border-b bg-muted/20 p-4 space-y-4">
      {ioSpec && <IoSpecCard spec={ioSpec} />}
      {datasets && datasets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Database className="size-4" /> Datasets ({datasets.length})
          </div>
          <div className="space-y-3">
            {datasets.map((d) => (
              <DatasetCard key={`${d.id}-${d.role}`} dataset={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IoSpecCard({ spec }: { spec: IoSpec }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-2 text-sm font-medium">Yêu cầu input / output</div>
      <pre className="overflow-auto rounded-md bg-muted/40 p-2 font-mono text-xs">
        {renderSignature(spec)}
      </pre>
      {spec.algorithm_hint && (
        <div className="mt-2 rounded-md bg-blue-50 p-2 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
          <strong>{spec.algorithm_required ? 'Bắt buộc' : 'Gợi ý'}:</strong>{' '}
          {spec.algorithm_hint}
        </div>
      )}
    </div>
  )
}

function renderSignature(spec: IoSpec): string {
  const args = spec.inputs.map((i) => `${i.name}: ${i.type}${i.shape ? ' ' + i.shape : ''}`).join(', ')
  const out = spec.outputs
    .map((o) => `${o.name}: ${o.type}${o.shape ? ' ' + o.shape : ''}${o.dtype ? ' [' + o.dtype + ']' : ''}`)
    .join(', ')
  return `def ${spec.function_name}(${args}) -> ${spec.outputs.length > 1 ? `(${out})` : out}`
}

function DatasetCard({ dataset }: { dataset: DatasetEntry }) {
  const isImageFolder = dataset.dataset_type === 'image_folder'
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            {dataset.name}
            <Badge variant="outline" className="text-[10px]">
              {dataset.role}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {dataset.dataset_type}
            </Badge>
          </div>
          {dataset.description && (
            <p className="mt-1 text-xs text-muted-foreground">{dataset.description}</p>
          )}
        </div>
        {dataset.signed_url && (
          <a
            href={dataset.signed_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs hover:bg-muted"
          >
            <Download className="size-3" /> Tải về
          </a>
        )}
      </div>

      {isImageFolder &&
        dataset.preview != null &&
        Array.isArray((dataset.preview as { images?: unknown }).images) && (
          <ImageGalleryPreview preview={dataset.preview} />
        )}

      {!isImageFolder && dataset.preview != null && (
        <details className="rounded-md border bg-muted/40">
          <summary className="cursor-pointer p-2 text-xs font-medium">Preview</summary>
          <pre className="max-h-60 overflow-auto p-2 font-mono text-xs">
            {JSON.stringify(dataset.preview, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

interface PreviewShape {
  images?: Array<{ path: string; url?: string; label?: string; width?: number; height?: number }>
}

function ImageGalleryPreview({ preview }: { preview: unknown }) {
  const p = preview as PreviewShape
  const images: GalleryImage[] = (p.images ?? [])
    .filter((i) => !!i.url)
    .map((i) => ({
      path: i.path,
      url: i.url!,
      label: i.label,
      width: i.width,
      height: i.height,
    }))
  if (images.length === 0) return null
  return (
    <div className="mt-2">
      <ImageGallery images={images} />
    </div>
  )
}
