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
import { quizService } from '@/services/quiz.service'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Pencil, ChevronUp, ChevronDown } from 'lucide-react'

interface Quiz {
  id: string
  question_type: 'mcq' | 'true_false' | 'code_complete'
  question: string
  options: unknown
  correct_answer: string
  explanation: string | null
  order_index: number
  points: number
}

type FormState = {
  question_type: 'mcq' | 'true_false' | 'code_complete'
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  points: number
}

const EMPTY_FORM: FormState = {
  question_type: 'mcq',
  question: '',
  options: ['', ''],
  correct_answer: '',
  explanation: '',
  points: 1,
}

export function QuizEditor({ lessonId, quizzes }: { lessonId: string; quizzes: Quiz[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Quiz | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(q: Quiz) {
    setEditing(q)
    setForm({
      question_type: q.question_type,
      question: q.question,
      options: Array.isArray(q.options) ? (q.options as string[]) : ['', ''],
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? '',
      points: q.points,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.question.trim() || !form.correct_answer.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Câu hỏi và đáp án bắt buộc.', variant: 'destructive' })
      return
    }
    if (form.question_type === 'mcq') {
      const cleanOpts = form.options.map((o) => o.trim()).filter(Boolean)
      if (cleanOpts.length < 2) {
        toast({ title: 'Cần ≥2 lựa chọn', variant: 'destructive' })
        return
      }
      if (!cleanOpts.includes(form.correct_answer.trim())) {
        toast({
          title: 'Đáp án không khớp',
          description: 'Đáp án phải là một trong các lựa chọn.',
          variant: 'destructive',
        })
        return
      }
    }
    if (form.question_type === 'true_false') {
      if (!['true', 'false'].includes(form.correct_answer.trim())) {
        toast({ title: 'Đáp án phải là "true" hoặc "false"', variant: 'destructive' })
        return
      }
    }

    setBusy(true)
    const supabase = createBrowserSupabase()
    const payload = {
      lesson_id: lessonId,
      question_type: form.question_type,
      question: form.question.trim(),
      options:
        form.question_type === 'mcq' ? form.options.map((o) => o.trim()).filter(Boolean) : null,
      correct_answer: form.correct_answer.trim(),
      explanation: form.explanation.trim() || null,
      points: form.points,
    }
    try {
      if (editing) {
        const { error } = await quizService.update(supabase, editing.id, payload)
        if (error) throw error
        toast({ title: 'Đã cập nhật câu hỏi', variant: 'success' })
      } else {
        const nextIdx =
          quizzes.length > 0 ? Math.max(...quizzes.map((q) => q.order_index)) + 1 : 0
        const { error } = await quizService.create(supabase, {
          ...payload,
          order_index: nextIdx,
        })
        if (error) throw error
        toast({ title: 'Đã thêm câu hỏi', variant: 'success' })
      }
      setOpen(false)
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
    if (!confirm('Xóa câu hỏi này?')) return
    const supabase = createBrowserSupabase()
    const { error } = await quizService.remove(supabase, id)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      return
    }
    router.refresh()
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const idx = quizzes.findIndex((q) => q.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= quizzes.length) return
    const a = quizzes[idx]
    const b = quizzes[swapIdx]
    if (!a || !b) return
    const supabase = createBrowserSupabase()
    await quizService.update(supabase, a.id, { order_index: b.order_index })
    await quizService.update(supabase, b.id, { order_index: a.order_index })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Quiz câu hỏi ({quizzes.length})</h3>
          <p className="text-xs text-muted-foreground">
            Học sinh phải đạt điểm tối thiểu (mặc định 70%) để mở bài kế tiếp.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> Thêm câu hỏi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Sửa câu hỏi' : 'Câu hỏi mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <div className="space-y-1.5">
                  <Label>Loại câu hỏi</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.question_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        question_type: e.target.value as FormState['question_type'],
                        correct_answer: '',
                        options: e.target.value === 'mcq' ? ['', ''] : [],
                      }))
                    }
                  >
                    <option value="mcq">Trắc nghiệm (chọn 1)</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="code_complete">Điền code</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Điểm</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.points}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, points: Math.max(1, Number(e.target.value)) }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Câu hỏi</Label>
                <Textarea
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  rows={3}
                />
              </div>

              {form.question_type === 'mcq' && (
                <McqOptionsEditor
                  options={form.options}
                  correctAnswer={form.correct_answer}
                  onOptionsChange={(options) => setForm((f) => ({ ...f, options }))}
                  onCorrectChange={(correct_answer) =>
                    setForm((f) => ({ ...f, correct_answer }))
                  }
                />
              )}

              {form.question_type === 'true_false' && (
                <div className="space-y-1.5">
                  <Label>Đáp án</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.correct_answer}
                    onChange={(e) => setForm((f) => ({ ...f, correct_answer: e.target.value }))}
                  >
                    <option value="">— Chọn —</option>
                    <option value="true">Đúng</option>
                    <option value="false">Sai</option>
                  </select>
                </div>
              )}

              {form.question_type === 'code_complete' && (
                <div className="space-y-1.5">
                  <Label>Đáp án (so sánh không phân biệt khoảng trắng + case)</Label>
                  <Textarea
                    value={form.correct_answer}
                    onChange={(e) => setForm((f) => ({ ...f, correct_answer: e.target.value }))}
                    rows={3}
                    className="font-mono text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Giải thích (hiện sau khi học sinh nộp)</Label>
                <Textarea
                  value={form.explanation}
                  onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {editing ? 'Lưu' : 'Thêm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        {quizzes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Chưa có câu hỏi. Nếu bài này không có quiz, học sinh sẽ tự động mở được bài kế tiếp.
          </div>
        ) : (
          <ol className="divide-y">
            {quizzes.map((q, i) => (
              <li key={q.id} className="flex items-start justify-between gap-3 p-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-sm font-medium">{q.question}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {q.question_type === 'mcq'
                          ? 'Trắc nghiệm'
                          : q.question_type === 'true_false'
                            ? 'Đúng/Sai'
                            : 'Điền code'}
                      </span>
                      <span>{q.points} điểm</span>
                      <span className="truncate">
                        Đáp án: <code className="rounded bg-muted px-1">{q.correct_answer}</code>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReorder(q.id, 'up')}
                    disabled={i === 0}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReorder(q.id, 'down')}
                    disabled={i === quizzes.length - 1}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}>
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

function McqOptionsEditor({
  options,
  correctAnswer,
  onOptionsChange,
  onCorrectChange,
}: {
  options: string[]
  correctAnswer: string
  onOptionsChange: (next: string[]) => void
  onCorrectChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>Lựa chọn (tick đáp án đúng)</Label>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="mcq-correct"
              checked={correctAnswer !== '' && correctAnswer === opt}
              onChange={() => onCorrectChange(opt)}
              disabled={!opt.trim()}
              className="size-4"
            />
            <Input
              value={opt}
              onChange={(e) => {
                const next = [...options]
                next[i] = e.target.value
                onOptionsChange(next)
                // Keep correct_answer in sync if it was tracking this option
                if (correctAnswer === opt) onCorrectChange(e.target.value)
              }}
              placeholder={`Lựa chọn ${i + 1}`}
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = options.filter((_, j) => j !== i)
                  onOptionsChange(next)
                  if (correctAnswer === opt) onCorrectChange('')
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onOptionsChange([...options, ''])}
      >
        <Plus className="size-3" /> Thêm lựa chọn
      </Button>
    </div>
  )
}
