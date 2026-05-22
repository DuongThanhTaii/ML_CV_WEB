'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { lessonService } from '@/services/lesson.service'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  order_index: number
  estimated_minutes: number | null
}

export function LessonList({ courseId, lessons }: { courseId: string; lessons: Lesson[] }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [estimate, setEstimate] = useState(20)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleCreate() {
    if (!title) return
    setCreating(true)
    const supabase = createBrowserSupabase()
    const nextIdx = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order_index)) + 1 : 1
    const { error } = await lessonService.create(supabase, {
      course_id: courseId,
      order_index: nextIdx,
      title,
      content_mdx: content || `# ${title}\n\nNội dung bài học…`,
      estimated_minutes: estimate,
    })
    setCreating(false)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Đã tạo lesson', variant: 'success' })
    setOpen(false)
    setTitle('')
    setContent('')
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa lesson này?')) return
    const supabase = createBrowserSupabase()
    const { error } = await lessonService.remove(supabase, id)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Thêm lesson
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lesson mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tiêu đề</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Nội dung (Markdown)</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="# Tiêu đề\n\nNội dung…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Thời gian ước tính (phút)</Label>
                <Input
                  type="number"
                  min={5}
                  value={estimate}
                  onChange={(e) => setEstimate(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="size-4 animate-spin" />}
                Tạo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        {lessons.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Chưa có lesson nào.
          </div>
        ) : (
          <ol className="divide-y">
            {lessons.map((l, i) => (
              <li key={l.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <Link
                    href={`/teacher/courses/${courseId}/lessons/${l.id}`}
                    className="font-medium hover:underline"
                  >
                    {l.title}
                  </Link>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
