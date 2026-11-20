'use client'

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { trackEvent } from '@/shared/lib/analytics'
import type { WorkfolioPalette } from '@/shared/lib/palette'
import { useHasHydratedPalette, usePalette, useUIActions } from '@/shared/store/use-ui-store'

type ThemeModeOption = 'light' | 'dark' | 'system'

interface PaletteSwatchMeta {
  id: WorkfolioPalette
  labelKey: 'paletteDefault' | 'paletteGraphite' | 'paletteSepia'
  hintKey: 'paletteDefaultHint' | 'paletteGraphiteHint' | 'paletteSepiaHint'
  lightSwatch: string
  darkSwatch: string
}

const PALETTE_SWATCHES: readonly PaletteSwatchMeta[] = [
  {
    id: 'default',
    labelKey: 'paletteDefault',
    hintKey: 'paletteDefaultHint',
    lightSwatch: 'hsl(40 20% 99%)',
    darkSwatch: 'hsl(24 10% 10%)',
  },
  {
    id: 'graphite',
    labelKey: 'paletteGraphite',
    hintKey: 'paletteGraphiteHint',
    lightSwatch: 'hsl(220 20% 97%)',
    darkSwatch: 'hsl(222 28% 12%)',
  },
  {
    id: 'sepia',
    labelKey: 'paletteSepia',
    hintKey: 'paletteSepiaHint',
    lightSwatch: 'hsl(38 42% 94%)',
    darkSwatch: 'hsl(28 22% 14%)',
  },
]

const MODE_OPTIONS: readonly {
  id: ThemeModeOption
  labelKey: 'modeLight' | 'modeDark' | 'modeSystem'
  Icon: typeof Sun
}[] = [
  { id: 'light', labelKey: 'modeLight', Icon: Sun },
  { id: 'dark', labelKey: 'modeDark', Icon: Moon },
  { id: 'system', labelKey: 'modeSystem', Icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('Header')
  const palette = usePalette()
  const hasHydratedPalette = useHasHydratedPalette()
  const { setPalette } = useUIActions()

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const activeMode = hasHydratedPalette ? (theme ?? 'system') : undefined
  const activePalette = hasHydratedPalette ? palette : 'default'
  const paletteDotClass = activePalette === 'graphite' ? 'bg-info' : activePalette === 'sepia' ? 'bg-warning' : ''

  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open)
    if (open) {
      setTooltipOpen(false)
    }
  }

  const handleTooltipOpenChange = (open: boolean) => {
    setTooltipOpen(popoverOpen ? false : open)
  }

  const handleSelectMode = (nextMode: ThemeModeOption) => {
    setTheme(nextMode)
    trackEvent('theme_toggled', { theme: nextMode })
  }

  const handleSelectPalette = (nextPalette: WorkfolioPalette) => {
    setPalette(nextPalette)
    trackEvent('palette_changed', { palette: nextPalette })
  }

  return (
    <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
      <Tooltip open={tooltipOpen} onOpenChange={handleTooltipOpenChange}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t('themeToggle')}
              className="relative bg-muted/40 text-muted-foreground hover:text-foreground"
            >
              <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              {paletteDotClass ? (
                <span
                  aria-hidden="true"
                  className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ring-1 ring-background ${paletteDotClass}`}
                />
              ) : null}
              <span className="sr-only">{t('themeToggle')}</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t('themeToggle')}</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" sideOffset={8} aria-label={t('appearance.title')}>
        <div className="space-y-3">
          {/* Axis 1: Theme (Light / Dark / System) */}
          <div className="space-y-1.5">
            <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t('appearance.modeLabel')}
            </div>
            <ToggleGroup
              type="single"
              variant="segmented"
              size="sm"
              value={activeMode ?? ''}
              aria-label={t('appearance.modeLabel')}
              onValueChange={(nextValue) => {
                if (nextValue === 'light' || nextValue === 'dark' || nextValue === 'system') {
                  handleSelectMode(nextValue)
                }
              }}
              className="grid w-full grid-cols-3"
            >
              {MODE_OPTIONS.map(({ id, labelKey, Icon }) => (
                <ToggleGroupItem key={id} value={id} className="gap-1 px-2 text-[11px]">
                  <Icon className="h-3 w-3 shrink-0" />
                  <span>{t(`appearance.${labelKey}`)}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Axis 2: Semantic Palette */}
          <div className="space-y-1.5">
            <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t('appearance.paletteLabel')}
            </div>
            <ToggleGroup
              type="single"
              orientation="vertical"
              variant="outline"
              value={activePalette}
              aria-label={t('appearance.paletteLabel')}
              onValueChange={(nextValue) => {
                if (nextValue === 'default' || nextValue === 'graphite' || nextValue === 'sepia') {
                  handleSelectPalette(nextValue)
                }
              }}
              className="flex w-full flex-col gap-1"
            >
              {PALETTE_SWATCHES.map((item) => {
                const isActive = activePalette === item.id
                return (
                  <ToggleGroupItem
                    key={item.id}
                    value={item.id}
                    className="h-auto w-full justify-between gap-2 whitespace-normal rounded-lg border-transparent bg-transparent px-2.5 py-1.5 text-left font-normal text-foreground hover:border-border/70 hover:bg-muted/50 hover:text-foreground data-[state=on]:border-primary/40 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 rounded-full border border-border shadow-2xs"
                        style={{
                          background: `linear-gradient(135deg, ${item.lightSwatch} 50%, ${item.darkSwatch} 50%)`,
                        }}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium leading-tight">
                          {t(`appearance.${item.labelKey}`)}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {t(`appearance.${item.hintKey}`)}
                        </span>
                      </span>
                    </span>
                    {isActive ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
