/**
 * CLI to encrypt hidden test files before storing in DB.
 *
 * Usage:
 *   pnpm encrypt:tests path/to/hidden_tests.py
 *
 * Output: base64 ciphertext printed to stdout, paste into Supabase row.
 */
import { encryptTests } from '../src/lib/grading/encryption'
import { readFile } from 'node:fs/promises'

const file = process.argv[2]
const key = process.env.GRADING_ENCRYPTION_KEY

if (!file) {
  console.error('Usage: pnpm encrypt:tests <file.py>')
  process.exit(1)
}
if (!key) {
  console.error('Set GRADING_ENCRYPTION_KEY env var (base64, 32 bytes)')
  process.exit(1)
}

const plaintext = await readFile(file, 'utf8')
const ciphertext = await encryptTests(plaintext, key)
console.log(ciphertext)
