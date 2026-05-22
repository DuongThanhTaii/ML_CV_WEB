'use client'

import { useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Notebook } from '@/components/notebook/notebook'
import { AssignmentPanel } from '@/components/grading/assignment-panel'
import { TutorChat } from '@/components/ai/tutor-chat'
import type { NotebookCell } from '@/types/notebook'

interface Props {
  courseSlug: string
  lesson: any
  assignments: any[]
  prev: { id: string; title: string } | null
  next: { id: string; title: string } | null
}

export function LessonView({ courseSlug, lesson, assignments, prev, next }: Props) {
  const starterCells: NotebookCell[] =
    (lesson.starter_notebook_json as NotebookCell[] | null) ?? [
      {
        id: 'cell-default',
        type: 'code',
        source: '# Viết code Python của bạn ở đây\nprint("Hello!")',
        outputs: [],
      },
    ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <nav className="text-sm">
        <Link href={`/courses/${courseSlug}`} className="text-muted-foreground hover:text-foreground">
          ← Quay lại khóa học
        </Link>
      </nav>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
      </header>

      <Tabs defaultValue="lesson" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lesson">📖 Bài học</TabsTrigger>
          <TabsTrigger value="notebook">🧪 Notebook</TabsTrigger>
          <TabsTrigger value="assignment">
            ✅ Bài tập{assignments.length > 0 && ` (${assignments.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lesson" className="prose prose-sm max-w-none py-4 dark:prose-invert lg:prose-base">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content_mdx}</ReactMarkdown>
        </TabsContent>

        <TabsContent value="notebook" className="py-4">
          <Notebook initialCells={starterCells} />
        </TabsContent>

        <TabsContent value="assignment" className="py-4">
          {assignments.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Bài học này chưa có bài tập.
            </div>
          ) : (
            <div className="space-y-6">
              {assignments.map((a) => (
                <AssignmentPanel key={a.id} assignment={a} />
              ))}
            </div>
          )}
        </TabsContent>
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
          <Button asChild>
            <Link href={`/courses/${courseSlug}/lessons/${next.id}`}>
              {next.title} <ChevronRight className="size-4" />
            </Link>
          </Button>
        )}
      </nav>

      <FloatingTutor lessonId={lesson.id} />
    </div>
  )
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
