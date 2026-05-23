'use client'

import { Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  signedUrl: string
  filename?: string
}

/**
 * Lightweight PDF viewer using the browser's native PDF rendering via <iframe>.
 * No extra deps (react-pdf adds ~600KB). Works in Chrome/Edge/Firefox/Safari.
 *
 * The signed URL is short-lived; parent passes a fresh URL on each page load.
 */
export function PdfViewer({ signedUrl, filename = 'lesson.pdf' }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={signedUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" /> Mở tab mới
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={signedUrl} download={filename}>
            <Download className="size-4" /> Tải xuống
          </a>
        </Button>
      </div>
      <div className="aspect-[4/5] w-full overflow-hidden rounded-md border bg-muted sm:aspect-[16/10]">
        <iframe
          src={`${signedUrl}#toolbar=1&navpanes=0`}
          title="PDF bài giảng"
          className="size-full"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Nếu PDF không hiển thị, trình duyệt có thể đã chặn nội dung. Hãy mở tab mới hoặc tải xuống.
      </p>
    </div>
  )
}
