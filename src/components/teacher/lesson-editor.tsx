'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { lessonService } from '@/services/lesson.service'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface Props {
  lesson: {
    id: string
    title: string
    content_mdx: string
    estimated_minutes: number | null
  }
}

export function LessonEditor({ lesson }: Props) {
  const [title, setTitle] = useState(lesson.title)
  const [content, setContent] = useState(lesson.content_mdx)
  const [estimate, setEstimate] = useState(lesson.estimated_minutes ?? 20)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    setSaving(true)
    const supabase = createBrowserSupabase()
    const { error } = await lessonService.update(supabase, lesson.id, {
      title,
      content_mdx: content,
      estimated_minutes: estimate,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Đã lưu', variant: 'success' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-1.5">
          <Label>Tiêu đề</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phút</Label>
          <Input type="number" min={5} value={estimate} onChange={(e) => setEstimate(Number(e.target.value))} />
        </div>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Soạn thảo</TabsTrigger>
          <TabsTrigger value="preview">Xem trước</TabsTrigger>
        </TabsList>
        <TabsContent value="edit">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="font-mono text-sm"
            placeholder="# Tiêu đề\n\nViết nội dung Markdown ở đây…"
          />
        </TabsContent>
        <TabsContent value="preview">
          <div className="prose prose-sm max-w-none rounded-md border bg-card p-6 dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Lưu lesson
      </Button>
    </div>
  )
}
