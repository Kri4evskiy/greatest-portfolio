import { execSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const rootDir = process.cwd()
const envExamplePath = resolve(rootDir, '.env.example')
const envPath = resolve(rootDir, '.env')

function syncEnvFile() {
  if (!existsSync(envPath) && existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath)
    console.log('[setup] Created .env from .env.example')
  }
}

function runStep(label, command) {
  console.log(`[setup] ${label}...`)
  execSync(command, { cwd: rootDir, stdio: 'inherit' })
}

function main() {
  syncEnvFile()
  runStep('Building @repo/shared-schemas (Zod contracts)', 'pnpm --filter @repo/shared-schemas build')
  runStep('Generating Prisma Client (@repo/api)', 'pnpm --filter @repo/api prisma:generate')
  console.log('[setup] Monorepo workspace is ready! Run "pnpm run dev" to start all services.')
}

main()
