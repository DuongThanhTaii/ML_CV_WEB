'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto size-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Đã có lỗi xảy ra</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || 'Vui lòng thử lại sau vài giây.'}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">#{error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>Thử lại</Button>
          <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
            Về trang chính
          </Button>
        </div>
      </div>
    </main>
  )
}
