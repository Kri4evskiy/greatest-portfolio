export const WORKFOLIO_PALETTES = ['default', 'graphite', 'sepia'] as const
export type WorkfolioPalette = (typeof WORKFOLIO_PALETTES)[number]

export const PALETTE_STORAGE_KEY = 'workfolio-palette'

export function isWorkfolioPalette(value: unknown): value is WorkfolioPalette {
  return value === 'default' || value === 'graphite' || value === 'sepia'
}

export function readPaletteFromStorage(): WorkfolioPalette {
  if (typeof window === 'undefined') {
    return 'default'
  }

  try {
    const raw = window.localStorage.getItem(PALETTE_STORAGE_KEY)
    return isWorkfolioPalette(raw) ? raw : 'default'
  } catch {
    return 'default'
  }
}

export function persistPaletteToStorage(palette: WorkfolioPalette): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (palette === 'default') {
      window.localStorage.removeItem(PALETTE_STORAGE_KEY)
    } else {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, palette)
    }
  } catch {
    // Ignore storage quota or private-mode restrictions
  }
}

export function applyPaletteToDocument(palette: WorkfolioPalette): void {
  if (typeof document === 'undefined') {
    return
  }

  if (palette === 'default') {
    delete document.documentElement.dataset.palette
  } else {
    document.documentElement.dataset.palette = palette
  }
}

export const PALETTE_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('${PALETTE_STORAGE_KEY}');if(p==='graphite'||p==='sepia'){document.documentElement.dataset.palette=p;}}catch(e){}})();`
