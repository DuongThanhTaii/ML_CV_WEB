import type { SB } from '@/services/_types'

/**
 * Create a short-lived signed URL for a private bucket object.
 * Default TTL: 1 hour — enough for a single lesson view, short enough that
 * a leaked URL doesn't grant long-term access.
 */
export async function createSignedUrl(
  supabase: SB,
  bucket: string,
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)
  if (error || !data) return null
  return data.signedUrl
}
