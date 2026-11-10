'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ReactNode } from 'react'

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
