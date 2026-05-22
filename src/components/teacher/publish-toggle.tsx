'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { courseService } from '@/services/course.service'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function PublishToggle({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  const [published, setPublished] = useState(isPublished)
  const { toast } = useToast()
  const router = useRouter()

  async function handle() {
    const next = !published
    setPublished(next)
    const supabase = createBrowserSupabase()
    const { error } = await courseService.publish(supabase, courseId, next)
    if (error) {
      setPublished(!next)
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: next ? 'Đã publish' : 'Đã unpublish', variant: 'success' })
    router.refresh()
  }

  return (
    <Button onClick={handle} variant={published ? 'secondary' : 'default'}>
      {published ? 'Unpublish' : 'Publish khóa học'}
    </Button>
  )
}
