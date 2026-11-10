import type { Meta, StoryObj } from '@storybook/react'
import { Callout } from './callout'

const meta: Meta<typeof Callout> = {
  title: 'Workfolio UI/Callout',
  component: Callout,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Callout>

export const ArchitectureNote: Story = {
  args: {
    icon: '🧭',
    variant: 'default',
    title: 'Architecture Inspector Active',
    children:
      'Каждая технология в матрице навыков сопровождается ADR-обоснованием (Почему, Где и Как она применяется в этом монорепозитории).',
  },
}

export const InfoTip: Story = {
  args: {
    icon: 'ℹ️',
    variant: 'info',
    title: 'Edge Web Crypto Verification',
    children:
      'Проверка подписи HS256 выполняется через встроенный crypto.subtle за <0.2 мс без внешних npm-зависимостей.',
  },
}

export const SuccessNote: Story = {
  args: {
    icon: '💡',
    variant: 'success',
    title: 'Zero Client JS Shiki',
    children: 'Двойная тема подсветки синтаксиса переключается через CSS-переменные за 0 мс.',
  },
}

export const WarningNote: Story = {
  args: {
    icon: '⚠️',
    variant: 'warning',
    title: 'Rate Limit Guardrail',
    children: 'Публичные эндпоинты требуют предварительно включённого @nestjs/throttler перед деплоем.',
  },
}

export const DestructiveCaution: Story = {
  args: {
    icon: '🛡️',
    variant: 'destructive',
    title: 'Zero-Trust Policy',
    children: 'Никогда не храните JWT-токены в синхронном LocalStorage — используйте только HttpOnly куки.',
  },
}
