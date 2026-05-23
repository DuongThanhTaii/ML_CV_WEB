import type { SB } from './_types'

export const lessonProgressService = {
  async getForStudent(supabase: SB, studentId: string, lessonId: string) {
    const { data } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)
      .maybeSingle()
    return data
  },

  /** Record first view (idempotent — no-op if row exists) */
  async markViewed(supabase: SB, studentId: string, lessonId: string) {
    return supabase
      .from('lesson_progress')
      .upsert(
        { student_id: studentId, lesson_id: lessonId },
        { onConflict: 'student_id,lesson_id', ignoreDuplicates: true },
      )
  },

  async listForStudentInCourse(supabase: SB, studentId: string, lessonIds: string[]) {
    if (lessonIds.length === 0) return []
    const { data } = await supabase
      .from('lesson_progress')
      .select('lesson_id, best_quiz_score, passed, passed_at')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds)
    return data ?? []
  },
}
