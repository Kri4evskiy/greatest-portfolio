import { spawn, spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'

function canRunTurbo() {
  if (process.env.FORCE_PNPM === 'true' || process.env.FORCE_PNPM === '1') {
    return false
  }

  try {
    const testCmd = isWindows ? 'pnpm.cmd exec turbo --version' : 'pnpm exec turbo --version'
    const result = spawnSync(testCmd, {
      shell: true,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 4000,
    })

    if (result.error || result.status !== 0) {
      return false
    }

    const output = ((result.stdout || '') + (result.stderr || '')).toLowerCase()
    if (output.includes('blocked') || output.includes('unknown') || output.includes('error')) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function runCommand(command, args) {
  const fullCmd = [command, ...args].join(' ')
  const child = spawn(fullCmd, {
    stdio: 'inherit',
    shell: true,
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
    } else {
      process.exit(code ?? 0)
    }
  })

  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(sig, () => {
      if (!child.killed) {
        child.kill(sig)
      }
    })
  }
}

function main() {
  const turboAvailable = canRunTurbo()

  if (turboAvailable) {
    console.log('[dev-runner] ⚡ Starting monorepo via Turborepo (turbo run dev)...')
    const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm'
    runCommand(pnpmCmd, ['turbo', 'run', 'dev'])
  } else {
    console.warn('\n[dev-runner] ⚠️ Turborepo execution unavailable (e.g. Windows Smart App Control or missing binary).')
    console.log(
      '[dev-runner] 🛡️ Gracefully falling back to native pnpm workspaces runner (Next.js + NestJS + Telemetry MS)...\n',
    )

    // Ensure @repo/shared-schemas is pre-built (equivalent to turbo dependsOn: ["^build"])
    try {
      const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm'
      spawnSync(pnpmCmd, ['--filter', '@repo/shared-schemas', 'build'], {
        shell: true,
        stdio: 'inherit',
      })
    } catch {
      // ignore
    }

    // 💡 Scalability Note: When adding new applications to apps/* or additional subprojects (e.g. infra/services),
    // you can replace the explicit package list with dynamic pnpm workspace discovery:
    // runCommand(pnpmCmd, ['--filter', './apps/*', '--parallel', 'run', 'dev'])
    const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm'
    runCommand(pnpmCmd, [
      '--filter',
      '@repo/web',
      '--filter',
      '@repo/api',
      '--filter',
      '@repo/telemetry-ms',
      '--parallel',
      'dev',
    ])
  }
}

main()
