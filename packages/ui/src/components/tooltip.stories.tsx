import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const meta: Meta<typeof Tooltip> = {
  title: 'Workfolio UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-24 items-center justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              Hover or focus for ADR hint
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edge Web Crypto HS256 verification (&lt;0.2ms)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
}

export const PlacementVariants: Story = {
  render: () => (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-32 flex-wrap items-center justify-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm">
              Top
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Tooltip placed above trigger</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm">
              Bottom
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip placed below trigger</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm">
              Right
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Tooltip placed to the right</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
}
