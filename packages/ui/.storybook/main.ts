import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  async viteFinal(viteConfig) {
    const { default: tailwindcss } = await import('@tailwindcss/vite')
    return mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
    })
  },
}

export default config
