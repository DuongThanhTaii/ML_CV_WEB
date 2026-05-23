import type { SB } from '@/services/_types'

export interface GatingAssignmentStatus {
  assignment_id: string
  title: string
  pass_threshold_pct: number
  best_pct: number
  passed: boolean
}

/**
 * Load all assignments in this lesson that gate progression, plus the student's
 * current best score on each. Used to render gate badges + decide if Next is unlocked.
 */
export async function loadGatingAssignmentsForLesson(
  supabase: SB,
  studentId: string,
  lessonId: string,
): Promise<GatingAssignmentStatus[]> {
  const { data: assignments } = await supabase
    .from('assignments_public')
    .select('id, title, pass_threshold_pct, gates_progression')
    .eq('lesson_id', lessonId)

  const gating = (assignments ?? []).filter((a) => a.gates_progression)
  if (gating.length === 0) return []

  // Compute best % per assignment in parallel via RPC
  const results = await Promise.all(
    gating.map(async (a) => {
      const { data: pct } = await supabase.rpc('best_assignment_pct', {
        p_student_id: studentId,
        p_assignment_id: a.id,
      })
      const bestPct = typeof pct === 'number' ? pct : 0
      return {
        assignment_id: a.id,
        title: a.title,
        pass_threshold_pct: a.pass_threshold_pct,
        best_pct: bestPct,
        passed: bestPct >= a.pass_threshold_pct,
      }
    }),
  )
  return results
}
