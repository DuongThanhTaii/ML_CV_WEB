import type { Database } from '@/types/database'
import type { SB } from './_types'

export const moduleService = {
  async listByCourse(supabase: SB, courseId: string) {
    return supabase
      .from('modules')
      .select('id, order_index, title, description')
      .eq('course_id', courseId)
      .order('order_index')
  },

  async create(
    supabase: SB,
    input: { course_id: string; order_index: number; title: string; description?: string },
  ) {
    return supabase.from('modules').insert(input).select('id').single()
  },

  async update(
    supabase: SB,
    id: string,
    patch: Partial<Database['public']['Tables']['modules']['Update']>,
  ) {
    return supabase.from('modules').update(patch).eq('id', id)
  },

  async remove(supabase: SB, id: string) {
    return supabase.from('modules').delete().eq('id', id)
  },
}
