import fs from 'node:fs'
import path from 'node:path'

export interface CvFileMetadata {
  exists: boolean
  fileName: string
  publicUrl: string
  downloadFileName: string
  sizeKb: number
  updatedAt: string
}

const CANONICAL_DOWNLOAD_NAME = 'Stanislav_Krychevskyi_CV.pdf'

function resolveCvDirectory(): string {
  const candidates = [path.join(process.cwd(), 'public', 'cv'), path.join(process.cwd(), 'apps', 'web', 'public', 'cv')]

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir
    }
  }

  return candidates[0] ?? path.join(process.cwd(), 'public', 'cv')
}

/**
 * Automatically detects the most recently updated .pdf file inside `apps/web/public/cv/`.
 * Appends `?v=<mtimeMs>` cache-buster so replacing the file immediately invalidates stale browser caches.
 */
export function getLatestCvFileMetadata(): CvFileMetadata {
  const cvDir = resolveCvDirectory()

  if (!fs.existsSync(cvDir)) {
    return {
      exists: false,
      fileName: CANONICAL_DOWNLOAD_NAME,
      publicUrl: `/cv/${CANONICAL_DOWNLOAD_NAME}`,
      downloadFileName: CANONICAL_DOWNLOAD_NAME,
      sizeKb: 0,
      updatedAt: '',
    }
  }

  const pdfEntries = fs
    .readdirSync(cvDir)
    .filter((name) => name.toLowerCase().endsWith('.pdf'))
    .map((name) => {
      const fullPath = path.join(cvDir, name)
      const stat = fs.statSync(fullPath)
      return {
        name,
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        mtimeIso: stat.mtime.toISOString().slice(0, 10),
      }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)

  const latest = pdfEntries[0]

  if (!latest) {
    return {
      exists: false,
      fileName: CANONICAL_DOWNLOAD_NAME,
      publicUrl: `/cv/${CANONICAL_DOWNLOAD_NAME}`,
      downloadFileName: CANONICAL_DOWNLOAD_NAME,
      sizeKb: 0,
      updatedAt: '',
    }
  }

  const versionToken = Math.floor(latest.mtimeMs)

  return {
    exists: true,
    fileName: latest.name,
    publicUrl: `/cv/${encodeURIComponent(latest.name)}?v=${versionToken}`,
    downloadFileName: CANONICAL_DOWNLOAD_NAME,
    sizeKb: Math.max(1, Math.round(latest.size / 1024)),
    updatedAt: latest.mtimeIso,
  }
}
