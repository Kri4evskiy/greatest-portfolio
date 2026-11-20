import { existsSync, readdirSync, rmSync, statSync, unlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'

const DEFAULT_KEEP_LIGHT = 12
const DEFAULT_KEEP_HEAVY = 1
const HEAVY_ENTRY_BYTES = 50 * 1024 * 1024

function formatSize(bytes) {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`
  }
  return `${mb.toFixed(1)} MB`
}

function parseIntFlag(args, prefix, fallback) {
  const match = args.find((arg) => arg.startsWith(prefix))
  if (!match) {
    return fallback
  }
  const value = Number(match.slice(prefix.length))
  return Number.isInteger(value) && value >= 0 ? value : fallback
}

function measureDirBytes(dirPath) {
  let total = 0
  for (const dirent of readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = join(dirPath, dirent.name)
    if (dirent.isDirectory()) {
      total += measureDirBytes(fullPath)
    } else if (dirent.isFile()) {
      total += statSync(fullPath).size
    }
  }
  return total
}

function getCacheEntryKey(fileName) {
  return fileName.replace(/(-meta\.json|-manifest\.json|\.tar\.zst|\.tar\.gz|\.log)$/, '')
}

function main() {
  const args = process.argv.slice(2)
  const rootDir = process.cwd()
  const turboDir = resolve(rootDir, '.turbo')
  const cacheDir = join(turboDir, 'cache')

  if (args.includes('--all')) {
    if (!existsSync(turboDir)) {
      console.log('[clean-cache] .turbo does not exist — nothing to remove.')
      return
    }
    const bytes = measureDirBytes(turboDir)
    rmSync(turboDir, { recursive: true, force: true })
    console.log(`[clean-cache] Removed entire .turbo directory (freed ${formatSize(bytes)}).`)
    return
  }

  if (!existsSync(cacheDir)) {
    console.log('[clean-cache] .turbo/cache does not exist — nothing to prune.')
    return
  }

  const keepLight = parseIntFlag(args, '--keep=', DEFAULT_KEEP_LIGHT)
  const keepHeavy = parseIntFlag(args, '--keep-heavy=', DEFAULT_KEEP_HEAVY)

  /** @type {Map<string, { files: string[]; totalSize: number; newestMtimeMs: number }>} */
  const entriesByHash = new Map()

  for (const dirent of readdirSync(cacheDir, { withFileTypes: true })) {
    if (!dirent.isFile()) continue
    const fullPath = join(cacheDir, dirent.name)
    const stats = statSync(fullPath)
    const key = getCacheEntryKey(dirent.name)
    const existing = entriesByHash.get(key)

    if (existing) {
      existing.files.push(fullPath)
      existing.totalSize += stats.size
      if (stats.mtimeMs > existing.newestMtimeMs) {
        existing.newestMtimeMs = stats.mtimeMs
      }
    } else {
      entriesByHash.set(key, {
        files: [fullPath],
        totalSize: stats.size,
        newestMtimeMs: stats.mtimeMs,
      })
    }
  }

  const sortedEntries = Array.from(entriesByHash.values()).sort((a, b) => b.newestMtimeMs - a.newestMtimeMs)

  let keptLight = 0
  let keptHeavy = 0
  let keptBytes = 0
  let deletedEntries = 0
  let deletedFiles = 0
  let freedBytes = 0

  for (const entry of sortedEntries) {
    const isHeavy = entry.totalSize >= HEAVY_ENTRY_BYTES
    const shouldKeep = isHeavy ? keptHeavy < keepHeavy : keptLight < keepLight

    if (shouldKeep) {
      if (isHeavy) {
        keptHeavy += 1
      } else {
        keptLight += 1
      }
      keptBytes += entry.totalSize
      continue
    }

    deletedEntries += 1
    freedBytes += entry.totalSize
    for (const filePath of entry.files) {
      unlinkSync(filePath)
      deletedFiles += 1
    }
  }

  const keptTotal = keptLight + keptHeavy
  console.log(
    `[clean-cache] Pruned ${deletedEntries} old cache entries (${deletedFiles} files, freed ${formatSize(freedBytes)}). Kept ${keptTotal} recent entries (${keptHeavy} heavy, ${keptLight} light; ${formatSize(keptBytes)}).`,
  )
}

main()
