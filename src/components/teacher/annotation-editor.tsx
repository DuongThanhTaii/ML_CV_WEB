'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { annotationService } from '@/services/annotation.service'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Square, Pentagon, MousePointer2, Trash2 } from 'lucide-react'

export interface EditorAnnotation {
  id?: string // undefined for in-progress, set after save
  shape_type: 'bbox' | 'polygon'
  coordinates: number[] | number[][]
  label: string
  color?: string | null
}

interface Props {
  datasetId: string
  imagePath: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
  initial: EditorAnnotation[]
  onChange?: (anns: EditorAnnotation[]) => void
}

type Mode = 'select' | 'bbox' | 'polygon'

const COLOR_PALETTE = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7']

export function AnnotationEditor({
  datasetId,
  imagePath,
  imageUrl,
  imageWidth,
  imageHeight,
  initial,
  onChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [mode, setMode] = useState<Mode>('select')
  const [annotations, setAnnotations] = useState<EditorAnnotation[]>(initial)
  const [draftLabel, setDraftLabel] = useState('object')
  const [draftBbox, setDraftBbox] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  )
  const [draftPolygon, setDraftPolygon] = useState<Array<[number, number]>>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    onChange?.(annotations)
  }, [annotations, onChange])

  // Convert client mouse coords -> image pixel coords via SVG viewBox math
  function eventToImageCoords(e: React.MouseEvent<SVGSVGElement>): [number, number] | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * imageWidth
    const y = ((e.clientY - rect.top) / rect.height) * imageHeight
    return [Math.max(0, Math.min(imageWidth, x)), Math.max(0, Math.min(imageHeight, y))]
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    const coords = eventToImageCoords(e)
    if (!coords) return
    if (mode === 'bbox') {
      setDraftBbox({ x: coords[0], y: coords[1], w: 0, h: 0 })
    } else if (mode === 'polygon') {
      setDraftPolygon((prev) => [...prev, coords])
    }
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (mode !== 'bbox' || !draftBbox) return
    const coords = eventToImageCoords(e)
    if (!coords) return
    setDraftBbox({
      x: Math.min(draftBbox.x, coords[0]),
      y: Math.min(draftBbox.y, coords[1]),
      w: Math.abs(coords[0] - draftBbox.x),
      h: Math.abs(coords[1] - draftBbox.y),
    })
  }

  function handleMouseUp() {
    if (mode === 'bbox' && draftBbox && draftBbox.w > 4 && draftBbox.h > 4) {
      const newAnn: EditorAnnotation = {
        shape_type: 'bbox',
        coordinates: [draftBbox.x, draftBbox.y, draftBbox.w, draftBbox.h],
        label: draftLabel || 'object',
        color: COLOR_PALETTE[annotations.length % COLOR_PALETTE.length],
      }
      setAnnotations((prev) => [...prev, newAnn])
    }
    setDraftBbox(null)
  }

  function handleDoubleClick() {
    if (mode === 'polygon' && draftPolygon.length >= 3) {
      const newAnn: EditorAnnotation = {
        shape_type: 'polygon',
        coordinates: draftPolygon,
        label: draftLabel || 'object',
        color: COLOR_PALETTE[annotations.length % COLOR_PALETTE.length],
      }
      setAnnotations((prev) => [...prev, newAnn])
      setDraftPolygon([])
    }
  }

  function handleRemove(idx: number) {
    setAnnotations((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleCancelDraft() {
    setDraftBbox(null)
    setDraftPolygon([])
  }

  async function handleSaveAll() {
    setSaving(true)
    const supabase = createBrowserSupabase()
    try {
      // Replace strategy: wipe existing ground truth for this image, re-insert all
      await annotationService.clearForImage(supabase, datasetId, imagePath, true)
      for (const ann of annotations) {
        const { error } = await annotationService.create(supabase, {
          dataset_id: datasetId,
          image_path: imagePath,
          shape_type: ann.shape_type,
          coordinates: ann.coordinates as never,
          label: ann.label,
          color: ann.color ?? null,
          is_ground_truth: true,
        })
        if (error) throw error
      }
      toast({ title: `Đã lưu ${annotations.length} annotation`, variant: 'success' })
    } catch (e) {
      toast({
        title: 'Lỗi lưu annotation',
        description: e instanceof Error ? e.message : 'Unknown',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function exportCoco() {
    const coco = {
      images: [{ id: 1, file_name: imagePath, width: imageWidth, height: imageHeight }],
      categories: [...new Set(annotations.map((a) => a.label))].map((label, i) => ({
        id: i + 1,
        name: label,
      })),
      annotations: annotations.map((ann, i) => {
        const catId = [...new Set(annotations.map((a) => a.label))].indexOf(ann.label) + 1
        if (ann.shape_type === 'bbox') {
          const [x, y, w, h] = ann.coordinates as number[]
          return {
            id: i + 1,
            image_id: 1,
            category_id: catId,
            bbox: [x, y, w, h],
            area: (w ?? 0) * (h ?? 0),
            iscrowd: 0,
          }
        }
        // polygon
        const poly = ann.coordinates as number[][]
        const xs = poly.map((p) => p[0]!)
        const ys = poly.map((p) => p[1]!)
        const x = Math.min(...xs)
        const y = Math.min(...ys)
        const w = Math.max(...xs) - x
        const h = Math.max(...ys) - y
        return {
          id: i + 1,
          image_id: 1,
          category_id: catId,
          segmentation: [poly.flat()],
          bbox: [x, y, w, h],
          area: w * h,
          iscrowd: 0,
        }
      }),
    }
    const blob = new Blob([JSON.stringify(coco, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${imagePath.replace(/\W+/g, '_')}_coco.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border">
          <ToolButton active={mode === 'select'} onClick={() => setMode('select')} label="Chọn">
            <MousePointer2 className="size-4" />
          </ToolButton>
          <ToolButton active={mode === 'bbox'} onClick={() => setMode('bbox')} label="Bbox">
            <Square className="size-4" />
          </ToolButton>
          <ToolButton active={mode === 'polygon'} onClick={() => setMode('polygon')} label="Polygon">
            <Pentagon className="size-4" />
          </ToolButton>
        </div>
        <Input
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          placeholder="Nhãn (vd: dog, person)"
          className="w-40"
        />
        {(draftBbox || draftPolygon.length > 0) && (
          <Button variant="outline" size="sm" onClick={handleCancelDraft}>
            Hủy nháp
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCoco}>
            Export COCO
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Lưu ground truth ({annotations.length})
          </Button>
        </div>
      </div>

      {mode === 'polygon' && (
        <p className="text-xs text-muted-foreground">
          Click từng điểm để vẽ polygon. <strong>Double-click</strong> để đóng polygon.
        </p>
      )}

      <div className="relative inline-block max-w-full overflow-hidden rounded-md border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imagePath}
          className="block max-h-[70vh] max-w-full"
          draggable={false}
        />
        <svg
          ref={svgRef}
          viewBox={`0 0 ${imageWidth} ${imageHeight}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          style={{ cursor: mode === 'select' ? 'default' : 'crosshair' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        >
          {/* Existing annotations */}
          {annotations.map((ann, i) => {
            const color = ann.color ?? COLOR_PALETTE[i % COLOR_PALETTE.length]
            if (ann.shape_type === 'bbox') {
              const [x, y, w, h] = ann.coordinates as number[]
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill="none"
                    stroke={color}
                    strokeWidth={Math.max(2, imageWidth / 400)}
                  />
                  <text x={x! + 4} y={y! + imageHeight * 0.03} fill={color!} fontSize={imageHeight * 0.025} fontWeight={700}>
                    {ann.label}
                  </text>
                </g>
              )
            }
            const points = (ann.coordinates as number[][]).map((p) => `${p[0]},${p[1]}`).join(' ')
            return (
              <polygon
                key={i}
                points={points}
                fill={color!}
                fillOpacity={0.25}
                stroke={color!}
                strokeWidth={Math.max(2, imageWidth / 400)}
              />
            )
          })}
          {/* Draft bbox */}
          {draftBbox && (
            <rect
              x={draftBbox.x}
              y={draftBbox.y}
              width={draftBbox.w}
              height={draftBbox.h}
              fill="rgba(59,130,246,0.2)"
              stroke="#3b82f6"
              strokeWidth={Math.max(2, imageWidth / 400)}
              strokeDasharray={imageWidth / 80}
            />
          )}
          {/* Draft polygon */}
          {draftPolygon.length > 0 && (
            <g>
              {draftPolygon.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={Math.max(3, imageWidth / 200)} fill="#3b82f6" />
              ))}
              {draftPolygon.length > 1 && (
                <polyline
                  points={draftPolygon.map((p) => `${p[0]},${p[1]}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={Math.max(2, imageWidth / 400)}
                  strokeDasharray={imageWidth / 80}
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {annotations.length > 0 && (
        <div className="rounded-md border">
          <ul className="divide-y">
            {annotations.map((ann, i) => (
              <li key={i} className="flex items-center justify-between gap-3 p-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded"
                    style={{ background: ann.color ?? COLOR_PALETTE[i % COLOR_PALETTE.length] }}
                  />
                  <span className="font-medium">{ann.label}</span>
                  <span className="text-xs text-muted-foreground">({ann.shape_type})</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(i)}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ToolButton({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center first:rounded-l-md last:rounded-r-md ${
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}
