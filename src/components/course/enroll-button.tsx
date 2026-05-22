'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { enrollmentService } from '@/services/enrollment.service'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  courseId: string
  initialEnrolled: boolean
  firstLessonId: string | null
}

export function EnrollButton({ courseId, initialEnrolled, firstLessonId }: Props) {
  const params = useParams<{ slug: string }>()
  const [enrolled, setEnrolled] = useState(initialEnrolled)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleEnroll() {
    setLoading(true)
    const supabase = createBrowserSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { error } = await enrollmentService.enroll(supabase, user.id, courseId)
    setLoading(false)
    if (error) {
      toast({ title: 'Lỗi đăng ký', description: error.message, variant: 'destructive' })
      return
    }
    setEnrolled(true)
    toast({ title: 'Đăng ký thành công', variant: 'success' })
    router.refresh()
  }

  if (enrolled) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="size-4" /> Đã đăng ký
        </span>
        {firstLessonId && (
          <Button asChild>
            <Link href={`/courses/${params.slug}/lessons/${firstLessonId}`}>Bắt đầu học →</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <Button onClick={handleEnroll} disabled={loading} size="lg">
      {loading && <Loader2 className="size-4 animate-spin" />}
      Đăng ký miễn phí
    </Button>
  )
}
