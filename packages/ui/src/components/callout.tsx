import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '../lib/utils'

export const calloutVariants = cva('flex items-start gap-3.5 rounded-lg border p-4 text-sm text-foreground', {
  variants: {
    variant: {
      default: 'border-border/80 bg-surface-subtle',
      info: 'border-info/35 bg-info/5',
      success: 'border-success/35 bg-success/5',
      warning: 'border-warning/40 bg-warning/5',
      destructive: 'border-destructive/40 bg-destructive/5',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const calloutIconStyles: Record<NonNullable<CalloutProps['variant']>, string> = {
  default: 'text-foreground',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof calloutVariants> {
  icon?: React.ReactNode | undefined
  title?: string | undefined
}

export function Callout({
  icon = '💡',
  title,
  variant = 'default',
  children,
  className,
  ...props
}: CalloutProps): React.JSX.Element {
  const resolvedVariant = variant ?? 'default'
  return (
    <div className={cn(calloutVariants({ variant: resolvedVariant }), className)} {...props}>
      <span className={cn('mt-0.5 select-none text-base leading-none', calloutIconStyles[resolvedVariant])}>
        {icon}
      </span>
      <div className="flex-1 space-y-1">
        {title ? <p className="font-semibold text-foreground">{title}</p> : null}
        <div className="leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}
