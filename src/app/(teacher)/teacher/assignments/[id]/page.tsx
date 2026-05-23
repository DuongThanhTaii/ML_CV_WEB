import { createServerSupabase } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { AssignmentEditor } from '@/components/teacher/assignment-editor'
import { AssignmentDatasetPicker } from '@/components/teacher/assignment-dataset-picker'
import { AssignmentIoSpecEditor } from '@/components/teacher/assignment-io-spec-editor'
import type { IoSpec } from '@/components/teacher/assignment-io-spec-editor'
import { SubmissionList } from '@/components/teacher/submission-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { submissionService } from '@/services/submission.service'
import { assignmentDatasetService } from '@/services/assignment-dataset.service'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TeacherAssignmentPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !assignment) notFound()

  const [{ data: submissions }, attached] = await Promise.all([
    submissionService.listForAssignment(supabase, id),
    assignmentDatasetService.listByAssignment(supabase, id),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{assignment.title}</h1>
        <p className="text-sm text-muted-foreground">
          Loại: {assignment.evaluation_type} · {assignment.max_score} điểm
          {assignment.requires_manual_review && ' · cần review thủ công'}
        </p>
      </header>

      <Tabs defaultValue="config">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="config">Cấu hình</TabsTrigger>
          <TabsTrigger value="datasets">Datasets ({attached.length})</TabsTrigger>
          <TabsTrigger value="iospec">I/O Spec</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions ({submissions?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <AssignmentEditor assignment={assignment} />
        </TabsContent>
        <TabsContent value="datasets">
          <AssignmentDatasetPicker
            assignmentId={id}
            teacherId={user.id}
            initialAttached={attached as never}
          />
        </TabsContent>
        <TabsContent value="iospec">
          <AssignmentIoSpecEditor
            assignmentId={id}
            initial={(assignment.io_spec as IoSpec | null) ?? null}
          />
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionList submissions={(submissions as never) ?? []} assignmentId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
