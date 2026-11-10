import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'

const meta: Meta<typeof Input> = {
  title: 'Workfolio UI/Input',
  component: Input,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Filter 16 stack technologies or search ADR...',
    variant: 'default',
  },
}

export const Subtle: Story = {
  args: {
    placeholder: 'Search notes via Cmd+K...',
    variant: 'subtle',
  },
}
