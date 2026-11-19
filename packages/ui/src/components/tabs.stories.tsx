import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Workfolio UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Tabs>

export const ArchitectureViews: Story = {
  render: () => (
    <Tabs defaultValue="tokens" className="max-w-lg">
      <TabsList>
        <TabsTrigger value="tokens">2D Tokens</TabsTrigger>
        <TabsTrigger value="layers">Cascade Layers</TabsTrigger>
        <TabsTrigger value="container">Container Queries</TabsTrigger>
      </TabsList>
      <TabsContent value="tokens">
        <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground shadow-xs">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge variant="core" className="font-mono text-[10px]">
              Mode × Palette
            </Badge>
          </div>
          Semantic HSL tokens mapped via <code className="font-mono text-foreground">@theme inline</code> support Light,
          Dark, Graphite, and Sepia themes with zero component changes.
        </div>
      </TabsContent>
      <TabsContent value="layers">
        <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground shadow-xs">
          Base resets live in <code className="font-mono text-foreground">@layer base</code>, Shiki & dialog rules in{' '}
          <code className="font-mono text-foreground">@layer components</code>, and reduced-motion overrides sit
          unlayered above utilities.
        </div>
      </TabsContent>
      <TabsContent value="container">
        <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground shadow-xs">
          Cards wrap <code className="font-mono text-foreground">@container</code> so internal grids and typography
          adapt to column width rather than global viewport breakpoints.
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="max-w-md">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
        <TabsTrigger value="admin" disabled>
          Admin (Locked)
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="rounded-lg border border-border bg-surface-subtle p-3.5 text-xs text-muted-foreground">
          Active tab content renders with keyboard arrow navigation out of the box.
        </div>
      </TabsContent>
      <TabsContent value="metrics">
        <div className="rounded-lg border border-border bg-surface-subtle p-3.5 text-xs text-muted-foreground">
          Secondary tab panel.
        </div>
      </TabsContent>
    </Tabs>
  ),
}
