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
import { Check, Loader2, Upload, Trash2, ExternalLink } from 'lucide-react'
import { parseYouTubeId, youtubeThumbnailUrl } from '@/lib/youtube/parse'

interface ModuleOption {
  id: string
  title: string
}

interface Props {
  lesson: {
    id: string
    course_id: string
    title: string
    content_mdx: string
    estimated_minutes: number | null
    module_id: string | null
    pass_threshold: number
    pdf_storage_path: string | null
    pdf_size_bytes: number | null
    video_youtube_id: string | null
    video_title: string | null
    video_required: boolean
  }
  modules: ModuleOption[]
}

export function LessonEditor({ lesson, modules }: Props) {
  const [title, setTitle] = useState(lesson.title)
  const [content, setContent] = useState(lesson.content_mdx)
  const [estimate, setEstimate] = useState(lesson.estimated_minutes ?? 20)
  const [moduleId, setModuleId] = useState(lesson.module_id ?? '')
  const [passThreshold, setPassThreshold] = useState(lesson.pass_threshold)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    setSaving(true)
    const supabase = createBrowserSupabase()
    const { error } = await lessonService.update(supabase, lesson.id, {
      title,
      content_mdx: content,
      estimated_minutes: estimate,
      module_id: moduleId || null,
      pass_threshold: passThreshold,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Đã lưu', variant: 'success' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-1.5">
          <Label>Tiêu đề</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phút</Label>
          <Input
            type="number"
            min={5}
            value={estimate}
            onChange={(e) => setEstimate(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Module</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            disabled={modules.length === 0}
          >
            <option value="">— Không gán module —</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Điểm pass quiz (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={passThreshold}
            onChange={(e) => setPassThreshold(Number(e.target.value))}
          />
        </div>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Ghi chú (Markdown)</TabsTrigger>
          <TabsTrigger value="preview">Xem trước</TabsTrigger>
        </TabsList>
        <TabsContent value="edit">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
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

      <div className="border-t pt-6">
        <h3 className="mb-3 text-base font-semibold">Tài liệu bài giảng</h3>
        <div className="space-y-6">
          <PdfSection
            lessonId={lesson.id}
            courseId={lesson.course_id}
            initialPath={lesson.pdf_storage_path}
            initialSize={lesson.pdf_size_bytes}
          />
          <VideoSection
            lessonId={lesson.id}
            initialYoutubeId={lesson.video_youtube_id}
            initialTitle={lesson.video_title}
            initialRequired={lesson.video_required}
          />
        </div>
      </div>
    </div>
  )
}

function PdfSection({
  lessonId,
  courseId,
  initialPath,
  initialSize,
}: {
  lessonId: string
  courseId: string
  initialPath: string | null
  initialSize: number | null
}) {
  const [path, setPath] = useState(initialPath)
  const [size, setSize] = useState(initialSize)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  async function handleUpload(file: File) {
    if (file.type !== 'application/pdf') {
      toast({ title: 'Phải là file PDF', variant: 'destructive' })
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'PDF quá lớn (giới hạn 20MB)', variant: 'destructive' })
      return
    }
    setUploading(true)
    const supabase = createBrowserSupabase()
    const targetPath = `${courseId}/${lessonId}.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('lesson-pdfs')
      .upload(targetPath, file, { upsert: true, contentType: 'application/pdf' })
    if (uploadErr) {
      setUploading(false)
      toast({ title: 'Upload thất bại', description: uploadErr.message, variant: 'destructive' })
      return
    }
    const { error: updateErr } = await lessonService.update(supabase, lessonId, {
      pdf_storage_path: targetPath,
      pdf_size_bytes: file.size,
    })
    setUploading(false)
    if (updateErr) {
      toast({ title: 'Lỗi DB', description: updateErr.message, variant: 'destructive' })
      return
    }
    setPath(targetPath)
    setSize(file.size)
    toast({ title: 'Đã upload PDF', variant: 'success' })
  }

  async function handleRemove() {
    if (!path) return
    if (!confirm('Xóa PDF này?')) return
    const supabase = createBrowserSupabase()
    await supabase.storage.from('lesson-pdfs').remove([path])
    await lessonService.update(supabase, lessonId, {
      pdf_storage_path: null,
      pdf_size_bytes: null,
    })
    setPath(null)
    setSize(null)
    toast({ title: 'Đã xóa PDF', variant: 'success' })
  }

  return (
    <div className="space-y-2 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">PDF slides (tùy chọn)</Label>
          <p className="text-xs text-muted-foreground">
            Upload tối đa 20MB. Học sinh đã đăng ký mới xem được.
          </p>
        </div>
        {path && (
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <Trash2 className="size-4" /> Xóa
          </Button>
        )}
      </div>
      {path ? (
        <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          <Check className="size-4" />
          Đã upload — {((size ?? 0) / 1024 / 1024).toFixed(2)} MB
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/30">
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Đang upload…
            </>
          ) : (
            <>
              <Upload className="size-4" /> Chọn file PDF
            </>
          )}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
        </label>
      )}
    </div>
  )
}

function VideoSection({
  lessonId,
  initialYoutubeId,
  initialTitle,
  initialRequired,
}: {
  lessonId: string
  initialYoutubeId: string | null
  initialTitle: string | null
  initialRequired: boolean
}) {
  const [input, setInput] = useState(initialYoutubeId ?? '')
  const [savedId, setSavedId] = useState(initialYoutubeId)
  const [savedTitle, setSavedTitle] = useState(initialTitle)
  const [required, setRequired] = useState(initialRequired)
  const [verifying, setVerifying] = useState(false)
  const { toast } = useToast()

  async function handleVerifyAndSave() {
    const id = parseYouTubeId(input)
    if (!id) {
      toast({ title: 'URL hoặc ID YouTube không hợp lệ', variant: 'destructive' })
      return
    }
    setVerifying(true)
    try {
      // Verify via oEmbed (no API key)
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      )
      if (!res.ok) {
        toast({ title: 'Video không tồn tại hoặc không cho phép embed', variant: 'destructive' })
        return
      }
      const meta = (await res.json()) as { title?: string }
      const supabase = createBrowserSupabase()
      const { error } = await lessonService.update(supabase, lessonId, {
        video_youtube_id: id,
        video_title: meta.title ?? null,
        video_duration_seconds: null, // backfilled by player on first load
        video_required: required,
      })
      if (error) throw error
      setSavedId(id)
      setSavedTitle(meta.title ?? null)
      toast({ title: 'Đã lưu video', variant: 'success' })
    } catch (e) {
      toast({
        title: 'Lỗi',
        description: e instanceof Error ? e.message : 'Không thể lưu',
        variant: 'destructive',
      })
    } finally {
      setVerifying(false)
    }
  }

  async function handleToggleRequired(newRequired: boolean) {
    setRequired(newRequired)
    const supabase = createBrowserSupabase()
    await lessonService.update(supabase, lessonId, { video_required: newRequired })
  }

  async function handleRemove() {
    if (!confirm('Xóa video khỏi lesson?')) return
    const supabase = createBrowserSupabase()
    await lessonService.update(supabase, lessonId, {
      video_youtube_id: null,
      video_title: null,
      video_duration_seconds: null,
    })
    setSavedId(null)
    setSavedTitle(null)
    setInput('')
    toast({ title: 'Đã xóa video', variant: 'success' })
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Video YouTube (tùy chọn)</Label>
          <p className="text-xs text-muted-foreground">
            Upload video lên YouTube ở chế độ <strong>Unlisted</strong>, sau đó paste URL hoặc ID
            11 ký tự vào đây.
          </p>
        </div>
        {savedId && (
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <Trash2 className="size-4" /> Xóa
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://youtu.be/abcdefghij0 hoặc abcdefghij0"
        />
        <Button onClick={handleVerifyAndSave} disabled={verifying}>
          {verifying && <Loader2 className="size-4 animate-spin" />}
          {savedId ? 'Cập nhật' : 'Lưu'}
        </Button>
      </div>

      {savedId && (
        <div className="flex items-start gap-3 rounded-md bg-muted/30 p-3">
          <img
            src={youtubeThumbnailUrl(savedId)}
            alt=""
            className="h-16 w-28 shrink-0 rounded object-cover"
          />
          <div className="min-w-0 flex-1 text-sm">
            <div className="truncate font-medium">{savedTitle ?? '(Chưa có tiêu đề)'}</div>
            <div className="text-xs text-muted-foreground">ID: {savedId}</div>
            <a
              href={`https://youtube.com/watch?v=${savedId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="size-3" /> Mở trên YouTube
            </a>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => handleToggleRequired(e.target.checked)}
          disabled={!savedId}
          className="size-4"
        />
        <span>Bắt buộc xem ≥90% để mở bài kế tiếp</span>
      </label>
    </div>
  )
}
