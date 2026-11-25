'use client'

import type { SupportedLocale } from '@repo/shared-schemas'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useIsCommandPaletteOpen, useUIActions } from '@/shared/store/use-ui-store'

const LazyCommandPaletteModal = dynamic(() => import('./ui/command-palette-modal').then((m) => m.CommandPaletteModal), {
  ssr: false,
})

/**
 * Lightweight global Cmd+K / Ctrl+K shortcut listener that keeps the full
 * CommandPaletteModal UI and Radix Dialog out of the initial route JS bundle.
 */
export function CommandPaletteLoader({ locale }: { locale: SupportedLocale }) {
  const isOpen = useIsCommandPaletteOpen()
  const { openCommandPalette: openPalette, closeCommandPalette: closePalette } = useUIActions()
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (isOpen) {
          closePalette()
        } else {
          openPalette('')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, openPalette, closePalette])

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      setHasLoaded(true)
    }
  }, [hasLoaded, isOpen])

  if (!isOpen && !hasLoaded) {
    return null
  }

  return <LazyCommandPaletteModal locale={locale} />
}
