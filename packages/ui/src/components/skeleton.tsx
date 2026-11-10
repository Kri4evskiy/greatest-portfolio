import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '../lib/utils'

export const skeletonVariants = cva('animate-pulse rounded-md', {
  variants: {
    variant: {
      default: 'bg-muted',
      subtle: 'bg-surface-subtle border border-border/40',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, variant, ...props }: SkeletonProps): React.JSX.Element {
  return <div className={cn(skeletonVariants({ variant }), className)} {...props} />
}
