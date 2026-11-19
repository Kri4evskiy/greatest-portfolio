import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent, CardHeader } from './card'
import { Skeleton } from './skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Workfolio UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const ArticleCardPlaceholder: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader className="space-y-2.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="flex gap-1.5 pt-0">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-14" />
      </CardContent>
    </Card>
  ),
}

export const SubtleVariant: Story = {
  render: () => (
    <div className="max-w-md space-y-2.5 rounded-lg border border-border bg-card p-4 shadow-xs">
      <Skeleton variant="subtle" className="h-4 w-1/3" />
      <Skeleton variant="subtle" className="h-8 w-full" />
      <Skeleton variant="subtle" className="h-4 w-3/4" />
    </div>
  ),
}
