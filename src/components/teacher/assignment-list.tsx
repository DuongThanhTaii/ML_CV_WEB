'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  evaluation_type: 'unittest' | 'ml_metric' | 'cv_output' | 'mixed' | null
  max_score: number
  is_published: boolean
}

interface Props {
  lessonId: string
  courseId: string
  assignments: Assignment[]
}

export function AssignmentList({ lessonId, courseId, assignments }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleCreate() {
    setCreating(true)
    const supabase = createBrowserSupabase()
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        lesson_id: lessonId,
        course_id: courseId,
        title,
        description_mdx: description,
        starter_code: '# Viết code Python của bạn ở đây\n',
        visible_tests: '',
        evaluation_type: 'unittest',
        max_score: 100,
      })
      .select('id')
      .single()
    setCreating(false)
    if (error || !data) {
      toast({ title: 'Lỗi', description: error?.message, variant: 'destructive' })
      return
    }
    setOpen(false)
    setTitle('')
    setDescription('')
    router.push(`/teacher/assignments/${data.id}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Thêm bài tập
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bài tập mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tiêu đề</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={creating || !title}>
                {creating && <Loader2 className="size-4 animate-spin" />}
                Tạo & cấu hình
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        {assignments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Chưa có bài tập nào.</p>
        ) : (
          <ul className="divide-y">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between p-3">
                <Link
                  href={`/teacher/assignments/${a.id}`}
                  className="flex flex-1 items-center gap-3 hover:underline"
                >
                  <span className="font-medium">{a.title}</span>
                  <Badge variant="outline">{a.evaluation_type}</Badge>
                  <Badge variant="secondary">{a.max_score}đ</Badge>
                </Link>
                {a.is_published ? (
                  <Badge variant="success">Published</Badge>
                ) : (
                  <Badge variant="outline">Draft</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
