'use client'

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../lib/utils'

export const toggleGroupVariants = cva('inline-flex items-center pr-1', {
  variants: {
    variant: {
      segmented: 'gap-0.5 rounded-lg border border-border/70 bg-surface-subtle p-1 text-muted-foreground',
      outline: 'flex-wrap gap-1.5',
    },
  },
  defaultVariants: {
    variant: 'segmented',
  },
})

export const toggleGroupItemVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        segmented:
          'text-muted-foreground hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-2xs',
        outline:
          'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
      },
      size: {
        xs: 'h-6 px-1.5 text-[11px]',
        sm: 'h-7 px-2.5 text-xs',
        default: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'segmented',
      size: 'default',
    },
  },
)

type ToggleGroupVariant = NonNullable<VariantProps<typeof toggleGroupVariants>['variant']>
type ToggleGroupSize = NonNullable<VariantProps<typeof toggleGroupItemVariants>['size']>

interface ToggleGroupContextValue {
  variant: ToggleGroupVariant
  size: ToggleGroupSize
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  variant: 'segmented',
  size: 'default',
})

export const ToggleGroup = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleGroupVariants> &
    VariantProps<typeof toggleGroupItemVariants>
>(({ className, variant, size, children, ...props }, ref) => {
  const resolvedVariant: ToggleGroupVariant = variant ?? 'segmented'
  const resolvedSize: ToggleGroupSize = size ?? 'default'

  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(toggleGroupVariants({ variant: resolvedVariant }), className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant: resolvedVariant, size: resolvedSize }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
})
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

export const ToggleGroupItem = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleGroupItemVariants>
>(({ className, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  const resolvedVariant = variant ?? context.variant
  const resolvedSize = size ?? context.size

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(toggleGroupItemVariants({ variant: resolvedVariant, size: resolvedSize }), className)}
      {...props}
    />
  )
})
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName
