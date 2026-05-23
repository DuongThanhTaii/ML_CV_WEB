import type { SB } from './_types'

export type DatasetRole = 'train' | 'test' | 'validation' | 'reference'

export const assignmentDatasetService = {
  async listByAssignment(supabase: SB, assignmentId: string) {
    const { data } = await supabase
      .from('assignment_datasets')
      .select('role, datasets(id, name, description, dataset_type, storage_path, preview)')
      .eq('assignment_id', assignmentId)
    return data ?? []
  },

  async attach(supabase: SB, assignmentId: string, datasetId: string, role: DatasetRole) {
    return supabase
      .from('assignment_datasets')
      .insert({ assignment_id: assignmentId, dataset_id: datasetId, role })
  },

  async detach(supabase: SB, assignmentId: string, datasetId: string, role: DatasetRole) {
    return supabase
      .from('assignment_datasets')
      .delete()
      .eq('assignment_id', assignmentId)
      .eq('dataset_id', datasetId)
      .eq('role', role)
  },
}
