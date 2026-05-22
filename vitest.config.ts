import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      include: ['src/lib/grading/**', 'src/lib/utils.ts'],
      thresholds: {
        'src/lib/grading/scorer.ts': { lines: 100, functions: 100 },
        'src/lib/grading/encryption.ts': { lines: 100, functions: 100 },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
