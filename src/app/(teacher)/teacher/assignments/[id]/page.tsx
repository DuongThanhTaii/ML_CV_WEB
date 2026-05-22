import { createServerSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AssignmentEditor } from '@/components/teacher/assignment-editor'
import { SubmissionList } from '@/components/teacher/submission-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { submissionService } from '@/services/submission.service'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TeacherAssignmentPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !assignment) notFound()

  const { data: submissions } = await submissionService.listForAssignment(supabase, id)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{assignment.title}</h1>
        <p className="text-sm text-muted-foreground">
          Loại: {assignment.evaluation_type} · {assignment.max_score} điểm
        </p>
      </header>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Cấu hình</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions ({submissions?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <AssignmentEditor assignment={assignment} />
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionList submissions={(submissions as never) ?? []} assignmentId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
