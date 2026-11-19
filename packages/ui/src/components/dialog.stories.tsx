import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'
import { Button } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

const meta: Meta<typeof Dialog> = {
  title: 'Workfolio UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open ADR Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="core" className="font-mono text-[10px]">
              ADR #07
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px]">
              @starting-style
            </Badge>
          </div>
          <DialogTitle>Tailwind CSS v4 + Radix Dialog</DialogTitle>
          <DialogDescription>
            Combines WAI-ARIA focus trapping and scroll locking with native CSS entry transitions.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-surface-subtle p-3.5 text-xs text-muted-foreground">
          Uses semantic <code className="font-mono text-foreground">--surface-elevated</code>,{' '}
          <code className="font-mono text-foreground">--border</code>, and translucent{' '}
          <code className="font-mono text-foreground">bg-foreground/40 backdrop-blur-xs</code> overlay tokens.
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button size="sm">Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const WithoutDefaultCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Open Custom-Header Dialog
        </Button>
      </DialogTrigger>
      <DialogContent hideCloseButton className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle className="text-sm">Command Palette Header Pattern</DialogTitle>
          <DialogClose className="rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground">
            ESC
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          Example dialog using hideCloseButton to render a custom ESC close trigger.
        </DialogDescription>
        <div className="p-4 text-xs text-muted-foreground">
          Pass <code className="font-mono text-foreground">hideCloseButton</code> to omit the top-right icon button when
          embedding a custom close trigger in the header.
        </div>
      </DialogContent>
    </Dialog>
  ),
}
