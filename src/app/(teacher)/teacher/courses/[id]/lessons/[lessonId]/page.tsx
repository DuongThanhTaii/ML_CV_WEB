import { createServerSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LessonEditor } from '@/components/teacher/lesson-editor'
import { AssignmentList } from '@/components/teacher/assignment-list'
import { QuizEditor } from '@/components/teacher/quiz-editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { moduleService } from '@/services/module.service'
import { quizService } from '@/services/quiz.service'

interface Props {
  params: Promise<{ id: string; lessonId: string }>
}

export default async function TeacherLessonEditPage({ params }: Props) {
  const { id: courseId, lessonId } = await params
  const supabase = await createServerSupabase()

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()
  if (error || !lesson) notFound()

  const [{ data: assignments }, { data: modules }, { data: quizzes }] = await Promise.all([
    supabase
      .from('assignments')
      .select('id, title, evaluation_type, max_score, is_published, created_at')
      .eq('lesson_id', lessonId)
      .order('created_at'),
    moduleService.listByCourse(supabase, courseId),
    quizService.listForTeacher(supabase, lessonId),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <a href={`/teacher/courses/${courseId}/edit`} className="text-sm text-muted-foreground hover:underline">
          ← Khóa học
        </a>
        <h1 className="mt-1 text-3xl font-bold">{lesson.title}</h1>
      </header>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Nội dung</TabsTrigger>
          <TabsTrigger value="quiz">Quiz ({quizzes?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="assignments">Bài tập ({assignments?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <LessonEditor lesson={lesson} modules={modules ?? []} />
        </TabsContent>
        <TabsContent value="quiz">
          <QuizEditor lessonId={lessonId} quizzes={quizzes ?? []} />
        </TabsContent>
        <TabsContent value="assignments">
          <AssignmentList lessonId={lessonId} courseId={courseId} assignments={assignments ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
