import type * as React from 'react';
import { cn } from '../lib/utils';

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode | undefined;
  title?: string | undefined;
  variant?: 'default' | 'info' | 'success' | 'warning' | undefined;
}

export function Callout({
  icon = '💡',
  title,
  variant: _variant = 'default',
  children,
  className,
  ...props
}: CalloutProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-start gap-3.5 rounded-lg border border-border/80 bg-muted/60 p-4 text-sm text-foreground',
        className,
      )}
      {...props}
    >
      <span className="mt-0.5 select-none text-base leading-none">{icon}</span>
      <div className="flex-1 space-y-1">
        {title ? <p className="font-semibold text-foreground">{title}</p> : null}
        <div className="text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
