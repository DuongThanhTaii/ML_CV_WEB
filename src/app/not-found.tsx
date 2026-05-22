import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Frown } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <Frown className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">
          Trang bạn tìm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Về trang chính</Link>
        </Button>
      </div>
    </main>
  )
}
