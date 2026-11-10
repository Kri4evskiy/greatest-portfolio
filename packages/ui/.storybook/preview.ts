import type { Preview } from '@storybook/react'
import * as React from 'react'
import '../src/styles/globals.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Global theme for @repo/ui components (Light / Dark)',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', icon: 'sun', title: 'Light Side (Workfolio Ivory)' },
          { value: 'dark', icon: 'moon', title: 'Dark Side (Workfolio Obsidian)' },
        ],
        dynamicTitle: true,
      },
    },
    palette: {
      description: 'Semantic color palette preset ([data-palette])',
      toolbar: {
        title: 'Palette',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default (Workfolio Paper)' },
          { value: 'graphite', title: 'Graphite (Cool Slate)' },
          { value: 'sepia', title: 'Sepia (Reading Mode)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    palette: 'default',
  },
  decorators: [
    (Story, context) => {
      const selectedTheme = (context.globals.theme as string | undefined) ?? 'light'
      const selectedPalette = (context.globals.palette as string | undefined) ?? 'default'
      const isDark = selectedTheme === 'dark'

      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark)
        document.body.classList.toggle('dark', isDark)
        if (selectedPalette === 'default') {
          delete document.documentElement.dataset.palette
        } else {
          document.documentElement.dataset.palette = selectedPalette
        }
      }

      return React.createElement(
        'div',
        {
          className: cnThemeSurface(isDark),
          'data-palette': selectedPalette === 'default' ? undefined : selectedPalette,
        },
        React.createElement(Story),
      )
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

function cnThemeSurface(isDark: boolean): string {
  return `${isDark ? 'dark ' : ''}rounded-lg border border-border bg-background p-6 text-foreground transition-colors`
}

export default preview
