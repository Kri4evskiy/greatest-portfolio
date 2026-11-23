import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    clearMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    passWithNoTests: true,
  },
})
