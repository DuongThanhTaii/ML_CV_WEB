import { createServerSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LessonEditor } from '@/components/teacher/lesson-editor'
import { AssignmentList } from '@/components/teacher/assignment-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, evaluation_type, max_score, is_published, created_at')
    .eq('lesson_id', lessonId)
    .order('created_at')

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
          <TabsTrigger value="assignments">Bài tập ({assignments?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <LessonEditor lesson={lesson} />
        </TabsContent>
        <TabsContent value="assignments">
          <AssignmentList lessonId={lessonId} courseId={courseId} assignments={assignments ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
