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
    title: 'Architecture Inspector Active',
    children:
      'Каждая технология в матрице навыков сопровождается ADR-обоснованием (Почему, Где и Как она применяется в этом монорепозитории).',
  },
}
