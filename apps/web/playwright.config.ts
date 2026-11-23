import { defineConfig, devices } from '@playwright/test'
import { resolveJwtSecret } from '@repo/shared-schemas'

const DEFAULT_E2E_JWT_SECRET = resolveJwtSecret(process.env.JWT_SECRET)

export default defineConfig({
  testDir: './e2e/specs',
  // Scale parallel workers cleanly; specs sharing in-memory API state declare `test.describe.configure({ mode: 'serial' })`.
  fullyParallel: true,
  ...(process.env.CI ? { workers: 2 } : {}),
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node ../api/dist/main.js',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        NODE_ENV: 'production',
        WORKFOLIO_DEMO_MODE: 'true',
        PORT: '4000',
        WEB_ORIGIN: 'http://localhost:3000,http://127.0.0.1:3000',
        JWT_SECRET: DEFAULT_E2E_JWT_SECRET,
        DATABASE_URL: '',
        DIRECT_URL: '',
      },
    },
    {
      command: 'pnpm exec next start --port 3000',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        NODE_ENV: 'production',
        API_INTERNAL_URL: 'http://localhost:4000',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        JWT_SECRET: DEFAULT_E2E_JWT_SECRET,
        NODE_OPTIONS: '--dns-result-order=ipv4first --no-network-family-autoselection',
      },
    },
  ],
})
