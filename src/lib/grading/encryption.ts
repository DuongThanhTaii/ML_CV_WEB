/**
 * AES-256-GCM encryption for hidden test cases.
 * Key is base64-encoded in env (32 bytes). Never exposed to client.
 * Uses Web Crypto API — works in Node, Deno (Edge Functions), and Bun.
 */

function getKey(base64Key: string): ArrayBuffer {
  const binary = atob(base64Key)
  const buf = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  if (bytes.length !== 32) throw new Error('Grading key must be 32 bytes')
  return buf
}

export async function encryptTests(plaintext: string, base64Key: string): Promise<string> {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await crypto.subtle.importKey('raw', getKey(base64Key), 'AES-GCM', false, ['encrypt'])
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  // Format: base64(iv | ciphertext)
  const combined = new Uint8Array(iv.length + cipher.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipher), iv.length)
  return toBase64(combined)
}

export async function decryptTests(payload: string, base64Key: string): Promise<string> {
  const combined = fromBase64(payload)
  const iv = combined.slice(0, 12)
  const cipher = combined.slice(12)
  const key = await crypto.subtle.importKey('raw', getKey(base64Key), 'AES-GCM', false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  return new TextDecoder().decode(plain)
}

function toBase64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
