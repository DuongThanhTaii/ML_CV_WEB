import type { Database } from '@/types/database'
import type { SB } from './_types'

type QuizRow = Database['public']['Tables']['quizzes']['Row']

export const quizService = {
  /** Public-facing: reads from quizzes_public view (correct_answer + explanation stripped) */
  async listForStudent(supabase: SB, lessonId: string) {
    const { data, error } = await supabase
      .from('quizzes_public')
      .select('id, question_type, question, options, difficulty, order_index, points')
      .eq('lesson_id', lessonId)
      .order('order_index')
    return { data: data ?? [], error }
  },

  /** Teacher view: full quiz including answer/explanation */
  async listForTeacher(supabase: SB, lessonId: string) {
    return supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index')
  },

  async create(
    supabase: SB,
    input: Database['public']['Tables']['quizzes']['Insert'] & { lesson_id: string },
  ) {
    return supabase.from('quizzes').insert(input).select('id').single()
  },

  async update(
    supabase: SB,
    id: string,
    patch: Partial<Database['public']['Tables']['quizzes']['Update']>,
  ) {
    return supabase.from('quizzes').update(patch).eq('id', id)
  },

  async remove(supabase: SB, id: string) {
    return supabase.from('quizzes').delete().eq('id', id)
  },
}

export type StudentQuizQuestion = Pick<
  QuizRow,
  'id' | 'question_type' | 'question' | 'options' | 'difficulty' | 'order_index' | 'points'
>
