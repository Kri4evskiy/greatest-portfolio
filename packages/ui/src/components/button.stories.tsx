import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Workfolio UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Explore Architecture',
    variant: 'default',
  },
};

export const LockedKnowledgeBase: Story = {
  args: {
    children: '🔒 Base of Knowledge',
    variant: 'locked',
  },
};

export const UnlockedKnowledgeBase: Story = {
  args: {
    children: '🔓 Base of Knowledge',
    variant: 'unlocked',
  },
};

export const Outline: Story = {
  args: {
    children: 'Why in stack? (ADR)',
    variant: 'outline',
    size: 'sm',
  },
};
