import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vitest/config'
import { defineConfig } from 'vitest/config'

/**
 * Maps relative `.js` specifiers required by Node.js native ESM back to `.ts` sources
 * so Vitest + SWC resolve NestJS modules without breaking production ESM imports.
 */
function resolveTsExtensionPlugin(): Plugin {
  return {
    name: 'resolve-ts-extension',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || !source.startsWith('.')) {
        return null
      }

      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      })

      if (resolved && !resolved.external && resolved.id.endsWith('.js')) {
        const tsPath = resolved.id.replace(/\.js$/, '.ts')
        if (existsSync(tsPath)) {
          return tsPath
        }
      }

      return null
    },
  }
}

function ensureSwcNativeCacheDir(): void {
  if (process.env.SWC_NATIVE_BINDING_CACHE) {
    return
  }
  // Keep path short (< Windows MAX_PATH) because @swc/core appends a long SID + SHA-256 lockfile.
  const cacheDir = resolve(import.meta.dirname, '../../.turbo/swc')
  mkdirSync(cacheDir, { recursive: true })
  process.env.SWC_NATIVE_BINDING_CACHE = cacheDir
}

export function createApiVitestConfig(include: string[]) {
  return defineConfig(async () => {
    ensureSwcNativeCacheDir()
    const { default: swc } = await import('unplugin-swc')

    return {
      test: {
        environment: 'node',
        pool: 'forks',
        setupFiles: ['./vitest.setup.ts'],
        include,
        clearMocks: true,
        unstubEnvs: true,
        unstubGlobals: true,
        passWithNoTests: true,
      },
      plugins: [
        resolveTsExtensionPlugin(),
        swc.vite({
          module: { type: 'es6' },
          jsc: {
            target: 'es2022',
            parser: {
              syntax: 'typescript',
              decorators: true,
            },
            transform: {
              legacyDecorator: true,
              decoratorMetadata: true,
            },
          },
        }),
      ],
    }
  })
}
