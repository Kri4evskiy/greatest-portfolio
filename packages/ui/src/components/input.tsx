import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../lib/utils'

export const inputVariants = cva(
  'flex h-9 w-full rounded-md border px-3 py-1 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-border bg-background shadow-sm',
        subtle: 'border-border/60 bg-surface-subtle',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type = 'text', ...props }, ref) => {
    return <input type={type} className={cn(inputVariants({ variant }), className)} ref={ref} {...props} />
  },
)
Input.displayName = 'Input'
