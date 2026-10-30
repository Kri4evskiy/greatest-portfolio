import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'

const meta: Meta<typeof Badge> = {
  title: 'Workfolio UI/Badge',
  component: Badge,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Badge>

export const Core: Story = {
  args: {
    children: 'Core Stack',
    variant: 'core',
  },
}

export const Production: Story = {
  args: {
    children: 'Production',
    variant: 'production',
  },
}

export const Experimental: Story = {
  args: {
    children: 'Experimental (Redact)',
    variant: 'experimental',
  },
}
