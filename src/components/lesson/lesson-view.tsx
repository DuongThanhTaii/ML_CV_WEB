'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Lock,
  PlayCircle,
  ScrollText,
  Target,
  X,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'

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
        <Link
          href={`/courses/${courseSlug}`}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại khóa học
        </Link>
      </nav>

      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{lesson.title}</h1>
        <div className="flex flex-wrap gap-2">
          {hasQuiz && (
            <RequirementBadge
              passed={quizPassed}
              label="Quiz"
              value={
                quizPassed
                  ? `${progress?.best_quiz_score}%`
                  : `cần ≥${lesson.pass_threshold}%`
              }
            />
          )}
          {hasVideo && lesson.video_required && (
            <RequirementBadge
              passed={videoOk}
              label="Video"
              value={videoOk ? 'đã xem' : `${videoPct}% / 90%`}
            />
          )}
          {gatingAssignments.map((g) => (
            <RequirementBadge
              key={g.assignment_id}
              passed={g.passed}
              label="Bài tập"
              value={
                g.passed
                  ? `${g.best_pct}%`
                  : `${g.best_pct}% / ${g.pass_threshold_pct}%`
              }
              title={g.title}
              locked
            />
          ))}
        </div>
      </header>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {hasVideo && (
            <ToolbarTab value="video" icon={<PlayCircle className="size-3.5" />}>
              Video
            </ToolbarTab>
          )}
          {hasPdf && (
            <ToolbarTab value="pdf" icon={<FileText className="size-3.5" />}>
              Slide PDF
            </ToolbarTab>
          )}
          <ToolbarTab value="notes" icon={<ScrollText className="size-3.5" />}>
            Ghi chú
          </ToolbarTab>
          <ToolbarTab value="notebook" icon={<FlaskConical className="size-3.5" />}>
            Notebook
          </ToolbarTab>
          {hasAssignment && (
            <ToolbarTab value="assignment" icon={<ClipboardCheck className="size-3.5" />}>
              Bài tập ({assignments.length})
            </ToolbarTab>
          )}
          {hasQuiz && (
            <ToolbarTab value="quiz" icon={<Target className="size-3.5" />}>
              Quiz ({quizQuestions.length})
            </ToolbarTab>
          )}
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

      <nav className="flex items-center justify-between gap-4 border-t border-border/60 pt-6">
        {prev ? (
          <Button asChild variant="ghost">
            <Link href={`/courses/${courseSlug}/lessons/${prev.id}`}>
              <ChevronLeft className="size-4" />
              <span className="truncate">{prev.title}</span>
            </Link>
          </Button>
        ) : (
          <div />
        )}
        {next && (
          <div className="flex flex-col items-end gap-1.5">
            <Button asChild={canGoNext} disabled={!canGoNext} size="lg">
              {canGoNext ? (
                <Link href={`/courses/${courseSlug}/lessons/${next.id}`}>
                  <span className="truncate">{next.title}</span>
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span>
                  <Lock className="size-4" />
                  <span className="truncate">{next.title}</span>
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

function ToolbarTab({
  value,
  icon,
  children,
}: {
  value: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <TabsTrigger
      value={value}
      className="gap-1.5 rounded-md border border-transparent px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 data-[state=active]:border-border/60 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-soft"
    >
      <span className="text-primary">{icon}</span>
      {children}
    </TabsTrigger>
  )
}

function RequirementBadge({
  passed,
  label,
  value,
  title,
  locked,
}: {
  passed: boolean
  label: string
  value: string
  title?: string
  locked?: boolean
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        passed
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
      )}
    >
      {passed ? (
        <Check className="size-3" />
      ) : locked ? (
        <Lock className="size-3" />
      ) : (
        <Target className="size-3" />
      )}
      <span className="font-semibold">{label}:</span>
      <span>{value}</span>
    </span>
  )
}

function missingRequirements(
  needQuiz: boolean,
  needVideo: boolean,
  needAssignment: boolean,
): string {
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
        className="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-elevated transition-all hover:scale-105 hover:shadow-glow"
        aria-label="AI Tutor"
      >
        <Bot className="size-5" />
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 h-[500px] w-[380px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-elevated">
          <div className="flex items-center justify-between border-b border-border/60 bg-card px-4 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Bot className="size-4 text-primary" />
              AI Tutor
            </span>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="h-[calc(100%-2.75rem)]">
            <TutorChat sessionId={null} context={{ lessonId }} />
          </div>
        </div>
      )}
    </>
  )
}
