import { describe, expect, it } from 'vitest'
import { encryptTests, decryptTests } from './encryption'

// 32 bytes base64
const KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

describe('AES-GCM round trip', () => {
  it('encrypts then decrypts back', async () => {
    const plain = 'def test_x(): assert add(2, 3) == 5'
    const cipher = await encryptTests(plain, KEY)
    expect(cipher).not.toContain('test_x')
    const decrypted = await decryptTests(cipher, KEY)
    expect(decrypted).toBe(plain)
  })

  it('rejects bad key', async () => {
    const cipher = await encryptTests('hello', KEY)
    const badKey = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
    await expect(decryptTests(cipher, badKey)).rejects.toBeTruthy()
  })

  it('rejects malformed key length', async () => {
    await expect(encryptTests('hello', 'short')).rejects.toThrow(/32 bytes/)
  })

  it('handles unicode (Vietnamese)', async () => {
    const plain = 'def test_điểm(): assert tính_điểm() == "Đạt"'
    const cipher = await encryptTests(plain, KEY)
    const decrypted = await decryptTests(cipher, KEY)
    expect(decrypted).toBe(plain)
  })
})
