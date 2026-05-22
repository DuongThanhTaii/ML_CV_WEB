// Mirrors src/lib/grading/encryption.ts but uses Deno globals.
// Keep these in sync.

function getKey(base64Key: string): Uint8Array {
  const binary = atob(base64Key)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  if (bytes.length !== 32) throw new Error('Grading key must be 32 bytes')
  return bytes
}

export async function decryptTests(payload: string, base64Key: string): Promise<string> {
  const combined = fromBase64(payload)
  const iv = combined.slice(0, 12)
  const cipher = combined.slice(12)
  const key = await crypto.subtle.importKey('raw', getKey(base64Key), 'AES-GCM', false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  return new TextDecoder().decode(plain)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
