import type { SB } from './_types'

export const submissionService = {
  async listMine(supabase: SB, studentId: string, limit = 20) {
    return supabase
      .from('submissions')
      .select('id, status, attempt_number, submitted_at, assignment_id, grading_results(score, max_score)')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
      .limit(limit)
  },

  async listForAssignment(supabase: SB, assignmentId: string) {
    return supabase
      .from('submissions')
      .select(
        'id, student_id, status, attempt_number, submitted_at, code_hash, profiles(full_name, email), grading_results(score, max_score, passed_tests, total_tests)',
      )
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })
  },

  async getDetail(supabase: SB, submissionId: string) {
    return supabase
      .from('submissions')
      .select(
        '*, profiles(full_name, email), grading_results(*), ai_feedback(*), assignments(title, max_score)',
      )
      .eq('id', submissionId)
      .single()
  },

  async overrideScore(supabase: SB, submissionId: string, newScore: number, teacherId: string) {
    const { data: latest } = await supabase
      .from('grading_results')
      .select('id, max_score')
      .eq('submission_id', submissionId)
      .order('graded_at', { ascending: false })
      .limit(1)
      .single()

    if (!latest) throw new Error('No grading result to override')

    return supabase
      .from('grading_results')
      .update({ score: newScore, graded_by: `manual:${teacherId}` })
      .eq('id', latest.id)
  },
}
