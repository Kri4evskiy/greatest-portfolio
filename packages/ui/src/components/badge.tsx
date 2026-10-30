import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '../lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-border bg-muted text-foreground',
        outline: 'border-border bg-transparent text-muted-foreground',
        core: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
        production: 'border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300',
        experimental: 'border-purple-500/30 bg-purple-500/10 text-purple-800 dark:text-purple-300',
        warning: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
