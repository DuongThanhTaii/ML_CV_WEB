import type { Database } from '@/types/database'
import type { SB } from './_types'

export const annotationService = {
  async listByImage(supabase: SB, datasetId: string, imagePath: string) {
    const { data } = await supabase
      .from('image_annotations')
      .select('*')
      .eq('dataset_id', datasetId)
      .eq('image_path', imagePath)
      .order('created_at')
    return data ?? []
  },

  async listGroundTruth(supabase: SB, datasetId: string) {
    const { data } = await supabase
      .from('image_annotations')
      .select('image_path, shape_type, coordinates, label')
      .eq('dataset_id', datasetId)
      .eq('is_ground_truth', true)
    return data ?? []
  },

  async create(
    supabase: SB,
    input: Database['public']['Tables']['image_annotations']['Insert'],
  ) {
    return supabase.from('image_annotations').insert(input).select('id').single()
  },

  async remove(supabase: SB, id: string) {
    return supabase.from('image_annotations').delete().eq('id', id)
  },

  async clearForImage(supabase: SB, datasetId: string, imagePath: string, onlyGroundTruth = true) {
    let q = supabase
      .from('image_annotations')
      .delete()
      .eq('dataset_id', datasetId)
      .eq('image_path', imagePath)
    if (onlyGroundTruth) q = q.eq('is_ground_truth', true)
    return q
  },
}
