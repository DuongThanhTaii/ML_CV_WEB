'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Notebook } from '@/components/notebook/notebook'
import { AssignmentPanel } from '@/components/grading/assignment-panel'
import { TutorChat } from '@/components/ai/tutor-chat'
import { LessonQuiz } from '@/components/lesson/lesson-quiz'
import { LessonVideoPlayer } from '@/components/lesson/lesson-video-player'
import { PdfViewer } from '@/components/lesson/pdf-viewer'
import type { NotebookCell } from '@/types/notebook'
import type { StudentQuizQuestion } from '@/services/quiz.service'
import type { GatingAssignmentStatus } from '@/lib/lessons/assignment-gating'

interface LessonProgress {
  best_quiz_score: number | null
  passed: boolean
  video_watched_pct: number
  video_unique_seconds_bitmap: string | null
}

interface Lesson {
  id: string
  title: string
  content_mdx: string
  pass_threshold: number
  starter_notebook_json: unknown
  pdf_storage_path: string | null
  video_youtube_id: string | null
  video_duration_seconds: number | null
  video_title: string | null
  video_required: boolean
}

interface Props {
  courseSlug: string
  lesson: Lesson
  assignments: unknown[]
  prev: { id: string; title: string } | null
  next: { id: string; title: string } | null
  quizQuestions: StudentQuizQuestion[]
  progress: LessonProgress | null
  pdfSignedUrl: string | null
  gatingAssignments: GatingAssignmentStatus[]
}

export function LessonView({
  courseSlug,
  lesson,
  assignments,
  prev,
  next,
  quizQuestions,
  progress,
  pdfSignedUrl,
  gatingAssignments,
}: Props) {
  const router = useRouter()
  const starterCells: NotebookCell[] =
    (lesson.starter_notebook_json as NotebookCell[] | null) ?? [
      {
        id: 'cell-default',
        type: 'code',
        source: '# Viết code Python của bạn ở đây\nprint("Hello!")',
        outputs: [],
      },
    ]

  const hasVideo = !!lesson.video_youtube_id
  const hasPdf = !!pdfSignedUrl
  const hasQuiz = quizQuestions.length > 0
  const hasAssignment = assignments.length > 0

  const [videoPct, setVideoPct] = useState(progress?.video_watched_pct ?? 0)
  const quizPassed = progress?.passed ?? false
  const videoOk = !hasVideo || !lesson.video_required || videoPct >= 90
  const assignmentsOk = gatingAssignments.every((a) => a.passed)
  const canGoNext = (!hasQuiz || quizPassed) && videoOk && assignmentsOk

  const defaultTab = useMemo(() => {
    if (hasVideo) return 'video'
    if (hasPdf) return 'pdf'
    return 'notes'
  }, [hasVideo, hasPdf])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <nav className="text-sm">
        <Link href={`/courses/${courseSlug}`} className="text-muted-foreground hover:text-foreground">
          ← Quay lại khóa học
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        <div className="flex flex-wrap gap-2 text-xs">
          {hasQuiz && (
            <span
              className={`rounded-md px-3 py-1.5 font-medium ${
                quizPassed
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
              }`}
            >
              Quiz: {quizPassed ? `✓ ${progress?.best_quiz_score}%` : `cần ≥${lesson.pass_threshold}%`}
            </span>
          )}
          {hasVideo && lesson.video_required && (
            <span
              className={`rounded-md px-3 py-1.5 font-medium ${
                videoOk
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
              }`}
            >
              Video: {videoOk ? '✓ đã xem' : `${videoPct}% / 90%`}
            </span>
          )}
          {gatingAssignments.map((g) => (
            <span
              key={g.assignment_id}
              className={`rounded-md px-3 py-1.5 font-medium ${
                g.passed
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
              }`}
              title={g.title}
            >
              🔒 Bài tập: {g.passed ? `✓ ${g.best_pct}%` : `${g.best_pct}% / ${g.pass_threshold_pct}%`}
            </span>
          ))}
        </div>
      </header>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex w-full flex-wrap">
          {hasVideo && <TabsTrigger value="video">🎬 Video</TabsTrigger>}
          {hasPdf && <TabsTrigger value="pdf">📄 Slide PDF</TabsTrigger>}
          <TabsTrigger value="notes">📖 Ghi chú</TabsTrigger>
          <TabsTrigger value="notebook">🧪 Notebook</TabsTrigger>
          {hasAssignment && (
            <TabsTrigger value="assignment">✅ Bài tập ({assignments.length})</TabsTrigger>
          )}
          {hasQuiz && <TabsTrigger value="quiz">🎯 Quiz ({quizQuestions.length})</TabsTrigger>}
        </TabsList>

        {hasVideo && (
          <TabsContent value="video" className="py-4">
            <LessonVideoPlayer
              lessonId={lesson.id}
              youtubeId={lesson.video_youtube_id!}
              durationSeconds={lesson.video_duration_seconds}
              initialBitmapBase64={progress?.video_unique_seconds_bitmap ?? null}
              initialWatchedPct={progress?.video_watched_pct ?? 0}
              required={lesson.video_required}
              onPctChange={setVideoPct}
            />
            {lesson.video_title && (
              <p className="mt-2 text-sm text-muted-foreground">{lesson.video_title}</p>
            )}
          </TabsContent>
        )}

        {hasPdf && (
          <TabsContent value="pdf" className="py-4">
            <PdfViewer signedUrl={pdfSignedUrl!} filename={`${lesson.title}.pdf`} />
          </TabsContent>
        )}

        <TabsContent
          value="notes"
          className="prose prose-sm max-w-none py-4 dark:prose-invert lg:prose-base"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content_mdx}</ReactMarkdown>
        </TabsContent>

        <TabsContent value="notebook" className="py-4">
          <Notebook initialCells={starterCells} />
        </TabsContent>

        {hasAssignment && (
          <TabsContent value="assignment" className="py-4">
            <div className="space-y-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {assignments.map((a: any) => (
                <AssignmentPanel key={a.id} assignment={a} />
              ))}
            </div>
          </TabsContent>
        )}

        {hasQuiz && (
          <TabsContent value="quiz" className="py-4">
            <LessonQuiz
              lessonId={lesson.id}
              questions={quizQuestions}
              passThreshold={lesson.pass_threshold}
              bestScore={progress?.best_quiz_score ?? null}
              alreadyPassed={quizPassed}
              onPass={() => router.refresh()}
            />
          </TabsContent>
        )}
      </Tabs>

      <nav className="flex items-center justify-between border-t pt-6">
        {prev ? (
          <Button asChild variant="ghost">
            <Link href={`/courses/${courseSlug}/lessons/${prev.id}`}>
              <ChevronLeft className="size-4" /> {prev.title}
            </Link>
          </Button>
        ) : (
          <div />
        )}
        {next && (
          <div className="flex flex-col items-end gap-1">
            <Button asChild={canGoNext} disabled={!canGoNext}>
              {canGoNext ? (
                <Link href={`/courses/${courseSlug}/lessons/${next.id}`}>
                  {next.title} <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span>
                  🔒 {next.title} <ChevronRight className="size-4" />
                </span>
              )}
            </Button>
            {!canGoNext && (
              <span className="text-xs text-muted-foreground">
                {missingRequirements(hasQuiz && !quizPassed, hasVideo && !videoOk, !assignmentsOk)}
              </span>
            )}
          </div>
        )}
      </nav>

      <FloatingTutor lessonId={lesson.id} />
    </div>
  )
}

function missingRequirements(needQuiz: boolean, needVideo: boolean, needAssignment: boolean): string {
  const parts: string[] = []
  if (needQuiz) parts.push('quiz')
  if (needVideo) parts.push('video')
  if (needAssignment) parts.push('bài tập')
  if (parts.length === 0) return ''
  return `Hoàn thành ${parts.join(' + ')} để mở khóa`
}

function FloatingTutor({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105"
        aria-label="AI Tutor"
      >
        🤖
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 h-[500px] w-[380px] overflow-hidden rounded-lg border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
            <span className="text-sm font-medium">AI Tutor</span>
            <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground">
              ✕
            </button>
          </div>
          <div className="h-[calc(100%-2.5rem)]">
            <TutorChat sessionId={null} context={{ lessonId }} />
          </div>
        </div>
      )}
    </>
  )
}
