import type { Meta, StoryObj } from '@storybook/react'
import { Sun } from 'lucide-react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

const meta: Meta<typeof Popover> = {
  title: 'Workfolio UI/Popover',
  component: Popover,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  render: () => (
    <div className="flex min-h-40 items-start justify-center pt-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Open Popover
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-1.5">
            <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Theme
            </div>
            <p className="text-xs leading-relaxed text-foreground">
              Portal-backed Radix Popover with Escape handling, outside click dismissal, and focus restoration.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
}

export const AlignEndCompact: Story = {
  render: () => (
    <div className="flex min-h-40 items-start justify-end pt-4 pr-6">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Appearance settings">
            <Sun className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8}>
          <div className="space-y-2">
            <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Palette Preset
            </div>
            <div className="rounded-lg border border-border/70 bg-surface-subtle p-2 text-xs text-foreground">
              Warm Paper • Graphite • Sepia
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
}
