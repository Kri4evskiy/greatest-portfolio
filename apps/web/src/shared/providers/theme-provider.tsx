'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ReactNode, useEffect } from 'react'
import { PALETTE_STORAGE_KEY } from '@/shared/lib/palette'
import { useUIStore } from '@/shared/store/use-ui-store'

// Suppress the React 19 false-positive development warning for next-themes script injection.
// React 19 warns when rendering an inline <script> tag inside client components, but next-themes
// relies on this script to prevent Flash of Unstyled Content (FOUC) during SSR hydration.
// Reference: https://github.com/pacocoursey/next-themes/issues/385
// if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
//   const originalConsoleError = console.error
//   console.error = (...args: unknown[]) => {
//     if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
//       return
//     }
//     originalConsoleError.apply(console, args)
//   }
// }

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const syncPalette = () => {
      useUIStore.getState().syncPaletteFromStorage()
    }

    syncPalette()

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) {
        return
      }
      if (event.key === PALETTE_STORAGE_KEY || event.key === null) {
        syncPalette()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="workfolio-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
