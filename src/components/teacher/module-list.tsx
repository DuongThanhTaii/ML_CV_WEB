'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { moduleService } from '@/services/module.service'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Pencil } from 'lucide-react'

interface Module {
  id: string
  order_index: number
  title: string
  description: string | null
}

export function ModuleList({ courseId, modules }: { courseId: string; modules: Module[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Module | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  function openCreate() {
    setEditing(null)
    setTitle('')
    setDescription('')
    setCreateOpen(true)
  }

  function openEdit(m: Module) {
    setEditing(m)
    setTitle(m.title)
    setDescription(m.description ?? '')
    setCreateOpen(true)
  }

  async function handleSave() {
    if (!title.trim()) return
    setBusy(true)
    const supabase = createBrowserSupabase()
    try {
      if (editing) {
        const { error } = await moduleService.update(supabase, editing.id, {
          title: title.trim(),
          description: description.trim() || null,
        })
        if (error) throw error
        toast({ title: 'Đã cập nhật module', variant: 'success' })
      } else {
        const nextIdx =
          modules.length > 0 ? Math.max(...modules.map((m) => m.order_index)) + 1 : 1
        const { error } = await moduleService.create(supabase, {
          course_id: courseId,
          order_index: nextIdx,
          title: title.trim(),
          description: description.trim() || undefined,
        })
        if (error) throw error
        toast({ title: 'Đã tạo module', variant: 'success' })
      }
      setCreateOpen(false)
      router.refresh()
    } catch (e) {
      toast({
        title: 'Lỗi',
        description: e instanceof Error ? e.message : 'Không thể lưu',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa module này? Các lesson bên trong sẽ KHÔNG bị xóa nhưng sẽ tách khỏi module.'))
      return
    const supabase = createBrowserSupabase()
    const { error } = await moduleService.remove(supabase, id)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      return
    }
    router.refresh()
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const idx = modules.findIndex((m) => m.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= modules.length) return

    const a = modules[idx]
    const b = modules[swapIdx]
    if (!a || !b) return
    const supabase = createBrowserSupabase()
    // Two-step swap to avoid unique(course_id, order_index) conflict
    await moduleService.update(supabase, a.id, { order_index: -1 })
    await moduleService.update(supabase, b.id, { order_index: a.order_index })
    await moduleService.update(supabase, a.id, { order_index: b.order_index })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Module gom nhóm các lesson liên quan, ví dụ &quot;Module 1: Linear Models&quot;.
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> Thêm module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Sửa module' : 'Module mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tiêu đề</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Linear Models"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mô tả (tùy chọn)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Giới thiệu ngắn cho module này…"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {editing ? 'Lưu' : 'Tạo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        {modules.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Chưa có module nào. Tạo module để gom nhóm lesson, hoặc bỏ qua nếu khóa học ngắn.
          </div>
        ) : (
          <ol className="divide-y">
            {modules.map((m, i) => (
              <li key={m.id} className="flex items-center justify-between gap-2 p-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{m.title}</div>
                    {m.description && (
                      <div className="truncate text-xs text-muted-foreground">{m.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReorder(m.id, 'up')}
                    disabled={i === 0}
                    aria-label="Lên"
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReorder(m.id, 'down')}
                    disabled={i === modules.length - 1}
                    aria-label="Xuống"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)} aria-label="Sửa">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} aria-label="Xóa">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
