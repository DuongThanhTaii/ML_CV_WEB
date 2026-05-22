import type { SB } from './_types'

type DatasetType = 'csv' | 'image_folder' | 'json' | 'parquet'

export const datasetService = {
  async listMine(supabase: SB, ownerId: string) {
    return supabase
      .from('datasets')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
  },

  async listPublic(supabase: SB) {
    return supabase
      .from('datasets')
      .select('id, name, description, dataset_type, size_bytes, row_count, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)
  },

  async getById(supabase: SB, id: string) {
    return supabase.from('datasets').select('*').eq('id', id).single()
  },

  async upload(
    supabase: SB,
    ownerId: string,
    file: File,
    meta: { name: string; description?: string; datasetType: DatasetType; isPublic?: boolean },
  ) {
    const path = `${ownerId}/${crypto.randomUUID()}-${file.name}`
    const upload = await supabase.storage.from('datasets').upload(path, file)
    if (upload.error) throw upload.error

    return supabase
      .from('datasets')
      .insert({
        owner_id: ownerId,
        name: meta.name,
        description: meta.description ?? null,
        dataset_type: meta.datasetType,
        storage_path: path,
        size_bytes: file.size,
        is_public: meta.isPublic ?? false,
      })
      .select('id')
      .single()
  },

  async signedUrl(supabase: SB, path: string, expiresIn = 3600) {
    return supabase.storage.from('datasets').createSignedUrl(path, expiresIn)
  },

  async remove(supabase: SB, id: string, storagePath: string) {
    await supabase.storage.from('datasets').remove([storagePath])
    return supabase.from('datasets').delete().eq('id', id)
  },
}
