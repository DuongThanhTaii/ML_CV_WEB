import { createServerSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CourseForm } from '@/components/teacher/course-form'
import { LessonList } from '@/components/teacher/lesson-list'
import { ModuleList } from '@/components/teacher/module-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PublishToggle } from '@/components/teacher/publish-toggle'
import { moduleService } from '@/services/module.service'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !course) notFound()

  const [{ data: lessons }, { data: modules }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, order_index, estimated_minutes, module_id')
      .eq('course_id', id)
      .order('order_index'),
    moduleService.listByCourse(supabase, id),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <PublishToggle courseId={course.id} isPublished={course.is_published} />
      </header>

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="modules">Modules ({modules?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>
        <TabsContent value="lessons">
          <LessonList courseId={course.id} lessons={lessons ?? []} modules={modules ?? []} />
        </TabsContent>
        <TabsContent value="modules">
          <ModuleList courseId={course.id} modules={modules ?? []} />
        </TabsContent>
        <TabsContent value="settings">
          <CourseForm initial={course} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
