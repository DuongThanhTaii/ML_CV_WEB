import type { SB } from './_types'

export const enrollmentService = {
  async isEnrolled(supabase: SB, studentId: string, courseId: string) {
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle()
    return !!data
  },

  async enroll(supabase: SB, studentId: string, courseId: string) {
    return supabase.from('enrollments').insert({ student_id: studentId, course_id: courseId })
  },

  async unenroll(supabase: SB, studentId: string, courseId: string) {
    return supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId)
  },

  async updateProgress(supabase: SB, studentId: string, courseId: string, progressPct: number) {
    return supabase
      .from('enrollments')
      .update({ progress_pct: progressPct })
      .eq('student_id', studentId)
      .eq('course_id', courseId)
  },
}
