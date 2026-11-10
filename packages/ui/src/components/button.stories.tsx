import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Workfolio UI/Button',
  component: Button,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: 'Explore Architecture',
    variant: 'default',
  },
}

export const LockedKnowledgeBase: Story = {
  render: () => (
    <Button variant="locked" size="sm" className="gap-2">
      <span>🔒 Base of Knowledge</span>
      <Badge variant="warning" className="px-1.5 py-0 font-mono text-[10px]">
        Protected
      </Badge>
    </Button>
  ),
}

export const UnlockedKnowledgeBase: Story = {
  render: () => (
    <Button variant="unlocked" size="sm" className="gap-2">
      <span>🔓 Base of Knowledge</span>
      <Badge variant="success" className="px-1.5 py-0 font-mono text-[10px]">
        GUEST
      </Badge>
    </Button>
  ),
}

export const Destructive: Story = {
  args: {
    children: 'Revoke Guest Pass',
    variant: 'destructive',
  },
}

export const Outline: Story = {
  args: {
    children: 'Why in stack? (ADR)',
    variant: 'outline',
    size: 'sm',
  },
}
