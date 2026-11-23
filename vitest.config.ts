import { defineConfig } from 'vitest/config'

/**
 * Root Vitest project graph for IDE Testing Explorer (`vitest.explorer`)
 * and unified root runs (`pnpm exec vitest run`).
 */
export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcovonly'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/**/*.{ts,tsx}', 'apps/*/src/**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/src/generated/**',
        '**/*.d.ts',
        '**/*.stories.*',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/e2e/**',
        '**/vitest.setup.*',
        '**/vitest.*.ts',
        '**/vitest.config.*',
        '**/playwright.config.*',
        '**/messages/**/*.json',
        'apps/api/src/main.ts',
        'apps/api/src/migrations/**',
        'apps/telemetry-ms/src/main.ts',
        'apps/web/src/app/**/opengraph-image.tsx',
        'apps/web/src/app/**/icon.tsx',
        'apps/web/src/app/**/apple-icon.tsx',
      ],
    },
  },
})
