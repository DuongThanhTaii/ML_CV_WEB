import type { Database } from '@/types/database'
import type { SB } from './_types'

export const profileService = {
  async getById(supabase: SB, id: string) {
    return supabase.from('profiles').select('*').eq('id', id).single()
  },

  async update(
    supabase: SB,
    id: string,
    patch: Partial<Database['public']['Tables']['profiles']['Update']>,
  ) {
    return supabase.from('profiles').update(patch).eq('id', id).select('*').single()
  },

  async uploadAvatar(supabase: SB, userId: string, file: File) {
    const path = `${userId}/avatar-${Date.now()}-${file.name}`
    const upload = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upload.error) throw upload.error
    const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
    return url
  },
}
