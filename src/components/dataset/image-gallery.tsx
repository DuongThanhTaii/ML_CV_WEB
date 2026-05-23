'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export interface GalleryImage {
  path: string
  url: string
  label?: string | null
  width?: number
  height?: number
}

interface Props {
  images: GalleryImage[]
  emptyMessage?: string
  /** Optional overlay renderer per image (e.g., for annotations) */
  renderOverlay?: (img: GalleryImage, displayWidth: number, displayHeight: number) => React.ReactNode
}

/**
 * Grid + lightbox image gallery for dataset previews.
 * Lazy loads thumbnails via native loading="lazy".
 */
export function ImageGallery({
  images,
  emptyMessage = 'Dataset không có ảnh.',
  renderOverlay,
}: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const active = activeIdx !== null ? images[activeIdx] : null

  if (images.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  function goPrev() {
    setActiveIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length))
  }
  function goNext() {
    setActiveIdx((i) => (i === null ? null : (i + 1) % images.length))
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.path}
            type="button"
            onClick={() => setActiveIdx(i)}
            className="group relative aspect-square overflow-hidden rounded-md border bg-muted transition-transform hover:scale-[1.02] hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.label ?? img.path}
              loading="lazy"
              className="size-full object-cover"
            />
            {img.label && (
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {img.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {active && (
        <Lightbox
          image={active}
          index={activeIdx!}
          total={images.length}
          onPrev={goPrev}
          onNext={goNext}
          onClose={() => setActiveIdx(null)}
          renderOverlay={renderOverlay}
        />
      )}
    </>
  )
}

function Lightbox({
  image,
  index,
  total,
  onPrev,
  onNext,
  onClose,
  renderOverlay,
}: {
  image: GalleryImage
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  renderOverlay?: Props['renderOverlay']
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Đóng"
      >
        <X className="size-5" />
      </button>
      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Trước"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Sau"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
      <div
        className="relative max-h-full max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.label ?? image.path}
          className="max-h-[85vh] max-w-[90vw] rounded-md object-contain"
        />
        {renderOverlay && image.width && image.height && (
          <div className="pointer-events-none absolute inset-0">
            {renderOverlay(image, image.width, image.height)}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-md bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
          <div className="text-sm font-medium">{image.label ?? image.path}</div>
          <div className="text-xs opacity-70">
            {index + 1} / {total}
            {image.width && image.height && ` · ${image.width}×${image.height}`}
          </div>
        </div>
      </div>
    </div>
  )
}
