/**
 * Compact "unique seconds watched" bitmap for anti-cheat video tracking.
 * One bit per second; a 1h video = 3600 bits = 450 bytes.
 *
 * Format on the wire: base64-encoded bytes.
 * Bit ordering: byte index = floor(second / 8), bit index within byte = second % 8 (LSB).
 */

export function emptyBitmap(durationSeconds: number): Uint8Array {
  const byteLength = Math.ceil(Math.max(0, durationSeconds) / 8)
  return new Uint8Array(byteLength)
}

export function bitmapFromBase64(b64: string | null, durationSeconds: number): Uint8Array {
  const target = emptyBitmap(durationSeconds)
  if (!b64) return target
  try {
    const raw = typeof atob === 'function'
      ? Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      : Buffer.from(b64, 'base64')
    const len = Math.min(raw.length, target.length)
    for (let i = 0; i < len; i++) target[i] = raw[i]!
    return target
  } catch {
    return target
  }
}

export function bitmapToBase64(bitmap: Uint8Array): string {
  if (typeof btoa === 'function') {
    let s = ''
    for (const b of bitmap) s += String.fromCharCode(b)
    return btoa(s)
  }
  return Buffer.from(bitmap).toString('base64')
}

export function setBit(bitmap: Uint8Array, second: number) {
  if (second < 0) return
  const byte = Math.floor(second / 8)
  const bit = second % 8
  if (byte < bitmap.length) bitmap[byte]! |= 1 << bit
}

export function getBit(bitmap: Uint8Array, second: number): boolean {
  const byte = Math.floor(second / 8)
  const bit = second % 8
  if (byte >= bitmap.length) return false
  return ((bitmap[byte]! >> bit) & 1) === 1
}

export function countSetBits(bitmap: Uint8Array): number {
  let count = 0
  for (const b of bitmap) {
    let n = b
    while (n) {
      n &= n - 1
      count++
    }
  }
  return count
}

/** Merge `incoming` into `base` (in-place on `base`) using bitwise OR. */
export function mergeBitmap(base: Uint8Array, incoming: Uint8Array) {
  const len = Math.min(base.length, incoming.length)
  for (let i = 0; i < len; i++) base[i]! |= incoming[i]!
}

/** Compute % watched (0-100) given duration in seconds */
export function watchedPercent(bitmap: Uint8Array, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0
  const watched = countSetBits(bitmap)
  return Math.min(100, Math.round((watched / durationSeconds) * 100))
}
