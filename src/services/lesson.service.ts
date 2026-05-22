import type { Database } from '@/types/database'
import type { SB } from './_types'

export const lessonService = {
  async getById(supabase: SB, id: string) {
    return supabase
      .from('lessons')
      .select('*, courses(id, slug, title, teacher_id)')
      .eq('id', id)
      .single()
  },

  async getWithAssignments(supabase: SB, id: string) {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*, courses(id, slug, title)')
      .eq('id', id)
      .single()
    if (error || !lesson) return { data: null, error }

    const { data: assignments } = await supabase
      .from('assignments_public')
      .select('*')
      .eq('lesson_id', id)
      .order('title')

    return { data: { lesson, assignments: assignments ?? [] }, error: null }
  },

  async create(
    supabase: SB,
    input: {
      course_id: string
      order_index: number
      title: string
      content_mdx: string
      estimated_minutes?: number
    },
  ) {
    return supabase.from('lessons').insert(input).select('id').single()
  },

  async update(supabase: SB, id: string, patch: Partial<Database['public']['Tables']['lessons']['Update']>) {
    return supabase.from('lessons').update(patch).eq('id', id)
  },

  async remove(supabase: SB, id: string) {
    return supabase.from('lessons').delete().eq('id', id)
  },

  async reorder(supabase: SB, updates: Array<{ id: string; order_index: number }>) {
    return Promise.all(
      updates.map((u) =>
        supabase.from('lessons').update({ order_index: u.order_index }).eq('id', u.id),
      ),
    )
  },
}
