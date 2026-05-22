import type { Database } from '@/types/database'
import type { SB } from './_types'

export const courseService = {
  async listPublished(supabase: SB) {
    return supabase
      .from('courses')
      .select('id, slug, title, description, category, difficulty, cover_image_url, estimated_hours')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
  },

  async getBySlug(supabase: SB, slug: string) {
    return supabase.from('courses').select('*').eq('slug', slug).single()
  },

  async listLessons(supabase: SB, courseId: string) {
    return supabase
      .from('lessons')
      .select('id, title, order_index, estimated_minutes, is_free_preview')
      .eq('course_id', courseId)
      .order('order_index')
  },

  async listMyCourses(supabase: SB, studentId: string) {
    return supabase
      .from('enrollments')
      .select('progress_pct, enrolled_at, courses(id, slug, title, category, cover_image_url)')
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false })
  },

  async listByTeacher(supabase: SB, teacherId: string) {
    return supabase
      .from('courses')
      .select('id, slug, title, category, is_published, created_at')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
  },

  async create(
    supabase: SB,
    input: {
      slug: string
      title: string
      description?: string
      category: 'ml' | 'cv' | 'data' | 'mixed'
      difficulty: number
      teacher_id: string
    },
  ) {
    return supabase.from('courses').insert(input).select('id, slug').single()
  },

  async update(supabase: SB, id: string, patch: Partial<Database['public']['Tables']['courses']['Update']>) {
    return supabase.from('courses').update(patch).eq('id', id).select('id').single()
  },

  async publish(supabase: SB, id: string, isPublished: boolean) {
    return supabase.from('courses').update({ is_published: isPublished }).eq('id', id)
  },
}
