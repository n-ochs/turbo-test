import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    clearMocks: true,
    include: ['**/*.spec.ts'],
    reporters: ['verbose'],
    testTimeout: 120000,
    coverage: {
      enabled: true,
      reporter: ['text', 'json', 'html'],
    },
  },
})
