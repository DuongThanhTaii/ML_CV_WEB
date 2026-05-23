/**
 * Extract a YouTube video ID from common URL formats or accept a bare ID.
 * Accepts:
 *  - https://youtube.com/watch?v=XXXXXXXXXXX
 *  - https://www.youtube.com/watch?v=XXXXXXXXXXX&t=42s
 *  - https://youtu.be/XXXXXXXXXXX
 *  - https://www.youtube.com/embed/XXXXXXXXXXX
 *  - https://www.youtube.com/shorts/XXXXXXXXXXX
 *  - Bare 11-char ID: XXXXXXXXXXX
 */
const ID_REGEX = /^[A-Za-z0-9_-]{11}$/
const URL_REGEX =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/

export function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (ID_REGEX.test(trimmed)) return trimmed
  const match = trimmed.match(URL_REGEX)
  return match?.[1] ?? null
}

export function youtubeThumbnailUrl(videoId: string, quality: 'default' | 'hq' | 'maxres' = 'hq') {
  const q = quality === 'maxres' ? 'maxresdefault' : quality === 'hq' ? 'hqdefault' : 'default'
  return `https://img.youtube.com/vi/${videoId}/${q}.jpg`
}

export interface YouTubeOEmbed {
  title: string
  author_name: string
  thumbnail_url: string
}

/**
 * Validate ID by hitting YouTube's oEmbed endpoint (no API key required).
 * Returns metadata if the video exists and is embeddable, null otherwise.
 */
export async function fetchYouTubeOEmbed(videoId: string): Promise<YouTubeOEmbed | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { next: { revalidate: 86400 } },
    )
    if (!res.ok) return null
    const data = (await res.json()) as Partial<YouTubeOEmbed>
    if (!data.title) return null
    return {
      title: data.title,
      author_name: data.author_name ?? '',
      thumbnail_url: data.thumbnail_url ?? '',
    }
  } catch {
    return null
  }
}
