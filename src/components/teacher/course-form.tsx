'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { courseService } from '@/services/course.service'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Props {
  initial?: {
    id: string
    slug: string
    title: string
    description: string | null
    category: 'ml' | 'cv' | 'data' | 'mixed'
    difficulty: number
    is_published: boolean
  }
}

export function CourseForm({ initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<'ml' | 'cv' | 'data' | 'mixed'>(initial?.category ?? 'ml')
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 1)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createBrowserSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    try {
      if (initial) {
        const { error } = await courseService.update(supabase, initial.id, {
          title,
          slug,
          description,
          category,
          difficulty,
        })
        if (error) throw error
        toast({ title: 'Đã lưu', variant: 'success' })
        router.refresh()
      } else {
        const { data, error } = await courseService.create(supabase, {
          slug: slug || slugify(title),
          title,
          description,
          category,
          difficulty,
          teacher_id: user.id,
        })
        if (error || !data) throw error ?? new Error('Insert failed')
        toast({ title: 'Đã tạo', variant: 'success' })
        router.push(`/teacher/courses/${data.id}/edit`)
      }
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Tên khóa học</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (!initial && !slug) setSlug(slugify(e.target.value))
          }}
          placeholder="ML cơ bản cho người mới"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug (URL)</Label>
        <Input
          id="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ml-co-ban"
          pattern="[a-z0-9-]+"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">Mô tả</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Khóa học giới thiệu các khái niệm ML cơ bản…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Danh mục</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as 'ml' | 'cv' | 'data' | 'mixed')}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ml">Machine Learning</option>
            <option value="cv">Computer Vision</option>
            <option value="data">Data analysis</option>
            <option value="mixed">Hỗn hợp</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="difficulty">Độ khó (1-5)</Label>
          <Input
            id="difficulty"
            type="number"
            min={1}
            max={5}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
          />
        </div>
      </div>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        {initial ? 'Lưu thay đổi' : 'Tạo khóa học'}
      </Button>
    </form>
  )
}
