import type { SB } from '@/services/_types'
import type { LessonWithProgress } from '@/types/database'

/**
 * Check whether the current authenticated user can open a lesson.
 * Delegates to the `can_access_lesson` SQL RPC, which encapsulates:
 *   - teacher/admin bypass
 *   - enrollment check (unless lesson is free preview)
 *   - previous-lesson quiz pass (if previous lesson has a quiz)
 */
export async function canAccessLesson(supabase: SB, lessonId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_access_lesson', {
    target_lesson_id: lessonId,
  })
  if (error) return false
  return data === true
}

/**
 * Returns all lessons of a course annotated with progress + lock state for the
 * current authenticated user. Empty array if course has no lessons.
 */
export async function listLessonsWithProgress(
  supabase: SB,
  courseId: string,
): Promise<LessonWithProgress[]> {
  const { data, error } = await supabase.rpc('list_lessons_with_progress', {
    target_course_id: courseId,
  })
  if (error || !data) return []
  return data as LessonWithProgress[]
}
