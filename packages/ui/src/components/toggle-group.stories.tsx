import type { Meta, StoryObj } from '@storybook/react'
import { Globe, Monitor, Moon, Sun } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

const meta: Meta<typeof ToggleGroup> = {
  title: 'Workfolio UI/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ToggleGroup>

export const Segmented: Story = {
  render: () => (
    <ToggleGroup type="single" variant="segmented" size="sm" defaultValue="system" aria-label="Color mode">
      <ToggleGroupItem value="light" className="gap-1.5">
        <Sun className="h-3.5 w-3.5" />
        Light
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" className="gap-1.5">
        <Moon className="h-3.5 w-3.5" />
        Dark
      </ToggleGroupItem>
      <ToggleGroupItem value="system" className="gap-1.5">
        <Monitor className="h-3.5 w-3.5" />
        System
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const CompactLocaleRail: Story = {
  render: () => (
    <ToggleGroup
      type="single"
      variant="segmented"
      size="xs"
      defaultValue="en"
      aria-label="Language switcher"
      className="h-8 rounded-md border-border bg-muted/40 p-0.5"
    >
      <Globe aria-hidden="true" className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-muted-foreground" />
      <ToggleGroupItem value="en" className="rounded-sm font-mono">
        EN
      </ToggleGroupItem>
      <ToggleGroupItem value="uk" className="rounded-sm font-mono">
        UK
      </ToggleGroupItem>
      <ToggleGroupItem value="ru" className="rounded-sm font-mono">
        RU
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const OutlineFilters: Story = {
  render: () => (
    <ToggleGroup type="single" variant="outline" size="sm" defaultValue="all" aria-label="Architecture stack filter">
      <ToggleGroupItem value="all">All</ToggleGroupItem>
      <ToggleGroupItem value="frontend">Frontend</ToggleGroupItem>
      <ToggleGroupItem value="backend">Backend</ToggleGroupItem>
      <ToggleGroupItem value="devops">DevOps</ToggleGroupItem>
    </ToggleGroup>
  ),
}
