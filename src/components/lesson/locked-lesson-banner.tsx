import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LockedLessonBanner({ courseSlug }: { courseSlug: string }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <Lock className="size-7 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-semibold">Bài học chưa mở khóa</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Bạn cần hoàn thành quiz của bài học liền trước với điểm đạt yêu cầu để mở bài này.
        Nếu bạn chưa đăng ký khóa học, hãy đăng ký trước.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href={`/courses/${courseSlug}`}>← Quay lại khóa học</Link>
        </Button>
      </div>
    </div>
  )
}
