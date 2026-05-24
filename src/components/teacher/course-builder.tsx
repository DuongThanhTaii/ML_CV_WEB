'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  Upload,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  FileText,
  Code2,
  Sparkles,
  AlertCircle,
  Lightbulb,
} from 'lucide-react'

interface QuizDraft {
  question: string
  options: string[] // length 4
  correct_answer: string
  explanation: string
}

interface LessonDraft {
  /** Local UI key */
  uid: string
  title: string
  file: File | null
  mdxContent: string
  quizzes: QuizDraft[]
  aiBusy: boolean
  aiError: string | null
  requireCoding: boolean
  hiddenTests: string
  passThresholdPct: number
  starterCode: string
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function lessonTitleFromFile(name: string): string {
  return name
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()
}

export function CourseBuilder() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Course-level
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'ml' | 'cv' | 'data' | 'mixed'>('ml')
  const [difficulty, setDifficulty] = useState(2)
  const [moduleTitle, setModuleTitle] = useState('Bài giảng')

  // Lessons
  const [lessons, setLessons] = useState<LessonDraft[]>([])

  // Submission
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string>('')

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function handleFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return
    const next: LessonDraft[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]!
      if (f.type !== 'application/pdf') continue
      if (f.size > 20 * 1024 * 1024) {
        toast({
          title: `Bỏ qua ${f.name}: quá 20MB`,
          variant: 'destructive',
        })
        continue
      }
      next.push({
        uid: uid(),
        title: lessonTitleFromFile(f.name),
        file: f,
        mdxContent: '',
        quizzes: [],
        aiBusy: false,
        aiError: null,
        requireCoding: true,
        hiddenTests: '',
        passThresholdPct: 50,
        starterCode: '# Viết code của bạn ở đây\n',
      })
    }
    setLessons((prev) => [...prev, ...next])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function addEmptyLesson() {
    setLessons((prev) => [
      ...prev,
      {
        uid: uid(),
        title: `Bài ${prev.length + 1}`,
        file: null,
        mdxContent: '',
        quizzes: [],
        aiBusy: false,
        aiError: null,
        requireCoding: false,
        hiddenTests: '',
        passThresholdPct: 50,
        starterCode: '# Viết code của bạn ở đây\n',
      },
    ])
  }

  async function runAiOnLesson(uidKey: string) {
    const lesson = lessons.find((l) => l.uid === uidKey)
    if (!lesson) return
    if (!lesson.file) {
      updateLesson(uidKey, { aiError: 'Cần upload PDF trước khi gọi AI' })
      return
    }
    updateLesson(uidKey, { aiBusy: true, aiError: null })
    try {
      const fd = new FormData()
      fd.append('file', lesson.file)
      fd.append('title', lesson.title)
      const res = await fetch('/api/ai/analyze-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      updateLesson(uidKey, {
        mdxContent: data.mdx_summary ?? '',
        quizzes: Array.isArray(data.quiz) ? data.quiz : [],
        requireCoding: true,
        hiddenTests: data.assignment?.hidden_tests ?? lesson.hiddenTests,
        starterCode: data.assignment?.starter_code ?? lesson.starterCode,
        aiBusy: false,
        aiError: null,
      })
      toast({
        title: 'AI đã gợi ý xong',
        description: `${data.quiz?.length ?? 0} câu quiz + 1 bài coding draft`,
        variant: 'success',
      })
    } catch (e) {
      updateLesson(uidKey, {
        aiBusy: false,
        aiError: e instanceof Error ? e.message : 'AI fail',
      })
    }
  }

  function updateLesson(uidKey: string, patch: Partial<LessonDraft>) {
    setLessons((prev) => prev.map((l) => (l.uid === uidKey ? { ...l, ...patch } : l)))
  }

  function removeLesson(uidKey: string) {
    setLessons((prev) => prev.filter((l) => l.uid !== uidKey))
  }

  function moveLesson(uidKey: string, dir: 'up' | 'down') {
    setLessons((prev) => {
      const idx = prev.findIndex((l) => l.uid === uidKey)
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (idx < 0 || swap < 0 || swap >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[swap]] = [next[swap]!, next[idx]!]
      return next
    })
  }

  function validate(): string | null {
    if (!title.trim()) return 'Thiếu tên khóa học'
    if (!slug.trim()) return 'Thiếu slug'
    if (!/^[a-z0-9-]+$/.test(slug)) return 'Slug chỉ chứa a-z, 0-9, dấu gạch ngang'
    if (lessons.length === 0) return 'Thêm ít nhất 1 bài học'
    for (const [i, l] of lessons.entries()) {
      if (!l.title.trim()) return `Bài ${i + 1}: thiếu tiêu đề`
      if (l.requireCoding && !l.hiddenTests.trim()) {
        return `Bài ${i + 1}: tick "yêu cầu coding" thì phải nhập hidden tests`
      }
    }
    return null
  }

  async function handleSubmit() {
    const err = validate()
    if (err) {
      toast({ title: err, variant: 'destructive' })
      return
    }
    setBusy(true)
    setProgress('Đang tạo khóa học...')

    try {
      // Step 1: create course + module + lessons + assignments
      const res = await fetch('/api/courses/builder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          category,
          difficulty,
          moduleTitle: moduleTitle.trim() || 'Bài giảng',
          lessons: lessons.map((l) => ({
            title: l.title.trim(),
            hasPdf: !!l.file,
            mdxContent: l.mdxContent.trim() || undefined,
            quizzes: l.quizzes.length > 0 ? l.quizzes : undefined,
            coding: l.requireCoding
              ? {
                  hiddenTestsPlain: l.hiddenTests,
                  passThresholdPct: l.passThresholdPct,
                  starterCode: l.starterCode,
                }
              : null,
          })),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Lỗi không xác định' }))
        throw new Error(typeof body.error === 'string' ? body.error : JSON.stringify(body.error))
      }
      const result = (await res.json()) as {
        courseId: string
        courseSlug: string
        lessons: Array<{ index: number; id: string; title: string; hasPdf: boolean }>
      }

      // Step 2: upload PDFs in parallel
      const supabase = createBrowserSupabase()
      const pdfTasks = result.lessons
        .filter((rl) => rl.hasPdf)
        .map(async (rl) => {
          const draft = lessons[rl.index]
          if (!draft?.file) return
          const path = `${result.courseId}/${rl.id}.pdf`
          setProgress(`Uploading PDF: ${draft.title}...`)
          const { error: uploadErr } = await supabase.storage
            .from('lesson-pdfs')
            .upload(path, draft.file, {
              upsert: true,
              contentType: 'application/pdf',
            })
          if (uploadErr) throw new Error(`PDF ${draft.title}: ${uploadErr.message}`)
          const { error: updateErr } = await supabase
            .from('lessons')
            .update({ pdf_storage_path: path, pdf_size_bytes: draft.file.size })
            .eq('id', rl.id)
          if (updateErr) throw new Error(`Update lesson ${draft.title}: ${updateErr.message}`)
        })

      await Promise.all(pdfTasks)

      toast({
        title: 'Đã tạo khóa học',
        description: `${result.lessons.length} bài học + ${
          lessons.filter((l) => l.requireCoding).length
        } bài coding gating`,
        variant: 'success',
      })

      router.push(`/teacher/courses/${result.courseId}/edit`)
    } catch (e) {
      toast({
        title: 'Lỗi tạo khóa học',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  const totalSizeMb =
    lessons.reduce((s, l) => s + (l.file?.size ?? 0), 0) / 1024 / 1024
  const codingCount = lessons.filter((l) => l.requireCoding).length

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Tạo khóa học nhanh</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload nhiều PDF cùng lúc — mỗi file thành 1 bài học. Tick &quot;yêu cầu coding&quot; để
          học sinh phải pass bài tập mới mở khóa bài kế tiếp.
        </p>
      </header>

      <section className="space-y-4 rounded-md border bg-card p-5">
        <h2 className="text-base font-semibold">1. Thông tin khóa học</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
          <div className="space-y-1.5">
            <Label>Tên khóa học</Label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="VD: Machine Learning Cơ Bản"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Slug{' '}
              <span className="text-xs font-normal text-muted-foreground">(URL của khóa học)</span>
            </Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugTouched(true)
              }}
              placeholder="machine-learning-co-ban"
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Mô tả (tùy chọn)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Khóa học này dạy về..."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              <option value="ml">Machine Learning</option>
              <option value="cv">Computer Vision</option>
              <option value="data">Data Science</option>
              <option value="mixed">Tổng hợp</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Độ khó</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Tên module</Label>
            <Input
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="Bài giảng"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-md border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            2. Bài học ({lessons.length}
            {codingCount > 0 && ` · ${codingCount} có coding gating`})
          </h2>
          <div className="text-xs text-muted-foreground">
            Tổng size PDF: {totalSizeMb.toFixed(1)} MB
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-medium hover:bg-primary/10">
            <Upload className="size-4" />
            Chọn nhiều file PDF
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFilesPicked(e.target.files)}
            />
          </label>
          <Button variant="outline" size="sm" onClick={addEmptyLesson}>
            + Thêm bài không có PDF
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Chưa có bài nào. Chọn PDF ở trên để bắt đầu.
          </div>
        ) : (
          <ol className="space-y-3">
            {lessons.map((l, i) => (
              <li key={l.uid} className="rounded-md border bg-background p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={l.title}
                        onChange={(e) => updateLesson(l.uid, { title: e.target.value })}
                        placeholder="Tiêu đề bài học"
                        className="font-medium"
                      />
                      {l.file && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                          <FileText className="size-3" /> {(l.file.size / 1024 / 1024).toFixed(2)}MB
                        </span>
                      )}
                    </div>

                    {l.file && (
                      <div>
                        <Button
                          type="button"
                          variant={l.quizzes.length > 0 || l.mdxContent ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => runAiOnLesson(l.uid)}
                          disabled={l.aiBusy || l.file.size > 4 * 1024 * 1024}
                        >
                          {l.aiBusy ? (
                            <>
                              <Loader2 className="size-4 animate-spin" /> AI đang phân tích PDF...
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-4" />
                              {l.quizzes.length > 0 || l.mdxContent
                                ? 'AI gợi ý lại'
                                : 'AI gợi ý nội dung từ PDF'}
                            </>
                          )}
                        </Button>
                        {l.file.size > 4 * 1024 * 1024 && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertCircle className="size-3" />
                            PDF &gt; 4MB không gọi được AI. Soạn nội dung tay.
                          </p>
                        )}
                        {l.aiError && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="size-3" /> {l.aiError}
                          </p>
                        )}
                      </div>
                    )}

                    <AiDraftSection
                      lesson={l}
                      onUpdate={(patch) => updateLesson(l.uid, patch)}
                    />

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={l.requireCoding}
                        onChange={(e) =>
                          updateLesson(l.uid, { requireCoding: e.target.checked })
                        }
                        className="size-4"
                      />
                      <Code2 className="size-3.5" />
                      <span className="font-medium">
                        Yêu cầu code để mở bài kế tiếp
                      </span>
                    </label>

                    {l.requireCoding && (
                      <div className="space-y-2 rounded-md bg-muted/30 p-3">
                        <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                          <div className="space-y-1">
                            <Label className="text-xs">Starter code (học sinh thấy)</Label>
                            <Textarea
                              value={l.starterCode}
                              onChange={(e) =>
                                updateLesson(l.uid, { starterCode: e.target.value })
                              }
                              rows={5}
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Điểm pass (%)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={l.passThresholdPct}
                              onChange={(e) =>
                                updateLesson(l.uid, {
                                  passThresholdPct: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Hidden tests (chấm điểm — học sinh KHÔNG thấy)
                            {l.quizzes.length > 0 && (
                              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <AlertCircle className="size-3" />
                                Nếu AI tạo, hãy KIỂM TRA test chạy đúng trước khi submit
                              </span>
                            )}
                          </Label>
                          <Textarea
                            value={l.hiddenTests}
                            onChange={(e) =>
                              updateLesson(l.uid, { hiddenTests: e.target.value })
                            }
                            rows={6}
                            className="font-mono text-xs"
                            placeholder={`# Ví dụ:\ndef test_solution():\n    assert solve(2, 3) == 5\n    assert solve(10, 20) == 30`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Sẽ được mã hóa AES-256-GCM trước khi lưu DB.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveLesson(l.uid, 'up')}
                      disabled={i === 0}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveLesson(l.uid, 'down')}
                      disabled={i === lessons.length - 1}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeLesson(l.uid)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background/95 p-4 shadow-lg backdrop-blur" id="builder-actions">
        <div className="text-sm text-muted-foreground">
          {busy ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> {progress}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              Sẵn sàng tạo: {lessons.length} bài học, {codingCount} bài coding
            </span>
          )}
        </div>
        <Button size="lg" onClick={handleSubmit} disabled={busy || lessons.length === 0}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          Tạo khóa học
        </Button>
      </section>
    </div>
  )
}

function AiDraftSection({
  lesson,
  onUpdate,
}: {
  lesson: LessonDraft
  onUpdate: (patch: Partial<LessonDraft>) => void
}) {
  const hasMdx = lesson.mdxContent.trim().length > 0
  const hasQuiz = lesson.quizzes.length > 0
  if (!hasMdx && !hasQuiz) return null

  return (
    <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
      <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
        <Sparkles className="size-3.5" /> NỘI DUNG AI GỢI Ý (review trước khi submit)
      </div>

      {hasMdx && (
        <div className="space-y-1">
          <Label className="text-xs">Nội dung bài học (MDX)</Label>
          <Textarea
            value={lesson.mdxContent}
            onChange={(e) => onUpdate({ mdxContent: e.target.value })}
            rows={6}
            className="font-mono text-xs"
          />
        </div>
      )}

      {hasQuiz && (
        <details className="rounded-md bg-background/60 p-2" open>
          <summary className="cursor-pointer text-xs font-medium">
            Quiz ({lesson.quizzes.length} câu)
          </summary>
          <ul className="mt-2 space-y-3">
            {lesson.quizzes.map((q, i) => (
              <li key={i} className="space-y-1 rounded-md border bg-background p-2 text-xs">
                <div className="flex items-start gap-1">
                  <span className="font-medium">{i + 1}.</span>
                  <Input
                    value={q.question}
                    onChange={(e) => {
                      const next = [...lesson.quizzes]
                      next[i] = { ...next[i]!, question: e.target.value }
                      onUpdate({ quizzes: next })
                    }}
                    className="text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const next = lesson.quizzes.filter((_, j) => j !== i)
                      onUpdate({ quizzes: next })
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="grid gap-1 pl-4 sm:grid-cols-2">
                  {q.options.map((opt, j) => (
                    <label
                      key={j}
                      className={`flex items-center gap-1.5 rounded border px-2 py-1 ${
                        q.correct_answer === opt
                          ? 'border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950/30'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-${lesson.uid}-${i}`}
                        checked={q.correct_answer === opt}
                        onChange={() => {
                          const next = [...lesson.quizzes]
                          next[i] = { ...next[i]!, correct_answer: opt }
                          onUpdate({ quizzes: next })
                        }}
                        className="size-3"
                      />
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options]
                          const oldOpt = newOpts[j]
                          newOpts[j] = e.target.value
                          const next = [...lesson.quizzes]
                          next[i] = {
                            ...next[i]!,
                            options: newOpts,
                            // keep correct_answer in sync with renamed option
                            correct_answer:
                              q.correct_answer === oldOpt ? e.target.value : q.correct_answer,
                          }
                          onUpdate({ quizzes: next })
                        }}
                        className="h-7 text-xs"
                      />
                    </label>
                  ))}
                </div>
                {q.explanation && (
                  <p className="flex items-start gap-1.5 pl-4 italic text-muted-foreground">
                    <Lightbulb className="mt-0.5 size-3 shrink-0 text-amber-500" />
                    <span>{q.explanation}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
