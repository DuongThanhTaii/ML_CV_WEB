import type { NotebookCell } from '@/types/notebook'
import type { SB } from './_types'

export const notebookService = {
  async listMine(supabase: SB, ownerId: string) {
    return supabase
      .from('notebooks')
      .select('id, title, lesson_id, updated_at, last_run_at')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false })
  },

  async getById(supabase: SB, id: string) {
    return supabase.from('notebooks').select('*').eq('id', id).single()
  },

  async create(
    supabase: SB,
    input: { owner_id: string; cells_json: NotebookCell[]; title?: string; lesson_id?: string },
  ) {
    return supabase
      .from('notebooks')
      .insert({ ...input, cells_json: input.cells_json as never })
      .select('id')
      .single()
  },

  async save(supabase: SB, id: string, cells: NotebookCell[]) {
    return supabase
      .from('notebooks')
      .update({ cells_json: cells as never, last_run_at: new Date().toISOString() })
      .eq('id', id)
  },

  async rename(supabase: SB, id: string, title: string) {
    return supabase.from('notebooks').update({ title }).eq('id', id)
  },

  async remove(supabase: SB, id: string) {
    return supabase.from('notebooks').delete().eq('id', id)
  },
}
