import type { Meta, StoryObj } from '@storybook/react'
import { ChevronRight, Folder, FolderOpen, Layers } from 'lucide-react'
import { useState } from 'react'
import { Badge } from './badge'
import { Button } from './button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'

const meta: Meta<typeof Collapsible> = {
  title: 'Workfolio UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Collapsible>

function ControlledCollapsibleDemo({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen)

  return (
    <div className="w-80 rounded-xl border border-border bg-card p-3 shadow-xs">
      <Collapsible open={open} onOpenChange={setOpen} className="space-y-1">
        <div className="flex items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-muted/50">
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 flex-1 justify-start gap-2 px-1.5 text-xs">
              <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} />
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold">Frontend Architecture</span>
            </Button>
          </CollapsibleTrigger>
          <Badge variant="secondary" className="font-mono text-[10px]">
            3
          </Badge>
        </div>

        <CollapsibleContent>
          <div className="ml-3 space-y-1 border-l border-border/70 pl-3 pt-1 text-xs text-muted-foreground">
            <div className="rounded-md px-2 py-1 hover:bg-muted/60 hover:text-foreground">FSD-Modular Layers</div>
            <div className="rounded-md px-2 py-1 hover:bg-muted/60 hover:text-foreground">React 19 Compiler</div>
            <div className="rounded-md px-2 py-1 hover:bg-muted/60 hover:text-foreground">State & IndexedDB Cache</div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function NestedTreeDemo() {
  const [rootOpen, setRootOpen] = useState(true)
  const [subOpen, setSubOpen] = useState(true)

  return (
    <div className="w-80 rounded-xl border border-border bg-card p-3 shadow-xs">
      <Collapsible open={rootOpen} onOpenChange={setRootOpen} className="space-y-0.5">
        <div className="flex items-center justify-between gap-1 rounded-md py-0.5 pr-1.5 hover:bg-muted/50">
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" className="h-6 w-6" aria-label="Toggle This Project">
              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${rootOpen ? 'rotate-90' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <span className="flex flex-1 items-center gap-1.5 text-[13px] font-semibold">
            <Layers className="h-3.5 w-3.5 text-primary" />
            This Project
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            2
          </Badge>
        </div>

        <CollapsibleContent>
          <div className="ml-[11px] space-y-0.5 border-l border-border/70 pl-2.5 pt-0.5">
            <Collapsible open={subOpen} onOpenChange={setSubOpen} className="space-y-0.5">
              <div className="flex items-center justify-between gap-1 rounded-md py-0.5 pr-1.5 hover:bg-muted/50">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6"
                    aria-label="Toggle Design System"
                  >
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${subOpen ? 'rotate-90' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <span className="flex flex-1 items-center gap-1.5 text-xs font-medium">
                  {subOpen ? (
                    <FolderOpen className="h-3.5 w-3.5 text-primary/80" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  Design System
                </span>
              </div>

              <CollapsibleContent>
                <div className="ml-2.75 space-y-0.5 border-l border-border/70 pl-2.5 pt-0.5 text-xs text-muted-foreground">
                  <div className="rounded-md px-2 py-1 text-primary font-medium bg-primary/10">Tailwind v4 Tokens</div>
                  <div className="rounded-md px-2 py-1 hover:bg-muted/60 hover:text-foreground">Storybook 10</div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export const Default: Story = {
  render: () => <ControlledCollapsibleDemo initialOpen={false} />,
}

export const DefaultOpen: Story = {
  render: () => <ControlledCollapsibleDemo initialOpen={true} />,
}

export const NestedTree: Story = {
  render: () => <NestedTreeDemo />,
}
