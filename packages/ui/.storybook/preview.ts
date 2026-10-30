import type { Preview } from '@storybook/react'
import '../src/styles/globals.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Global theme for @repo/ui components (Notion Workfolio Light / Dark)',
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
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const selectedTheme = (context.globals.theme as string | undefined) ?? 'light'
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', selectedTheme === 'dark')
      }
      return Story()
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

export default preview
