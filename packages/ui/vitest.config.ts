import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    clearMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    passWithNoTests: true,
  },
})
