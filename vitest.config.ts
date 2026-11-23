import { defineConfig } from 'vitest/config'

/**
 * Root Vitest project graph for IDE Testing Explorer (`vitest.explorer`)
 * and unified root runs (`pnpm exec vitest run`).
 */
export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*'],
  },
})
